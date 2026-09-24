import * as THREE from 'three'
import { COURT_LENGTH, COURT_WIDTH } from './constants'
import { BALL_POSITION, BALL_VIEW_AZIMUTH, BALL_VIEW_ELEVATION } from './Basketball'

/**
 * Named camera poses.
 *
 * Each pose says what it wants framed rather than where the camera goes, so
 * the rig can solve distance per aspect instead of hardcoding one that only
 * works at 16:9. `fit` is the half-extent, in feet, of the region to keep in
 * frame, centred on `target`.
 *
 * This replaces the single locked rake the scene started with. Overlays will
 * each declare a pose, so the set is expected to grow.
 */
export const POSES = {
    wide: {
        id: 'wide',
        label: 'Half court',
        elevation: 30,
        azimuth: 0,
        target: [0, 12, 0],
        fit: [COURT_LENGTH / 2 + 2, COURT_WIDTH / 2 + 2],
        fov: 34,
        // Narrow viewports frame the middle of the floor rather than pulling
        // back until the court is a strip.
        minFitX: 30,
    },
    hoop: {
        id: 'hoop',
        label: 'Basket',
        elevation: 22,
        // Off-axis and on the court side of the baseline, so the shot sees the
        // face of the glass and the net rather than the back of the stanchion.
        azimuth: -60,
        // Aimed below the rim: centring on the basket frames mostly dark air,
        // and the floor under it is the half that carries the context.
        target: [37, 5, 0],
        fitRadius: 16,
        fov: 38,
    },
    shots: {
        id: 'shots',
        // Not "Shot map": that is the overlay toggle, and two controls with
        // the same name sitting a row apart is a coin flip for the user.
        label: 'Shot angle',
        // Lower than the half-court rake: these are vertical objects, and the
        // whole point of the form is the height, which an overhead view flattens
        // away entirely.
        elevation: 26,
        azimuth: -22,
        target: [22, 3, 0],
        fit: [30, 27],
        fov: 34,
        minFitX: 24,
    },
    overhead: {
        id: 'overhead',
        label: 'Overhead',
        elevation: 65,
        azimuth: 0,
        target: [0, 10, 10],
        fit: [COURT_LENGTH / 2 + 2, COURT_WIDTH / 2 + 2],
        fov: 34,
        minFitX: 30,
    },
    dfence: {
        id: 'dfence',
        label: 'D-Fence',
        // Lower than the half-court rake and in tight — a seat-level look at
        // the two spots the show actually drops onto, not a framing of the
        // whole floor.
        elevation: 14,
        azimuth: 0,
        target: [0, 4, 6],
        fit: [17, 13],
        fov: 36,
    },
    celebration: {
        id: 'celebration',
        label: 'Celebrate',
        elevation: 24,
        azimuth: 0,
        target: [0, 2, 0],
        fit: [COURT_LENGTH / 2 + 4, COURT_WIDTH / 2 + 4],
        fov: 38,
        minFitX: 30,
        // Degrees per second the camera keeps orbiting once it arrives —
        // every other pose is a fixed spot; this is the one place the rig
        // itself keeps moving on its own.
        orbitSpeed: 6,
    },
}

/**
 * Down at floor level beside the ball.
 *
 * `fitRadius` rather than `fit`: the subject is a sphere less than a foot
 * across, and the rectangular floor-corner solve assumes the thing being
 * framed lies flat at y=0, which badly misjudges anything standing up. A
 * long lens and a low eye keep the court behind it compressed and shallow,
 * which is what puts it out of focus.
 */
POSES.ball = {
    id: 'ball',
    label: 'Ball',
    elevation: BALL_VIEW_ELEVATION,
    azimuth: BALL_VIEW_AZIMUTH,
    target: [BALL_POSITION[0], BALL_POSITION[1], BALL_POSITION[2]],
    fitRadius: 0.82,
    fov: 30,
}

export const POSE_ORDER = ['wide', 'shots', 'hoop', 'overhead', 'ball']

const probe = new THREE.PerspectiveCamera(34, 1, 1, 3000)
const corner = new THREE.Vector3()

/**
 * Distance that frames a pose's region at the given aspect.
 *
 * Solved by projecting the corners and pulling back until the worst one lands
 * inside the frame, because at a shallow rake the near corners are far closer
 * than the centre and a centre-plane solve undershoots badly.
 */
export function solveDistance(pose, aspect, fill = 0.95) {
    // A pose aimed at something off the floor (a basket, not a region of
    // court) frames a sphere instead: the floor-corner solve assumes the
    // subject lies at y=0 and badly misjudges anything standing up.
    if (pose.fitRadius) {
        const vfov = THREE.MathUtils.degToRad(pose.fov)
        const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect)
        return pose.fitRadius / Math.sin(Math.min(vfov, hfov) / 2)
    }

    const elev = THREE.MathUtils.degToRad(pose.elevation)
    const azim = THREE.MathUtils.degToRad(pose.azimuth)

    const t = THREE.MathUtils.clamp((aspect - 0.62) / (1.35 - 0.62), 0, 1)
    const hx = THREE.MathUtils.lerp(pose.minFitX ?? pose.fit[0], pose.fit[0], t)
    const hz = pose.fit[1]
    const [tx, ty, tz] = pose.target

    const corners = [
        [tx - hx, 0, tz - hz],
        [tx + hx, 0, tz - hz],
        [tx - hx, 0, tz + hz],
        [tx + hx, 0, tz + hz],
    ]

    let dist = 120
    probe.aspect = aspect
    probe.fov = pose.fov

    for (let pass = 0; pass < 8; pass++) {
        const horiz = Math.cos(elev) * dist
        probe.position.set(
            tx + Math.sin(azim) * horiz,
            Math.sin(elev) * dist,
            tz + Math.cos(azim) * horiz
        )
        probe.lookAt(tx, ty, tz)
        probe.updateProjectionMatrix()
        probe.updateMatrixWorld()

        let worst = 0
        for (const c of corners) {
            corner.set(c[0], c[1], c[2]).project(probe)
            worst = Math.max(worst, Math.abs(corner.x), Math.abs(corner.y))
        }
        dist *= worst / fill
    }

    return dist
}

/** Writes a pose's camera position into `out`, at `dist`, with a yaw/lift offset. */
export function posePosition(pose, dist, yawOffset, liftOffset, out) {
    const elev = THREE.MathUtils.degToRad(pose.elevation) + liftOffset
    const azim = THREE.MathUtils.degToRad(pose.azimuth) + yawOffset
    const horiz = Math.cos(elev) * dist
    return out.set(
        pose.target[0] + Math.sin(azim) * horiz,
        Math.sin(elev) * dist,
        pose.target[2] + Math.cos(azim) * horiz
    )
}
