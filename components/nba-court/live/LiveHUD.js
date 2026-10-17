import { useEffect, useState } from 'react'
import useVisualViewportInset from '../../webgl/use-visual-viewport-inset'
import { markerForPlay } from './live-markers'
import useNarrow from '../use-narrow'
import { brandBadge, brandBright, scoreBandGradient } from './team-gradient'
import { teamLogoUrl } from './nba-teams'
import MarkerGlyph from './MarkerGlyph'
import { OVERLAY_BG_STRONG } from '../overlay-surface'

/**
 * The flat 2D complement to the 3D scene (floor marks, `ScoreboardText`) —
 * not redundant with it. The in-scene typography is an occasional moment
 * (timeouts, period breaks); this is always-available detail the way a real
 * broadcast's score bug never goes away just because there's also a video
 * board.
 *
 * Laid out as a broadcast bug rather than a panel of controls: the call —
 * what just happened — is the top line and the largest thing here, because
 * it is the one element that changes and the one the floor marks are
 * illustrating. The score sits under it, deliberately small; it is
 * reference, not news, and the same numbers are already three storeys tall
 * behind the benches.
 *
 * Score/period/clock are read off `latestPlay`, not `game` — `game`'s own
 * score is the *final* score baked into a completed game's payload, not
 * "the score as of this point". Every play carries the score at its own
 * moment, which is the one value correct throughout playback.
 */

/**
 * Which side a play belongs to, matched on ESPN's numeric team id rather
 * than on the play's `end`.
 *
 * `end` says which basket the team is attacking, which is the same question
 * only until a defensive play comes along — a steal or a defensive rebound
 * is credited to the side *not* attacking that end. The id is unambiguous.
 * Period and game boundaries carry no team at all, so this returns null and
 * the badge is simply absent.
 */
function sideForPlay(game, play) {
    const id = play?.teamId
    if (id == null) return null
    if (game?.home?.teamId === id) return game.home
    if (game?.away?.teamId === id) return game.away
    return null
}

/** The team whose action it was, in its own colour. */
function TeamBadge({ side, size = 'md' }) {
    if (!side) return null
    const label = (side.tricode || side.abbr || '').toUpperCase()
    if (!label) return null
    const { background, color } = brandBadge(side.color)
    return (
        <span
            className={`shrink-0 rounded-[3px] font-sans font-bold uppercase tabular-nums tracking-wider ${
                size === 'sm'
                    ? 'px-1 py-px text-[9px]'
                    : 'px-1.5 py-0.5 text-[10px]'
            }`}
            style={{ backgroundColor: background, color }}
        >
            {label}
        </span>
    )
}

function periodLabel(period) {
    if (!period) return ''
    if (period <= 4) return ['1st', '2nd', '3rd', '4th'][period - 1]
    const ot = period - 4
    return ot === 1 ? 'OT' : `${ot}OT`
}

/**
 * Timeouts remaining, counted from the play-by-play and capped the way a
 * broadcast bug caps them.
 *
 * ESPN does not report this. The summary payload carries a
 * `timeoutsAvailable` boolean — a feed capability flag, not a count — and
 * nothing else, checked directly against a full game's payload. But every
 * timeout is itself a play, attributed to a team, so what's left is the
 * allowance minus the ones already taken.
 *
 * **There is no per-half allowance in the NBA.** The seven are spread
 * across all four quarters with no first/second-half split. What makes a
 * TV bug show two or three late in a game is not a half reset, it's a set
 * of ceilings on how many a team may still *hold*:
 *
 * - no more than 4 may be used in the fourth quarter, and anything unused
 *   from the first three quarters is forfeited rather than carried;
 * - from the later of 3:00 left in the fourth or the second mandatory TV
 *   timeout, a team may hold only 2 for the rest of the game;
 * - each overtime grants 2 more, which likewise can't be replenished.
 *
 * So the number shown is the smaller of "how many are left" and "how many
 * may still be held at this point", and the row of pips is sized to that
 * ceiling — which is why it shrinks from seven to four to two as the game
 * closes out, exactly as a broadcast bug does.
 */
const BASE_TIMEOUTS = 7
const OT_TIMEOUTS = 2
const FOURTH_QUARTER_CAP = 4
const LATE_GAME_CAP = 2
/** Seconds left in the fourth at which the two-timeout ceiling applies. */
const LATE_GAME_SECONDS = 180

