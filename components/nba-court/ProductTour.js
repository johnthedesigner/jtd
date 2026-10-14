import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { OVERLAY_BG } from './overlay-surface'

/**
 * A numbered walkthrough of the app, anchored to the real controls rather
 * than drawn over a picture of them.
 *
 * Two things shape the design:
 *
 * 1. **The controls on screen change with the view.** The landing has a
 *    game strip and a court picker; a game in progress has a score bug, a
 *    speed control and a way out, and none of the landing's controls at
 *    all. One list of steps covering both would spend half its length
 *    pointing at nothing, so there are two lists and the current view
 *    picks one.
 * 2. **Even within a view, a control may be absent** — the speed control
 *    only exists while replaying a finished game, not during a live one.
 *    So a step whose anchor isn't on screen is dropped before numbering,
 *    which is why the numbers are computed here and not written into the
 *    step list.
 *
 * The highlight is a hole in a dimmed sheet (one element, an enormous
 * spread `box-shadow`), and nothing on the page is click-blocked: the court
 * keeps rendering and the controls keep working. The cost of that is that
 * someone can navigate out from under the tour mid-step, which ends it.
 */

const TOURS = {
    landing: [
        {
            id: 'welcome',
            title: 'A basketball game, rendered',
            body: 'Every game here is drawn on a real NBA floor in 3D — the plays, the score, the lighting. Pick a game and it plays out on the court behind this card.',
        },
        {
            id: 'tabs',
            anchor: 'games-tabs',
            title: 'Live now, or anything from the past week',
            body: '“Watch live” has whatever is in progress plus the rest of the week’s schedule. “Replays” has the finished games — those start from the opening tip, not the final score.',
        },
        {
            id: 'card',
            anchor: 'game-card',
            title: 'Pick a game',
            body: 'Each card shows the matchup, the home side, and when it was played. Choosing one drops you onto that team’s home floor.',
        },
        {
            id: 'court',
            anchor: 'court-menu',
            title: 'Change the floor',
            body: 'Every team’s court is here, in its current and vintage paint. This only exists out here — inside a game the floor belongs to whoever is hosting.',
        },
    ],
    live: [
        {
            id: 'hud',
            anchor: 'live-hud',
            title: 'What just happened',
            body: 'The call, the score, the clock, and how many timeouts each side still has. Open it to read back through the plays.',
        },
        {
            id: 'floor',
            title: 'Watch the floor',
            body: 'Shots, rebounds and steals are marked where they happened, and the camera turns toward each one. The score behind the benches is part of the building, lit like everything else.',
        },
        {
            id: 'speed',
            anchor: 'playback-speed',
            title: 'Set the pace',
            body: 'A replay runs at its own speed — slow it down to watch a sequence land, or run it up to get through a quarter.',
        },
        {
            id: 'exit',
            anchor: 'exit-game',
            title: 'Back out',
            body: 'This leaves the game and returns you to the schedule, with the lights going down and back up on the way.',
        },
    ],
}

/** Breathing room between the highlight and the thing it is highlighting. */
const HIGHLIGHT_PAD = 8
const TOOLTIP_WIDTH = 330
const TOOLTIP_GAP = 14
/** Keeps the card off the site header, which floats above this canvas. */
const EDGE = 16
const HEADER = 92

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
}

/**
 * Anchor rectangles, in the container's own coordinates, re-read every
 * frame while the tour is open.
 *
 * Per-frame rather than on an event: the strip these anchors live in loads
 * asynchronously, scrolls horizontally, and reflows when a tab changes, and
 * a highlight that lags its target by even a few frames reads as broken.
 * Half a dozen `getBoundingClientRect` calls a frame is nothing next to the
 * scene already rendering behind it.
 */
function useAnchorRects(open, containerRef, keys) {
    const [rects, setRects] = useState({})
    const keyList = keys.join(',')

    useEffect(() => {
        if (!open) {
            setRects({})
            return
        }
        let frame = 0
        const read = () => {
            const host = containerRef.current
            if (host) {
                const base = host.getBoundingClientRect()
                const next = {}
                for (const key of keyList.split(',')) {
                    if (!key) continue
                    const el = host.querySelector(`[data-tour="${key}"]`)
                    if (!el) continue
                    const r = el.getBoundingClientRect()
                    if (r.width === 0 && r.height === 0) continue
                    next[key] = {
                        left: r.left - base.left,
                        top: r.top - base.top,
                        width: r.width,
                        height: r.height,
                    }
                }
                setRects((prev) => (sameRects(prev, next) ? prev : next))
            }
            frame = requestAnimationFrame(read)
        }
        frame = requestAnimationFrame(read)
        return () => cancelAnimationFrame(frame)
    }, [open, containerRef, keyList])

    return rects
}

