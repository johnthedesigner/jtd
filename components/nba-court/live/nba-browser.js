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
 * The browser itself is a module-level singleton: launching one costs real
 * time (measured locally at ~380ms cold, and considerably more once
 * `@sparticuz/chromium` unpacks inside a fresh serverless container), so it's
 * launched once and reused by every later call that lands on the same warm
 * instance, rather than per request.
 */

// Confirmed non-viable (see above) — kept only so future investigation
// doesn't have to rediscover the URL shape from scratch.
export const NBA_FEED_BASE = 'https://cdn.nba.com/static/json'

export const ESPN_FEED_BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba'
export const ESPN_SUMMARY_BASE = 'https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba'

let browserPromise = null
let realUserAgentPromise = null

/**
 * The browser's own real User-Agent with "HeadlessChrome" swapped for
 * "Chrome" — derived from the live browser instance rather than
 * hardcoded, so it can never drift out of sync with whatever Chrome
 * version is actually installed (a stale hardcoded version string would
 * itself be a mismatch worth flagging).
 */
async function getRealUserAgent(browser) {
    if (!realUserAgentPromise) {
        realUserAgentPromise = browser.userAgent().then((ua) => ua.replace('HeadlessChrome/', 'Chrome/'))
    }
    return realUserAgentPromise
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
    if (browserPromise) {
        try {
            const existing = await browserPromise
            if (existing.isConnected()) return existing
        } catch {
            // Last launch attempt failed — fall through and retry below.
        }
        browserPromise = null
    }
    browserPromise = launchBrowser()
    return browserPromise
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