/**
 * Team fouls, and whether that puts the other side in the bonus.
 *
 * ESPN does not report either. Both are counted from the play-by-play, and
 * the counting rules come from the rulebook (Rule 12) rather than from the
 * several blog explanations that disagree with each other:
 *
 * - **Four team fouls per regulation period**, so the fifth is penalised.
 *   **Three in overtime**, so the fourth is.
 * - **A team that has not used its quota gets one free foul in the last two
 *   minutes.** The practical effect, and the one broadcasts show, is that
 *   inside two minutes the *second* foul of those two minutes puts a team in
 *   the penalty however few they have committed overall.
 * - **Offensive fouls are not charged as team fouls** ("the offending team
 *   is not charged with a team foul"), and technicals are not common fouls
 *   charged as team fouls either. Flagrant and clear-path fouls *are*
 *   included.
 *
 * Which is why this excludes rather than allows: anything ESPN calls a foul
 * counts unless it is a technical, an offensive foul, or the duplicate
 * `Offensive Foul Turnover` row it emits beside one. An unfamiliar new foul
 * type then counts, which is right far more often than it is wrong — an
 * allowlist would silently drop it.
 *
 * Validated by counting personal fouls the same way across seven games and
 * comparing against each box score: five matched exactly and two were short
 * by one, both because ESPN had emitted an `Offensive Foul Turnover` with no
 * paired `Offensive Foul` row. Offensive fouls are excluded from the team
 * total anyway, so the bonus figure is unaffected by that gap.
 */
const REGULATION_TEAM_FOULS = 4
const OVERTIME_TEAM_FOULS = 3
/** Seconds left at which the last-two-minutes allowance applies. */
const LATE_PERIOD_SECONDS = 120
/** Fouls inside those two minutes that put a team in the penalty. */
const LATE_PERIOD_FOULS = 2

function countsAsTeamFoul(play) {
    if (play.type !== 'foul') return false
    const kind = play.subType ?? ''
    if (/technical/i.test(kind)) return false
    if (/offensive foul/i.test(kind)) return false
    return true
}

/**
 * `{ fouls, inPenalty }` for the team with this ESPN id, in the period the
 * game is currently in. `inPenalty` means *this* team has fouled enough that
 * the other side now shoots — so the bonus belongs to the opponent.
 */
function teamFoulState(plays, teamId, period, clock) {
    if (teamId == null || !period) return { fouls: 0, inPenalty: false }
    const quota = period > 4 ? OVERTIME_TEAM_FOULS : REGULATION_TEAM_FOULS
    let fouls = 0
    let lateFouls = 0
    for (const play of plays) {
        if (play.period !== period) continue
        if (play.teamId !== teamId) continue
        if (!countsAsTeamFoul(play)) continue
        fouls += 1
        const left = clockSeconds(play.clock)
        if (left != null && left <= LATE_PERIOD_SECONDS) lateFouls += 1
    }
    const left = clockSeconds(clock)
    const inLate = left != null && left <= LATE_PERIOD_SECONDS
    const inPenalty =
        fouls > quota || (inLate && lateFouls >= LATE_PERIOD_FOULS)
    return { fouls, inPenalty }
}

/** "11:46" or, under a minute, "4.0" — both appear in the same feed. */
function clockSeconds(clock) {
    if (clock == null) return null
    const text = String(clock)
    if (text.includes(':')) {
        const [m, sec] = text.split(':')
        const total = Number(m) * 60 + Number(sec)
        return Number.isFinite(total) ? total : null
    }
    const n = Number(text)
    return Number.isFinite(n) ? n : null
}

/** The most a team may still be holding at this point in the game. */
function timeoutCeiling(period, clock) {
    if (!period) return BASE_TIMEOUTS
    if (period > 4) return LATE_GAME_CAP
    if (period === 4) {
        const secs = clockSeconds(clock)
        if (secs != null && secs <= LATE_GAME_SECONDS) return LATE_GAME_CAP
        return FOURTH_QUARTER_CAP
    }
    return BASE_TIMEOUTS
}

