import { TEAM_NAMES } from '../constants'
import { teamLogoUrl } from './nba-teams'

/**
 * One game, shared by the landing panel and the drawer.
 *
 * Logos come straight from ESPN's own CDN, whose URL is derivable from the
 * tricode alone (`.../teamlogos/nba/500/{tricode}.png`) — no assets to
 * source, host, or keep in sync. Verified reachable by plain request: it's
 * a static image CDN, unlike the JSON API, which is behind bot protection
 * that took a whole investigation to get around.
 *
 * Home is marked explicitly rather than relying on "AWAY @ HOME" word order
 * being read correctly — the home side gets the label and a colour bar.
 */

function periodLabel(period) {
    if (!period) return ''
    if (period <= 4) return ['1st', '2nd', '3rd', '4th'][period - 1]
    const ot = period - 4
    return ot === 1 ? 'OT' : `${ot}OT`
}

function statusText(game) {
    if (game.status === 'live') return `${periodLabel(game.period)} ${game.clock}`.trim()
    if (game.status === 'final') return game.period > 4 ? 'Final/OT' : 'Final'
    if (!game.startTimeUTC) return 'Scheduled'
    try {
        const d = new Date(game.startTimeUTC)
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
            ' · ' +
            d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    } catch {
        return 'Scheduled'
    }
}

function TeamRow({ side, accent, isHome, showScore }) {
    const src = teamLogoUrl(side?.tricode)
    return (
        <div className="flex items-center gap-2.5">
            <span
                aria-hidden
                className="h-8 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: isHome ? accent || '#8894a8' : 'transparent' }}
            />
            {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={src}
                    alt=""
                    width={26}
                    height={26}
                    className="h-[26px] w-[26px] shrink-0 object-contain"
                    loading="lazy"
                />
            ) : (
                <span className="h-[26px] w-[26px] shrink-0" />
            )}
            <span className="min-w-0 flex-1 truncate font-sans text-sm font-bold text-white">
                {side?.tricode ? side.tricode.toUpperCase() : '—'}
                {isHome && (
                    <span className="ml-2 font-sans text-[10px] font-bold uppercase tracking-wider text-white/40">
                        Home
                    </span>
                )}
            </span>
            {showScore && (
                <span className="shrink-0 font-sans text-base font-bold tabular-nums text-white">
                    {side?.score ?? '—'}
                </span>
            )}
        </div>
    )
}

export default function GameCard({ game, accent, onSelect }) {
    const clickable = game.status === 'live' || game.status === 'final'
    const showScore = clickable
    const title = `${TEAM_NAMES[game.away?.tricode] ?? game.away?.tricode ?? ''} at ${
        TEAM_NAMES[game.home?.tricode] ?? game.home?.tricode ?? ''
    }`

    return (
        <button
            type="button"
            disabled={!clickable}
            onClick={() => clickable && onSelect?.(game)}
            title={title}
            className={`w-full rounded-sm border border-white/10 bg-white/[0.06] p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                clickable ? 'hover:border-white/25 hover:bg-white/[0.12]' : 'opacity-70'
            }`}
        >
            <div className="flex flex-col gap-2">
                <TeamRow side={game.away} accent={accent?.away} isHome={false} showScore={showScore} />
                <TeamRow side={game.home} accent={accent?.home} isHome showScore={showScore} />
            </div>
            {/*
              A finished game plays back from the opening tip rather than
              showing its result (see `usePlayFeed`), which is not something
              a card reading "Final" tells anyone — hence saying so outright
              instead of leaving it to be discovered by clicking.
            */}
            <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-white/10 pt-2">
                <span
                    className={`font-sans text-[11px] font-bold uppercase tracking-wider ${
                        game.status === 'live' ? 'text-emerald-400' : 'text-white/45'
                    }`}
                >
                    {statusText(game)}
                </span>
                {clickable && (
                    <span className="shrink-0 font-sans text-[11px] font-bold uppercase tracking-wider text-white">
                        {game.status === 'live' ? 'Watch →' : 'Replay →'}
                    </span>
                )}
            </div>
        </button>
    )
}
