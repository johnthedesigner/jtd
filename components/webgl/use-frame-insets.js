import { useEffect, useState } from 'react'

/**
 * Shared by every WebGL experiment on this site, not just the arena it was
 * written for. Lifted out of `CourtViewer` when a second scene needed it;
 * the behaviour is unchanged.
 */

/**
 * How much of the viewport the bottom overlay covers, as a fraction.
 *
 * Measured off whatever is actually down there — the game strip out on the
 * landing, the score bug inside a game — rather than carried as a constant
 * per view. The camera frames the scene into the band above it (see
 * `solveFraming`), so a number that drifts out of date here shows up as the
 * court sliding under the overlay, and these two things change shape for
 * real reasons: the strip's cards are shorter on a phone, and the score bug
 * grows when its play feed is open.
 */
export default function useFrameInsets(hostRef) {
    const [insets, setInsets] = useState({ top: 0.08, bottom: 0.24 })
    useEffect(() => {
        const host = hostRef.current
        if (!host || typeof ResizeObserver === 'undefined') return
        let frame = 0
        const measure = () => {
            const height = host.clientHeight
            if (!height) return
            const el = host.querySelector('[data-bottom-overlay]')
            // The strip's own top padding is a fade, not content; the
            // element's full height would reserve space that nothing
            // occupies. Its first child is the part that is actually drawn.
            const box = el?.firstElementChild ?? el
            const bottomPx = box ? box.getBoundingClientRect().height : 0
            // The site nav floats over this canvas and is not part of it,
            // so it is measured from the document rather than the host.
            const nav = document.querySelector('header')
            const navBox = nav?.getBoundingClientRect()
            const hostTop = host.getBoundingClientRect().top
            const topPx = navBox ? Math.max(0, navBox.bottom - hostTop) : 0
            const next = {
                top: Math.min(Math.max(topPx / height, 0), 0.3),
                bottom: Math.min(Math.max(bottomPx / height, 0.08), 0.6),
            }
            setInsets((prev) =>
                Math.abs(prev.top - next.top) < 0.005 &&
                Math.abs(prev.bottom - next.bottom) < 0.005
                    ? prev
                    : next
            )
        }
        // The overlay mounts and swaps with the view, so watch the subtree
        // rather than one element that may not exist yet.
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(measure)
        })
        observer.observe(host)
        const mutation = new MutationObserver(() => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(measure)
        })
        mutation.observe(host, { childList: true, subtree: true })
        measure()
        return () => {
            cancelAnimationFrame(frame)
            observer.disconnect()
            mutation.disconnect()
        }
    }, [hostRef])
    return insets
}
