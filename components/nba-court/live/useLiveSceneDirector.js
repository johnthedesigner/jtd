import { useEffect, useRef, useState } from 'react'
import { sceneForPlay, TIER_PRIORITY } from './live-scenes'

/**
 * Watches the latest incoming play (from `useReplayFeed` today, `usePlayFeed`
 * once live polling exists — same shape either way) and decides what the
 * camera/scene should be doing right now: idle, or reacting to a recent
 * notable play for a few seconds before easing back.
 *
 * Deliberately plain React, no `useFrame` — this runs outside the R3F Canvas
 * (alongside `CourtViewer`'s existing `prevPose`/`moveRef` refs) and doesn't
 * need render-loop access. The hold timer is a real `setTimeout`, not a
 * frame-driven countdown: that's also the more correct choice given this
 * app's `useRenderActive` work (the render loop fully pauses while the tab
 * is backgrounded) — a wall-clock timer reflects real elapsed time either
 * way, so a returning viewer sees state consistent with how much time
 * actually passed, rather than a countdown that silently froze.
 *
 * Not every play interrupts an active scene — only another *triggering*
 * play does (a free throw arriving mid-spotlight shouldn't cut it short).
 * And even a triggering play only interrupts a scene of *equal or lower*
 * priority (`TIER_PRIORITY` in `live-scenes.js`) — found this mattered in
 * practice, not just in theory: in one real game, a timeout was followed
 * two plays later by a missed shot, which would otherwise cut a 6-second
 * typography moment down to under a second. A same-or-higher-priority
 * event still always replaces what's active and restarts the hold, the
 * same way `CourtViewer`'s `selectView` already restarts an in-flight pose
 * transition by resetting `moveRef.current = 0`.
 */
export default function useLiveSceneDirector(latestPlay) {
    const [activeScene, setActiveScene] = useState(null)
    const lastActionNumberRef = useRef(null)
    const revertTimerRef = useRef(null)
    const activeTierRef = useRef(null)

    useEffect(() => {
        if (!latestPlay || latestPlay.actionNumber === lastActionNumberRef.current) return
        lastActionNumberRef.current = latestPlay.actionNumber

        const scene = sceneForPlay(latestPlay)
        if (!scene) return // non-triggering play — leave any active scene running
        if (activeTierRef.current && TIER_PRIORITY[scene.tier] < TIER_PRIORITY[activeTierRef.current]) {
            return // a lesser event than what's already showing — ignore it
        }

        if (revertTimerRef.current) clearTimeout(revertTimerRef.current)
        activeTierRef.current = scene.tier
        setActiveScene(scene)
        revertTimerRef.current = setTimeout(() => {
            setActiveScene(null)
            activeTierRef.current = null
            revertTimerRef.current = null
        }, scene.holdSeconds * 1000)
    }, [latestPlay])

    // Cleanup on unmount only — an in-flight hold timer shouldn't outlive
    // the component that scheduled it.
    useEffect(() => {
        return () => {
            if (revertTimerRef.current) clearTimeout(revertTimerRef.current)
        }
    }, [])

    return activeScene
}
