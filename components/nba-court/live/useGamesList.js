import { useEffect, useState } from 'react'

/**
 * Fetches one tab of `/api/nba-live/games` — the route that fans out across
 * the season calendar server-side, so this stays a single request.
 *
 * Only fetches while `enabled`: a visitor who never reaches the landing
 * shouldn't pay for either tab, and the inactive tab shouldn't fetch just
 * because the strip is on screen.
 *
 * **It polls.** A live game's score, quarter and clock are stale the moment
 * they arrive, and a game that ends has to leave "Watch live" on its own —
 * the route already decides which tab a game belongs to from its status, so
 * a refetch is all that takes. Without this the landing was a snapshot of
 * whenever the page happened to load.
 */
const POLL_MS = 30_000

export default function useGamesList(tab, { enabled = true, pollMs = POLL_MS } = {}) {
    const [games, setGames] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!enabled || !tab) return
        let cancelled = false
        let timer = 0

        // A tab switch is a new list and shows skeletons. A poll is not, and
        // must not: `loading` drives the skeletons, so setting it on every
        // refetch would blink the whole row twice a minute.
        setGames([])
        setLoading(true)

        const load = async () => {
            try {
                /*
                  `no-store` keeps this out of the *browser's* cache only.

                  The route sets `stale-while-revalidate`, which is right for
                  the edge and wrong here: Chrome honours it by handing the
                  cached body straight back to this fetch and revalidating in
                  the background, so a poll for a live score could redisplay
                  a minute-old one and fire two requests doing it. The shared
                  cache is what protects the origin; the client wants
                  whatever the edge currently holds.
                */
                const response = await fetch(`/api/nba-live/games?tab=${tab}`, {
                    cache: 'no-store',
                })
                if (!response.ok) throw new Error(`games ${response.status}`)
                const data = await response.json()
                if (cancelled) return
                setGames(data.games ?? [])
                setError(null)
            } catch (err) {
                if (!cancelled) setError(err.message)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        const schedule = () => {
            clearTimeout(timer)
            // Nothing to keep fresh for a tab nobody is looking at, and a
            // backgrounded tab polling on a timer is how a page quietly
            // costs someone their battery.
            if (typeof document !== 'undefined' && document.hidden) return
            timer = setTimeout(tick, pollMs)
        }

        const tick = async () => {
            await load()
            if (!cancelled) schedule()
        }

        const onVisibility = () => {
            if (document.hidden) {
                clearTimeout(timer)
            } else {
                // Coming back, the list is as stale as the time away. Catch
                // up at once rather than after another full interval.
                tick()
            }
        }

        tick()
        document.addEventListener('visibilitychange', onVisibility)
        return () => {
            cancelled = true
            clearTimeout(timer)
            document.removeEventListener('visibilitychange', onVisibility)
        }
    }, [tab, enabled, pollMs])

    return { games, loading, error }
}
