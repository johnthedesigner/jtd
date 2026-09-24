import { useEffect, useState } from 'react'

// Slower than "one play arrives, then the next" would suggest — a scene
// reaction needs enough real time to actually ease in and hold (see
// live-scenes.js's HOLD_SECONDS) before the next play supersedes it, or the
// camera never settles anywhere, just perpetually chases a moving target.
// Real games naturally space notable events out much more than this
// game's raw play-by-play does; this is a testing/demo pace, not a replay
// of real timing, and is worth retuning once seen in motion.
export const DEFAULT_INTERVAL_MS = 3500

/**
 * Plays back a saved game on a timer, revealing one play at a time — the
 * source doc's own "build replay first" advice: everything downstream
 * (camera scenes, markers, HUD) can be built and tested against this
 * without waiting for a real game, and `usePlayFeed` (once live polling
 * exists) is meant to hand out the exact same shape, so nothing downstream
 * needs to know which one it's connected to.
 *
 * Deliberately a fixed interval, not real game-clock pacing — matches the
 * scope this was planned at (verifying the pipeline moves continuously,
 * with no gaps), not simulating real broadcast timing.
 */
export default function useReplayFeed(
    fixtureUrl,
    { intervalMs = DEFAULT_INTERVAL_MS, autoStart = true, startAt = 0 } = {}
) {
    const [game, setGame] = useState(null)
    const [allPlays, setAllPlays] = useState([])
    const [revealedCount, setRevealedCount] = useState(0)

    useEffect(() => {
        // Gated by `autoStart` too, not just the reveal timer below —
        // `usePlayFeed` always mounts this hook (hooks can't be called
        // conditionally) even while watching a real polled game, so
        // fetching the demo fixture regardless would be a wasted request
        // every single time, not just an edge case.
        if (!autoStart) return
        let cancelled = false
        setRevealedCount(0)
        fetch(fixtureUrl)
            .then((r) => r.json())
            .then((data) => {
                if (cancelled) return
                const plays = data.plays ?? []
                setGame(data.game)
                setAllPlays(plays)
                // `?replayfrom=` starts part-way in, as a fraction of the
                // game's length. A full replay runs ~25 minutes at this
                // pace, which makes the end of a game — and the things that
                // only happen there — effectively unreachable otherwise.
                const frac = Math.max(0, Math.min(1, startAt))
                if (frac > 0) setRevealedCount(Math.floor(plays.length * frac))
            })
        return () => {
            cancelled = true
        }
    }, [fixtureUrl, autoStart, startAt])

    useEffect(() => {
        if (!autoStart || revealedCount >= allPlays.length) return
        const id = setTimeout(() => setRevealedCount((c) => c + 1), intervalMs)
        return () => clearTimeout(id)
    }, [autoStart, allPlays.length, revealedCount, intervalMs])

    const plays = allPlays.slice(0, revealedCount)
    return { game, plays, latestPlay: plays[plays.length - 1] ?? null }
}
