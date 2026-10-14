import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { logoRings, LOGO_VIEWBOX } from '../logo-hero-gpu/logo-glyph'
import { makeSignFrameMaterial, makeSignPanelMaterial } from './sign-material'
import { centeredTextGeometry, useTypeface } from './typeface'

/**
 * The JTD mark standing behind the court on the landing view, built the same
 * way the scoreboard is: a gunmetal body with a lit face, two materials on
 * one extrusion indexed by its own groups.
 *
 * It occupies the spot the score numerals take during a game, which is why
 * it only appears when there is no game on — the two would otherwise stand
 * in the same place.
 */

/** Inked height, in feet. A little over the scoreboard numerals' own scale. */
const LOGO_HEIGHT = 29.25
/** Same proportion the scoreboard characters use. */
const DEPTH_RATIO = 0.11
const CHAMFER_RATIO = 0.012
/** Behind the courtside seats, where the scoreboard stands during a game. */
const LOGO_Z = -38
/** The whole lockup stands on this, the way the numerals do. */
const BASE_Y = 2

const WORDMARK = 'Courtside'
const WORDMARK_FONT_URL = '/fonts/birthstone.typeface.json'
/**
 * `size` is the em, not the inked height, and a script face inks far less
 * of its em than a sans does — so this is the em that *produces* roughly
 * the height wanted, with the real figure measured off the geometry below
 * and used for the stacking. Same lesson as `ScoreboardText`'s
 * `NUMERAL_INK_RATIO`, arrived at the same way.
 */
const WORDMARK_SIZE = 10.5
/**
 * Shallower than the mark, and barely chamfered. Birthstone's hairlines are
 * a few inches wide at this scale; the mark's own 11% depth ratio would
 * make them deeper than they are thick, and a chamfer sized to the mark
 * would eat them outright.
 */
const WORDMARK_DEPTH = 0.55
const WORDMARK_CHAMFER = 0.045
/** Between the bottom of the mark and the top of the word's ink. */
const WORDMARK_GAP = 1.6

/**
 * The lockup stands behind the court, so it lives in whatever headroom the
 * framing leaves above the floor — and on a short viewport that is almost
 * none. On a landscape phone it was running off the top of the screen
 * entirely, mark first.
 *
 * Scaling the whole group shrinks it *toward the floor*, because everything
 * in it is positioned up from the same baseline, so it keeps its footing
 * instead of sliding. Below the floor of this range there is no headroom
 * worth using and it is hidden rather than shown as a sliver.
 */
const FULL_HEIGHT_AT = 760
const MIN_SCALE = 0.62
/**
 * Below this there is no usable headroom at all. A landscape phone frames
 * the court's back edge about 14% down the screen, which leaves roughly
 * fifty pixels above it — less than the mark alone needs at any scale worth
 * rendering. The site header already carries the logo there.
 */
const HIDE_BELOW = 440

function lockupScale(viewportHeight) {
    if (viewportHeight < HIDE_BELOW) return 0
    return Math.min(1, Math.max(MIN_SCALE, viewportHeight / FULL_HEIGHT_AT))
}

/** Ray-casting point-in-polygon over a flat `[x, y, x, y, ...]` ring. */
function pointInRing(px, py, ring) {
    let inside = false
    for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
        const xi = ring[i]
        const yi = ring[i + 1]
        const xj = ring[j]
        const yj = ring[j + 1]
        if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
            inside = !inside
        }
    }
    return inside
}

/**
 * Rings to `THREE.Shape`s, with counters attached as holes.
 *
 * Nesting is decided by containment rather than winding — the same choice
 * the typeface work landed on, and for the same reason: winding is not
 * reliable once outlines have been through a conversion, and a counter
 * misread as an outline fills solid without erroring.
 *
 * The mark's three letters currently have no counters at all, so this does
 * nothing today; it is here so that adding one is not a silent bug.
 */
