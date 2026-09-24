import * as THREE from 'three'
import { COURT_HALF, COURT_WIDTH } from './constants'
import { STANCHION } from './hoop-spec'
import { CHAIR } from './chair-geometry'

/**
 * Where everything beyond the court itself goes, in feet, off the same
 * origin as the court. All of it is measured out from the boundary lines the
 * way a real building is: chairs set back from the line, tables at half
 * court, a stepped bowl beyond that with enough clearance that no row ever
 * has to duck around a table.
 */

export const TABLE = {
    length: 22,
    depth: 2.3,
    height: 2.5,
    topThickness: 0.1,
    panelInset: 0.08,
    legSize: 0.12,
}

export const SIDELINE = {
    /** Front edge of the first row, off the sideline. */
    setback: COURT_HALF[1] + 6,
    /** Rows run the full length of the sideline, corner to corner. */
    maxX: COURT_HALF[0] + 1,
    blockGap: 1.6,
    rows: 2,
}

export const BASELINE = {
    /** Front edge of the first row, off the baseline — deeper than the
     *  sideline setback, clearing the stanchion's own footprint. */
    setback: COURT_HALF[0] + 8,
    rows: 5,
    /** Half-gap left empty directly behind the basket, both sides. */
    stanchionClearance: STANCHION.bodyWidth / 2 + 0.8,
    /** How far the rows reach across, in from centre. */
    zReach: COURT_WIDTH / 2 + 3,
}

export const ROW_PITCH = 3

/**
 * Tunnel mouths: past the outer end of both the home and away bench blocks,
 * outside the corner of the court, cutting out through the bowl at a
 * diagonal — not along the sideline at all, which is why the chair rows
 * themselves run straight through to the corner with no break in them. Only
 * on the bench/scorer's side (opposite the camera), where real benches are.
 */
export const TUNNEL = {
    /** How wide a slice of each corner's 90-degree arc opens up, centred on
     *  the diagonal — in units of that corner's arc segments. */
    cornerArcHalfWidth: 2,
    /** How many bowl rows the opening cuts through before the bowl closes
     *  back up overhead, the way a real tunnel is a cut through the lower
     *  rows only. */
    bowlRows: 3,
}

export const BOWL = {
    rows: 20,
    treadDepth: 2.6,
    riserHeight: 1.35,
    /** Inner edge of row 0 — outside every floor-level chair and table, with
     *  a walkway's worth of clearance to spare. */
    baseHalfX: 70,
    baseHalfZ: 37,
    cornerRadius: 14,
    /** The tunnel gaps live inside the corner arcs, so those carry the
     *  resolution — straight runs need only their two tangent points. */
    cornerSegments: 12,
    edgeSegments: 1,
}

/** Yaw (radians) that turns local +Z (a chair's "front") to face `(dx, dz)`. */
function yawFacing(dx, dz) {
    return Math.atan2(dx, dz)
}

/** Five rows either side of both stanchions, clear of the stanchion itself. */
export function buildBaselineChairPlacements() {
    const out = []
    const { setback, rows, stanchionClearance, zReach } = BASELINE
    for (const end of [-1, 1]) {
        const yaw = yawFacing(-end, 0)
        for (let r = 0; r < rows; r++) {
            const x = end * (setback + r * ROW_PITCH)
            for (const sign of [-1, 1]) {
                let z = sign * (stanchionClearance + CHAIR.spacing / 2)
                while (Math.abs(z) <= zReach) {
                    out.push({ position: [x, 0, z], yaw })
                    z += sign * CHAIR.spacing
                }
            }
        }
    }
    return out
}

/**
 * Two rows on each sideline, running corner to corner past the table — the
 * table interrupts the middle, nothing else does. The tunnels are outside
 * this entirely, past the corner (see `buildArenaBowlGeometry`).
 */
export function buildSidelineChairPlacements() {
    const out = []
    const { setback, blockGap, rows, maxX } = SIDELINE
    const halfTable = TABLE.length / 2
    for (const side of [-1, 1]) {
        const yaw = yawFacing(0, -side)
        for (let row = 0; row < rows; row++) {
            const z = side * (setback + row * ROW_PITCH)
            for (const dir of [-1, 1]) {
                let x = dir * (halfTable + blockGap + CHAIR.spacing / 2)
                while (Math.abs(x) <= maxX) {
                    out.push({ position: [x, 0, z], yaw })
                    x += dir * CHAIR.spacing
                }
            }
        }
    }
    return out
}

/** The scorer's table (bench side) and the commentary table (camera side). */
export function buildTablePlacements() {
    return [-1, 1].map((side) => ({
        position: [0, 0, side * SIDELINE.setback],
        yaw: yawFacing(0, -side),
    }))
}

