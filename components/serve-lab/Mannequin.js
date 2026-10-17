import * as THREE from 'three'
import { woodSurface } from './serve-textures'

/**
 * The figure: an artist's drawing mannequin, not a person.
 *
 * A deliberate choice from the prototype, and worth keeping. The capture is
 * one anonymous player and the joint centres are solved to a few
 * millimetres, but everything about a human body *between* those joints —
 * muscle, build, face — is absent. A wooden mannequin claims exactly what
 * the data supports: here are the joints, here are the segments between
 * them, and nothing more. A realistic body would be inventing the rest.
 *
 * Limbs are lathe shapes that taper and bulge slightly, with ball joints
 * at the ends, an egg for the chest and pelvis, paddle hands and wedge
 * feet. The hitting arm is tinted warm and the tossing arm cool, so which
 * side is doing what reads at a glance.
 *
 * Posed by writing matrices directly: `matrixAutoUpdate` is off on
 * everything that moves, because the pose is computed as a basis from
 * measured vectors, not as Euler angles that three would then recompose.
 */

const WOOD = '#d4b287'
const WOOD_JOINT = '#a98352'

/*
  The arms used to be tinted, warm for the hitting side and cool for the
  tossing one, so which arm was doing what read at a glance. Dropped: a
  real mannequin is one piece of wood throughout, and the tint was the last
  thing making this one look like a diagram of a mannequin rather than one.
  Which arm is which is legible from the motion.
*/



/**
 * Segment table: proximal joint, distal joint, radius at each end, which
 * material, which twist track drives its roll (null for none), then two
 * scale factors across and along that twist, and how far down the segment
 * actually reaches.
 *
 * The forearms are the interesting rows: they take a twist source so
 * pronation shows, and they are flattened (1.18 across, 0.82 along) because
 * a forearm is not round.
 */
const SEGMENTS = [
    ['neck', 'head', 0.046, 0.042, 'body', null, 1, 1, 0.5, 0.5],
    ['neck', 'sh_hit', 0.038, 0.034, 'body', null, 1, 1, 1, 0.5],
    ['neck', 'sh_toss', 0.038, 0.034, 'body', null, 1, 1, 1, 0.5],
    ['sh_hit', 'el_hit', 0.055, 0.04, 'hit', null, 1, 1, 1, 0.42],
    ['el_hit', 'wr_hit', 0.046, 0.028, 'hit', 'hit', 1.2, 0.8, 1, 0.34],
    ['sh_toss', 'el_toss', 0.055, 0.04, 'toss', null, 1, 1, 1, 0.42],
    ['el_toss', 'wr_toss', 0.046, 0.028, 'toss', 'toss', 1.2, 0.8, 1, 0.34],
    ['hip_hit', 'kn_hit', 0.086, 0.054, 'body', null, 1, 1, 1, 0.4],
    ['kn_hit', 'an_hit', 0.062, 0.034, 'body', null, 1, 1, 1, 0.28],
    ['hip_toss', 'kn_toss', 0.086, 0.054, 'body', null, 1, 1, 1, 0.4],
    ['kn_toss', 'an_toss', 0.062, 0.034, 'body', null, 1, 1, 1, 0.28],
]

/*
  Ball joints, sized just under the limb ends that cup them. On the real
  thing the socket closes over the ball and only a band of it shows; a
  sphere larger than the limb reads as a bead threaded on a stick.
*/
const BALL_JOINTS = {
    sh_hit: 0.048, sh_toss: 0.048,
    el_hit: 0.036, el_toss: 0.036,
    wr_hit: 0.026, wr_toss: 0.026,
    hip_hit: 0.06, hip_toss: 0.06,
    kn_hit: 0.05, kn_toss: 0.05,
    an_hit: 0.034, an_toss: 0.034,
    neck: 0.042,
}

