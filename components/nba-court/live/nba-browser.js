import puppeteer from 'puppeteer-core'

/**
 * Fetches ESPN's live JSON feeds through a real headless browser instead of
 * a plain HTTP client.
 *
 * CONFIRMED, via a controlled side-by-side comparison, not assumed: headless
 * and headful Puppeteer sessions were dumped and diffed field by field
 * (User-Agent, navigator.webdriver, plugin count, window/screen dimensions,
 * WebGL renderer). Two concrete differences showed up — the User-Agent
 * literally contains the substring "HeadlessChrome", and headless mode's
 * outerHeight/outerWidth report smaller than its own innerHeight/innerWidth,
 * which is physically impossible for a real browser window (window chrome
 * always adds height) and a well-known automation tell. Overriding just the
 * User-Agent — replacing "HeadlessChrome" with "Chrome", nothing else
 * touched — was tested in isolation and was sufficient on its own: it fixed
 * ESPN's endpoint in plain headless mode, reproduced twice. No display, no
 * Xvfb, no hosting change needed.
 *
 * NBA's cdn.nba.com endpoint does NOT get fixed by this — still 403 even
 * with the same override, confirming (independent of this finding) that it
 * sits behind additional protection (see the plan doc's Akamai Bot Manager
 * cookie trace, and swar/nba_api's own unresolved issues). ESPN is therefore
 * this app's actual live data source; NBA's endpoint is not used.
 *
 * Separately: this fetches via `page.goto()` and reads the response body
 * directly off Puppeteer's `HTTPResponse`, rather than `page.evaluate(() =>
 * fetch(url))` from inside a hosted page — a `fetch()` call sends
 * `Sec-Fetch-Mode: cors`, a request-type signature confirmed blocked even
 * from a real browser. `page.goto()` sends `Sec-Fetch-Mode: navigate`,
 * matching a real address-bar request.
 *
 * The browser is a singleton **on `globalThis`, not on this module**, and
 * that distinction was worth about 24GB of a laptop's RAM.
 *
 * A plain `let browserPromise` here looks like a singleton and is not one in
 * Next's dev server, which re-evaluates server modules per request: measured
 * directly, three sequential requests to one route launched three separate
 * Chromiums. Nothing closed them, and because `puppeteer.launch()` detaches
 * the child, they outlived the dev server itself — orphans from two days
 * earlier were still resident, reparented to launchd, 25MB apiece. 424 of
 * them had accumulated.
 *
 * So three things hold the line, and all three are needed:
 *
 * 1. `Symbol.for` on `globalThis` — the one place that survives module
 *    re-evaluation.
 * 2. An idle timer that closes the browser when nothing has used it for a
 *    while, so a dev server left running overnight isn't holding a Chromium.
 * 3. Exit hooks that kill the child process, so stopping the server does not
 *    leave anything behind. `exit` alone is not enough: Node does not emit it
 *    for a signal-terminated process, which is exactly how a dev server dies.
 *
 * Launch cost is still real (~380ms locally, considerably more once
 * `@sparticuz/chromium` unpacks in a cold serverless container), which is why
 * the thing is pooled at all rather than opened per call.
 */

// Confirmed non-viable (see above) — kept only so future investigation
// doesn't have to rediscover the URL shape from scratch.
export const NBA_FEED_BASE = 'https://cdn.nba.com/static/json'

export const ESPN_FEED_BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba'
export const ESPN_SUMMARY_BASE = 'https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba'

/**
 * Shared across every copy of this module in the process. `Symbol.for` keys
 * into the global registry, so two evaluations of this file reach the same
 * object instead of each getting a private one.
 */
const STATE_KEY = Symbol.for('jtd.nba-court.browser-pool')

/** Close the browser after this long with no requests. */
const IDLE_MS = 5 * 60 * 1000

function pool() {
    let state = globalThis[STATE_KEY]
    if (!state) {
        state = {
            promise: null,
            browser: null,
            userAgent: null,
            idleTimer: null,
            exitHooked: false,
        }
        globalThis[STATE_KEY] = state
    }
    return state
}

/**
 * The browser's own real User-Agent with "HeadlessChrome" swapped for
 * "Chrome" — derived from the live browser instance rather than
 * hardcoded, so it can never drift out of sync with whatever Chrome
 * version is actually installed (a stale hardcoded version string would
 * itself be a mismatch worth flagging).
 */
async function getRealUserAgent(browser) {
    const state = pool()
    if (!state.userAgent) {
        state.userAgent = browser
            .userAgent()
            .then((ua) => ua.replace('HeadlessChrome/', 'Chrome/'))
    }
    return state.userAgent
}

/**
 * Whether a browser is still usable.
 *
 * puppeteer-core moved this from an `isConnected()` method to a `connected`
 * property, and the old call survived here for a long time without anyone
 * noticing, because the reuse path it lived on was never once reached — the
 * singleton it guarded was being rebuilt per request, so there was never an
 * existing browser to check. The first thing fixing the singleton did was
 * surface `state.browser.isConnected is not a function` on every request
 * after the first. Both spellings are accepted so a future bump doesn't
 * quietly reintroduce a relaunch-every-time bug.
 */
