import { useEffect, useState } from 'react'

/**
 * Shared by every WebGL experiment on this site, not just the arena it was
 * written for. Lifted out of `CourtViewer` when a second scene needed it;
 * the behaviour is unchanged.
 */

/**
 * True only while this tab is both the visible tab and the focused window.
 * Backs the render loop's on/off switch below — an R3F canvas nobody can
 * see still burns CPU and GPU (and, on a laptop, battery) running its
 * animation every frame, so the whole scene should go fully idle rather
 * than just quietly rendering into a backgrounded tab.
 *
 * Two separate browser signals, combined: visibilitychange alone catches
 * switching tabs or minimizing, but doesn't reliably fire when this window
 * loses OS focus to another app while still on screen, which is what the
 * focus/blur listeners are for.
 */
export default function useRenderActive() {
    // Visibility and focus are tracked separately and combined, rather than
    // both folded into one synchronous document.hasFocus() poll. That poll
    // turns out to be unreliable in at least one real environment (headless
    // Chrome under CDP automation reports it false from the very first
    // frame, with no blur ever having fired) — and since frameloop='never'
    // below skips every render including the first one, trusting a flaky
    // "false" at mount time means the canvas never paints anything at all,
    // ever. Focus/blur events are edge-triggered and don't have that
    // problem: both start true, and only flip on an event that actually
    // fired, so a page that never receives a real blur stays active.
    const [visible, setVisible] = useState(true)
    const [focused, setFocused] = useState(true)
    useEffect(() => {
        const onVisibility = () => setVisible(document.visibilityState === 'visible')
        const onFocus = () => setFocused(true)
        const onBlur = () => setFocused(false)
        onVisibility()
        document.addEventListener('visibilitychange', onVisibility)
        window.addEventListener('focus', onFocus)
        window.addEventListener('blur', onBlur)
        return () => {
            document.removeEventListener('visibilitychange', onVisibility)
            window.removeEventListener('focus', onFocus)
            window.removeEventListener('blur', onBlur)
        }
    }, [])
    return visible && focused
}
