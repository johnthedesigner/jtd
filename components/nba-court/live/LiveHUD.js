import { useState } from 'react'
import { markerForPlay } from './live-markers'
import { teamLogoUrl } from './nba-teams'
import MarkerGlyph from './MarkerGlyph'

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

/** The row of pips a TV bug uses — filled for held, hollow for spent. */
function TimeoutPips({ left, ceiling, accent }) {
    return (
        <div className="flex items-center gap-[4px]" title={`${left} timeouts left`}>
            {Array.from({ length: ceiling }, (_, i) => (
                <span
                    key={i}
                    className="h-[5px] w-[5px] rounded-full"
                    style={{
                        backgroundColor: i < left ? accent || '#cbd3e0' : 'transparent',
                        boxShadow: i < left ? 'none' : 'inset 0 0 0 1px rgba(255,255,255,0.22)',
                    }}
                />
            ))}
        </div>
    )
}

function TeamSide({ side, score, accent, timeouts, ceiling, align = 'left', dim = false }) {
    const logo = teamLogoUrl(side?.tricode)
    const right = align === 'right'
    return (
        <div
            className={`flex min-w-0 flex-1 items-center gap-2.5 ${right ? 'flex-row-reverse' : ''} ${
                dim ? 'opacity-45' : ''
            }`}
        >
            {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" width={24} height={24} className="h-6 w-6 shrink-0 object-contain" />
            ) : (
                <span className="h-6 w-6 shrink-0" />
            )}
            <div className={`flex min-w-0 flex-col gap-1 ${right ? 'items-end' : 'items-start'}`}>
                <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-white/70">
                    {side?.tricode ? side.tricode.toUpperCase() : '—'}
                </span>
                <TimeoutPips left={timeouts} ceiling={ceiling} accent={accent} />
            </div>
            <span className="shrink-0 font-sans text-xl font-bold tabular-nums text-white">
                {score ?? '—'}
            </span>
        </div>
    )
}

function Chevron({ open }) {
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
            className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
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
}) {
    const [expanded, setExpanded] = useState(false)

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

    const feed = [...plays].reverse()

    return (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="pointer-events-auto w-full max-w-xl overflow-hidden rounded-sm bg-black/80 backdrop-blur">
                {/*
                  The call, on top and biggest. The chevron leads rather than
                  trails: it's the control, and putting it first keeps the
                  event text starting at the same x whether or not a symbol
                  is present.
                */}
                {latestPlay && (
                    <button
                        type="button"
                        onClick={() => setExpanded((e) => !e)}
                        aria-expanded={expanded}
                        aria-label={expanded ? 'Hide play feed' : 'Show play feed'}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-white/50 transition-colors hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70"
                    >
                        <Chevron open={expanded} />
                        <MarkerGlyph kind={markerForPlay(latestPlay)?.kind} size={16} />
                        <span
                            data-latest-play
                            className="min-w-0 flex-1 truncate font-sans text-sm font-bold text-white"
                        >
                            {latestPlay.description}
                        </span>
                    </button>
                )}

                {expanded && (
                    <ul className="max-h-64 overflow-y-auto border-t border-white/10 px-4 py-1.5">
                        {feed.map((p) => (
                            <li
                                key={p.actionNumber}
                                className="flex items-center gap-2.5 py-1 font-sans text-xs text-white/70"
                            >
                                <MarkerGlyph kind={markerForPlay(p)?.kind} size={13} />
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

                {/* Score: reference, not news — kept small under the call. */}
                <div className="flex items-center gap-3 border-t border-white/10 bg-white/[0.03] px-4 py-2.5">
                    <TeamSide
                        side={game.away}
                        score={awayScore}
                        accent={awayColors?.ribbonPrimary}
                        timeouts={awayTimeouts}
                        ceiling={ceiling}
                        dim={winner === 'home'}
                    />
                    <div className="shrink-0 px-1 text-center font-sans text-[11px] font-bold uppercase leading-tight tracking-wider text-white/45">
                        <div>{winner ? 'Final' : periodLabel(period)}</div>
                        <div className="font-mono tabular-nums text-white/70">
                            {winner ? '' : clock}
                        </div>
                    </div>
                    <TeamSide
                        side={game.home}
                        score={homeScore}
                        accent={homeColors?.ribbonPrimary}
                        timeouts={homeTimeouts}
                        ceiling={ceiling}
                        align="right"
                        dim={winner === 'away'}
                    />
                </div>
            </div>
        </div>
    )
}
