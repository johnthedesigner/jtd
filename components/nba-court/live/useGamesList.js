import { useEffect, useState } from 'react'

/**
 * Fetches one tab of `/api/nba-live/games` — the route that fans out across
 * the season calendar server-side, so this stays a single request.
 *
 * Only fetches while `enabled`, matching `useScoreboardPoll`'s own gate: a
 * visitor who never opens the drawer shouldn't pay for either tab, and the
 * inactive tab shouldn't fetch just because the drawer is open.
 *
 * No polling here, unlike the scoreboard: these lists span days, so they
 * don't meaningfully change while someone looks at them, and the route is
 * edge-cached hard (a day for `past`, which is immutable).
 */
export default function useGamesList(tab, { enabled = true } = {}) {
    const [games, setGames] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!enabled || !tab) return
        let cancelled = false
        setLoading(true)
        fetch(`/api/nba-live/games?tab=${tab}`)
            .then((r) => {
                if (!r.ok) throw new Error(`games ${r.status}`)
                return r.json()
            })
            .then((data) => {
                if (cancelled) return
                setGames(data.games ?? [])
                setError(null)
            })
            .catch((err) => {
                if (!cancelled) setError(err.message)
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [tab, enabled])

    return { games, loading, error }
}
