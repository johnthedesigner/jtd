import { useEffect, useRef, useState } from 'react'
import useReplayFeed, { DEFAULT_INTERVAL_MS } from './useReplayFeed'

// Matches the `summary/[gameId]` route's own `s-maxage=3` — polling faster
// wouldn't get fresher data (the edge cache is the actual freshness floor),
// slower would waste it.
const POLL_MS = 3000
const REPLAY_FIXTURE_URL = '/nba-live/sample-playbyplay.json'

/**
 * The one thing everything downstream (the scene director, markers,
 * typography, the HUD) actually consumes — same `{ game, plays, latestPlay
 * }` shape regardless of which source is behind it, so nothing downstream
 * needed to change to go from replay-only to this.
 *
 * No `gameId` (nothing picked from the game list yet): falls back to
 * `useReplayFeed`'s demo fixture — replay stays a permanent capability, not
 * a development stand-in the source doc's own phrase captures exactly:
 * "a working demo on any day with no games, which will be most days."
 *
 * A `gameId`: polls the real `summary/[gameId]` route instead.
 *
 * **Mid-game join is already correct, not a special case**: the summary
 * route returns the *entire* play history on every request, not just
 * what's new — so the very first poll after selecting an in-progress game
 * already populates the full `plays` array and the real current
 * `latestPlay`, with no artificial catch-up needed.
 *
 * **A finished game is replayed, not summarized.** The summary route hands
 * back a completed game's entire play history at once, so showing it
 * as-is drops you on the final buzzer — the score already final, the last
 * play "End of Game", nothing left to watch. That's the opposite of what
 * picking a game off the Past tab is for. So a game that comes back
 * `final` has its plays revealed on the same timer `useReplayFeed` uses
 * for the demo fixture, from the opening tip. An in-progress game is
 * *not* paced: there, every play already known really has happened, and
 * the point is to be caught up to the live moment.
 *
 * **Revised plays are already correct too, for the same reason**: this
 * replaces `plays` wholesale on every poll rather than appending — if
 * ESPN corrects an earlier play (the source doc's own caution: "diff on
 * `actionNumber` rather than appending blindly"), the next poll's full
 * array already reflects it, and every consumer downstream keys off
 * `actionNumber` already (for exactly this reason), so a correction to an
 * old play is picked up automatically without re-triggering anything tied
 * to `latestPlay` specifically.
 */
export default function usePlayFeed(gameId, { active = true, startAt = 0 } = {}) {
    const replay = useReplayFeed(REPLAY_FIXTURE_URL, { autoStart: active && !gameId, startAt })

    const [liveGame, setLiveGame] = useState(null)
    const [livePlays, setLivePlays] = useState([])
    const [error, setError] = useState(null)
    const stoppedRef = useRef(false)
    // How much of a finished game has been played back so far (see above).
    const [revealed, setRevealed] = useState(0)

    useEffect(() => {
        stoppedRef.current = false
        setRevealed(0)
        if (!active || !gameId) return

        let cancelled = false
        const fetchOnce = async () => {
            if (stoppedRef.current) return
            try {
                const res = await fetch(`/api/nba-live/summary/${gameId}`)
                if (!res.ok) throw new Error(`summary ${res.status}`)
                const data = await res.json()
                if (cancelled) return
                setLiveGame(data.game)
                setLivePlays(data.plays ?? [])
                setError(null)
                // A final game's data won't change again — no point
                // polling a completed game forever.
                if (data.game?.status === 'final') stoppedRef.current = true
            } catch (err) {
                if (!cancelled) setError(err.message)
            }
        }

        fetchOnce()
        const id = setInterval(fetchOnce, POLL_MS)
        return () => {
            cancelled = true
            clearInterval(id)
        }
    }, [active, gameId])

    const isFinal = liveGame?.status === 'final'

    // `?replayfrom=` jumps into a finished game part-way through, as a
    // fraction of its length — 0.97 lands in the closing minute. A full
    // replay runs about 25 minutes at this pace, so without it the end of a
    // game (and everything that fires there) is effectively unreachable.
    // Applied once per game, the first time its plays arrive.
    const jumpedRef = useRef(false)
    useEffect(() => {
        jumpedRef.current = false
    }, [gameId])
    useEffect(() => {
        if (!isFinal || jumpedRef.current || livePlays.length === 0) return
        jumpedRef.current = true
        const frac = Math.max(0, Math.min(1, startAt))
        if (frac > 0) setRevealed(Math.floor(livePlays.length * frac))
    }, [isFinal, livePlays.length, startAt])

    useEffect(() => {
        if (!active || !isFinal) return
        if (revealed >= livePlays.length) return
        const id = setTimeout(() => setRevealed((c) => c + 1), DEFAULT_INTERVAL_MS)
        return () => clearTimeout(id)
    }, [active, isFinal, revealed, livePlays.length])

    if (!gameId) return replay

    const plays = isFinal ? livePlays.slice(0, revealed) : livePlays

    return {
        game: liveGame,
        plays,
        latestPlay: plays[plays.length - 1] ?? null,
        error,
    }
}
