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

/**
 * A week either side of today, which is the window the landing page offers.
 *
 * Still filtered against the season calendar rather than walked day by day:
 * a week with no games in it costs seven pointless navigations otherwise,
 * and in the offseason that is every week.
 */
const WINDOW_DAYS = 7
/** A ceiling on the fan-out, since a busy week can have a game every night. */
const MAX_DATES = 8

const isoToDateParam = (iso) => String(iso).slice(0, 10).replace(/-/g, '')

function dateParam(date) {
    const y = date.getUTCFullYear()
    const m = String(date.getUTCMonth() + 1).padStart(2, '0')
    const d = String(date.getUTCDate()).padStart(2, '0')
    return `${y}${m}${d}`
}

function todayDateParam() {
    return dateParam(new Date())
}

/** `days` from today, as a comparable YYYYMMDD string. */
function offsetDateParam(days) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() + days)
    return dateParam(d)
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
    const weekAhead = offsetDateParam(WINDOW_DAYS)
    const weekBack = offsetDateParam(-WINDOW_DAYS)
    let calendar = calendarOf(base.data)
    // Today belongs to both windows: it holds games still to tip off *and*
    // games already finished, and which list each lands in is decided by
    // its status below rather than by its date.
    let dates =
        tab === 'upcoming'
            ? calendar.filter((d) => d >= today && d <= weekAhead).slice(0, MAX_DATES)
            : calendar.filter((d) => d <= today && d >= weekBack).slice(-MAX_DATES)

    // In the offseason the current season's calendar is entirely in the
    // future, so "past" finds nothing in it. The previous season's calendar
    // comes back from a year query (`?dates=YYYY`), verified directly.
    if (tab === 'past' && dates.length === 0) {
        const seasonYear = Number(base.data?.leagues?.[0]?.season?.year)
        if (Number.isFinite(seasonYear)) {
            const prior = await fetchScoreboard(String(seasonYear - 1))
            if (prior.ok) {
                calendar = calendarOf(prior.data)
                // No week filter here: the point of the fallback is that
                // there are no games within a week, so it reaches back to
                // whatever the last played dates actually were.
                dates = calendar.filter((d) => d < today).slice(-MAX_DATES)
            }
        }
    }

    const games = []
    for (const date of dates) {
        const day = await fetchScoreboard(date)
        if (!day.ok) continue
        games.push(...normalizeScoreboard(day.data))
    }

    /**
     * The two tabs are "watch" and "replay", so they split on status, not
     * only on date. A game that finished earlier today is a replay; one
     * that tips off tonight is not, and neither belongs in the other list.
     */
    const filtered =
        tab === 'upcoming'
            ? games.filter((g) => g.status === 'live' || g.status === 'scheduled')
            : games.filter((g) => g.status === 'final')

    // Anything in progress goes to the front — it is the one thing on this
    // page that cannot be watched later. Then by tip-off time. Replays need
    // no sort: `dates` runs oldest to newest, so the row reads left to right
    // as a timeline up to now, which is why the strip opens scrolled to its
    // end rather than its start.
    if (tab === 'upcoming') {
        const rank = { live: 0, scheduled: 1 }
        filtered.sort(
            (a, b) =>
                (rank[a.status] ?? 2) - (rank[b.status] ?? 2) ||
                (a.startTimeUTC || '').localeCompare(b.startTimeUTC || '')
        )
    }

    res.setHeader(
        'Cache-Control',
        tab === 'past'
            ? 's-maxage=86400, stale-while-revalidate=3600'
            : 's-maxage=300, stale-while-revalidate=600'
    )
    res.status(200).json({ tab, dates, games: filtered })
}
