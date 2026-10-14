import * as THREE from 'three'
import { COURT_LENGTH, COURT_WIDTH } from './constants'

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
        // `minFitX` is gone here too: cropping the ends of the floor on a
        // narrow screen was the old answer to "the court becomes a strip",
        // and it meant a phone never saw a whole court. It made no
        // difference on a desktop aspect anyway — the lerp saturated at
        // `fit[0]` by about 1.35:1 — so this only changes narrow viewports,
        // which is exactly where it was wrong.
        //
        // The scoreboard behind the benches. *Measured* off the real
        // `TextGeometry` — numerals ink 24.29ft from `SCORE_Y`, their team
        // labels sit above that and reach 35.28ft, and three digits span
        // 57.95ft so the pair reaches x = 62.98. Estimating these from the
        // size constants put the top 2ft low and the width 8ft narrow,
        // which is what was clipping the tops of the scores.
        fitTop: { y: 36, z: -38, x: 63 },
    },
    /**
     * The landing's own framing: `wide`, sitting a little higher in frame.
     *
     * A separate pose rather than a tweak to `wide`, because `wide` is also
     * what a live game settles back to between plays, and the two want
     * different things from the same floor. The landing is a title card and
     * can afford the court nearer the middle; a game needs the headroom for
     * the scoreboard standing behind the benches.
     *
     * `target.y` is the control here, not `elevation`: `solveDistance` fits
     * the four floor corners, so aiming above the floor is what pushes it
     * down the picture. Dropping it from 12 lifts the court's back edge by
     * about 40px at 1280x800 — the front edge is behind the game strip
     * either way, so the back edge is what actually reads as movement.
     */
    landing: {
        id: 'landing',
        label: 'Half court',
        elevation: 30,
        azimuth: 0,
        // `target[1]` is only a starting guess here: `framingY` below solves
        // for the aim that actually lands the court where it should be.
        target: [0, 8, 0],
        fit: [COURT_LENGTH / 2 + 2, COURT_WIDTH / 2 + 2],
        fov: 34,
        // No `minFitX`: the whole floor has to fit the width at every
        // aspect, so there is no narrow-viewport fallback that frames only
        // the middle of it.
        //
        // The JTD lockup standing behind the court, at its full unscaled
        // height — `LandingLogo` shrinks it on short viewports, so holding
        // room for the tallest case is the conservative direction.
        //
        // Measured from `logoRings`, not derived from `LOGO_HEIGHT`: that
        // constant is a scale factor on a 41-unit viewBox whose glyphs only
        // ink 17.06 of it, so reading it as a height reserved thirteen feet
        // of empty air and pushed the whole scene down the frame.
        fitTop: { y: 30, z: -38, x: 24 },
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

export const POSE_ORDER = ['wide', 'shots', 'hoop', 'overhead']

const probe = new THREE.PerspectiveCamera(34, 1, 1, 3000)
const corner = new THREE.Vector3()

/**
 * Every point a pose has to keep on screen.
 *
 * The four floor corners, plus — where a pose declares one — the top of
 * whatever stands behind the court. That second part is the whole reason
 * this exists: the landing's JTD lockup and a game's scoreboard numerals
 * are tall objects at `z = -38`, and framing only the floor placed the
 * court beautifully while pushing both of them off the top of the screen.
 * They are scene content, so they belong in the region being fitted.
 */
function fitPoints(pose) {
    const hx = pose.fit[0]
    const hz = pose.fit[1]
    const [tx, , tz] = pose.target
    const points = [
        [tx - hx, 0, tz - hz],
        [tx + hx, 0, tz - hz],
        [tx - hx, 0, tz + hz],
        [tx + hx, 0, tz + hz],
    ]
    const top = pose.fitTop
    if (top) {
        for (const x of [-top.x, 0, top.x]) points.push([x, top.y, top.z])
    }
    return points
}

/**
 * Where a pose's region lands vertically, as a fraction of frame height.
 *
 * 0 is the top edge, 0.5 dead centre. Returned alongside the distance
 * because the two are coupled: pulling back to fit a tall narrow viewport
 * changes where the floor sits, so solving one without the other gives a
 * framing that only holds at the aspect it was tuned at.
 */
function projectedBand(pose, aspect, dist, ty) {
    const elev = THREE.MathUtils.degToRad(pose.elevation)
    const azim = THREE.MathUtils.degToRad(pose.azimuth)
    const [tx, , tz] = pose.target
    const horiz = Math.cos(elev) * dist
    probe.aspect = aspect
    probe.fov = pose.fov
    probe.position.set(
        tx + Math.sin(azim) * horiz,
        Math.sin(elev) * dist,
        tz + Math.cos(azim) * horiz
    )
    probe.lookAt(tx, ty, tz)
    probe.updateProjectionMatrix()
    probe.updateMatrixWorld()
    let minY = Infinity
    let maxY = -Infinity
    let worst = 0
    for (const c of fitPoints(pose)) {
        corner.set(c[0], c[1], c[2]).project(probe)
        minY = Math.min(minY, corner.y)
        maxY = Math.max(maxY, corner.y)
        worst = Math.max(worst, Math.abs(corner.x), Math.abs(corner.y))
    }
    // NDC runs +1 at the top; screen fraction runs 0 at the top.
    return { centreFraction: 0.5 - (minY + maxY) / 4, worst }
}

/**
 * The aim height that puts the region's centre at `pose.framingY`.
 *
 * Bisected rather than derived: the camera's own height is a function of
 * distance and elevation and does *not* follow `target[1]`, so changing the
 * aim pitches the camera rather than translating it, and the relationship
 * between aim height and screen position is not the straight line it looks
 * like. Aiming higher puts the floor lower in frame, which is monotonic,
 * and that is all bisection needs.
 */
function solveTargetY(pose, aspect, dist) {
    let lo = -60
    let hi = 90
    for (let i = 0; i < 24; i += 1) {
        const mid = (lo + hi) / 2
        if (projectedBand(pose, aspect, dist, mid).centreFraction < pose.framingY) lo = mid
        else hi = mid
    }
    return (lo + hi) / 2
}

/**
 * Share of the free band left as air, split evenly above and below.
 *
 * Small on purpose. This is subtracted from a band that is *already* the
 * screen minus the overlay, so it compounds: at 16% the content came out
 * about four fifths the size it could have been and the court read as a
 * postage stamp on a laptop. The job here is a visible margin, not a
 * proportion of the layout.
 */
const AIR = 0.12

/**
 * Distance and aim that frame a pose's region at the given aspect.
 *
 * The two are solved together, alternating, because each moves the other:
 * pulling back to fit a narrow viewport shifts where the floor sits, and
 * re-aiming to place the floor changes what has to fit.
 *
 * `topFraction` and `bottomFraction` are the shares of the frame already
 * spoken for: the site's own nav floating across the top, and the game
 * strip or score bug along the bottom. The scene is framed into the band
 * between them rather than into the whole frame, which is the only version
 * of this that holds across devices — those two are a roughly fixed number
 * of pixels, so together they are a third of a laptop's height and three
 * quarters of a landscape phone's. One tuned pair of numbers cannot be
 * right for both, and picking one drove the court either underneath an
 * overlay or down to a third of the width it could have used.
 */
export function solveFraming(pose, aspect, { topFraction = 0, bottomFraction = 0 } = {}) {
    const band = 1 - topFraction - bottomFraction
    const free = Math.min(Math.max(band, 0.28), 1)
    const fillX = pose.fill ?? 0.95
    if (pose.fitTop == null || pose.fitRadius) {
        return { dist: solveDistance(pose, aspect, fillX), targetY: pose.target[1] }
    }
    // The content gets the free band less its margins; the aim centres it
    // in that band, which is what puts matching air above and below.
    const fillY = free * (1 - AIR)
    // Centred in the band, which is what puts matching air above and below.
    const framingY = topFraction + free / 2
    const posed = { ...pose, framingY }

    let dist = solveDistance(posed, aspect, fillX, fillY)
    let targetY = pose.target[1]
    for (let round = 0; round < 4; round += 1) {
        const withAim = { ...posed, target: [pose.target[0], targetY, pose.target[2]] }
        targetY = solveTargetY(withAim, aspect, dist)
        dist = solveDistance({ ...withAim, target: [pose.target[0], targetY, pose.target[2]] }, aspect, fillX, fillY)
    }
    return { dist, targetY }
}

/**
 * Distance that frames a pose's region at the given aspect.
 *
 * Solved by projecting the corners and pulling back until the worst one lands
 * inside the frame, because at a shallow rake the near corners are far closer
 * than the centre and a centre-plane solve undershoots badly.
 */
export function solveDistance(pose, aspect, fill = 0.95, fillY = fill) {
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

    const [tx, ty, tz] = pose.target
    const corners = fitPoints(pose)

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

        let worstX = 0
        let minY = Infinity
        let maxY = -Infinity
        for (const c of corners) {
            corner.set(c[0], c[1], c[2]).project(probe)
            worstX = Math.max(worstX, Math.abs(corner.x))
            minY = Math.min(minY, corner.y)
            maxY = Math.max(maxY, corner.y)
        }
        /*
          Horizontally the content is centred, so its distance from the
          middle is what has to fit. Vertically it is deliberately *not* —
          `framingY` pushes it up, clear of the overlay along the bottom —
          so the thing to measure is how tall it is, not how far the far
          edge sits from the centre of the screen. Measuring |y| here was a
          real bug: it treated the vertical budget as a band around the
          middle of the frame, so offsetting the content upward made the
          solve pull back as if it had grown, and the court came out about
          half the size it could have been.
        */
        const spanY = (maxY - minY) / 2
        dist *= Math.max(worstX / fill, spanY / fillY)
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
