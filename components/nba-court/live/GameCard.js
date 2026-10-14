import { TEAM_NAMES } from '../constants'
import { CARD_BG } from '../overlay-surface'
import { teamLogoUrl } from './nba-teams'
import { brandGradient } from './team-gradient'

/**
 * One game, shared by the landing strip and anything else that lists games.
 *
 * The two team rows are the card's identity: each one is a full-bleed band
 * running from that club's own colour on the left to black on the right,
 * with the mark set large enough that it breaks the band's top and bottom
 * edges. Cropping is the point — a logo contained inside a row is a little
 * icon beside a label, and a logo bleeding out of one is the row.
 *
 * Why the colour has to be processed rather than used as shipped, and why
 * the near-black clubs need lifting rather than darkening, is in
 * `team-gradient.js`.
 *
 * Logos come straight from ESPN's own CDN, whose URL is derivable from the
 * tricode alone (`.../teamlogos/nba/500/{tricode}.png`) — no assets to
 * source, host, or keep in sync. Verified reachable by plain request: it's
 * a static image CDN, unlike the JSON API, which is behind bot protection
 * that took a whole investigation to get around.
 *
 * Home is marked explicitly rather than relying on "AWAY @ HOME" word order
 * being read correctly.
 *
 * **Every card is the same height**, whatever its state. The footer is two
 * fixed rows — when and state on the first, the call to action on the second
 * — and nothing in it is conditional. Before, a finished game grew a third
 * line for its date while a scheduled one did not, so switching tabs made
 * the whole strip jump.
 *
 * The call to action is the card's only control, rather than the card itself
 * being one big button. A scheduled game needs a *disabled* affordance, not
 * an absent one, and a disabled button inside a clickable card is both a
 * nesting violation and a lie about what is clickable.
 */

/** Short enough that two rows plus a footer still clear the court. */
export const ROW_HEIGHT = 48
/** Deliberately larger than the row: this is what does the cropping. */
export const LOGO_SIZE = 74
/** Where the text starts, clear of the mark. */
export const TEXT_INSET = 68

function periodLabel(period) {
    if (!period) return ''
    if (period <= 4) return ['1st', '2nd', '3rd', '4th'][period - 1]
    const ot = period - 4
    return ot === 1 ? 'OT' : `${ot}OT`
}

/**
 * "Oct 11 · 7:00 PM", or just "7:00 PM" where there isn't room for both.
 *
 * On a narrow card the full string truncated mid-time ("OCT 14 · 7…"),
 * which loses the more useful half. The date is the part that can go: the
 * state beside it already says Tonight, Tomorrow or Final, so the day is
 * not the thing being read off this line.
 */
function whenText(game, compact = false) {
    if (!game.startTimeUTC) return null
    try {
        const d = new Date(game.startTimeUTC)
        const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        if (compact) return time
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' + time
    } catch {
        return null
    }
}

/**
 * How near a scheduled game is, in words.
 *
 * "Scheduled" told nobody anything the date beside it didn't already say.
 * These answer the question this tab is actually asked — is there something
 * to watch soon — and the evening split earns its place because almost every
 * NBA game is an evening game, so "Today" against a 7pm tip reads as though
 * it might already have been and gone.
 */
const EVENING_HOUR = 17

function proximityText(game) {
    if (!game.startTimeUTC) return 'Upcoming'
    const start = new Date(game.startTimeUTC)
    if (Number.isNaN(start.getTime())) return 'Upcoming'
    // Compared by calendar day in the viewer's own zone, not by hours
    // elapsed: a game 20 hours out can be tonight or the day after next.
    const dayOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const days = Math.round((dayOf(start) - dayOf(new Date())) / 86400000)
    if (days === 0) return start.getHours() >= EVENING_HOUR ? 'Tonight' : 'Today'
    if (days === 1) return 'Tomorrow'
    return 'Upcoming'
}

/**
 * The right-hand half of the footer's first line: what the game *is* right
 * now, as against `whenText`'s when it happens.
 */
function statusText(game) {
    if (game.status === 'live') {
        return [periodLabel(game.period), game.clock].filter(Boolean).join(' · ')
    }
    if (game.status === 'final') return game.period > 4 ? 'Final/OT' : 'Final'
    return proximityText(game)
}

