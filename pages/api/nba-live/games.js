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

/**
 * ESPN keys its scoreboard by the **US** date, and this used to read UTC.
 *
 * An NBA evening game is the next day in UTC before it has even tipped off:
 * 7pm Eastern on the 14th is 23:00 UTC, and a 10:30pm game runs past 03:00
 * UTC on the 15th. So from late afternoon Eastern onward, "today" in UTC was
 * tomorrow's scoreboard — and since the upcoming window starts at today,
 * every game actually being played was filtered out before a request was
 * even made. "Watch live" could not show a live game after about 8pm ET,
 * which is when nearly all of them are on.
 *
 * Formatting in `America/New_York` asks for the date ESPN itself is using.
 */
const ESPN_TIME_ZONE = 'America/New_York'
const espnDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: ESPN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
})

function dateParam(date) {
    // `en-CA` formats as YYYY-MM-DD, which is the shape ESPN wants minus
    // its separators.
    return espnDate.format(date).replace(/-/g, '')
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
    /*
      The upcoming window reaches back one day as well as forward.

      A game that tipped at 10pm Eastern is still being played at 1am, by
      which point ESPN's "today" has rolled over but the game is still on
      *yesterday's* scoreboard. Starting the window at today would drop it
      at exactly the moment someone might want to watch it. It costs one
      extra scoreboard fetch, and the status filter below throws away
      anything from that date which has already finished.
    */
    const yesterday = offsetDateParam(-1)
    let calendar = calendarOf(base.data)
    // Today belongs to both windows: it holds games still to tip off *and*
    // games already finished, and which list each lands in is decided by
    // its status below rather than by its date.
    let dates =
        tab === 'upcoming'
            ? calendar.filter((d) => d >= yesterday && d <= weekAhead).slice(0, MAX_DATES)
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

    /*
      Both windows change while someone is watching, which the old numbers
      did not allow for.

      `upcoming` carries live scores and clocks, and a day's cache on `past`
      meant a game that had just finished would not appear in Replays until
      tomorrow. The edge cache still absorbs the real cost — this route is a
      handful of real browser navigations — it just does so over seconds now
      rather than hours.
    */
    /*
      `max-age=0` is the part that matters for the browser.

      `s-maxage` only speaks to shared caches, so with no `max-age` at all
      Chrome fell back to heuristic freshness and served its own copy: the
      landing polled on schedule and redisplayed the same score and clock
      for minutes while the route itself was returning fresh ones. This asks
      the browser to revalidate every time and lets the edge absorb the real
      cost, which is where it belongs — a miss here is a handful of actual
      browser navigations.
    */
    res.setHeader(
        'Cache-Control',
        tab === 'past'
            ? 'public, max-age=0, s-maxage=300, stale-while-revalidate=1800'
            : 'public, max-age=0, s-maxage=30, stale-while-revalidate=60'
    )
    res.status(200).json({ tab, dates, games: filtered })
}
