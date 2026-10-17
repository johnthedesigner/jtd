import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import useVisualViewportInset from '../../webgl/use-visual-viewport-inset'
import useGamesList from './useGamesList'
import GameCard from './GameCard'
import GameCardSkeleton from './GameCardSkeleton'
import { TourButton } from '../../webgl/ProductTour'
import { TOUR_LABEL } from '../court-tours'
import useNarrow, { NARROW_MAX } from '../use-narrow'

/**
 * The landing surface: a week of games laid across the bottom of the
 * screen, centred, with the heading doubling as the switch between what can
 * be watched now and what can be replayed.
 *
 * The two tabs split on status rather than purely on date — a game that
 * finished earlier today is a replay, not something to watch — and anything
 * in progress sorts to the front of "Watch live", since it is the only
 * thing here that cannot be seen later.
 *
 * There is no separate "all games" view any more. A week either side is the
 * whole set worth offering, it fits in a scrollable row, and a second
 * surface showing the same cards was a layer of navigation standing between
 * someone and the one thing this page is for.
 *
 * Only the visible tab fetches (`useGamesList`'s `enabled` gate), and
 * neither fetches while the strip is hidden.
 */

const TABS = [
    { id: 'upcoming', label: 'Watch live' },
    { id: 'past', label: 'Replays' },
]

/**
 * Card width, and the gap after it — what a row's worth is measured in.
 *
 * A single source for both the cards and their skeletons, and for the count
 * that fills the row. Driving the width from Tailwind classes instead would
 * mean the measurement and the layout could disagree the moment either one
 * was touched, and the symptom (a skeleton row that reflows as real cards
 * land) is exactly what the skeletons exist to prevent.
 */
const CARD_WIDTH = 218
const CARD_WIDTH_NARROW = 156
const CARD_GAP = 8

/**
 * Cards beyond the ones that fit, so the loading row runs off the edge.
 *
 * A placeholder row that ends flush with the viewport says the list is
 * this long, and then real cards arrive and it runs off the screen. Letting
 * the skeletons overflow says "there is more here" from the first frame,
 * which is what the loaded row actually looks like. They are clipped rather
 * than scrollable, so the extras cost nothing to reach.
 */
const SKELETON_OVERFLOW = 3

/**
 * How many cards fit across the strip right now.
 *
 * Measured rather than fixed, so the loading row reflects the real width at
 * any size instead of guessing a count that only suits one.
 */
function useFittingCount(ref, cardWidth) {
    const [count, setCount] = useState(4)
    useEffect(() => {
        const el = ref.current
        if (!el || typeof ResizeObserver === 'undefined') return
        const measure = () => {
            const width = el.clientWidth
            if (!width) return
            setCount(Math.max(1, Math.floor((width + CARD_GAP) / (cardWidth + CARD_GAP))))
        }
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(el)
        return () => observer.disconnect()
    }, [ref, cardWidth])
    return count
}

