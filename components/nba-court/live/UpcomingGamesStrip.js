import useGamesList from './useGamesList'
import GameCard from './GameCard'

/**
 * The landing surface: the next few games laid out across the bottom of the
 * page, where the view/team/era controls used to be. Picking a game is the
 * primary thing to do here, so it gets the primary position; everything
 * else moved behind the settings flyout beside it.
 *
 * Unpositioned on purpose — `CourtViewer` owns the bottom bar and places
 * this inside it, next to the settings button, so the two share one
 * gradient and one baseline instead of each floating independently.
 */

const MAX_CARDS = 3

export default function UpcomingGamesStrip({ active, onSelectGame, onOpenAll }) {
    const { games, loading, error } = useGamesList('upcoming', { enabled: active })

    if (!active) return null

    const shown = games.slice(0, MAX_CARDS)

    return (
        <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-4 pb-2">
                <h2 className="font-sans text-[11px] font-bold uppercase tracking-wider text-white/50">
                    Upcoming games
                </h2>
                {/*
                  Kept mounted even with nothing to show: it's the way through
                  to past games too, which exist year-round, whereas the
                  upcoming list is empty for stretches of the offseason.
                */}
                <button
                    type="button"
                    onClick={onOpenAll}
                    className="min-h-[32px] shrink-0 rounded-sm bg-white/10 px-3 font-sans text-[11px] font-bold uppercase tracking-wider text-white/70 backdrop-blur transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                    All games
                </button>
            </div>

            {loading && shown.length === 0 && (
                <p className="py-4 font-sans text-xs text-white/40">Loading games…</p>
            )}
            {error && !loading && (
                <p className="py-4 font-sans text-xs text-white/40">Couldn&rsquo;t load games.</p>
            )}
            {!loading && !error && shown.length === 0 && (
                <p className="py-4 font-sans text-xs text-white/40">
                    No upcoming games — try past games.
                </p>
            )}

            <div className="flex gap-2 overflow-x-auto pb-1">
                {shown.map((game) => (
                    <div key={game.gameId} className="w-[236px] shrink-0">
                        <GameCard game={game} onSelect={onSelectGame} />
                    </div>
                ))}
            </div>
        </div>
    )
}
