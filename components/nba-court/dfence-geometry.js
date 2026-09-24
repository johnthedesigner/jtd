import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * The two shapes for the "D-FENCE" show: a block letter D and a picket-fence
 * icon, the arena-scoreboard pun for "defense". Both are hand-built extruded
 * shapes rather than an imported font or icon — consistent with the rest of
 * this project (no external loaders), and a block letter is a simple enough
 * outline that a font adds dependency for no real gain here.
 *
 * Both rest on the floor at local Y=0, centred on X and Z, so dropping one in
 * is just animating the group's world Y position down to 0 — no per-shape
 * offset math needed at the call site.
 */

export const DFENCE_HEIGHT = 12
const DEPTH = 2.4

/** A block "D": a straight left stroke and top/bottom, a half-round right
 *  bulge, and a matching inner counter cut as a hole in the same shape. */
export function buildLetterDGeometry(height = DFENCE_HEIGHT, depth = DEPTH) {
    const H = height
    const stroke = H * 0.24
    const R = H / 2
    const Cx = H * 0.26

    const outer = new THREE.Shape()
    outer.moveTo(0, 0)
    outer.lineTo(0, H)
    outer.lineTo(Cx, H)
    outer.absarc(Cx, H / 2, R, Math.PI / 2, -Math.PI / 2, true)
    outer.lineTo(0, 0)
    outer.closePath()

    const holeR = Math.max(0.1, R - stroke)
    const hole = new THREE.Path()
    hole.moveTo(stroke, stroke)
    hole.lineTo(stroke, H - stroke)
    hole.lineTo(Cx, H - stroke)
    hole.absarc(Cx, H / 2, holeR, Math.PI / 2, -Math.PI / 2, true)
    hole.lineTo(stroke, stroke)
    hole.closePath()
    outer.holes.push(hole)

    const width = Cx + R
    const geometry = new THREE.ExtrudeGeometry(outer, {
        depth,
        bevelEnabled: true,
        bevelThickness: 0.12,
        bevelSize: 0.12,
        bevelSegments: 3,
        curveSegments: 20,
    })
    // Centre X and Z; leave Y alone so the shape's own floor (y=0) is the
    // resting height.
    geometry.translate(-width / 2, 0, -(depth / 2 + 0.12))
    return geometry
}

/** A simple picket-fence icon: two rails and a row of pointed pickets. */
export function buildFenceGeometry(height = DFENCE_HEIGHT * 0.82, depth = DEPTH) {
    const H = height
    const width = H * 1.35
    const railH = H * 0.09
    const picketW = H * 0.13
    const picketGap = H * 0.09
    const pointH = picketW * 0.75
    const parts = []

    const box = (w, h, d, cx, cy, cz) => {
        const g = new THREE.BoxGeometry(w, h, d)
        g.translate(cx, cy, cz)
        parts.push(g)
    }

    // Top and bottom rails, running the fence's full width.
    box(width, railH, depth * 0.55, 0, H * 0.62, 0)
    box(width, railH, depth * 0.55, 0, H * 0.22, 0)

    // Pickets: evenly spaced, each a post with a pyramidal point, standing
    // taller than the rails at both ends.
    const pitch = picketW + picketGap
    const count = Math.floor(width / pitch)
    const rowWidth = count * pitch - picketGap
    const startX = -rowWidth / 2 + picketW / 2

    for (let i = 0; i < count; i++) {
        const cx = startX + i * pitch
        box(picketW, H - pointH, depth, cx, (H - pointH) / 2, 0)

        const tip = new THREE.ConeGeometry(picketW * 0.62, pointH, 4)
        tip.rotateY(Math.PI / 4)
        tip.translate(cx, H - pointH / 2, 0)
        parts.push(tip)
    }

    const geometry = mergeGeometries(parts)
    for (const g of parts) g.dispose()
    return geometry
}