/**
 * A rounded-rectangle outline, sampled into points that each carry their own
 * outward normal — on the straight runs that is a fixed axis, on the corners
 * it is the arc's own radial direction, and the two agree exactly at each
 * tangent point. That is what makes growing this by a constant offset (see
 * `buildArenaBowlGeometry`) trace a second rounded rectangle with the same
 * corner style rather than distorting it.
 *
 * Straight runs carry `edgeSegs` intermediate points too, tagged with a
 * cardinal name; arc points are tagged with which of the four corners they
 * belong to (0: +X+Z, 1: -X+Z, 2: -X-Z, 3: +X-Z) and their index within that
 * corner's sweep, 0 at one tangent to `arcSegs - 1` approaching the other —
 * corners 2 and 3 are where the tunnel gaps get cut, centred on each corner's
 * diagonal midpoint.
 */
export function roundedRectOutline(halfX, halfZ, cornerR, arcSegs, edgeSegs = 1) {
    const pts = []
    const addArc = (cx, cz, a0, corner) => {
        for (let i = 0; i < arcSegs; i++) {
            const a = a0 + (Math.PI / 2) * (i / arcSegs)
            const nx = Math.cos(a)
            const nz = Math.sin(a)
            pts.push({ x: cx + nx * cornerR, z: cz + nz * cornerR, nx, nz, edge: null, corner, arcIndex: i })
        }
    }
    const addEdge = (x0, z0, x1, z1, nx, nz, edge) => {
        for (let i = 0; i < edgeSegs; i++) {
            const t = i / edgeSegs
            pts.push({ x: x0 + (x1 - x0) * t, z: z0 + (z1 - z0) * t, nx, nz, edge, corner: null, arcIndex: null })
        }
    }

    const ix = halfX - cornerR
    const iz = halfZ - cornerR

    addArc(ix, iz, 0, 0)
    addEdge(ix, halfZ, -ix, halfZ, 0, 1, 'camera')
    addArc(-ix, iz, Math.PI / 2, 1)
    addEdge(-halfX, iz, -halfX, -iz, -1, 0, 'endA')
    addArc(-ix, -iz, Math.PI, 2)
    addEdge(-ix, -halfZ, ix, -halfZ, 0, -1, 'bench')
    addArc(ix, -iz, Math.PI * 1.5, 3)
    addEdge(halfX, -iz, halfX, iz, 1, 0, 'endB')

    return pts
}

/**
 * The permanent bowl: a simplified stepped ring, one mesh, built by growing
 * the base outline outward and upward one row at a time. Riser faces point
 * inward, toward the court — the only side any camera in this scene ever
 * stands where it could see — and the material is set double-sided anyway,
 * since getting a hand-rolled ring's winding exactly right the first time
 * everywhere is not worth the risk for a background shape this simplified.
 *
 * Corners 2 and 3 — the two bench-side corners, each where a straight run
 * meets a baseline-end run — drop the quads inside a wedge centred on that
 * corner's diagonal, for the lower rows only. That is what makes the opening
 * a tunnel cut out through the corner at an angle, past the end of the bench
 * blocks, rather than a break along the sideline itself.
 */
export function buildArenaBowlGeometry() {
    const base = roundedRectOutline(
        BOWL.baseHalfX,
        BOWL.baseHalfZ,
        BOWL.cornerRadius,
        BOWL.cornerSegments,
        BOWL.edgeSegments
    )
    const n = base.length
    const mid = (BOWL.cornerSegments - 1) / 2
    const gapIndex = base.map(
        (p) =>
            (p.corner === 2 || p.corner === 3) &&
            Math.abs(p.arcIndex - mid) <= TUNNEL.cornerArcHalfWidth
    )

    const positions = []
    const normals = []
    const indices = []
    let vi = 0

    const ringAt = (offset, y) => base.map((p) => [p.x + p.nx * offset, y, p.z + p.nz * offset])

    const pushQuadRing = (ringA, ringB, normalFn, skipGap) => {
        const start = vi
        for (let i = 0; i < n; i++) {
            positions.push(...ringA[i])
            normals.push(...normalFn(i))
            vi++
        }
        for (let i = 0; i < n; i++) {
            positions.push(...ringB[i])
            normals.push(...normalFn(i))
            vi++
        }
        for (let i = 0; i < n; i++) {
            if (skipGap && (gapIndex[i] || gapIndex[(i + 1) % n])) continue
            const a0 = start + i
            const a1 = start + ((i + 1) % n)
            const b0 = start + n + i
            const b1 = start + n + ((i + 1) % n)
            indices.push(a0, b0, a1, a1, b0, b1)
        }
    }

    const inwardNormal = (i) => [-base[i].nx, 0, -base[i].nz]
    const upNormal = () => [0, 1, 0]

    for (let row = 0; row < BOWL.rows; row++) {
        const innerOffset = row * BOWL.treadDepth
        const outerOffset = (row + 1) * BOWL.treadDepth
        const y0 = row * BOWL.riserHeight
        const y1 = (row + 1) * BOWL.riserHeight
        const skipGap = row < TUNNEL.bowlRows

        pushQuadRing(ringAt(innerOffset, y0), ringAt(innerOffset, y1), inwardNormal, skipGap)
        pushQuadRing(ringAt(innerOffset, y1), ringAt(outerOffset, y1), upNormal, skipGap)
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geometry.setIndex(indices)
    return geometry
}