function TeamRow({ side, isHome, showScore, outcome, divider }) {
    const src = teamLogoUrl(side?.tricode)
    return (
        <div
            className={`relative flex items-center overflow-hidden ${
                divider ? 'border-b border-black/40' : ''
            }`}
            style={{ height: ROW_HEIGHT, backgroundImage: brandGradient(side?.color) }}
        >
            {src ? (
                // Absolute, and taller than its row, so it crops against the
                // band rather than shrinking to fit inside it. Pulled left
                // so it breaks the leading edge too.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={src}
                    alt=""
                    width={LOGO_SIZE}
                    height={LOGO_SIZE}
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 -translate-y-1/2 object-contain"
                    style={{
                        left: -10,
                        height: LOGO_SIZE,
                        width: LOGO_SIZE,
                        // A mark drawn in the club's own colour would melt
                        // into its own band without this.
                        filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.55))',
                    }}
                    loading="lazy"
                />
            ) : null}
            <span
                className="relative min-w-0 flex-1 truncate font-sans text-sm font-bold text-white"
                style={{ paddingLeft: TEXT_INSET }}
            >
                {(side?.tricode || side?.abbr || '—').toUpperCase()}
                {isHome && (
                    <span className="ml-2 font-sans text-[10px] font-bold uppercase tracking-wider text-white/50">
                        Home
                    </span>
                )}
            </span>
            {showScore && (
                /*
                  On a finished game the result should be legible without
                  reading both numbers and comparing them: the winning score
                  keeps its weight and goes green, the losing one drops to a
                  lighter weight. A live game has no result yet, so both
                  stay as they are. The gradient has reached black by here,
                  so all three treatments sit on the same ground.
                */
                <span
                    className={`relative shrink-0 pr-3 font-sans text-base tabular-nums ${
                        outcome === 'won'
                            ? 'font-bold text-emerald-400'
                            : outcome === 'lost'
                              ? 'font-normal text-white/60'
                              : 'font-bold text-white'
                    }`}
                >
                    {side?.score ?? '—'}
                </span>
            )}
        </div>
    )
}

export default function GameCard({ game, onSelect, compact = false }) {
    const when = whenText(game, compact)
    const playable = game.status === 'live' || game.status === 'final'

    /** Only a finished game has a winner; a tie leaves both neutral. */
    const outcomeFor = (side, other) => {
        if (game.status !== 'final') return null
        const a = side?.score
        const b = other?.score
        if (a == null || b == null || a === b) return null
        return a > b ? 'won' : 'lost'
    }
    const title = `${TEAM_NAMES[game.away?.tricode] ?? game.away?.tricode ?? ''} at ${
        TEAM_NAMES[game.home?.tricode] ?? game.home?.tricode ?? ''
    }`
    /*
      A finished game plays back from the opening tip rather than showing its
      result (see `usePlayFeed`), which is not something a card reading
      "Final" tells anyone — hence saying "Replay" outright instead of
      leaving it to be discovered by clicking.
    */
    const cta = game.status === 'final' ? 'Replay' : 'Watch live'

    const body = (
        <>
            <TeamRow
                side={game.away}
                isHome={false}
                showScore={playable}
                outcome={outcomeFor(game.away, game.home)}
                divider
            />
            <TeamRow
                side={game.home}
                isHome
                showScore={playable}
                outcome={outcomeFor(game.home, game.away)}
            />
            <div className="px-3 pb-3 pt-2">
                {/*
                  When on the left, state on the right. Both always present,
                  so the line never collapses and the cards stay aligned
                  across a tab switch.
                */}
                <div className="flex items-baseline justify-between gap-2">
                    <span className="min-w-0 truncate font-sans text-[11px] font-bold uppercase tracking-wider text-white/75">
                        {when ?? '\u2014'}
                    </span>
                    <span
                        className={`shrink-0 font-sans text-[11px] font-bold uppercase tracking-wider tabular-nums ${
                            game.status === 'live' ? 'text-emerald-400' : 'text-white/45'
                        }`}
                    >
                        {statusText(game)}
                    </span>
                </div>
                {/*
                  A span, not a button: the whole card is the control, and a
                  button inside a button is invalid and swallows the click
                  that was meant for the card. It still has to *look* like
                  the thing you press, so it carries the card's hover state
                  through `group-hover`.
                */}
                <span
                    className={`mt-2 flex h-[28px] w-fit items-center rounded-sm border px-2.5 font-sans text-[11px] font-bold uppercase tracking-wider transition-colors ${
                        playable
                            ? 'border-white/25 bg-white/10 text-white group-hover:border-white/50 group-hover:bg-white/25'
                            : 'border-white/10 bg-transparent text-white/30'
                    }`}
                >
                    {cta} {playable ? '\u2192' : ''}
                </span>
            </div>
        </>
    )

    const shared = 'w-full overflow-hidden rounded-sm border text-left transition-colors'

    /*
      Unplayable games are a plain container. Giving them a disabled button
      wrapper would make the whole card a focus stop that does nothing, and
      a scheduled game is a thing to read, not a thing to press.
    */
    if (!playable) {
        return (
            <div
                title={[title, statusText(game), whenText(game)].filter(Boolean).join(' \u2014 ')}
                className={`${shared} border-white/10`}
                style={{ backgroundColor: CARD_BG }}
            >
                {body}
            </div>
        )
    }

    return (
        <button
            type="button"
            onClick={() => onSelect?.(game)}
            aria-label={`${cta}: ${title}`}
            title={[title, statusText(game), whenText(game)].filter(Boolean).join(' \u2014 ')}
            /*
              `group` so the call to action lights up with the rest of the
              card — the affordance has to read as "this whole thing is one
              button", not "something in here is hoverable".
            */
            className={`group ${shared} border-white/10 hover:border-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70`}
            style={{ backgroundColor: CARD_BG }}
        >
            {body}
        </button>
    )
}
