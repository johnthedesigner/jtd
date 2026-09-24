import { fetchViaBrowser, ESPN_SUMMARY_BASE } from '../../../../components/nba-court/live/nba-browser'
import { normalizeGameHeader, normalizePlayByPlay } from '../../../../components/nba-court/live/normalize'

/**
 * Play-by-play for one game, from ESPN's `summary` endpoint — which bundles
 * play-by-play, box score, odds, injuries, and more into a single payload
 * (confirmed directly: see JOURNAL.md). This app only needs the game header
 * (to resolve `homeTeamId`, for orienting plays) and the plays themselves,
 * so only those are returned — not the raw payload's odds/injuries/news/
 * videos/standings.
 *
 * `gameId` here is ESPN's own numeric event id (e.g. `401705127`), not
 * NBA's gameId format.
 *
 * Only ever polled for a game a client is actually watching, at a much
 * tighter cadence than the scoreboard — 3s matches roughly how often the
 * feed itself picks up a new action, and leans on the edge cache (not a
 * background loop — Vercel Cron's minimum interval is a full minute) to
 * keep repeat viewers of the same game from each paying for their own
 * browser navigation.
 */
export const config = {
    maxDuration: 60,
}

export default async function handler(req, res) {
    const { gameId } = req.query
    if (!/^\d+$/.test(String(gameId))) {
        res.status(400).json({ error: 'invalid gameId' })
        return
    }
    const result = await fetchViaBrowser(`${ESPN_SUMMARY_BASE}/summary?event=${gameId}`)
    if (!result.ok) {
        res.status(502).json({ error: 'summary unavailable', status: result.status, message: result.message })
        return
    }
    const game = normalizeGameHeader(result.data)
    const plays = normalizePlayByPlay(result.data, { homeTeamId: game.home.teamId })

    res.setHeader('Cache-Control', 's-maxage=3, stale-while-revalidate=5')
    res.status(200).json({ game, plays })
}
