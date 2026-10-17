import { useCallback, useEffect, useRef, useState } from 'react'

/** How often anything in the DOM re-reads the clock. Enough for a readout. */
const READOUT_HZ = 12

/**
 * Playback position, in data frames, scoped to a chapter's range.
 *
 * The authoritative value lives in a ref that the render loop owns and
 * advances; this exposes a slow copy for anything that has to display it.
 * Keeping those apart is what lets the scene run at full rate without
 * re-rendering the DOM around it sixty times a second.
 *
 * A chapter is a range and a speed rather than a point: it starts at its
 * first frame, runs to its last at its own pace, and stops there. Stopping
 * rather than looping is deliberate — a loop gives no moment to read the
 * claim against the thing that just happened.
 */
export default function useServeClock(data) {
    const clock = useRef({ t: 0, playing: false, speed: 0.1, from: 0, to: 0 })

    const [readout, setReadout] = useState({ t: 0, playing: false, atEnd: false })
    useEffect(() => {
        const id = setInterval(() => {
            const c = clock.current
            const atEnd = c.to > c.from && c.t >= c.to - 1e-6
            setReadout((prev) =>
                prev.t === c.t && prev.playing === c.playing && prev.atEnd === atEnd
                    ? prev
                    : { t: c.t, playing: c.playing, atEnd }
            )
        }, 1000 / READOUT_HZ)
        return () => clearInterval(id)
    }, [])

    /** Point the clock at a chapter and run it from the top. */
    const playRange = useCallback((from, to, speed, { autoplay = true } = {}) => {
        const c = clock.current
        c.from = from
        c.to = to
        c.speed = speed
        c.t = from
        c.playing = autoplay
    }, [])

    const replay = useCallback(() => {
        const c = clock.current
        c.t = c.from
        c.playing = true
    }, [])
    const play = useCallback(() => {
        const c = clock.current
        if (c.t >= c.to - 1e-6) c.t = c.from
        c.playing = true
    }, [])
    const pause = useCallback(() => {
        clock.current.playing = false
    }, [])

    useEffect(() => {
        if (!data) return
        clock.current.t = 0
        clock.current.to = 0
    }, [data])

    return { clock, ...readout, playRange, replay, play, pause }
}