/**
 * Profiles, because a mannequin is turned, not sculpted.
 *
 * Every piece of a real wooden artist's model except the hands and feet
 * comes off a lathe, which is why none of them is a sphere and all of them
 * are surfaces of revolution. The torso is the clearest case: it is not an
 * egg but a tapered wedge, broad across the shoulders, narrowing to a
 * waist, with a separate flared pelvis below it. Modelling those as
 * ellipsoids was the single thing most responsible for the figure reading
 * as a toy rather than as the object.
 *
 * Each profile is `[height, radius]` in unit space: height runs -1 at the
 * bottom to +1 at the top, radius 0 to 1 at the widest point. That way one
 * geometry can be scaled to whatever the capture says this player's
 * shoulders and hips actually measure.
 */

/** Catmull-Rom through the control points, so the turning has no creases. */
function profileGeometry(control, { steps = 40, radial = 28 } = {}) {
    const at = (i) => control[Math.max(0, Math.min(control.length - 1, i))]
    const points = []
    for (let i = 0; i < control.length - 1; i++) {
        const [y0, r0] = at(i - 1)
        const [y1, r1] = at(i)
        const [y2, r2] = at(i + 1)
        const [y3, r3] = at(i + 2)
        const n = Math.max(2, Math.round(steps / (control.length - 1)))
        for (let k = 0; k < n; k++) {
            const t = k / n
            const t2 = t * t
            const t3 = t2 * t
            const spline = (a, b, c, d) =>
                0.5 *
                ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
            points.push(
                new THREE.Vector2(Math.max(1e-4, spline(r0, r1, r2, r3)), spline(y0, y1, y2, y3))
            )
        }
    }
    const last = control[control.length - 1]
    points.push(new THREE.Vector2(Math.max(1e-4, last[1]), last[0]))
    return new THREE.LatheGeometry(points, radial)
}

/**
 * Chest: widest just under the shoulders, tapering to the waist, with the
 * neck socket narrow at the top. Flattened front-to-back by its scale.
 */
const CHEST_PROFILE = [
    // Nearly flat across the bottom, closing only in the last 2% of its
    // height. A lathe has to return to zero radius or it leaves an open
    // disc, but doing that gradually gives the torso a tapered point that
    // meets the waist joint at a seam instead of sitting on it.
    [-1.0, 0.02], [-0.985, 0.48], [-0.93, 0.62], [-0.75, 0.68], [-0.35, 0.77],
    [0.18, 0.9], [0.56, 1.0], [0.82, 0.86], [0.96, 0.5], [1.0, 0.02],
]

/** Pelvis: narrow at the waist, flaring to the hips, rounded underneath. */
const PELVIS_PROFILE = [
    [-1.0, 0.02], [-0.9, 0.52], [-0.55, 0.84], [-0.08, 1.0],
    // Same treatment at the top, where it meets the same joint.
    [0.45, 0.94], [0.8, 0.8], [0.975, 0.58], [1.0, 0.02],
]

/** Head: an egg, widest above the middle, blunt where it meets the neck. */
const HEAD_PROFILE = [
    [-1.0, 0.02], [-0.92, 0.5], [-0.6, 0.76], [-0.1, 0.94],
    [0.35, 1.0], [0.72, 0.88], [0.93, 0.54], [1.0, 0.02],
]

/** Hands and feet: carved paddles, round at the joint, blunt at the tip. */
const PADDLE_PROFILE = [
    [-1.0, 0.02], [-0.88, 0.56], [-0.45, 0.98], [0.1, 1.0],
    [0.55, 0.78], [0.86, 0.44], [1.0, 0.02],
]

/**
 * A limb.
 *
 * Tapers from one radius to the other and swells in between, with `bulge`
 * setting where the swell sits: a shank carries its calf high, an upper arm
 * is fullest near the middle. The ends pinch in so the ball joint reads as
 * a joint rather than as a bead stuck on.
 */
