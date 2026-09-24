import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * A metal folding chair, open and ready to sit in, at real dimensions (feet).
 * Built from primitives rather than loaded from a model: hundreds of these
 * stand around the floor, and merged into one geometry they cost a single
 * InstancedMesh draw call, where a rigged, skinned import (see chair.gltf,
 * the reference this was checked against) would cost a skeleton evaluation
 * per instance for a pose that never animates here.
 *
 * Local space: origin at floor centre of the footprint, +Y up, +Z the
 * direction a seated person's toes point. Placement rotates this to face
 * whichever way a given seat actually looks.
 */
export const CHAIR = {
    seatWidth: 1.5,
    seatDepth: 1.3,
    seatThickness: 0.08,
    seatHeight: 1.5,
    backHeight: 1.15,
    backThickness: 0.07,
    legRadius: 0.045,
    /** Centre-to-centre spacing along a row. */
    spacing: 1.9,
}

export function buildFoldingChairGeometry() {
    const c = CHAIR
    const parts = []

    const box = (w, h, d, cx, cy, cz, rx = 0, ry = 0, rz = 0) => {
        const g = new THREE.BoxGeometry(w, h, d)
        if (rx) g.rotateX(rx)
        if (ry) g.rotateY(ry)
        if (rz) g.rotateZ(rz)
        g.translate(cx, cy, cz)
        parts.push(g)
    }

    const tube = (r, h, cx, cy, cz, rx = 0, rz = 0) => {
        const g = new THREE.CylinderGeometry(r, r, h, 6)
        if (rx) g.rotateX(rx)
        if (rz) g.rotateZ(rz)
        g.translate(cx, cy, cz)
        parts.push(g)
    }

    const hw = c.seatWidth / 2
    const frontZ = c.seatDepth / 2
    const backZ = -c.seatDepth / 2
    const legInset = c.legRadius + 0.03

    // Seat.
    box(c.seatWidth, c.seatThickness, c.seatDepth, 0, c.seatHeight, 0)

    // Backrest, standing off the rear of the seat, plus a top rail closing
    // the frame the way a stamped-metal chair back actually reads.
    box(
        c.seatWidth,
        c.backHeight,
        c.backThickness,
        0,
        c.seatHeight + c.backHeight / 2,
        backZ + c.backThickness / 2
    )
    box(
        c.seatWidth,
        0.06,
        c.backThickness * 1.4,
        0,
        c.seatHeight + c.backHeight,
        backZ + c.backThickness / 2
    )

    // Front legs, splayed slightly outward the way a real tube frame is.
    for (const side of [-1, 1]) {
        tube(
            c.legRadius,
            c.seatHeight,
            side * (hw - legInset) + side * 0.08,
            c.seatHeight / 2,
            frontZ - legInset,
            0,
            side * 0.1
        )
    }

    // Rear legs: a vertical run to the seat, then a second, tilted segment
    // continuing up as the backrest's own support — one continuous tube on
    // a real chair, modelled here as two for a simple splice.
    for (const side of [-1, 1]) {
        tube(c.legRadius, c.seatHeight, side * (hw - legInset), c.seatHeight / 2, backZ + legInset)
        const riseLen = Math.hypot(c.backHeight, c.backThickness * 1.5)
        tube(
            c.legRadius,
            riseLen,
            side * (hw - legInset),
            c.seatHeight + c.backHeight / 2,
            backZ + c.backThickness * 0.4,
            -0.35
        )
    }

    // Front stretcher, the brace bar folding chairs run under the seat.
    tube(
        c.legRadius * 0.85,
        c.seatWidth - legInset * 2,
        0,
        c.seatHeight * 0.32,
        frontZ - legInset,
        0,
        Math.PI / 2
    )

    const merged = mergeGeometries(parts)
    for (const g of parts) g.dispose()
    return merged
}
