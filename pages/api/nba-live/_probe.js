import { fetchViaBrowser, ESPN_FEED_BASE, NBA_FEED_BASE } from '../../../components/nba-court/live/nba-browser'

/**
 * Go/no-go check for the live-game feature. Hits both sources so a single
 * run gives a real, reproducible answer for each — through the actual
 * `fetchViaBrowser` code path the real routes use, not a one-off script.
 *
 * ESPN is the one with an actual confirmed-working precedent (a human
 * pasting this exact URL into the address bar got real JSON back); NBA's
 * cdn is included for comparison since it was the original target. Neither
 * has been confirmed to work via Puppeteer's automated `page.goto()` yet —
 * that's exactly what this route exists to check, honestly, each time it's
 * run, rather than assumed from an earlier result.
 */
export const config = {
    maxDuration: 60,
}

export default async function handler(req, res) {
    const targets = {
        espn: `${ESPN_FEED_BASE}/scoreboard?dates=20250115`,
        nba: `${NBA_FEED_BASE}/liveData/scoreboard/todaysScoreboard_00.json`,
    }

    const results = {}
    for (const [key, url] of Object.entries(targets)) {
        const t0 = Date.now()
        const result = await fetchViaBrowser(url)
        const elapsedMs = Date.now() - t0
        results[key] = result.ok
            ? { reachable: true, elapsedMs }
            : { reachable: false, status: result.status, message: result.message, elapsedMs }
    }

    res.status(200).json(results)
}