function limbGeometry(radiusTop, radiusBottom, bulge = 0.5) {
    const points = []
    for (let i = 0; i <= 30; i++) {
        const y = i / 30
        const t = Math.min(1, Math.max(0, (y - 0.03) / 0.94))
        // Skew the sine so its peak lands at `bulge` rather than halfway.
        const skewed = t < bulge ? (t / bulge) * 0.5 : 0.5 + ((t - bulge) / (1 - bulge)) * 0.5
        const ease = Math.pow(Math.sin(Math.PI * skewed), 0.34)
        points.push(
            new THREE.Vector2(
                Math.max(1e-4, (radiusTop + (radiusBottom - radiusTop) * y) * ease),
                y
            )
        )
    }
    return new THREE.LatheGeometry(points, 24)
}

/**
 * @param options.joints     Which joint tracks to pose from. The comparison
 *                           serve has its own.
 * @param options.landmarks  Chest and pelvis landmark tracks, or null. The
 *                           comparison serve was exported without them, so
 *                           the torso frames fall back to the joints alone.
 * @param options.twist      Forearm twist tracks, or null for no pronation.
 * @param options.material   One material for the whole figure, for the
 *                           translucent comparison.
 */
export function buildMannequin(data, frame, sampler, options = {}) {
    const jointTracks = options.joints ?? data.joints
    const landTracks = options.landmarks === undefined ? data.land : options.landmarks
    const twistTracks = options.twist === undefined ? data.twist : options.twist
    const { forward, up } = frame
    const root = new THREE.Group()
    const disposables = []
    const track = (x) => (disposables.push(x), x)

    /*
  No `convertSRGBToLinear()` here, unlike the prototype.

  The prototype is three r147, where `ColorManagement` is off and
  `new Color('#d4b287')` stores the sRGB values untouched — so it has to
  convert explicitly. three 0.186 has colour management on by default and
  converts on assignment, so calling it again is a *second* conversion. It
  darkens and over-saturates every wood tone, which is exactly how this
  first went in: the figure came out a deep orange-brown against the
  prototype's pale tan.
*/
    const colour = (hex) => new THREE.Color(hex)
    /*
      One grain shared by every wooden part. A mannequin is turned from the
      same stock throughout, and giving each limb its own noise would read
      as four different woods bolted together.
    */
    const wood = woodSurface()
    const woodMaps = {
        map: wood.map,
        roughnessMap: wood.roughnessMap,
        normalMap: wood.normalMap,
        normalScale: new THREE.Vector2(0.16, 0.16),
    }
    const one = options.material ? track(options.material) : null
    const materials = one
        ? { body: one, joint: one, hit: one, toss: one }
        : {
              body: track(new THREE.MeshStandardMaterial({ color: colour(WOOD), roughness: 0.68, ...woodMaps })),
              joint: track(new THREE.MeshStandardMaterial({ color: colour(WOOD_JOINT), roughness: 0.62, ...woodMaps })),
              hit: track(new THREE.MeshStandardMaterial({ color: colour(WOOD), roughness: 0.62, ...woodMaps })),
              toss: track(new THREE.MeshStandardMaterial({ color: colour(WOOD), roughness: 0.62, ...woodMaps })),
          }

    // Joint and landmark positions, held across frames and rewritten in place.
    const J = {}
    for (const name of data.names) J[name] = new THREE.Vector3()
    const L = {}
    if (landTracks) for (const key of Object.keys(landTracks)) L[key] = new THREE.Vector3()

    const segmentMeshes = SEGMENTS.map((s) => {
        const mesh = new THREE.Mesh(track(limbGeometry(s[2], s[3], s[9])), materials[s[4]])
        mesh.matrixAutoUpdate = false
        mesh.castShadow = true
        root.add(mesh)
        return mesh
    })

    const jointMeshes = {}
    for (const [name, radius] of Object.entries(BALL_JOINTS)) {
        const mesh = new THREE.Mesh(track(new THREE.SphereGeometry(radius, 20, 14)), materials.joint)
        mesh.castShadow = true
        root.add(mesh)
        jointMeshes[name] = mesh
    }

    const paddleGeo = track(profileGeometry(PADDLE_PROFILE, { steps: 26, radial: 18 }))
    const headGeo = track(profileGeometry(HEAD_PROFILE, { steps: 44, radial: 32 }))
    const chestGeo = track(profileGeometry(CHEST_PROFILE, { steps: 48, radial: 32 }))
    const pelvisGeo = track(profileGeometry(PELVIS_PROFILE, { steps: 44, radial: 32 }))
    const makeShaped = (mat, geo = paddleGeo) => {
        const mesh = new THREE.Mesh(geo, mat)
        mesh.matrixAutoUpdate = false
        mesh.castShadow = true
        root.add(mesh)
        return mesh
    }
    const handHit = makeShaped(materials.hit)
    const handToss = makeShaped(materials.toss)
    const footHit = makeShaped(materials.body)
    const footToss = makeShaped(materials.body)
    const head = makeShaped(materials.body, headGeo)
    const chest = makeShaped(materials.body, chestGeo)
    const pelvis = makeShaped(materials.body, pelvisGeo)

    /*
      The waist is a ball joint like every other, not a nub.

      On the real object the torso and the hips are two turned pieces
      pinned through a sphere, and that sphere is the same family of part
      as the shoulders and hips. It was too small to read as one, and the
      two blocks either side tapered to points that met it edge-on. The
      second attempt left a torso in two pieces with a small ball wedged
      between them and the pelvis — three joints where the object has one.
      The chest now runs most of the way down and there is a single large
      ball between it and the pelvis.
    */
    const waist = new THREE.Mesh(track(new THREE.SphereGeometry(0.098, 26, 18)), materials.joint)
    waist.castShadow = true
    root.add(waist)
    /** A small nose, purely so which way the head is facing reads. */
    const nose = new THREE.Mesh(track(new THREE.ConeGeometry(0.013, 0.028, 12)), materials.body)
    root.add(nose)

    // Scratch vectors, reused every frame.
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()
    const m = new THREE.Matrix4()
    const twist = { hit: new THREE.Vector3(), toss: new THREE.Vector3() }
    const t1 = new THREE.Vector3(), t2 = new THREE.Vector3(), t3 = new THREE.Vector3()
    const bx = new THREE.Vector3(), by = new THREE.Vector3(), bz = new THREE.Vector3()
    const scratch = new THREE.Vector3()
    const YAXIS = new THREE.Vector3(0, 1, 0)
    /*
      The torso gets named vectors rather than the shared `t1..t3`
      scratches. Its pelvis centre has to survive while the chest axes are
      computed, and reusing a scratch for both silently overwrites the
      first — a figure bent at the waist, with nothing in the maths that
      looks wrong.
    */
    const pelvisCentre = new THREE.Vector3()
    const chestCentre = new THREE.Vector3()
    const pelvisUp = new THREE.Vector3()
    const chestUp = new THREE.Vector3()
    const midChest = new THREE.Vector3()
    const longAxis = new THREE.Vector3()
    const lateral = new THREE.Vector3()
    const sagittal = new THREE.Vector3()

    /**
     * A basis that points +Y from P to Q, rolled so +X follows `roll`.
     *
     * Without a roll source the reference is the court's forward direction,
     * except where the segment is nearly parallel to it — then up, since a
     * cross product with a parallel vector collapses.
     */
    const orient = (P, Q, roll, scaleX, scaleZ, length) => {
        b.subVectors(Q, P)
        const len = b.length()
        b.divideScalar(len || 1)
        if (roll) a.copy(roll)
        else a.crossVectors(b, Math.abs(b.dot(forward)) < 0.9 ? forward : up)
        a.addScaledVector(b, -a.dot(b)).normalize()
        c.crossVectors(a, b)
        m.makeBasis(a, b, c)
        m.scale(scratch.set(scaleX, length == null ? len : length, scaleZ))
        m.setPosition(P)
        return m
    }

    /** An ellipsoid at `centre`, long axis `axisY`, rolled toward `axisX`. */
    const ellipsoid = (mesh, centre, axisX, axisY, rx, ry, rz) => {
        b.copy(axisY).normalize()
        a.copy(axisX).addScaledVector(b, -axisX.dot(b)).normalize()
        c.crossVectors(a, b)
        m.makeBasis(a, b, c)
        m.scale(scratch.set(rx, ry, rz))
        m.setPosition(centre)
        mesh.matrix.copy(m)
        mesh.matrixWorldNeedsUpdate = true
    }

    /** A cylinder stretched to span two points. */
    const span = (mesh, from, to) => {
        scratch.subVectors(to, from)
        const len = scratch.length()
        mesh.position.addVectors(from, to).multiplyScalar(0.5)
        mesh.scale.set(1, len, 1)
        if (len > 0) mesh.quaternion.setFromUnitVectors(YAXIS, scratch.divideScalar(len))
    }

    /** A body frame from a sideways axis and a forward one, kept upright. */
    const bodyFrame = (lateral, fwd) => {
        bx.copy(lateral).normalize()
        bz.copy(fwd).addScaledVector(bx, -fwd.dot(bx)).normalize()
        by.crossVectors(bz, bx).normalize()
        if (by.y < 0) {
            by.negate()
            bz.negate()
        }
        bz.crossVectors(bx, by)
    }

    const placeOnFrame = (mesh, centre, rx, ry, rz) => {
        m.makeBasis(bx, by, bz)
        m.scale(scratch.set(rx, ry, rz))
        m.setPosition(centre)
        mesh.matrix.copy(m)
        mesh.matrixWorldNeedsUpdate = true
    }


    const pose = (t) => {
        for (const name of data.names) sampler.at(jointTracks[name], t, J[name])
        if (landTracks) for (const key of Object.keys(landTracks)) sampler.at(landTracks[key], t, L[key])
        if (twistTracks) {
            sampler.twistAt('hit', t, twist.hit)
            sampler.twistAt('toss', t, twist.toss)
        }

        SEGMENTS.forEach((s, i) => {
            const P = J[s[0]]
            let Q = J[s[1]]
            // The neck-to-head segment stops half way: the rest is head.
            if (s[8] !== 1) Q = t1.copy(P).lerp(Q, s[8])
            segmentMeshes[i].matrix.copy(orient(P, Q, s[5] && twistTracks ? twist[s[5]] : null, s[6], s[7]))
            segmentMeshes[i].matrixWorldNeedsUpdate = true
        })
        for (const name of Object.keys(BALL_JOINTS)) jointMeshes[name].position.copy(J[name])

        // Hands: paddles continuing the forearm, wide across the wrist.
        for (const [side, mesh] of [['hit', handHit], ['toss', handToss]]) {
            t2.subVectors(J['hand_' + side], J['wr_' + side]).normalize()
            t3.copy(J['wr_' + side]).addScaledVector(t2, 0.065)
            ellipsoid(mesh, t3, twistTracks ? twist[side] : frame.right, t2, 0.044, 0.072, 0.019)
        }

        // Feet: wedges from ankle to toe, kept level with the court.
        for (const [side, mesh] of [['hit', footHit], ['toss', footToss]]) {
            t2.subVectors(J['toe_' + side], J['an_' + side])
            const footLength = t2.length()
            t3.addVectors(J['an_' + side], J['toe_' + side])
                .multiplyScalar(0.5)
                .add(scratch.set(0, -0.012, 0))
            a.crossVectors(t2, up)
            ellipsoid(
                mesh, t3,
                a.lengthSq() > 1e-8 ? a : frame.right,
                t2, 0.046, footLength / 2 + 0.045, 0.036
            )
        }

        // ---- torso ------------------------------------------------------

        lateral.subVectors(J.hip_toss, J.hip_hit)
        const hipWidth = lateral.length()
        /*
          Facing direction for the pelvis. With the front and back hip
          landmarks it is measured; without them the court's own forward is
          a good enough stand-in, since `bodyFrame` only uses it to resolve
          the roll around an axis the hip joints already fix.
        */
        if (landTracks) {
            sagittal
                .addVectors(L.asisR, L.asisL)
                .sub(scratch.addVectors(L.psisR, L.psisL))
                .multiplyScalar(0.5)
        } else {
            sagittal.copy(frame.forward)
        }
        bodyFrame(lateral, sagittal)
        pelvisUp.copy(by)
        pelvisCentre.copy(J.pelvis).addScaledVector(by, 0.06)
        /*
          Wider than the joint centres, and deliberately so. `hipWidth` is
          the distance between the two solved hip centres, which sit inside
          the body; the pelvis of the object is wider than that, and the
          same goes for the shoulders below.

          But only a little. The first pass added 10 cm to the half-width
          and gave the figure a pelvis wider and deeper than its own chest,
          which no mannequin has: on the reference the hips are clearly
          narrower than the shoulders and the whole block is shallow.
        */
        placeOnFrame(pelvis, pelvisCentre, hipWidth / 2 + 0.055, 0.092, 0.088)

        lateral.subVectors(J.sh_toss, J.sh_hit)
        const shoulderWidth = lateral.length()
        /*
          The thorax long axis runs from the neck to an estimated mid-chest
          point, not along the IJ-to-C7 line.

          That line slopes about 50 degrees even on someone standing
          straight, and orienting the chest from it made the figure look
          badly hunched. This estimates where T8 would be — the ISB
          convention — from the depth between C7 and IJ, with no T8 marker
          to use.
        */
        if (landTracks) {
            midChest.subVectors(L.c7, L.ij).multiplyScalar(0.5).add(L.px)
        } else {
            // Neck to pelvis is the only long axis the joints alone offer.
            midChest.copy(J.pelvis).lerp(J.neck, 0.18)
        }
        longAxis.subVectors(J.neck, midChest)
        bx.copy(lateral).normalize()
        by.copy(longAxis).addScaledVector(bx, -longAxis.dot(bx)).normalize()
        bz.crossVectors(bx, by)
        chestUp.copy(by)
        const chestHeight = landTracks
            ? scratch.subVectors(J.neck, L.px).dot(by)
            : scratch.subVectors(J.neck, J.pelvis).dot(by) * 0.62
        chestCentre
            .copy(J.neck)
            .addScaledVector(by, -chestHeight / 2 - 0.085)
            .addScaledVector(bz, -0.03)
        // Reaching most of the way to the pelvis, so the ball below it is
        // the only joint between the two blocks.
        placeOnFrame(chest, chestCentre, (shoulderWidth / 2) * 0.98, chestHeight / 2 + 0.125, 0.088)

        // Between the two surfaces rather than between the two centres,
        // which is what left it floating clear of the chest above it.
        t1.copy(chestCentre).addScaledVector(chestUp, -(chestHeight / 2 + 0.125))
        t2.copy(pelvisCentre).addScaledVector(pelvisUp, 0.092)
        waist.position.addVectors(t1, t2).multiplyScalar(0.5)

        // Head, and which way it is facing.
        if (landTracks) t1.subVectors(L.headF, L.headB).normalize()
        else t1.copy(bz).normalize()
        nose.position.copy(J.head).addScaledVector(t1, 0.088)
        nose.quaternion.setFromUnitVectors(YAXIS, t1)
        t2.subVectors(J.head, J.neck)
        a.crossVectors(t2, t1)
        ellipsoid(head, J.head, a, t2, 0.079, 0.115, 0.092)
    }

    const dispose = () => {
        for (const d of disposables) d.dispose?.()
        disposables.length = 0
    }

    return { group: root, pose, joints: J, dispose }
}