export default function GamesStrip({ active, onSelectGame, onStartTour }) {
    const viewportInset = useVisualViewportInset()
    const [tab, setTab] = useState('upcoming')
    const { games, loading, error } = useGamesList(tab, { enabled: active })
    const scrollerRef = useRef(null)
    const narrow = useNarrow()
    const cardWidth = narrow ? CARD_WIDTH_NARROW : CARD_WIDTH
    const skeletonCount = useFittingCount(scrollerRef, cardWidth) + SKELETON_OVERFLOW
    /*
      While a fetch is in flight the previous tab's cards are still in
      state, and showing them was actively misleading: switching to Replays
      left a row of tonight's scheduled games sitting there with no sign
      anything was happening, and they were replaced without warning a
      minute later.
    */
    const showSkeletons = loading

    /**
     * Recent games run oldest to newest, so the end of the row is the most
     * recent — which is what someone is looking for. Upcoming runs the same
     * direction and wants the opposite end, which is where it already is.
     *
     * Layout effect, not a plain one: setting `scrollLeft` after paint
     * shows a frame of the row at the far left first, which reads as a
     * flinch.
     *
     * Once per visit to a tab, not once per update. `games` has to be a
     * dependency because `scrollWidth` is wrong until the cards exist — but
     * the list now refreshes on a timer, and without the guard every poll
     * would yank the row back to its end while someone was reading it.
     */
    const positionedFor = useRef(null)
    useLayoutEffect(() => {
        const el = scrollerRef.current
        if (!el || games.length === 0) return
        if (positionedFor.current === tab) return
        positionedFor.current = tab
        el.scrollLeft = tab === 'past' ? el.scrollWidth : 0
    }, [tab, games])

    if (!active) return null

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
            className="pointer-events-none fixed inset-x-0 z-20 bg-gradient-to-t from-[#0b0d12]/85 to-transparent px-4 pt-16 sm:px-6"
            /*
              The bottom gap is padding plus whatever the device reserves for
              its home indicator. On a phone the cards were running into the
              very edge of the screen, and under `viewport-fit=cover` the
              page now reaches under that bar as well — so the inset has to
              be added rather than assumed to be zero.
            */
            style={{
                bottom: `${viewportInset}px`,
                paddingBottom:
                    'calc(var(--strip-gap) + env(safe-area-inset-bottom, 0px))',
                paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
                paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
            }}
        >
            {/*
              Full width on purpose: a week is often thirty-odd games, and
              this project's root font size is 20px, so Tailwind's rem-based
              `max-w-*` scale is 25% larger than stock — `max-w-5xl` here is
              1280px, not 1024. Constraining it would have meant picking a
              number that only looks right at one window size anyway.
            */}
            <div className="pointer-events-auto flex w-full flex-col items-center">
                {/*
                  One band of controls across the top of the strip: what this
                  is on the left, which games to show on the right. Both were
                  previously elsewhere — the tour behind a "?" in the opposite
                  corner, the tabs centred — and neither read as belonging to
                  the row of games they govern.
                */}
                <div className="mb-2 flex w-full items-center justify-between gap-2 sm:gap-3">
                    {onStartTour ? <TourButton onClick={onStartTour} label={TOUR_LABEL} /> : <span />}
                    {/*
                      The heading is the control. Two words that change is a
                      lighter thing to put on screen than a labelled toggle
                      beside a static title, and there are only two states.
                    */}
                    <div
                        data-tour="games-tabs"
                        className="flex gap-1 rounded-sm bg-white/10 p-1 backdrop-blur"
                        role="group"
                        aria-label="Which games to show"
                    >
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setTab(t.id)}
                                aria-pressed={tab === t.id}
                                className={`min-h-[30px] rounded-sm px-3 font-sans text-[11px] font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                                    tab === t.id
                                        ? 'bg-white text-[#0b0d12]'
                                        : 'text-white/60 hover:text-white'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {error && !loading && (
                    <p className="py-4 font-sans text-xs text-white/40">
                        Couldn&rsquo;t load games.
                    </p>
                )}
                {!showSkeletons && !error && games.length === 0 && (
                    <p className="py-4 font-sans text-xs text-white/40">
                        {tab === 'upcoming'
                            ? 'Nothing live, and nothing scheduled this week.'
                            : 'No finished games in the past week.'}
                    </p>
                )}

                {/*
                  Scrolls rather than wraps: a week can be thirty-odd games,
                  and a second row would start eating the court.
                */}
                <div
                    ref={scrollerRef}
                    /*
                      Not scrollable while loading. There is nothing at the
                      far end to reach, and a row that scrolls through
                      placeholders invites exactly that — then snaps back to
                      the start when the real cards land.
                    */
                    className={`w-full pb-1 ${
                        showSkeletons ? 'overflow-hidden' : 'overflow-x-auto'
                    }`}
                    aria-busy={showSkeletons}
                >
                    {/*
                      `w-max` with `mx-auto` centres the row while it fits
                      and lets it scroll once it doesn't — centring the flex
                      container itself clips the first card off the left
                      edge the moment the content overflows.
                    */}
                    <div className={`flex w-max gap-2 ${showSkeletons ? '' : 'mx-auto'}`}>
                        {showSkeletons &&
                            Array.from({ length: skeletonCount }, (_, i) => (
                                <div key={`skeleton-${i}`} className="shrink-0" style={{ width: cardWidth }}>
                                    <GameCardSkeleton variant={tab} />
                                </div>
                            ))}
                        {!showSkeletons &&
                            games.map((game, i) => (
                                <div
                                    key={game.gameId}
                                    // The tour points at one card to explain
                                    // all of them; the first is the one
                                    // guaranteed to be in view, since the row
                                    // starts scrolled to whichever end this
                                    // tab reads from.
                                    data-tour={i === 0 ? 'game-card' : undefined}
                                    className="shrink-0"
                                    style={{ width: cardWidth }}
                                >
                                    <GameCard
                                        game={game}
                                        onSelect={onSelectGame}
                                        compact={narrow}
                                    />
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
