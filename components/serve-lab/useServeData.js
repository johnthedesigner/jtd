import { useEffect, useState } from 'react'

/**
 * The serve, fetched rather than imported.
 *
 * A static file under `public/`, so it is cached on its own and never
 * travels inside the page bundle. The raw 75-marker cloud is a second file
 * (`serve57-markers.json`) because it is half the payload and powers one
 * optional view; it is deliberately not fetched here.
 */
export default function useServeData(url = '/experiments/serve-lab/serve57.json') {
    const [data, setData] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        let cancelled = false
        fetch(url)
            .then((res) => {
                if (!res.ok) throw new Error(`serve data ${res.status}`)
                return res.json()
            })
            .then((json) => {
                if (!cancelled) setData(json)
            })
            .catch((err) => {
                if (!cancelled) setError(err.message)
            })
        return () => {
            cancelled = true
        }
    }, [url])

    return { data, error }
}
