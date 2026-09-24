import { useEffect, useState } from 'react'

const POLL_MS = 20000

/**
 * Polls `/api/nba-live/scoreboard` — the actual working route, already
 * confirmed reachable (see JOURNAL.md). A plain `useEffect` + `setInterval`
 * + `fetch`, matching how the rest of this codebase solves things by hand
 * (no SWR/react-query anywhere here — see the plan doc's own note on this).
 *
 * `dates` in ESPN's own `YYYYMMDD` form — omitted, the route defaults to
 * today server-side. Only polls while `enabled` (the drawer being open),
 * so this doesn't run at all for the common case of a visitor never
 * opening the game list.
 */
export default function useScoreboardPoll({ enabled = true, dates } = {}) {
    const [games, setGames] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!enabled) return
        let cancelled = false

        const fetchOnce = async () => {
            try {
                const url = dates ? `/api/nba-live/scoreboard?dates=${dates}` : '/api/nba-live/scoreboard'
                const res = await fetch(url)
                if (!res.ok) throw new Error(`scoreboard ${res.status}`)
                const data = await res.json()
                if (cancelled) return
                setGames(data.games ?? [])
                setError(null)
            } catch (err) {
                if (!cancelled) setError(err.message)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        fetchOnce()
        const id = setInterval(fetchOnce, POLL_MS)
        return () => {
            cancelled = true
            clearInterval(id)
        }
    }, [enabled, dates])

    return { games, loading, error }
}
