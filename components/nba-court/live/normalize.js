import { espnAbbrToTeam } from './nba-teams'
import { playLocationToWorld } from '../shot-data'

/**
 * Converts ESPN's raw scoreboard/summary payloads into this app's own
 * shapes, so a feed change touches only this file. Field names and the
 * coordinate convention below were verified against one real completed game
 * (Knicks @ 76ers, 2025-01-15, ESPN event 401705127) — see
 * `components/nba-court/JOURNAL.md` for the verification numbers, not just
 * an assertion that this is right.
 */

/**
 * ESPN's own status.type.state values, confirmed only for 'post' this
 * session (the one real game fetched was already final). 'pre' and 'in' are
 * ESPN's well-documented convention across their sports APIs, not
 * independently confirmed against a live or scheduled game here — worth a
 * quick re-check once this is exercised against an actual in-progress game.
 */
function normalizeStatus(state) {
    if (state === 'pre') return 'scheduled'
    if (state === 'in') return 'live'
    if (state === 'post') return 'final'
    return 'scheduled'
}

function sideFromCompetitor(c) {
    return {
        teamId: c?.team?.id ? Number(c.team.id) : null,
        tricode: espnAbbrToTeam(c?.team?.abbreviation),
        name: c?.team?.displayName ?? null,
        score: c?.score != null ? Number(c.score) : null,
    }
}

/** Shared by both `normalizeScoreboard` (one event) and `normalizeGameHeader`
 *  (the summary endpoint's `header`, which carries the same competition
 *  shape) — confirmed directly against a real summary payload, not assumed
 *  to match just because the field names look similar. */
function gameSummaryFromEvent(gameId, comp) {
    const status = comp?.status
    const competitors = comp?.competitors ?? []
    const home = competitors.find((c) => c.homeAway === 'home')
    const away = competitors.find((c) => c.homeAway === 'away')
    const homeSide = sideFromCompetitor(home)

    return {
        gameId,
        status: normalizeStatus(status?.type?.state),
        startTimeUTC: comp?.date,
        period: status?.period ?? 0,
        clock: status?.displayClock ?? '0:00',
        home: homeSide,
        away: sideFromCompetitor(away),
        courtKey: homeSide.tricode,
    }
}

export function normalizeScoreboard(raw) {
    const events = raw?.events ?? []
    return events.map((event) => gameSummaryFromEvent(event.id, event.competitions?.[0]))
}

/** The summary endpoint's `header` carries the same game info the
 *  scoreboard does, needed here so a play-by-play route can resolve
 *  `homeTeamId` (for orienting plays — see `normalizePlayByPlay`) from the
 *  one payload it already has, without a second scoreboard lookup. */
export function normalizeGameHeader(raw) {
    const header = raw?.header
    return gameSummaryFromEvent(header?.id, header?.competitions?.[0])
}

/**
 * ESPN marks "no real location for this play" (free throws, jump balls,
 * substitutions, ...) with a sentinel value near Int32 min
 * (-2147483648-ish) rather than omitting the field or using null —
 * confirmed directly against the raw payload, not assumed. Anything with
 * a magnitude nowhere near the court's own scale (at most ~50-60ft) is
 * treated as "no location."
 */
function hasRealCoordinate(c) {
    return c && Number.isFinite(c.x) && Number.isFinite(c.y) && Math.abs(c.x) < 1000 && Math.abs(c.y) < 1000
}

/**
 * Built from the full set of distinct `type.text` values seen in one real
 * game's play-by-play (216 shooting plays, 441 plays total) — not an
 * enumerated table of every specific shot id, which varies too widely
 * (Jump Shot, Pullup, Driving Layup, Fade Away, ...) to enumerate reliably;
 * `shootingPlay` is the structural signal for "this is a shot" instead.
 * Free throws are also flagged `shootingPlay: true` by ESPN, so they're
 * special-cased ahead of the generic shot check, confirmed directly against
 * a real free-throw play in the sample.
 */
function normalizePlayType(type, shootingPlay) {
    const text = type?.text ?? ''
    if (text.startsWith('Free Throw')) return 'freeThrow'
    if (shootingPlay) return 'shot'
    if (text.includes('Rebound')) return 'rebound'
    if (text.includes('Foul')) return 'foul'
    if (text.includes('Turnover') || text === 'Traveling' || text === 'Kicked Ball') return 'turnover'
    if (text === 'Substitution') return 'substitution'
    if (text.includes('Timeout')) return 'timeout'
    if (text === 'End Period' || text === 'End Game' || text.startsWith('Start')) return 'period'
    if (text === 'Jumpball') return 'jumpball'
    return 'other'
}

