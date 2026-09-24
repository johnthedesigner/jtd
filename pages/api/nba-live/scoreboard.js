import { fetchViaBrowser, ESPN_FEED_BASE } from '../../../components/nba-court/live/nba-browser'
import { normalizeScoreboard } from '../../../components/nba-court/live/normalize'

/**
 * Today's games and scores, from ESPN — the confirmed-working source (see
 * JOURNAL.md; NBA's own cdn.nba.com endpoint stays blocked even through the
 * same headless-browser mechanism). Cached at the edge rather than in
 * application memory — a serverless function's module state isn't reliably
 * shared across concurrent invocations, but `s-maxage` lets Vercel's own
 * network de-duplicate concurrent viewers for free, which matters even more
 * now that a cache miss costs a real browser navigation, not a cheap HTTP
 * call. 20s matches how often the scoreboard itself actually changes.
 */
export const config = {
    // A cold Chromium launch alone can approach the Hobby-tier 10s default;
    // this needs a Pro-tier-or-higher configurable duration.
    maxDuration: 60,
}

function todayAsEspnDate() {
    const now = new Date()
    const y = now.getUTCFullYear()
    const m = String(now.getUTCMonth() + 1).padStart(2, '0')
    const d = String(now.getUTCDate()).padStart(2, '0')
    return `${y}${m}${d}`
}

export default async function handler(req, res) {
    const dates = /^\d{8}$/.test(String(req.query.dates)) ? req.query.dates : todayAsEspnDate()
    const result = await fetchViaBrowser(`${ESPN_FEED_BASE}/scoreboard?dates=${dates}`)
    if (!result.ok) {
        res.status(502).json({ error: 'scoreboard unavailable', status: result.status, message: result.message })
        return
    }
    res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=30')
    // Normalized here, server-side, rather than passed through raw: ESPN's
    // payload carries odds/injuries/news/videos/standings none of this app
    // needs, and every consumer downstream should only ever know this app's
    // own GameSummary shape, never ESPN's.
    res.status(200).json({ games: normalizeScoreboard(result.data) })
}