function timeoutsRemaining(plays, end, period, clock) {
    const overtimes = Math.max(0, (period ?? 0) - 4)
    const allowance = BASE_TIMEOUTS + overtimes * OT_TIMEOUTS
    let used = 0
    for (const p of plays) {
        if (p.type === 'timeout' && p.end === end) used += 1
    }
    const left = allowance - used
    return Math.max(0, Math.min(left, timeoutCeiling(period, clock)))
}

/**
 * Timeouts, as the countable notches a broadcast bug uses.
 *
 * Notches rather than dots, and taller than they are wide, because the
 * question being asked of them is "how many" — a row of small circles reads
 * as texture at a glance, which is the failure the article singles out.
 */
function TimeoutPips({ left, ceiling, accent }) {
    return (
        <div className="flex items-center gap-[3px]" title={`${left} timeouts left`}>
            {Array.from({ length: ceiling }, (_, i) => (
                <span
                    key={i}
                    className="h-[9px] w-[3px] rounded-[1px]"
                    style={{
                        backgroundColor: i < left ? accent || '#cbd3e0' : 'transparent',
                        boxShadow: i < left ? 'none' : 'inset 0 0 0 1px rgba(255,255,255,0.25)',
                    }}
                />
            ))}
        </div>
    )
}

/**
 * The bonus flag.
 *
 * Amber, horizontal, and set solid rather than outlined — the one criticism
 * the article levels at nearly every bug it ranks is a bonus marker you
 * cannot pick out, whether because it is white on white, vertical, or tiny.
 * It is shown against the team that *benefits*, which is the side that will
 * shoot, not the side that has been fouling.
 */
function BonusFlag() {
    return (
        <span className="rounded-[2px] bg-amber-300 px-1 py-px font-sans text-[9px] font-bold uppercase leading-none tracking-wider text-[#0b0d12]">
            Bonus
        </span>
    )
}

/**
 * One side of the score bug: the team, its score, and its state.
 *
 * The score is the largest thing in the whole overlay, which is a reversal
 * — it used to sit deliberately small beneath the play description, on the
 * argument that the in-scene scoreboard already carries it three storeys
 * tall. That holds right up until the camera turns, or the viewport is a
 * phone, and it was never true of the clock, the fouls or the bonus, none
 * of which exist anywhere else. The bug is the thing you read at a glance,
 * so it reads like one.
 *
 * The team sits on a panel of its own colour, which is what the ranked
 * broadcast bugs do and the muted ones get marked down for.
 */
/**
 * The stripe's dimensions, and the narrower set a phone gets.
 *
 * Two bookends at the wide inset eat 140 of a 390pt screen, which left the
 * clock sitting on top of the scores and the two bonus flags overlapping
 * each other in the middle. The marks shrink rather than disappear — they
 * are most of what makes this read as a scorebug rather than a table.
 */
const BAND_HEIGHT = 66
const BAND_HEIGHT_NARROW = 60
/** Deliberately larger than the band — this is what does the cropping. */
const BOOKEND_LOGO = 88
const BOOKEND_LOGO_NARROW = 62
/** Where the text starts, clear of the mark. */
const BOOKEND_INSET = 70
const BOOKEND_INSET_NARROW = 40

/**
 * A team's mark, bookending its end of the stripe.
 *
 * Same trick the game cards use: a logo larger than the row it sits in,
 * pulled past the edge so it breaks three sides. Contained, it would be a
 * small icon beside a label; cropped, it is the end of the stripe. It takes
 * a drop shadow because a mark drawn in the club's own colour would
 * otherwise melt into the colour behind it, which is the club's own.
 */
