import * as THREE from 'three'

/**
 * Where the court is, in a capture that never recorded one.
 *
 * The lab gave us 75 markers in millimetres with Z up, and nothing else —
 * no court outline, no net, not even which way the player was facing in the
 * room. Everything here is reconstructed from the motion itself, following
 * the handoff's placement notes, and it is **approximate by construction**:
 * the real lab's court orientation is not in the data.
 *
 * Three anchors do the work:
 *
 * - **Forward** is `fwd`, the direction the serve was struck, worked out in
 *   the pipeline by turning the court until the recorded landing spot lies
 *   along the racket's horizontal swing direction at contact. That came out
 *   as a 5.7 degree rotation.
 * - **The baseline** sits 4 cm in front of where the tossing toe stood at
 *   frame 0, which is as close to "toes behind the line" as a serve gets.
 * - **The centre mark** is half a metre to the player's left, because the
 *   paper says the players stood 50 cm right of it.
 *
 * Keep this module free of three.js scene objects: it answers "where", and
 * `ServeArena` answers "what it looks like".
 */

const UP = new THREE.Vector3(0, 1, 0)

/** Court dimensions, in metres. These are the rules, not measurements. */
export const COURT = {
    /** Doubles sideline. The singles line is 4.115. */
    HALF_WIDTH: 5.485,
    HALF_SINGLES: 4.115,
    LENGTH: 23.77,
    /** Service line, from the baseline. The net is at 11.885. */
    SERVICE_LINE: 5.485,
    NET_DISTANCE: 11.885,
    /** The net runs 6.4 either side: 1.07 at the posts, 0.914 in the middle. */
    NET_HALF: 6.4,
    NET_POST_HEIGHT: 1.07,
    NET_CENTRE_HEIGHT: 0.914,
}

/**
 * Run-off, sized roughly like Arthur Ashe Stadium.
 *
 * Approximate: official figures for it are not published anywhere I could
 * find. For scale, the ITF minimum for international play is 6.4 m behind
 * and 3.66 m beside, so this is a generous show court rather than a
 * regulation minimum.
 */
export const RUNOFF_BASELINE = 8.5
export const RUNOFF_SIDE = 5.5

/**
 * The capture's own axes, and the court built on them.
 *
 * `toWorld` is the one conversion every other module should use: the data
 * is millimetres with Z up, three.js is metres with Y up, and the origin is
 * moved to the player's starting position so the scene is built around the
 * server rather than around an arbitrary corner of the lab.
 */
export function courtFrame(data) {
    const [ox, oy] = data.start
    /*
      The floor, not the lowest marker. `ground` is the lowest point any
      marker reached; a toe marker sits on top of the shoe, so taking it as
      the court surface would float the whole figure. 25 mm is the shoe.
    */
    const ground = (data.ground - 25) / 1000

    const toWorld = (out, x, y, z) =>
        out.set((x - ox) / 1000, z / 1000, -(y - oy) / 1000)

    const forward = new THREE.Vector3(data.fwd[0], 0, -data.fwd[1]).normalize()
    const right = new THREE.Vector3().crossVectors(forward, UP).normalize()

    /*
      Where the baseline goes, so the server is not foot faulting.

      The handoff puts it 4 cm in front of the tossing toe at frame 0, which
      is as close to "toes behind the line" as a serve gets — and is wrong
      for this one. The front foot slides forward through the load, as it
      does in a pinpoint stance, and reaches 0.41 m along the court while
      still on the ground. Against a line at 0.19 m that is a foot over by
      nine inches: a fault, drawn into every frame of the page.

      So the line is placed from the motion instead. A foot that is airborne
      cannot fault, and this player leaves the ground 0.11 s before contact,
      so only grounded frames count. The baseline sits just ahead of the
      furthest any grounded foot reaches before the ball is struck.

      The lab recorded no court, so this is a reconstruction either way;
      the question is only which reconstruction is consistent with the
      player not breaking a rule while serving.
    */
    const GROUNDED = 0.045
    const FOOT_CLEARANCE = 0.03
    const scratchFoot = new THREE.Vector3()
    let furthestGrounded = -Infinity
    for (const name of ['toe_toss', 'toe_hit', 'an_toss', 'an_hit']) {
        const trackPoints = data.joints[name]
        if (!trackPoints) continue
        for (let f = 0; f <= data.events.contact; f++) {
            const k = f * 3
            toWorld(scratchFoot, trackPoints[k], trackPoints[k + 1], trackPoints[k + 2])
            if (scratchFoot.y - ground > GROUNDED) continue
            furthestGrounded = Math.max(furthestGrounded, scratchFoot.dot(forward))
        }
    }

    const toe0 = toWorld(new THREE.Vector3(), data.toeToss0[0], data.toeToss0[1], 0)
    const baselineAt = Number.isFinite(furthestGrounded)
        ? furthestGrounded + FOOT_CLEARANCE
        : toe0.dot(forward) + 0.04

    const centreMark = new THREE.Vector3()
        .addScaledVector(forward, baselineAt)
        .addScaledVector(right, -0.5)
    centreMark.y = ground

    /** The player's own starting spot, which every camera is framed around. */
    const origin = new THREE.Vector3(0, ground, 0)

    /**
     * A point on the court, in court terms: `sideways` from the centre
     * mark (+ is the player's right), `down` the court from the baseline
     * toward the net, `height` above the surface.
     */
    const courtPoint = (sideways, down, height = 0) =>
        new THREE.Vector3()
            .copy(centreMark)
            .addScaledVector(right, sideways)
            .addScaledVector(forward, down)
            .add(new THREE.Vector3(0, height, 0))

    /*
      Where the ball met the strings, in world space. Lives here because it
      is a property of this capture's geometry, and because a camera that
      wants to frame contact should aim at the measured point rather than
      at a guess above the player's feet.
    */
    const contactPoint = toWorld(
        new THREE.Vector3(), data.ball.cp[0], data.ball.cp[1], data.ball.cp[2]
    )

    return { ground, forward, right, up: UP, centreMark, origin, courtPoint, toWorld, contactPoint }
}
