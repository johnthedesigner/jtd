import * as THREE from 'three'
import { RACKET } from './serve-frame'
import { PALETTE } from './palette'

/**
 * The things a chapter draws on top of the serve.
 *
 * Every annotation is built once and hidden; a chapter names the ones it
 * wants. Building on demand would mean allocating geometry during a camera
 * move, which is the one moment in this page where a frame drop is
 * obvious.
 *
 * They exist because a claim about a serve is only worth making if you can
 * point at the thing that proves it. "The drop is an elbow fold" is an
 * assertion; an arc drawn in the elbow that folds to 50 degrees and throws
 * back out to 170 is the evidence.
 */

/*
  Drawn from the scene's own two hues. What the racket is doing is orange,
  like the racket; what the body is doing is cyan, like the court. Where a
  pair has to be told apart — the face a frame either side of contact —
  they take one of each, which is the widest separation the palette has.
*/
const INK = {
    path: PALETTE.orangeLine,
    angle: PALETTE.orangeLine,
    hip: PALETTE.cyanBright,
    shoulder: PALETTE.orangeLine,
    early: PALETTE.orangeLine,
    late: PALETTE.orangeLine,
}

const colour = (hex) => new THREE.Color(hex)

/** A tube along a polyline, which reads at distance where a line does not. */
function tube(points, radius, material) {
    return new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), Math.max(8, points.length * 2), radius, 6, false),
        material
    )
}

