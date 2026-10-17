import { useEffect, useState } from 'react'

/**
 * How many pixels of the layout viewport sit below what you can actually
 * see — i.e. how much browser chrome is covering the bottom of the page.
 *
 * **Why this exists, after several failed attempts at the same bug.**
 *
 * On iOS the layout viewport (what `position: fixed` and `100vh` are
 * measured against) stays the height of the screen with the toolbars
 * hidden, while the visual viewport (what you can see) shrinks when they
 * are shown. Anything pinned to the bottom of the layout viewport is
 * therefore underneath the toolbar.
 *
 * Previous fixes tried to make the *document* the right height and then
 * anchor to the bottom of that — measure the viewport, publish it as a
 * custom property, size the page to it, then add a measured overshoot on
 * top. That chain works only if every box between the page and the
 * overlay honours it, and on iOS one of them reliably does not. Each
 * attempt was also "verified" in headless Chrome, which has no browser
 * chrome at all and so cannot reproduce the bug under any circumstances.
 *
 * This takes the document out of it. The element is positioned against the
 * layout viewport with `position: fixed`, and this hook returns exactly how
 * far up from its bottom edge it has to sit. No ancestor can get it wrong,
 * because no ancestor is involved.
 *
 * Both `resize` *and* `scroll` are listened for: on iOS the toolbar
 * retracting fires scroll, not resize, and that is the moment the usable
 * height changes.
 */
export default function useVisualViewportInset() {
    const [inset, setInset] = useState(0)

    useEffect(() => {
        if (typeof window === 'undefined') return
        const vv = window.visualViewport
        if (!vv) return

        const measure = () => {
            // Everything below the visible band, in layout-viewport pixels.
            const hidden = window.innerHeight - (vv.height + vv.offsetTop)
            // Never negative, and never more than half the screen: a wrong
            // sign or a transient reading should degrade to "no correction"
            // rather than fling the controls into the middle of the page.
            const next = Math.max(0, Math.min(Math.round(hidden), Math.round(window.innerHeight / 2)))
            setInset((prev) => (Math.abs(prev - next) < 1 ? prev : next))
        }

        measure()
        vv.addEventListener('resize', measure)
        vv.addEventListener('scroll', measure)
        window.addEventListener('orientationchange', measure)
        /*
          iOS reports a stale viewport for a moment after load and after an
          orientation change, while the toolbar is still settling. These
          catch the value once it has.
        */
        const timers = [60, 250, 800, 2000].map((ms) => setTimeout(measure, ms))
        return () => {
            vv.removeEventListener('resize', measure)
            vv.removeEventListener('scroll', measure)
            window.removeEventListener('orientationchange', measure)
            timers.forEach(clearTimeout)
        }
    }, [])

    return inset
}