function BookendLogo({ side, align, dim, narrow }) {
    const src = teamLogoUrl(side?.tricode)
    if (!src) return null
    const size = narrow ? BOOKEND_LOGO_NARROW : BOOKEND_LOGO
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt=""
            aria-hidden
            width={size}
            height={size}
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 object-contain ${
                dim ? 'opacity-40' : ''
            }`}
            style={{
                [align]: narrow ? -10 : -14,
                height: size,
                width: size,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
            }}
        />
    )
}

/**
 * One side of the score bug: the team, its score, and its state.
 *
 * The score is the largest thing in the whole overlay, which is a reversal
 * — it used to sit deliberately small beneath the play description, on the
 * argument that the in-scene scoreboard already carries it three storeys
 * tall. That holds right up until the camera turns, or the viewport is a
 * phone, and it was never true of the clock, the fouls or the bonus, none
 * of which exist anywhere else. The bug is the thing you read at a glance,
 * so it reads like one.
 *
 * The tricode has no badge of its own any more: the stripe behind it is
 * already this team's colour, so a second coloured chip on top of it was
 * saying the same thing twice.
 */
function ScoreSide({ side, score, accent, timeouts, ceiling, fouls, bonus, align = 'left', dim = false, narrow = false }) {
    const right = align === 'right'
    const inset = narrow ? BOOKEND_INSET_NARROW : BOOKEND_INSET
    // Lifted clear of the stripe behind them: the shipped brand hex sits
    // only a step or two from the `brandFill` it would be drawn on, which
    // at 3px wide is not enough to count them by. See `brandBright`.
    const vivid = brandBright(side?.color)

    return (
        <div
            className={`relative flex min-w-0 flex-1 flex-col justify-center gap-1 ${
                dim ? 'opacity-45' : ''
            }`}
            style={right ? { paddingRight: inset } : { paddingLeft: inset }}
        >
            <div className={`flex items-baseline gap-2 ${right ? 'flex-row-reverse' : ''}`}>
                <span className="shrink-0 font-sans text-xs font-bold uppercase tracking-wider text-white/80">
                    {side?.tricode ? side.tricode.toUpperCase() : side?.abbr ?? '—'}
                </span>
                <span className="shrink-0 font-sans text-[30px] font-bold leading-none tabular-nums text-white sm:text-[36px]">
                    {score ?? '—'}
                </span>
            </div>
            {/* Timeouts, team fouls and the bonus, on one quiet sub-line. */}
            <div
                className={`flex items-center gap-2 ${right ? 'flex-row-reverse' : ''}`}
                style={{ minHeight: 12 }}
            >
                <TimeoutPips left={timeouts} ceiling={ceiling} accent={vivid || accent} />
                <span className="whitespace-nowrap font-sans text-[10px] font-bold uppercase tracking-wider text-white/55">
                    {/* "FLS" on a phone, where the full word is the
                        difference between fitting and colliding. */}
                    {fouls} {narrow ? 'fls' : fouls === 1 ? 'foul' : 'fouls'}
                </span>
                {bonus && <BonusFlag />}
            </div>
        </div>
    )
}

/**
 * The call row's height, fixed.
 *
 * It has to be: the camera frames the scene into the band above this
 * overlay (see `useFrameInsets`), so a row that grew or shrank with its
 * contents would rescale the court underneath it. Fixing it is also what
 * lets the row clip — a ticker needs somewhere for the old line to go.
 */
const CALL_HEIGHT = 50
const CALL_HEIGHT_NARROW = 44

/** How long a call takes to hand over to the next one. */
const TICK_MS = 420
/**
 * Decelerating, and the same curve for both halves.
 *
 * The two lines are one strip of paper moving past a window, not two
 * independent animations — giving the outgoing line its own easing makes
 * them visibly slide at different rates and the illusion falls apart. This
 * is an ease-out: quick to commit, slow to settle, which is how a physical
 * ticker behaves once it is let go.
 */
const TICK_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

/**
 * One line of the ticker, positioned over the whole clip area so the
 * outgoing and incoming calls can occupy it at once.
 *
 * `offset` is where it sits: -1 is a line's height above the window, 1 is a
 * line's height below it, 0 is in place.
 */
function CallLine({ offset, settled, children }) {
    return (
        <span
            className="absolute inset-0 flex items-center gap-2.5 motion-reduce:!transition-none"
            style={{
                transform: `translateY(${offset * 100}%)`,
                opacity: offset === 0 ? 1 : 0,
                transition: settled
                    ? `transform ${TICK_MS}ms ${TICK_EASE}, opacity ${TICK_MS}ms ${TICK_EASE}`
                    : 'none',
            }}
        >
            {children}
        </span>
    )
}

/**
 * Hands over from one call to the next.
 *
 * Keeps the outgoing play mounted for the length of the transition, which
 * is the whole trick — React would otherwise unmount it the instant the new
 * one arrives and there would be nothing left to slide away. State holds
 * the *plays* rather than rendered nodes, so the lines are drawn by the
 * same function and cannot drift apart.
 *
 * The incoming line is mounted below the window with transitions off, and
 * only then released, over two frames. One frame is not enough: the browser
 * can coalesce the mount and the class change into a single style
 * recalculation, and the line simply appears in place with no travel.
 */
function useCallTicker(play) {
    const keyOf = (p) => (p ? p.actionNumber : 'empty')
    const [frame, setFrame] = useState(() => ({
        shown: play,
        leaving: null,
        token: 0,
        released: true,
    }))

    useEffect(() => {
        setFrame((prev) => {
            if (keyOf(play) === keyOf(prev.shown)) {
                // Same call, re-rendered. Keep the node fresh, do not animate.
                return play === prev.shown ? prev : { ...prev, shown: play }
            }
            return {
                shown: play,
                leaving: prev.shown,
                token: prev.token + 1,
                released: false,
            }
        })
    }, [play])

    /*
      Depends on the token alone, and that matters more than it looks.
      Keying this to `shown` or `released` instead means the state it sets
      re-runs the effect, whose cleanup then cancels the very frames it just
      scheduled — the two lines mount in position and never move, which is
      exactly what the first version did.

      The token only changes on a genuine handover, so the frames and the
      timeout survive long enough to do their work, and the guards make a
      late callback from a superseded handover a no-op.
    */
    useEffect(() => {
        if (frame.token === 0) return
        const token = frame.token
        let second = 0
        const first = requestAnimationFrame(() => {
            second = requestAnimationFrame(() =>
                setFrame((f) => (f.token === token ? { ...f, released: true } : f))
            )
        })
        const done = setTimeout(
            () => setFrame((f) => (f.token === token ? { ...f, leaving: null } : f)),
            TICK_MS
        )
        return () => {
            cancelAnimationFrame(first)
            cancelAnimationFrame(second)
            clearTimeout(done)
        }
    }, [frame.token])

    return { shown: frame.shown, leaving: frame.leaving, released: frame.released }
}

function Chevron({ open, dim = false }) {
    return (
        <svg
            viewBox="0 0 16 16"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''} ${
                dim ? 'opacity-25' : ''
            }`}
            aria-hidden
        >
            <polyline points="6,3 11,8 6,13" />
        </svg>
    )
}

