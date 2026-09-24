import { fetchViaBrowser, ESPN_FEED_BASE } from '../../../components/nba-court/live/nba-browser'
import { normalizeScoreboard } from '../../../components/nba-court/live/normalize'

/**
 * Upcoming and past games, across whatever dates actually have games.
 *
 * ESPN's scoreboard takes a single date only — a range (`?dates=A-B`) is
 * rejected with a 400, verified directly. But every scoreboard response
 * carries `leagues[0].calendar`: the full list of dates in the season that
 * have games at all (174 dates for 2026-27). So instead of walking the
 * calendar day by day and mostly hitting nothing — which today, in the
 * offseason, would mean ~5 weeks of empty requests before the season opener
 * — this reads the calendar once and then fetches only dates known to have
 * games.
 *
 * The fan-out happens here rather than in the browser so a client makes one
 * request, and it reuses `fetchViaBrowser`'s warm browser singleton, where
 * each additional navigation measured ~150ms rather than a cold launch.
 */
export const config = {
    maxDuration: 60,
}

/** How many *game dates* (not games) to pull per tab. */
const DATE_SPAN = 3

const isoToDateParam = (iso) => String(iso).slice(0, 10).replace(/-/g, '')

function todayDateParam() {
    const now = new Date()
    const y = now.getUTCFullYear()
    const m = String(now.getUTCMonth() + 1).padStart(2, '0')
    const d = String(now.getUTCDate()).padStart(2, '0')
    return `${y}${m}${d}`
}

async function fetchScoreboard(dates) {
    const url = dates ? `${ESPN_FEED_BASE}/scoreboard?dates=${dates}` : `${ESPN_FEED_BASE}/scoreboard`
    return fetchViaBrowser(url)
}

function calendarOf(raw) {
    return (raw?.leagues?.[0]?.calendar ?? []).map(isoToDateParam)
}

export default async function handler(req, res) {
    const tab = req.query.tab === 'past' ? 'past' : 'upcoming'

    const base = await fetchScoreboard()
    if (!base.ok) {
        res.status(502).json({ error: 'scoreboard unavailable', status: base.status, message: base.message })
        return
    }

    const today = todayDateParam()
    let calendar = calendarOf(base.data)
    let dates =
        tab === 'upcoming'
            ? calendar.filter((d) => d >= today).slice(0, DATE_SPAN)
            : calendar.filter((d) => d < today).slice(-DATE_SPAN).reverse()

    // In the offseason the current season's calendar is entirely in the
    // future, so "past" finds nothing in it. The previous season's calendar
    // comes back from a year query (`?dates=YYYY`), verified directly.
    if (tab === 'past' && dates.length === 0) {
        const seasonYear = Number(base.data?.leagues?.[0]?.season?.year)
        if (Number.isFinite(seasonYear)) {
            const prior = await fetchScoreboard(String(seasonYear - 1))
            if (prior.ok) {
                calendar = calendarOf(prior.data)
                dates = calendar.filter((d) => d < today).slice(-DATE_SPAN).reverse()
            }
        }
    }

    const games = []
    for (const date of dates) {
        const day = await fetchScoreboard(date)
        if (!day.ok) continue
        games.push(...normalizeScoreboard(day.data))
    }

    // Live first within upcoming, then by start time. Past needs no sort:
    // `dates` is already most-recent-first, so games collect in that order
    // (an earlier `reverse()` here actively broke it — verified against the
    // real response, which came back oldest-first).
    if (tab === 'upcoming') {
        const rank = { live: 0, scheduled: 1, final: 2 }
        games.sort(
            (a, b) =>
                (rank[a.status] ?? 3) - (rank[b.status] ?? 3) ||
                (a.startTimeUTC || '').localeCompare(b.startTimeUTC || '')
        )
    }

    res.setHeader(
        'Cache-Control',
        tab === 'past'
            ? 's-maxage=86400, stale-while-revalidate=3600'
            : 's-maxage=300, stale-while-revalidate=600'
    )
    res.status(200).json({ tab, dates, games })
}