function ringsToShapes(rings) {
    const depth = rings.map((ring, i) =>
        rings.reduce(
            (n, other, j) =>
                j !== i && pointInRing(ring[0], ring[1], other) ? n + 1 : n,
            0
        )
    )

    const toPoints = (ring) => {
        const pts = []
        for (let i = 0; i < ring.length; i += 2) {
            // SVG's Y runs down; flip so the mark stands up in the scene.
            pts.push(new THREE.Vector2(ring[i], LOGO_VIEWBOX.height - ring[i + 1]))
        }
        return pts
    }

    const shapes = []
    rings.forEach((ring, i) => {
        if (depth[i] % 2 !== 0) return
        const shape = new THREE.Shape(toPoints(ring))
        rings.forEach((hole, j) => {
            if (depth[j] % 2 !== 1) return
            // A counter belongs to the outline immediately containing it.
            if (!pointInRing(hole[0], hole[1], ring)) return
            shape.holes.push(new THREE.Path(toPoints(hole)))
        })
        shapes.push(shape)
    })
    return shapes
}

export default function LandingLogo({ visible = true }) {
    const wordFont = useTypeface(WORDMARK_FONT_URL)
    const viewportHeight = useThree((state) => state.size.height)
    const scale = lockupScale(viewportHeight)

    /**
     * The word, standing on the floor, with its own inked height reported
     * back so the mark above it knows where to start. Measured rather than
     * assumed: a script's ascenders and swashes make its ink nothing like
     * its em.
     */
    const wordGeometry = useMemo(
        () =>
            wordFont
                ? centeredTextGeometry(
                      TextGeometry,
                      wordFont,
                      WORDMARK,
                      WORDMARK_SIZE,
                      WORDMARK_DEPTH,
                      { baseline: 'bottom', chamfer: WORDMARK_CHAMFER }
                  )
                : null,
        [wordFont]
    )

    const geometry = useMemo(() => {
        const scale = LOGO_HEIGHT / LOGO_VIEWBOX.height
        const shapes = ringsToShapes(logoRings(scale))
        const depth = LOGO_HEIGHT * DEPTH_RATIO
        const chamfer = LOGO_HEIGHT * CHAMFER_RATIO
        const geo = new THREE.ExtrudeGeometry(shapes, {
            depth,
            curveSegments: 6,
            bevelEnabled: true,
            bevelThickness: chamfer,
            bevelSize: chamfer,
            bevelOffset: 0,
            bevelSegments: 1,
        })
        // Centre on X, stand it on its own baseline, and centre the
        // extrusion on Z so `LOGO_Z` means the middle of the slab.
        geo.computeBoundingBox()
        const b = geo.boundingBox
        geo.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -depth / 2)
        return geo
    }, [])

    const frameMaterial = useMemo(() => makeSignFrameMaterial({ cacheKey: 'logo' }), [])
    // Matches the scoreboard's own lit face, so the two read as the same
    // kind of sign in the same building.
    const panelMaterial = useMemo(() => makeSignPanelMaterial({ intensity: 1.0 }), [])
    // Index 0 is the lids, 1 the sides and bevel — see `sign-material.js`.
    const materials = useMemo(
        () => [panelMaterial, frameMaterial],
        [panelMaterial, frameMaterial]
    )

    useEffect(
        () => () => {
            geometry.dispose()
            frameMaterial.dispose()
            panelMaterial.dispose()
        },
        [geometry, frameMaterial, panelMaterial]
    )
    useEffect(() => () => wordGeometry?.dispose(), [wordGeometry])

    if (!visible) return null

    // The mark sits on top of the word, so until the word has been measured
    // there is nowhere to put it. One frame of nothing rather than a frame
    // in the wrong place.
    const wordInk = wordGeometry?.userData.inkHeight
    const markY = wordInk == null ? null : BASE_Y + wordInk + WORDMARK_GAP

    if (scale === 0) return null

    return (
        <group position={[0, 0, LOGO_Z]} scale={scale}>
            {wordGeometry && (
                <mesh
                    geometry={wordGeometry}
                    material={materials}
                    position={[0, BASE_Y, 0]}
                />
            )}
            {markY != null && (
                <mesh geometry={geometry} material={materials} position={[0, markY, 0]} />
            )}
        </group>
    )
}