export default function LiveHUD({
    active,
    game,
    plays,
    latestPlay,
    homeColors,
    awayColors,
    winner,
    footerLeft,
    footerRight,
}) {
    const viewportInset = useVisualViewportInset()
    const narrow = useNarrow()
    /*
      Open by default on a phone. The call row truncates hard at that width,
      so the one line of context it can show is often not the line you
      wanted — and there is no hover or tooltip to recover the rest. On a
      wide screen the call reads in full and the feed is genuinely optional,
      so it stays closed there.
    */
    const [expanded, setExpanded] = useState(false)
    const [touched, setTouched] = useState(false)
    useEffect(() => {
        // Only until the viewer says otherwise: once they have opened or
        // closed it themselves, a resize must not overrule them.
        if (!touched) setExpanded(narrow)
    }, [narrow, touched])
    const toggle = () => {
        setTouched(true)
        setExpanded((e) => !e)
    }

    // Above the early return, with the rest of the hooks. Placed below it
    // this ran only on the renders that got that far, which React counts as
    // a changing number of hooks and refuses outright.
    const { shown, leaving, released } = useCallTicker(latestPlay)

    if (!active || !game) return null

    // Deliberately NOT falling back to `game`'s own score/clock when there's
    // no `latestPlay` yet: those are baked in at payload time (the final
    // score, for a completed game), so showing them before the replay has
    // revealed a single play would present an unstarted game as over.
    const homeScore = latestPlay ? latestPlay.scoreHome : 0
    const awayScore = latestPlay ? latestPlay.scoreAway : 0
    const period = latestPlay?.period
    const clock = latestPlay?.clock ?? '—'

    const homeTimeouts = timeoutsRemaining(plays, 1, period, clock)
    const awayTimeouts = timeoutsRemaining(plays, -1, period, clock)
    const ceiling = timeoutCeiling(period, clock)
    // Attributed by ESPN's team id rather than by the play's `end`: `end` is
    // which basket the play happened at, and for a foul that is the *other*
    // team's (see `normalize.js`). The id is who committed it.
    const homeFouls = teamFoulState(plays, game.home?.teamId, period, clock)
    const awayFouls = teamFoulState(plays, game.away?.teamId, period, clock)

    const feed = [...plays].reverse()

    /**
     * One call, drawn the same way whichever line it is on. Only the line
     * actually in place carries `data-latest-play`, so anything reading the
     * current call off the DOM never catches the one on its way out.
     */
    const renderCall = (play, current = false) =>
        play ? (
            <>
                <MarkerGlyph kind={markerForPlay(play)?.kind} size={16} />
                <TeamBadge side={sideForPlay(game, play)} />
                <span
                    {...(current ? { 'data-latest-play': '' } : {})}
                    className="min-w-0 flex-1 truncate font-sans text-sm font-bold text-white"
                >
                    {play.description}
                </span>
            </>
        ) : (
            <span className="min-w-0 flex-1 truncate font-sans text-sm font-bold text-white/45">
                {game.status === 'final' ? 'Starting playback…' : 'Waiting for tip-off…'}
            </span>
        )

    return (
        <div
            data-bottom-overlay
                        /*
              Fixed to the visual viewport, not to the page box.

              This was `absolute; bottom: 0` inside a container sized from
              a measured `--app-height`, plus a measured `--vv-clip`
              correction on its padding. That chain is only correct while
              every box in it is, and on iOS one of them is not: with the
              document box 140 px taller than the screen — which is what
              the toolbar-hidden layout viewport produces — an
              `absolute; bottom: 0` child lands 140 px below the fold.
              See `components/webgl/use-visual-viewport-inset`.
            */
            className="pointer-events-none fixed inset-x-0 z-20 flex justify-center"
            /*
              The same bottom gap the game strip uses, plus whatever the
              device reserves for its home indicator. This had only a flat
              16px: under `viewport-fit=cover` the page reaches beneath that
              bar, so on a phone the overlay's last row — the tour button
              and the speed control — sat underneath it and was unreadable.
              The strip got this treatment and this did not.
            */
            style={{
                bottom: `${viewportInset}px`,
                paddingBottom:
                    'calc(var(--strip-gap) + env(safe-area-inset-bottom, 0px))',
                paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
                paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
            }}
        >
            <div
                data-tour="live-hud"
                className="pointer-events-auto w-full max-w-xl overflow-hidden rounded-sm ring-1 ring-white/10 backdrop-blur"
                style={{ backgroundColor: OVERLAY_BG_STRONG }}
            >
                {/*
                  The call, on top and biggest. The chevron leads rather than
                  trails: it's the control, and putting it first keeps the
                  event text starting at the same x whether or not a symbol
                  is present.

                  Always rendered, even before the first play has arrived.
                  It used to appear only once there was something to say,
                  which grew the overlay by a row a second or two after the
                  view opened — and because the camera frames the scene
                  against this overlay's height, that reflow rescaled the
                  whole court. An empty state costs one line of copy; the
                  alternative was a visible lurch on every game opened.
                */}
                <button
                    type="button"
                    onClick={() => latestPlay && toggle()}
                    disabled={!latestPlay}
                    aria-expanded={latestPlay ? expanded : undefined}
                    aria-label={
                        latestPlay
                            ? expanded
                                ? 'Hide play feed'
                                : 'Show play feed'
                            : undefined
                    }
                    className="flex w-full items-center gap-2.5 px-4 text-left text-white/50 transition-colors hover:text-white/80 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70"
                    style={{ height: narrow ? CALL_HEIGHT_NARROW : CALL_HEIGHT }}
                >
                    {/*
                      The chevron sits outside the window: it is the control
                      for the row, not part of what the row is reporting, and
                      a control that slid away with the text would be a
                      target that moves while you are reaching for it.
                    */}
                    <Chevron open={expanded} dim={!latestPlay} />
                    <span className="relative h-full min-w-0 flex-1 overflow-hidden">
                        {leaving !== undefined && leaving !== null && (
                            <CallLine offset={released ? -1 : 0} settled={released}>
                                {renderCall(leaving)}
                            </CallLine>
                        )}
                        <CallLine offset={released ? 0 : 1} settled={released}>
                            {renderCall(shown, true)}
                        </CallLine>
                    </span>
                </button>

                {/*
                  The feed's cap is shorter on a phone, where it is open by
                  default and the overlay's height is what the camera frames
                  the court against — a full-height feed would squeeze the
                  floor to a strip.
                */}
                {expanded && (
                    <ul className="max-h-40 overflow-y-auto border-t border-white/10 px-4 py-1.5 sm:max-h-64">
                        {feed.map((p) => (
                            <li
                                key={p.actionNumber}
                                className="flex items-center gap-2.5 py-1 font-sans text-xs text-white/70"
                            >
                                <MarkerGlyph kind={markerForPlay(p)?.kind} size={13} />
                                <TeamBadge side={sideForPlay(game, p)} size="sm" />
                                <span className="min-w-0 flex-1 truncate">{p.description}</span>
                                {/*
                                  Right-aligned and monospaced so the clock
                                  column lines up down the list, with a fixed
                                  width wide enough for "4th 12:00" — a
                                  shrink-to-fit column wraps the longest
                                  entries onto a second line.
                                */}
                                <span className="w-[68px] shrink-0 text-right font-mono text-[11px] tabular-nums text-white/40">
                                    {periodLabel(p.period)} {p.clock}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                {/*
                  The score band: the thing this overlay exists for.

                  No shot clock, and no possession arrow. ESPN publishes
                  neither — the hoop's on-court clock is decorative and says
                  so — and a fabricated number in the one place people read
                  real ones is worse than an honest gap. Everything here is
                  either reported or counted from the play-by-play.
                */}
                <div
                    className="relative flex items-center overflow-hidden border-t border-white/10 px-3 sm:px-4"
                    style={{
                        minHeight: narrow ? BAND_HEIGHT_NARROW : BAND_HEIGHT,
                        backgroundImage: scoreBandGradient(game.away?.color, game.home?.color),
                    }}
                >
                    <BookendLogo side={game.away} align="left" dim={winner === 'home'} narrow={narrow} />
                    <ScoreSide
                        side={game.away}
                        score={awayScore}
                        accent={awayColors?.ribbonPrimary}
                        timeouts={awayTimeouts}
                        ceiling={ceiling}
                        fouls={awayFouls.fouls}
                        bonus={homeFouls.inPenalty}
                        dim={winner === 'home'}
                        narrow={narrow}
                    />
                    {/*
                      Period over clock, centred. Monospaced so the clock
                      does not jitter sideways as the digits change, which
                      at this size is the difference between reading it and
                      watching it move.
                    */}
                    {/*
                      The clock sits on the neutral middle of the stripe,
                      which is the one part of it neither team owns.
                      Monospaced so the digits do not shuffle the layout
                      sideways as they change.
                    */}
                    <div className="relative shrink-0 px-2 text-center font-sans text-[10px] font-bold uppercase leading-tight tracking-wider text-white/55">
                        <div>{winner ? 'Final' : periodLabel(period)}</div>
                        <div className="font-mono text-base tabular-nums text-white">
                            {winner ? '' : clock}
                        </div>
                    </div>
                    <ScoreSide
                        side={game.home}
                        score={homeScore}
                        accent={homeColors?.ribbonPrimary}
                        timeouts={homeTimeouts}
                        ceiling={ceiling}
                        fouls={homeFouls.fouls}
                        bonus={awayFouls.inPenalty}
                        align="right"
                        dim={winner === 'away'}
                        narrow={narrow}
                    />
                    <BookendLogo side={game.home} align="right" dim={winner === 'away'} narrow={narrow} />
                </div>

                {/*
                  The controls for watching a game, in the thing you are
                  watching it with. They used to sit in opposite top corners
                  of the court, which put the two of them furthest from each
                  other and from everything else they relate to.
                */}
                {(footerLeft || footerRight) && (
                    <div className="flex items-center justify-between gap-2 border-t border-white/10 px-2 py-1.5">
                        <div className="flex min-w-0 items-center">{footerLeft}</div>
                        <div className="flex shrink-0 items-center">{footerRight}</div>
                    </div>
                )}
            </div>
        </div>
    )
}