/**
 * Which plays get a court location, and at which basket.
 *
 * ESPN attaches `coordinate` to far more than shots, which an earlier pass
 * here threw away by only reading it for `shootingPlay`. Re-checked against
 * the same real game (ESPN event 401705127, 441 plays), comparing every
 * non-shooting play's coordinate against its neighbours':
 *
 * - **Fouls: 31 of 34 independent.** Real, distinct locations. Kept.
 * - **Turnovers: 27 of 27 independent.** Real. Kept — and much better than
 *   the guess it replaces, which parked every steal near mid-court.
 * - **Rebounds: 86 of 86 are an exact copy of the previous play's
 *   coordinate** — ESPN stamps the missed shot's location onto the rebound
 *   rather than recording where the ball was gathered. Separation from the
 *   miss was 0.0ft at every percentile across all 93 miss/rebound pairs. So
 *   this is not a rebound location at all, and using it would stack a
 *   rebound mark exactly on the miss mark that just landed. Dropped here;
 *   `live-markers.js` places rebounds near the rim instead and says that
 *   it's inferred.
 * - Free throws carry ESPN's no-location sentinel, correctly — they happen
 *   on the line by definition, which `live-markers.js` handles.
 *
 * **Which basket** is a separate question from where on the half. ESPN's
 * coordinate is already relative to the basket the action happened at, so
 * only the left/right world placement depends on `end`, and `end` is
 * derived from the *play's own team*. That team is the attacking one for a
 * shot or a turnover, but the *defending* one for a foul — so a foul is
 * mirrored to the other end. Not independently verified, and it sits on top
 * of an x-sign orientation that was never verified either (see below); the
 * distance from the basket is right either way.
 */
function locateOnCourt(type, coordinate, end) {
    if (type === 'rebound' || type === 'freeThrow') return undefined
    if (!hasRealCoordinate(coordinate)) return undefined
    const atEnd = type === 'foul' ? -end : end
    const [x, z] = playLocationToWorld(coordinate.x, coordinate.y, atEnd)
    return { x, y: z }
}

/**
 * Which basket a given play's shot is drawn at, in world space — ESPN's own
 * coordinate is already relative to "the basket this shot targeted"
 * (verified: every team's shots stay in the same 0-30ish range in every
 * period, home or away — see JOURNAL.md), so there's no real period-based
 * end-switching to reconstruct, only a per-team choice of which physical
 * side of the rendered floor represents that team's shots — home at
 * `end=1`, away at `end=-1` — decided by comparing each play's own
 * `team.id` against `homeTeamId`, not applied uniformly to the whole game
 * (a play's team can be either side).
 *
 * Left/right (x) sign orientation has NOT been independently verified — the
 * distance-from-rim check that confirmed the origin/scale is symmetric
 * under x-mirroring, so this could place corner shots on the wrong side
 * until checked against a known shot visually.
 */
export function normalizePlayByPlay(raw, { homeTeamId } = {}) {
    const plays = raw?.plays ?? []
    return plays.map((p) => {
        const shootingPlay = Boolean(p.shootingPlay)
        const type = normalizePlayType(p.type, shootingPlay)
        const teamId = p.team?.id ? Number(p.team.id) : undefined
        const end = teamId === Number(homeTeamId) ? 1 : -1
        const court = locateOnCourt(type, p.coordinate, end)

        return {
            actionNumber: Number(p.sequenceNumber),
            period: p.period?.number ?? 0,
            clock: p.clock?.displayValue ?? '0:00',
            teamId,
            // Which basket this play's team is attacking, in world space —
            // exposed alongside `court` (not just used internally to compute
            // it) since a camera scene needs to know which end to face even
            // for plays with no specific location (e.g. a team's own
            // basket, for a turnover). Meaningless when `teamId` is
            // undefined (period/game-boundary plays carry no team).
            end,
            playerId: p.participants?.[0]?.athlete?.id ?? undefined,
            // ESPN's play-by-play doesn't embed a player display name
            // separately from `text` — only athlete ids. Cross-referencing
            // the boxscore's roster for names is real, un-done work; until
            // then `description` (below) is the only reliable display
            // string.
            playerName: undefined,
            type,
            subType: p.type?.text ?? undefined,
            made: shootingPlay ? Boolean(p.scoringPlay) : undefined,
            description: p.text ?? p.shortDescription ?? '',
            court,
            scoreHome: p.homeScore ?? undefined,
            scoreAway: p.awayScore ?? undefined,
        }
    })
}
