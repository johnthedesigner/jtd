import { useEffect, useState } from 'react'

/**
 * Shared by every WebGL experiment on this site, not just the arena it was
 * written for. Lifted out of `CourtViewer` when a second scene needed it;
 * the behaviour is unchanged.
 */

export default function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)')
        const update = () => setReduced(query.matches)
        update()
        query.addEventListener('change', update)
        return () => query.removeEventListener('change', update)
    }, [])
    return reduced
}