export function buildAnnotations(data, frame, sampler, racketAt, joints) {
    const root = new THREE.Group()
    const disposables = []
    const track = (x) => (disposables.push(x), x)
    const groups = {}
    const updaters = {}

    const mat = (hex, opts = {}) =>
        track(new THREE.MeshBasicMaterial({ color: colour(hex), transparent: true, opacity: 0.9, ...opts }))

    const add = (name, object, update) => {
        object.visible = false
        root.add(object)
        groups[name] = object
        if (update) updaters[name] = update
    }

    // ---- the racket head's path through the whole swing -----------------
    {
        const pts = []
        for (let f = 0; f <= data.recLast; f += 2) pts.push(racketAt(f).centre.clone())
        const g = new THREE.Group()
        g.add(tube(pts, 0.008, mat(INK.path, { opacity: 0.55 })))
        add('headPath', g)
    }

    // ---- the elbow angle, drawn as an arc in the joint ------------------
    {
        const SEGMENTS = 24
        const positions = new Float32Array((SEGMENTS + 1) * 3)
        const geo = track(new THREE.BufferGeometry())
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        const line = new THREE.Line(geo, track(new THREE.LineBasicMaterial({ color: colour(INK.angle), transparent: true, opacity: 0.95 })))
        line.frustumCulled = false
        const a = new THREE.Vector3(), b = new THREE.Vector3(), n = new THREE.Vector3(), v = new THREE.Vector3()
        add('elbowArc', line, () => {
            const e = joints.el_hit
            a.subVectors(joints.sh_hit, e).normalize()
            b.subVectors(joints.wr_hit, e).normalize()
            n.crossVectors(a, b)
            if (n.lengthSq() < 1e-9) return
            n.normalize()
            const total = Math.acos(Math.min(1, Math.max(-1, a.dot(b))))
            // Radius scales with the angle so a tight fold still reads.
            const r = 0.075 + 0.05 * (total / Math.PI)
            for (let i = 0; i <= SEGMENTS; i++) {
                v.copy(a).applyAxisAngle(n, (total * i) / SEGMENTS).multiplyScalar(r).add(e)
                positions.set([v.x, v.y, v.z], i * 3)
            }
            geo.attributes.position.needsUpdate = true
        })
    }

    // ---- hip line and shoulder line, for the separation ------------------
    {
        const bar = (hex) => {
            const m = new THREE.Mesh(
                track(new THREE.CylinderGeometry(0.016, 0.016, 1, 10)),
                mat(hex, { opacity: 0.95, depthTest: false })
            )
            m.renderOrder = 10
            return m
        }
        const hips = bar(INK.hip)
        const shoulders = bar(INK.shoulder)
        const g = new THREE.Group()
        g.add(hips, shoulders)
        const Y = new THREE.Vector3(0, 1, 0)
        const d = new THREE.Vector3(), p0 = new THREE.Vector3(), p1 = new THREE.Vector3()
        const span = (mesh, from, to, extend) => {
            d.subVectors(to, from).normalize()
            p0.copy(from).addScaledVector(d, -extend)
            p1.copy(to).addScaledVector(d, extend)
            const len = p0.distanceTo(p1)
            mesh.position.addVectors(p0, p1).multiplyScalar(0.5)
            mesh.scale.set(1, len, 1)
            mesh.quaternion.setFromUnitVectors(Y, d)
        }
        add('bodyLines', g, () => {
            span(hips, joints.hip_hit, joints.hip_toss, 0.22)
            span(shoulders, joints.sh_hit, joints.sh_toss, 0.22)
        })
    }

    // ---- the racket face a frame either side of contact ------------------
    {
        /*
          Three rims: one frame early, contact, one frame late. They mark
          fixed moments, so their geometry is built once at the frames they
          refer to rather than following the clock.
        */
        const rimPoints = (f) => {
            const r = racketAt(f)
            const pts = []
            for (let i = 0; i <= 48; i++) {
                const ang = (i / 48) * Math.PI * 2
                pts.push(
                    new THREE.Vector3()
                        .copy(r.centre)
                        .addScaledVector(r.across, Math.cos(ang) * RACKET.HALF_WIDTH)
                        .addScaledVector(r.along, Math.sin(ang) * RACKET.HALF_LENGTH)
                )
            }
            return pts
        }
        const rim = (f, hex, opacity) => tube(rimPoints(f), 0.006, mat(hex, { opacity }))

        const contact = data.events.contact
        const g = new THREE.Group()
        /*
          The middle ring starts the same orange as the other two and goes
          white as the ball actually arrives.

          White from the outset it looked like a label on a diagram — the
          one singled out in advance. Lighting it at the instant the ball
          meets the strings makes it something you watch happen, which is
          the claim of the chapter rather than an annotation of it.
        */
        const liveMat = mat(INK.early, { opacity: 0.6 })
        const COLD = colour(INK.early)
        const HOT = colour('#ffffff')
        g.add(
            rim(contact - 1, INK.early, 0.6),
            tube(rimPoints(contact), 0.0065, liveMat),
            rim(contact + 1, INK.early, 0.6)
        )
        /*
          One frame of ramp, starting at contact.

          It was a symmetric ramp two and a half frames wide, so the ring
          began lighting as the racket *approached* and faded once it had
          passed — which reads as the diagram anticipating the strike, and
          then forgetting it. It now holds orange right up to contact,
          crosses to white over a single frame, and stays there. At the
          speed this chapter plays, one frame is about a fifth of a second
          on screen: instant enough to land with the ball, slow enough to
          be a transition rather than a cut.
        */
        const RAMP_FRAMES = 1
        add('faceGhosts', g, (t) => {
            const k = Math.max(0, Math.min(1, (t - contact) / RAMP_FRAMES))
            liveMat.color.copy(COLD).lerp(HOT, k)
            liveMat.opacity = 0.6 + k * 0.4
        })
    }

    // ---- shoulder to racket tip, as one line ----------------------------
    {
        const SEG = 3
        const positions = new Float32Array((SEG + 1) * 3)
        const geo = track(new THREE.BufferGeometry())
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        const line = new THREE.Line(geo, track(new THREE.LineDashedMaterial({
            color: colour(INK.angle), dashSize: 0.05, gapSize: 0.035, transparent: true, opacity: 0.9, depthTest: false,
        })))
        line.frustumCulled = false
        line.renderOrder = 11
        add('extensionLine', line, (t) => {
            const r = racketAt(t)
            const pts = [joints.sh_hit, joints.el_hit, joints.wr_hit, r.tip]
            pts.forEach((p, i) => positions.set([p.x, p.y, p.z], i * 3))
            geo.attributes.position.needsUpdate = true
            geo.computeBoundingSphere()
            line.computeLineDistances()
        })
    }

    let active = []
    const setActive = (names) => {
        active = names ?? []
        for (const [name, object] of Object.entries(groups)) object.visible = active.includes(name)
    }
    const update = (t) => {
        for (const name of active) updaters[name]?.(t)
    }
    const dispose = () => {
        for (const x of disposables) x.dispose?.()
        disposables.length = 0
    }

    return { group: root, setActive, update, dispose }
}
