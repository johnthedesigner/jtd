import * as THREE from 'three'
import { applyPoolFalloff } from './pool-falloff'

/**
 * The scoreboard characters: a matte gunmetal body with a lit translucent
 * face, like channel lettering.
 *
 * **The whole thing is two materials on one mesh, and that is the point.**
 * `ExtrudeGeometry` already splits itself exactly where this needs a split
 * — material index 0 is the front and back lids, index 1 is the sides and
 * the bevel, verified against the geometry's own groups and normals. So the
 * face is lit, the body is metal, and nothing has to be computed to know
 * which is which.
 *
 * An earlier version inset the lit panel by a one-inch bezel, which meant
 * knowing every fragment's distance from the glyph outline, which meant
 * building a distance field by rasterising font outlines. Every bug in that
 * stretch came from the rasterising and none from the lighting: even-odd
 * fill cancelled the overlapping contours fonts routinely contain, nonzero
 * fill depended on winding that font conversion does not preserve (this
 * font's '4' arrives as two separate solid shapes), canvas antialiasing
 * left hairline seams that the bezel cut rendered as scratches across the
 * panel, and single-channel textures needed their row alignment set or the
 * field sheared. The inch of flat return was not worth any of it — and at
 * characters this tall it was under a pixel anyway.
 *
 * What reads as the bezel now is the chamfer: a few inches of angled metal
 * running right around the face, which is real geometry and needs no
 * decisions at all.
 */

export const FRAME_DEFAULTS = {
    color: '#4a4f57',
    roughness: 0.78,
    metalness: 0.55,
    /** Matches the courtside chairs — the same room, the same light. */
    falloff: { floor: 0.34, spill: 0.26 },
}

export const PANEL_DEFAULTS = {
    /**
     * Warm *white*, not amber — halfway between neutral and the warmer tint
     * that preceded it. The warmth has to stay slight: these read as lit
     * panels rather than painted surfaces only while the colour stays close
     * to white, and a saturated warm at low intensity turns them tan.
     */
    color: '#fff2e4',
    intensity: 1,
}

/**
 * Defaults merged so an explicitly-passed `undefined` does not clobber
 * them.
 *
 * Plain object spread does clobber: an optional prop that isn't set still
 * arrives as a key whose value is `undefined`, and `{...defaults,
 * ...options}` happily overwrites a good default with it. That silently
 * turned every panel with no explicit colour white — `new THREE.Color(
 * undefined)` is white — so the scoreboard ignored two rounds of colour
 * tuning while reporting no error at all, and the frame quietly fell back
 * to the default light pool instead of the chairs'.
 */
function withDefaults(defaults, options) {
    const out = { ...defaults }
    for (const key of Object.keys(options)) {
        if (options[key] !== undefined) out[key] = options[key]
    }
    return out
}

/** The metal. Lit by the room on the same falloff the chairs use. */
export function makeSignFrameMaterial({ cacheKey = '', ...options } = {}) {
    const o = withDefaults(FRAME_DEFAULTS, options)
    const material = new THREE.MeshStandardMaterial({
        color: o.color,
        roughness: o.roughness,
        metalness: o.metalness,
    })
    applyPoolFalloff(material, { cacheKey: `sign-frame${cacheKey}`, ...o.falloff })
    return material
}

/**
 * The lit face. Unlit by the scene on purpose — it is a light source, not a
 * surface the room illuminates — and even across its whole area, which is
 * what a diffuser is for.
 */
export function makeSignPanelMaterial({ ...options } = {}) {
    const o = withDefaults(PANEL_DEFAULTS, options)
    return new THREE.MeshBasicMaterial({
        color: new THREE.Color(o.color).multiplyScalar(o.intensity),
        toneMapped: false,
        // The back lid carries this material too, but faces away from the
        // camera and is culled, so it never shows.
        side: THREE.FrontSide,
    })
}