/** Cheap structural compare, so an unchanged layout doesn't re-render. */
function sameRects(a, b) {
    const ak = Object.keys(a)
    const bk = Object.keys(b)
    if (ak.length !== bk.length) return false
    return ak.every((k) => {
        const x = a[k]
        const y = b[k]
        return (
            y &&
            Math.round(x.left) === Math.round(y.left) &&
            Math.round(x.top) === Math.round(y.top) &&
            Math.round(x.width) === Math.round(y.width) &&
            Math.round(x.height) === Math.round(y.height)
        )
    })
}

export default function ProductTour({ containerRef, context, open, hidden, onClose }) {
    const steps = TOURS[context] ?? TOURS.landing
    const [index, setIndex] = useState(0)
    const anchorKeys = steps.map((s) => s.anchor).filter(Boolean)
    const rects = useAnchorRects(open, containerRef, anchorKeys)
    const cardRef = useRef(null)
    const [cardSize, setCardSize] = useState({ width: TOOLTIP_WIDTH, height: 180 })

    // A step pointing at a control that isn't on screen is no step at all.
    const visible = steps.filter((step) => !step.anchor || rects[step.anchor])
    const step = visible[Math.min(index, visible.length - 1)]
    const rect = step?.anchor ? rects[step.anchor] : null

    // Navigating out from under the tour ends it: the steps it was in the
    // middle of belong to a view that is no longer on screen.
    const lastContext = useRef(context)
    useEffect(() => {
        if (lastContext.current !== context) {
            lastContext.current = context
            if (open) onClose()
        }
    }, [context, open, onClose])

    useEffect(() => {
        if (!open) setIndex(0)
    }, [open])

    // Deliberately not an updater function: finishing the last step calls
    // back out to the parent, and doing that from inside a state updater
    // runs it during render — React warns, and the parent's own state
    // update is lost in the shuffle.
    const next = useCallback(() => {
        if (index >= visible.length - 1) onClose()
        else setIndex(index + 1)
    }, [index, visible.length, onClose])

    const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])

    useEffect(() => {
        if (!open) return
        const onKey = (e) => {
            if (e.key === 'Escape') onClose()
            else if (e.key === 'ArrowRight') next()
            else if (e.key === 'ArrowLeft') back()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose, next, back])

    // Measured, not assumed: the card's height depends on how long the
    // step's text wraps, and placing it above an anchor needs that height
    // before it is painted anywhere.
    useLayoutEffect(() => {
        const el = cardRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        setCardSize((prev) =>
            Math.round(prev.height) === Math.round(r.height) &&
            Math.round(prev.width) === Math.round(r.width)
                ? prev
                : { width: r.width, height: r.height }
        )
    }, [step, open, rect])

    // `hidden` is not `!open`: the court picker covers the whole screen,
    // so the tour steps aside while it is up, but it has not been dismissed
    // and comes back on the step it was on.
    if (!open || hidden || !step) return null

    const host = containerRef.current
    const hostRect = host?.getBoundingClientRect()
    const hostW = hostRect?.width ?? 0
    const hostH = hostRect?.height ?? 0

    let cardLeft
    let cardTop
    if (rect) {
        // Below the anchor by default, above it when the bottom of the
        // screen is where the anchor already is (which is where the game
        // strip and the score bug both live).
        const below = rect.top + rect.height + TOOLTIP_GAP
        const above = rect.top - TOOLTIP_GAP - cardSize.height
        const fitsBelow = below + cardSize.height <= hostH - EDGE
        cardTop = fitsBelow ? below : Math.max(HEADER, above)
        cardLeft = clamp(
            rect.left + rect.width / 2 - cardSize.width / 2,
            EDGE,
            Math.max(EDGE, hostW - cardSize.width - EDGE)
        )
    } else {
        cardLeft = Math.max(EDGE, hostW / 2 - cardSize.width / 2)
        cardTop = Math.max(HEADER, hostH / 2 - cardSize.height / 2)
    }

    const number = index + 1
    const isLast = index === visible.length - 1

    return (
        <div className="pointer-events-none absolute inset-0 z-40">
            {/*
              One element doing two jobs: the hole is the element's own box,
              and the dimming is a spread shadow large enough to cover any
              screen. An anchorless step has no hole, so the sheet is drawn
              plain and covers everything.
            */}
            {rect ? (
                <div
                    aria-hidden
                    className="absolute rounded-sm ring-2 ring-white/80 transition-all duration-200"
                    style={{
                        left: rect.left - HIGHLIGHT_PAD,
                        top: rect.top - HIGHLIGHT_PAD,
                        width: rect.width + HIGHLIGHT_PAD * 2,
                        height: rect.height + HIGHLIGHT_PAD * 2,
                        boxShadow: '0 0 0 9999px rgba(11, 13, 18, 0.72)',
                    }}
                />
            ) : (
                <div aria-hidden className="absolute inset-0 bg-[#0b0d12]/72" />
            )}

            <div
                ref={cardRef}
                role="dialog"
                aria-modal="false"
                aria-label={`Tour step ${number} of ${visible.length}: ${step.title}`}
                className="pointer-events-auto absolute w-[330px] max-w-[calc(100%-2rem)] rounded-sm bg-white p-4 text-[#0b0d12] shadow-2xl transition-[left,top] duration-200"
                style={{ left: cardLeft, top: cardTop }}
            >
                <div className="flex items-start gap-3">
                    <span
                        aria-hidden
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0b0d12] font-sans text-[11px] font-bold text-white"
                    >
                        {number}
                    </span>
                    <div className="min-w-0">
                        <h2 className="font-sans text-sm font-bold leading-snug">{step.title}</h2>
                        {/*
                          `mb-0` is load-bearing: the site's global stylesheet
                          gives every `p` a 2rem bottom margin, which opened a
                          dead band between the body copy and the buttons.
                        */}
                        <p className="mb-0 mt-1.5 font-sans text-xs leading-relaxed text-[#0b0d12]/70">
                            {step.body}
                        </p>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-black/10 pt-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#0b0d12]/45 transition-colors hover:text-[#0b0d12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b0d12]/40"
                    >
                        Skip tour
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="font-sans text-[11px] font-bold tabular-nums text-[#0b0d12]/40">
                            {number}/{visible.length}
                        </span>
                        <button
                            type="button"
                            onClick={back}
                            disabled={index === 0}
                            className="min-h-[30px] rounded-sm px-2.5 font-sans text-[11px] font-bold uppercase tracking-wider text-[#0b0d12]/70 transition-colors hover:bg-black/5 hover:text-[#0b0d12] disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b0d12]/40"
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            onClick={next}
                            className="min-h-[30px] rounded-sm bg-[#0b0d12] px-3 font-sans text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#0b0d12]/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b0d12]/40"
                        >
                            {isLast ? 'Done' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * The button that starts it, and the once-per-visitor auto-start.
 *
 * A tour nobody can find is decoration, so it runs itself the first time
 * someone lands here and then never again unless asked — the flag is
 * per-browser, and clearing site data brings it back.
 */
export const TOUR_SEEN_KEY = 'nba-court-tour-v1'

export function useTourAutoStart(ready, onOpen) {
    const fired = useRef(false)
    useEffect(() => {
        if (!ready || fired.current) return
        fired.current = true
        let seen = true
        try {
            seen = window.localStorage.getItem(TOUR_SEEN_KEY) === '1'
        } catch {
            // Private browsing throws on access; treat it as "already seen"
            // rather than running the tour on every single page load.
        }
        if (seen) return
        const timer = setTimeout(() => {
            try {
                window.localStorage.setItem(TOUR_SEEN_KEY, '1')
            } catch {
                /* nothing to do: it just runs again next time */
            }
            onOpen()
        }, 1200)
        return () => clearTimeout(timer)
    }, [ready, onOpen])
}

/**
 * Says what it does, rather than being a question mark in a corner.
 *
 * A bare "?" is a guess about whether anything is behind it; this is the one
 * control on the page whose whole job is to be understood before it is
 * clicked. It sits in the same row as the tab switch so the two read as one
 * band of controls above the games rather than as furniture in the corners.
 */
export function TourButton({ onClick, className = '', bare = false }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label="How to use JTD Courtside"
            title="How to use JTD Courtside"
            /*
              `bare` drops the panel and the hairline, for when this sits
              inside a surface that already has both — the score overlay's
              control row. Two nested panels read as a seam.
            */
            className={`flex items-center gap-1.5 rounded-sm font-sans text-[11px] font-bold uppercase tracking-wider text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                bare
                    ? 'min-h-[26px] px-2'
                    : 'h-[40px] px-3 ring-1 ring-white/10 backdrop-blur hover:ring-white/30'
            } ${className}`}
            style={bare ? undefined : { backgroundColor: OVERLAY_BG }}
        >
            <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className="shrink-0"
            >
                <circle cx="12" cy="12" r="9.5" />
                <path d="M9.4 9.2a2.7 2.7 0 1 1 3.4 3.3c-.6.2-.9.7-.9 1.3v.4" />
                <line x1="12" y1="17.2" x2="12" y2="17.3" />
            </svg>
            {/*
              The full sentence needs about 200px, which on a phone is half
              the width of the screen and collides with whatever shares its
              row. The icon carries it below that; the `title` and the
              accessible name stay the long form either way.
            */}
            <span className="hidden sm:inline">How to use JTD Courtside</span>
            <span className="sr-only sm:hidden">How to use JTD Courtside</span>
        </button>
    )
}
