import { useEffect, useState } from 'react'
import useGamesList from './useGamesList'
import GameCard from './GameCard'

/**
 * "All games" opens the bottom strip out into the whole viewport: same
 * cards, same grid rhythm, just every game instead of the next three, with
 * Upcoming / Past as tabs.
 *
 * It scales up from the bottom edge rather than fading in flat, so it reads
 * as the strip expanding rather than a separate panel arriving over it —
 * the transform is the cheap version of a real FLIP morph, and lands the
 * same impression without measuring and animating each card.
 *
 * Bespoke Tailwind like every other panel in this HUD — not
 * `components/ui`'s `Modal`, and not the installed-but-unused
 * `@radix-ui/react-dialog`. `CourtViewer.js` carries a standing comment
 * explaining why this HUD deliberately diverges from that light-surface
 * styling; this follows the same precedent.
 *
 * Only the visible tab fetches (`useGamesList`'s `enabled` gate), and
 * neither fetches while it's shut.
 */

const TABS = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past' },
]

export default function GameListOverlay({ open, onClose, onSelectGame }) {
    const [tab, setTab] = useState('upcoming')
    const { games, loading, error } = useGamesList(tab, { enabled: open })

    // Mounted-but-not-yet-entered for one frame, so the open transform has a
    // starting point to animate from. Without it the element mounts already
    // at its final transform and nothing moves.
    const [entered, setEntered] = useState(false)
    useEffect(() => {
        if (!open) {
            setEntered(false)
            return
        }
        const raf = requestAnimationFrame(() => setEntered(true))
        return () => cancelAnimationFrame(raf)
    }, [open])

    useEffect(() => {
        if (!open) return
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    if (!open) return null

    return (
        <div
            className={`absolute inset-0 z-30 flex origin-bottom flex-col bg-[#0b0d12]/95 backdrop-blur transition-all duration-300 ease-out ${
                entered ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
        >
            {/*
              Offset below the site header, which floats above this canvas
              and above this overlay. Without it the tabs sit underneath the
              logo and the header swallows the click on them outright — the
              tab looked dead while actually never receiving the event.
            */}
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 pb-4 pt-20 sm:px-6">
                <div className="flex gap-1 rounded-sm bg-white/10 p-1">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setTab(t.id)}
                            aria-pressed={tab === t.id}
                            className={`min-h-[36px] rounded-sm px-4 font-sans text-xs font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                                tab === t.id ? 'bg-white text-[#0b0d12]' : 'text-white/70 hover:text-white'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close game list"
                    className="min-h-[36px] min-w-[36px] rounded-sm font-sans text-base text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                    ✕
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {loading && games.length === 0 && (
                    <p className="py-10 text-center font-sans text-xs text-white/50">Loading…</p>
                )}
                {error && !loading && (
                    <p className="py-10 text-center font-sans text-xs text-white/50">
                        Couldn&rsquo;t load games.
                    </p>
                )}
                {!loading && !error && games.length === 0 && (
                    <p className="py-10 text-center font-sans text-xs text-white/50">
                        {tab === 'upcoming' ? 'No upcoming games.' : 'No past games.'}
                    </p>
                )}

                <div className="mx-auto grid max-w-5xl grid-cols-[repeat(auto-fill,minmax(236px,1fr))] gap-3">
                    {games.map((game) => (
                        <GameCard key={game.gameId} game={game} onSelect={onSelectGame} />
                    ))}
                </div>
            </div>
        </div>
    )
}
