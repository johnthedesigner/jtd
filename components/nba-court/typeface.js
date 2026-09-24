import { useEffect, useState } from 'react'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'

/**
 * Shared loader for the typeface.json fonts this scene extrudes into real
 * geometry (`ScoreboardText`'s Montserrat weights, the shot clock's LCD
 * face). Cached by URL the same way `CourtViewer`'s `loadCourt` caches
 * textures — a font is fetched once per session no matter how many meshes
 * ask for it, and the two Hoops asking for the same LCD face share one
 * request.
 *
 * Lazy on purpose: these are ~60KB-670KB static assets that only matter
 * once something actually renders text, so they're fetched on demand rather
 * than bundled into the main JS.
 */
const cache = new Map()

export function loadTypeface(url) {
    if (cache.has(url)) return cache.get(url)
    const promise = new Promise((resolve, reject) => {
        new FontLoader().load(url, resolve, undefined, reject)
    })
    cache.set(url, promise)
    return promise
}

export function useTypeface(url) {
    const [font, setFont] = useState(null)
    useEffect(() => {
        if (!url) return
        let cancelled = false
        loadTypeface(url).then((f) => {
            if (!cancelled) setFont(f)
        })
        return () => {
            cancelled = true
        }
    }, [url])
    return font
}

/**
 * A `TextGeometry` centred on its own origin, so positioning it is just
 * "where the middle of the text should be" rather than "where the first
 * glyph's bottom-left corner goes", which is what `TextGeometry` itself
 * measures from.
 *
 * `baseline: 'bottom'` centres horizontally but leaves the origin at the
 * bottom of the inked glyphs, for text that has to stand on something. The
 * measurement has to come from the bounding box rather than from `size`:
 * `size` is the em, and a run of digits inks only its cap height — about
 * 70% of that — so resting text on a floor by arithmetic on `size` sinks
 * it into the floor by the difference.
 */
export function centeredTextGeometry(
    TextGeometry,
    font,
    text,
    size,
    depth,
    { baseline = 'middle', chamfer = 0 } = {}
) {
    // `bevelSegments: 1` is what makes this a chamfer — a single flat cut
    // around the front and back faces — rather than the rounded fillet more
    // segments would give. `bevelOffset: 0` keeps the cut inside the glyph's
    // own outline so letterforms don't fatten as the chamfer grows.
    const geo = new TextGeometry(text, {
        font,
        size,
        depth,
        curveSegments: 6,
        bevelEnabled: chamfer > 0,
        bevelThickness: chamfer,
        bevelSize: chamfer,
        bevelOffset: 0,
        bevelSegments: 1,
    })
    geo.computeBoundingBox()
    const bb = geo.boundingBox
    const width = bb.max.x - bb.min.x
    const height = bb.max.y - bb.min.y
    const dy = baseline === 'bottom' ? -bb.min.y : -bb.min.y - height / 2
    const dx = -bb.min.x - width / 2
    geo.translate(dx, dy, -depth / 2)
    // The inked height, so callers stacking text (a label above a number)
    // can measure from what's actually drawn.
    geo.userData.inkHeight = height
    // Distance-from-edge field, for materials that light the letterforms
    // from inside — built in the same local frame the geometry just moved
    // to, so a shader can sample it straight from `position.xy`.
    return geo
}
