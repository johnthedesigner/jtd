import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { NET } from './hoop-spec'

/**
 * A real net, not a tapered cone.
 *
 * Twelve cords hang from the ring and cross in a diamond mesh. The diamonds
 * come from offsetting every other row by half a step, so each node sends two
 * cords down to the row below — one to each neighbour. That single offset is
 * the difference between something that reads as a net and something that
 * reads as a lampshade, which is why this is built rather than faked.
 *
 * The profile pinches: nets narrow fast just under the ring, then hang nearly
 * straight, so the radius is eased rather than interpolated linearly.
 */
export function buildNetGeometry({
    topRadius = NET.topRadius,
    bottomRadius = NET.bottomRadius,
    length = NET.length,
    strands = NET.strands,
    rows = NET.rows,
    cordRadius = NET.cordRadius,
} = {}) {
    const step = (Math.PI * 2) / strands

    const nodeAt = (row, index) => {
        const t = row / rows
        // Most of the taper happens in the first third of the drop.
        const eased = 1 - Math.pow(1 - t, 2.2)
        const radius = THREE.MathUtils.lerp(topRadius, bottomRadius, eased)
        const angle = (index + (row % 2) * 0.5) * step
        return new THREE.Vector3(
            Math.cos(angle) * radius,
            -t * length,
            Math.sin(angle) * radius
        )
    }

    const up = new THREE.Vector3(0, 1, 0)
    const parts = []

    const addCord = (a, b) => {
        const dir = new THREE.Vector3().subVectors(b, a)
        const len = dir.length()
        if (len < 1e-5) return
        const geo = new THREE.CylinderGeometry(cordRadius, cordRadius, len, 5, 1, true)
        const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize())
        geo.applyQuaternion(quat)
        geo.translate(
            (a.x + b.x) / 2,
            (a.y + b.y) / 2,
            (a.z + b.z) / 2
        )
        parts.push(geo)
    }

    for (let row = 0; row < rows; row++) {
        for (let i = 0; i < strands; i++) {
            const from = nodeAt(row, i)
            // Two cords per node, to each neighbour on the row below. On an
            // offset row those land half a step either side, forming diamonds.
            addCord(from, nodeAt(row + 1, i))
            addCord(from, nodeAt(row + 1, row % 2 === 0 ? i - 1 : i + 1))
        }
    }

    // The hem: a hoop of cord around the open bottom, as on a real net.
    const hemY = -length
    const hemRadius = bottomRadius
    for (let i = 0; i < strands; i++) {
        const a0 = (i + (rows % 2) * 0.5) * step
        const a1 = (i + 1 + (rows % 2) * 0.5) * step
        addCord(
            new THREE.Vector3(Math.cos(a0) * hemRadius, hemY, Math.sin(a0) * hemRadius),
            new THREE.Vector3(Math.cos(a1) * hemRadius, hemY, Math.sin(a1) * hemRadius)
        )
    }

    const merged = mergeGeometries(parts, false)
    parts.forEach((g) => g.dispose())
    merged.computeVertexNormals()
    return merged
}
