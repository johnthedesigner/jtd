import * as THREE from 'three'
import { BACKBOARD, STANCHION } from './hoop-spec'

/**
 * A rounded-rectangle cross-section, used to give the backboard bumper the
 * look of a soft rubber pad rather than a plain box. `roundTop` and
 * `roundBottom` each round only the two corners on that edge — a bumper bar
 * that meets the board's edge flush on one side (no rounding there, or a
 * visible gap would open at the seam) and is fully exposed on the other
 * (rounded, since that is the corner a real rubber bumper actually has).
 */
function chamferedRectShape(w, h, r, { roundTop = true, roundBottom = true } = {}) {
    const shape = new THREE.Shape()
    const x = -w / 2
    const y = -h / 2
    const rt = roundTop ? Math.min(r, w / 2, h / 2) : 0
    const rb = roundBottom ? Math.min(r, w / 2, h / 2) : 0

    shape.moveTo(x, y + rb)
    if (rb > 0) shape.absarc(x + rb, y + rb, rb, Math.PI, Math.PI * 1.5)
    else shape.lineTo(x, y)
    shape.lineTo(x + w - rb, y)
    if (rb > 0) shape.absarc(x + w - rb, y + rb, rb, -Math.PI / 2, 0)
    shape.lineTo(x + w, y + h - rt)
    if (rt > 0) shape.absarc(x + w - rt, y + h - rt, rt, 0, Math.PI / 2)
    else shape.lineTo(x + w, y + h)
    shape.lineTo(x + rt, y + h)
    if (rt > 0) shape.absarc(x + rt, y + h - rt, rt, Math.PI / 2, Math.PI)
    shape.closePath()
    return shape
}

/**
 * One bar of the backboard bumper, extruded along its length.
 *
 * `crossW`/`crossH` are the bar's cross-section (depth through the board,
 * protrusion off the edge); `length` runs along the edge it wraps.
 * `roundTop`/`roundBottom` name which side of the CROSS-SECTION (not the
 * bar's length) gets the soft corner — the side facing away from the board.
 */
export function buildBumperBar(crossW, crossH, length, radius, roundOpts) {
    const shape = chamferedRectShape(crossW, crossH, radius, roundOpts)
    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: length,
        bevelEnabled: false,
        curveSegments: 6,
    })
    geometry.translate(0, 0, -length / 2)
    geometry.computeVertexNormals()
    return geometry
}

/**
 * The stanchion, in two parts: a padded lower body and a metal upper.
 *
 * Both are side profiles extruded across the floor, because the elbow where the
 * column turns into the cantilever arm cannot be made from stacked boxes and is
 * most of what makes the silhouette recognisable.
 *
 * Local space: origin at the column's court-facing face on the floor, +X toward
 * centre court, Y up. Hoop rotates the whole group for the near basket.
 *
 * The court-facing face runs dead vertical to the floor. An earlier version
 * splayed out into a foot at the base, which read as a plinth rather than as
 * upholstery — real padding is a flat slab you could run into.
 */

/** The padded body: floor to the top of the padding, mass toward the back. */
export function buildStanchionPad() {
    const s = STANCHION
    const front = -s.panelThickness
    const shape = new THREE.Shape()

    shape.moveTo(front, 0)
    shape.lineTo(front, s.padTop)
    shape.lineTo(front - s.columnDepth, s.padTop)
    shape.lineTo(front - s.columnDepth, 2.6)
    shape.lineTo(front - s.baseBack, 1.15)
    shape.lineTo(front - s.baseBack, 0)
    shape.closePath()

    return extrude(shape, s.bodyWidth, s.padBevel)
}

/**
 * The panel on the court-facing face.
 *
 * Inset slightly on every side so a seam shows around it, which is what reads
 * as a six-inch pad wrapped onto a frame rather than a solid block of colour.
 */
export function buildStanchionPanel() {
    const s = STANCHION
    const inset = s.panelSeam
    const shape = new THREE.Shape()

    shape.moveTo(-s.panelThickness, inset)
    shape.lineTo(-s.panelThickness, s.padTop - inset)
    shape.lineTo(0, s.padTop - inset)
    shape.lineTo(0, inset)
    shape.closePath()

    return extrude(shape, s.bodyWidth - inset * 2, s.padBevel)
}

/**
 * The metal upper: column and cantilever arm, at about half the padded width.
 *
 * It starts below the top of the padding so it reads as emerging from it rather
 * than balanced on top.
 */
export function buildStanchionMetal(armReach) {
    const s = STANCHION
    const start = s.padTop - s.metalEmerge
    const shape = new THREE.Shape()

    shape.moveTo(-s.metalDepth, start)
    shape.lineTo(-s.metalDepth, s.armTop - 1.0)
    shape.lineTo(-s.metalDepth + 0.8, s.armTop)
    shape.lineTo(armReach, s.armTop)
    // The underside rises as it reaches the glass so it meets the board flush
    // with its bottom edge, rather than hanging below it as a cut-off slab.
    shape.lineTo(armReach, BACKBOARD.bottom)
    shape.lineTo(0.7, s.armBottom)
    shape.lineTo(-0.15, s.armBottom - 0.9)
    shape.lineTo(-0.15, start)
    shape.closePath()

    return extrude(shape, s.metalWidth, s.metalBevel)
}

/** Extrudes a profile across the floor, centred, with rounded edges. */
function extrude(shape, depth, bevel) {
    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 5,
        curveSegments: 1,
    })
    geometry.translate(0, 0, -(depth / 2 + bevel))
    // ExtrudeGeometry's own normals are kept. Recomputing them averages across
    // the boundary between a face and its bevel, which shades the chamfer as a
    // separate strip and reads as a seam running the length of the arm — as
    // though it were two pieces of material rather than one extrusion.
    return geometry
}
