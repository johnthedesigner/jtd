import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Racket head speed against time, with the playhead on it.
 *
 * The shape is the argument: flat for a second, then a near-vertical rise
 * in the last fifth of a second, and a notch where the ball takes a third
 * of the speed off the racket.
 *
 * **Drawn at its measured width rather than scaled to fit.** A `viewBox`
 * plus `width: 100%` is the usual way to make an SVG flexible, and it
 * stretches everything inside it — including the type, which ends up a
 * different width at every breakpoint and visibly condensed on a narrow
 * card. Measuring the container and emitting coordinates in real pixels
 * costs one `ResizeObserver` and keeps the labels the size they were set.
 */

const H = 54
/** Until the first measurement lands. */
const FALLBACK_W = 560

export default function SpeedChart({ speed, contactFrame, frame, highlight }) {
    const hostRef = useRef(null)
    const [width, setWidth] = useState(FALLBACK_W)

    useEffect(() => {
        const host = hostRef.current
        if (!host || typeof ResizeObserver === 'undefined') return
        const measure = () => {
            const w = Math.round(host.getBoundingClientRect().width)
            if (w > 0) setWidth((prev) => (Math.abs(prev - w) < 1 ? prev : w))
        }
        const observer = new ResizeObserver(measure)
        observer.observe(host)
        measure()
        return () => observer.disconnect()
    }, [])

    const { path, maxSpeed, lastFrame } = useMemo(() => {
        const last = speed.length - 1
        let max = 0
        for (const v of speed) if (v > max) max = v
        const pts = []
        const step = Math.max(1, Math.round(last / Math.max(1, width)))
        for (let i = 0; i <= last; i += step) {
            const x = (i / last) * width
            const y = H - (speed[i] / max) * (H - 16) - 2
            pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
        }
        return { path: `M${pts.join('L')}`, maxSpeed: max, lastFrame: last }
    }, [speed, width])

    const xOf = (f) => (Math.max(0, Math.min(lastFrame, f)) / lastFrame) * width
    const playhead = xOf(frame)
    const contactX = xOf(contactFrame)
    const mph = Math.round(maxSpeed * 2.23694)

    return (
        <div ref={hostRef} className="w-full">
            <svg
                width={width}
                height={H}
                viewBox={`0 0 ${width} ${H}`}
                className="block"
                role="img"
                aria-label={`Racket head speed over time, peaking at ${mph} miles per hour`}
            >
                {highlight && (
                    <rect
                        x={xOf(highlight.from)}
                        y={0}
                        width={Math.max(1, xOf(highlight.to) - xOf(highlight.from))}
                        height={H}
                        fill="#ff8c3a"
                        opacity="0.16"
                    />
                )}
                <path d={`${path}L${width},${H}L0,${H}Z`} fill="#39a5cc" opacity="0.16" />
                <path d={path} fill="none" stroke="#34c6eb" strokeWidth="1.5" strokeLinejoin="round" />
                <line x1={contactX} y1="0" x2={contactX} y2={H} stroke="#ffffff" strokeWidth="1" opacity="0.26" strokeDasharray="2 3" />
                <line x1={playhead} y1="0" x2={playhead} y2={H} stroke="#ffffff" strokeWidth="1.5" opacity="0.9" />
                {/* Set in real pixels, so they stay this size at any width. */}
                <text x="1" y="10" fill="#ffffff" fillOpacity="0.45" fontSize="9" fontFamily="ui-monospace, monospace">
                    {mph} mph
                </text>
                <text
                    x={Math.min(width - 2, contactX + 5)}
                    y={H - 3}
                    fill="#ffffff"
                    fillOpacity="0.45"
                    fontSize="9"
                    fontFamily="ui-monospace, monospace"
                >
                    contact
                </text>
            </svg>
        </div>
    )
}
