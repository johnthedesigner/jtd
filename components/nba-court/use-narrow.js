import { useEffect, useState } from 'react'

/**
 * True while the viewport is phone-width.
 *
 * Tailwind's `sm` breakpoint, in JS, for the handful of decisions that are
 * not styling — how many cards to measure for, how much of a list to show
 * by default. Anything that is only a matter of appearance should use the
 * `sm:` variant in markup instead and never reach for this.
 */
export const NARROW_MAX = 639

export default function useNarrow() {
    const [narrow, setNarrow] = useState(false)
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return
        const query = window.matchMedia(`(max-width: ${NARROW_MAX}px)`)
        const update = () => setNarrow(query.matches)
        update()
        query.addEventListener('change', update)
        return () => query.removeEventListener('change', update)
    }, [])
    return narrow
}