function isUsable(browser) {
    if (!browser) return false
    if (typeof browser.connected === 'boolean') return browser.connected
    if (typeof browser.isConnected === 'function') return browser.isConnected()
    return false
}

/**
 * Kills the browser without awaiting anything.
 *
 * `browser.close()` is async, and an `exit` handler cannot await — so this
 * signals the child process directly, which is the only cleanup that is
 * guaranteed to complete while the process is on its way out.
 */
function killBrowser(state) {
    const browser = state.browser
    state.browser = null
    state.promise = null
    state.userAgent = null
    if (state.idleTimer) {
        clearTimeout(state.idleTimer)
        state.idleTimer = null
    }
    if (!browser) return
    try {
        const child = browser.process()
        if (child) child.kill('SIGKILL')
    } catch {
        // Already gone; nothing to do.
    }
}

function hookExit(state) {
    if (state.exitHooked) return
    state.exitHooked = true
    process.once('exit', () => killBrowser(state))
    // Node emits `exit` when the loop drains or `process.exit()` runs, but
    // *not* for a process killed by a signal — which is how a dev server
    // ends. Each handler re-raises with the default disposition so this
    // doesn't quietly take over the server's own shutdown.
    for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
        process.once(signal, () => {
            killBrowser(state)
            process.kill(process.pid, signal)
        })
    }
}

/** Restarts the countdown to closing an unused browser. */
function touchIdleTimer(state) {
    if (state.idleTimer) clearTimeout(state.idleTimer)
    state.idleTimer = setTimeout(() => {
        const browser = state.browser
        state.browser = null
        state.promise = null
        state.userAgent = null
        state.idleTimer = null
        browser?.close().catch(() => {})
    }, IDLE_MS)
    // Never hold the process open just to wait out an idle timer.
    state.idleTimer.unref?.()
}

function isServerlessRuntime() {
    return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
}

async function launchBrowser() {
    if (isServerlessRuntime()) {
        const chromium = (await import('@sparticuz/chromium')).default
        return puppeteer.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        })
    }

    // Local dev: a full Chromium download isn't installed alongside
    // puppeteer-core on purpose (that's the whole reason to use -core
    // rather than plain puppeteer, since production uses @sparticuz's
    // build instead) — point at the system's real Chrome, same as this
    // project's own manual test scripts already do.
    const executablePath =
        process.env.PUPPETEER_EXECUTABLE_PATH ||
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    return puppeteer.launch({ executablePath, headless: true })
}

async function getBrowser() {
    const state = pool()
    hookExit(state)

    if (state.promise) {
        try {
            const existing = await state.promise
            if (isUsable(existing)) {
                touchIdleTimer(state)
                return existing
            }
        } catch {
            // Last launch attempt failed — fall through and relaunch.
        }
        // Only the caller that still owns the dead promise clears it. Without
        // this check, several callers awaiting the same broken promise each
        // start their own replacement and all but one get orphaned — the
        // in-process version of the bug this whole module is shaped around.
        if (state.promise) {
            state.promise = null
            state.browser = null
            state.userAgent = null
        }
    }

    if (!state.promise) {
        // Assigned synchronously, before any `await`, so a second caller
        // arriving in the same tick joins this launch instead of starting one.
        state.promise = launchBrowser().then((browser) => {
            state.browser = browser
            // A browser that dies on its own shouldn't leave a stale promise
            // behind for the next caller to await.
            browser.once('disconnected', () => {
                if (state.browser === browser) {
                    state.browser = null
                    state.promise = null
                    state.userAgent = null
                }
            })
            return browser
        })
    }
    touchIdleTimer(state)
    return state.promise
}

/**
 * Navigates to `url` and returns its JSON body, or a uniform failure shape.
 * Every caller (the API routes) treats any failure here — a real 403, a
 * launch error, a timeout — as "the feed is unreachable right now," since
 * that's the one thing that actually varies from request to request.
 */
export async function fetchViaBrowser(url, { timeout = 15000 } = {}) {
    let page
    try {
        const browser = await getBrowser()
        page = await browser.newPage()
        await page.setUserAgent(await getRealUserAgent(browser))
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout })
        if (!response) {
            return { ok: false, status: null, message: 'navigation produced no response' }
        }
        const status = response.status()
        if (status < 200 || status >= 300) {
            return { ok: false, status, message: `HTTP ${status}` }
        }
        const text = await response.text()
        try {
            return { ok: true, data: JSON.parse(text) }
        } catch (err) {
            return { ok: false, status, message: `invalid JSON: ${err.message}` }
        }
    } catch (err) {
        return { ok: false, status: null, message: err.message }
    } finally {
        if (page) await page.close().catch(() => {})
    }
}
