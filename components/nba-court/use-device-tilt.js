import { useEffect, useRef } from 'react'

/**
 * Drives the scene's parallax from how the device is being held, where that
 * is something the device can say.
 *
 * Writes into the same `{x, y}` ref the pointer does, in the same -1..1
 * range, so nothing downstream knows the difference. It returns a ref that
 * says whether tilt has taken over, which the pointer handler checks: a
 * phone fires both — a tap produces pointer events — and the two fighting
 * over one value reads as a twitch.
 *
 * Three things make this less simple than reading `beta` and `gamma`:
 *
 * 1. **Nobody holds a phone flat.** A device held at a comfortable reading
 *    angle already reports 30-70 degrees of pitch, so treating zero as
 *    neutral pins the parallax to its limit and leaves it there. The first
 *    reading becomes the neutral pose and everything after is measured
 *    against it.
 * 2. **Landscape swaps the axes.** Turn the phone and the axis that was
 *    left-to-right becomes top-to-bottom; `screen.orientation.angle` says
 *    which way round it currently is.
 * 3. **iOS requires permission, and only from a user gesture.** It cannot
 *    be asked for on load. The request rides on the first touch instead, so
 *    there is no prompt until someone has actually interacted, and no
 *    permission UI to design around.
 */

/** Degrees of tilt away from neutral that reach the full parallax range. */
const RANGE_DEGREES = 26
/** Ignore jitter below this, so a device resting on a table stays still. */
const DEADZONE = 0.04
/** How quickly the neutral pose follows a sustained change in holding angle. */
const RECENTER_PER_SECOND = 0.04

function clamp(v) {
    return v < -1 ? -1 : v > 1 ? 1 : v
}

export default function useDeviceTilt(pointerRef, { enabled = true } = {}) {
    const activeRef = useRef(false)

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return
        if (typeof window.DeviceOrientationEvent === 'undefined') return

        let neutral = null
        let last = typeof performance !== 'undefined' ? performance.now() : 0

        const onOrientation = (event) => {
            const { beta, gamma } = event
            if (beta == null || gamma == null) return
            // A desktop with no sensor can still emit an event of all
            // zeroes; that is not a reading, and taking it would hand the
            // parallax to a device that cannot move.
            if (beta === 0 && gamma === 0 && !activeRef.current) return

            const angle = window.screen?.orientation?.angle ?? 0
            // Portrait: gamma is left-right, beta is front-back. A quarter
            // turn exchanges them, and a half turn flips their signs.
            let tiltX
            let tiltY
            if (angle === 90) {
                tiltX = -beta
                tiltY = gamma
            } else if (angle === 270 || angle === -90) {
                tiltX = beta
                tiltY = -gamma
            } else if (angle === 180) {
                tiltX = -gamma
                tiltY = -beta
            } else {
                tiltX = gamma
                tiltY = beta
            }

            if (!neutral) neutral = { x: tiltX, y: tiltY }
            else {
                // Drift the neutral pose toward how the device is actually
                // being held, so settling into a new posture re-centres
                // instead of parking the scene at the edge of its range.
                const now = typeof performance !== 'undefined' ? performance.now() : last
                const dt = Math.min((now - last) / 1000, 0.1)
                last = now
                const k = RECENTER_PER_SECOND * dt
                neutral.x += (tiltX - neutral.x) * k
                neutral.y += (tiltY - neutral.y) * k
            }

            const nx = clamp((tiltX - neutral.x) / RANGE_DEGREES)
            const ny = clamp((tiltY - neutral.y) / RANGE_DEGREES)
            activeRef.current = true
            pointerRef.current.x = Math.abs(nx) < DEADZONE ? 0 : nx
            pointerRef.current.y = Math.abs(ny) < DEADZONE ? 0 : ny
        }

        const listen = () => window.addEventListener('deviceorientation', onOrientation)

        const needsPermission =
            typeof window.DeviceOrientationEvent.requestPermission === 'function'

        let onGesture = null
        if (needsPermission) {
            onGesture = () => {
                window.removeEventListener('touchend', onGesture)
                window.DeviceOrientationEvent.requestPermission()
                    .then((state) => {
                        if (state === 'granted') listen()
                    })
                    .catch(() => {
                        // Declined, or not served over https. Pointer
                        // parallax carries on as before.
                    })
            }
            window.addEventListener('touchend', onGesture, { once: true })
        } else {
            listen()
        }

        return () => {
            window.removeEventListener('deviceorientation', onOrientation)
            if (onGesture) window.removeEventListener('touchend', onGesture)
            activeRef.current = false
        }
    }, [pointerRef, enabled])

    return activeRef
}
