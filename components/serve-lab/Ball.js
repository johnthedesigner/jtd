import * as THREE from 'three'

/**
 * The ball: simulated, and labelled as such everywhere it is described.
 *
 * Nothing about the ball was captured — the lab tracked 75 markers on a
 * body and a racket, and none on a ball. What exists here is a toss fitted
 * to the tossing hand's measured velocity, a flight solved to land on the
 * spot the lab recorded, and a bounce. Its job is to look physically right,
 * not to be evidence.
 *
 * The one measured thing it touches is the contact point, and the sampler
 * below bends the flight to pass through it exactly.
 */

import { PALETTE } from './palette'

/*
  The ball keeps its own colour — see `palette.js` — but its path and the
  contact marker are scene furniture and take the palette's orange, which
  is also what the racket that put it there is painted in.
*/
const OPTIC = PALETTE.optic
const PATH = PALETTE.orangeLine
const CONTACT = PALETTE.orangeLine

/** A real ball is 67mm across. */
const BALL_RADIUS = 0.0335

/**
 * A soft round dot, so each mote is a puff rather than a square.
 *
 * `PointsMaterial` draws untextured points as hard squares, which at any
 * size above a pixel or two is unmistakable.
 */
function softDot() {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 64
    const ctx = canvas.getContext('2d')
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, 'rgba(255,255,255,0.9)')
    g.addColorStop(0.45, 'rgba(255,255,255,0.35)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 64)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
}

export function buildBall(data, frame, sampler) {
    const { courtPoint, ground, toWorld } = frame
    const root = new THREE.Group()
    const disposables = []
    const trackIt = (x) => (disposables.push(x), x)
    const colour = (hex) => new THREE.Color(hex)

    const ball = data.ball
    const contactFrame = data.events.contact
    const last = ball.n - 1
    const FPS = data.fps
    const release = ball.release

    /** The exact measured contact point, which the flight is pinned to. */
    const contactPoint = toWorld(new THREE.Vector3(), ball.cp[0], ball.cp[1], ball.cp[2])

    const scratch = new THREE.Vector3()

    /**
     * Ball position at a moment.
     *
     * Contact falls at frame 266.5 — between two samples — so the two
     * frames either side of it are interpolated toward the contact point
     * rather than through each other. Without that the ball cuts the corner
     * and misses the strings by a couple of centimetres at exactly the
     * moment anybody is looking.
     */
    const ballAt = (t, out) => {
        const tt = Math.max(0, Math.min(last, t))
        const pos = ball.pos
        const before = Math.floor(contactFrame)
        const after = Math.ceil(contactFrame)

        if (contactFrame % 1 && tt > before && tt < after) {
            if (tt <= contactFrame) {
                const k = before * 3
                toWorld(out, pos[k], pos[k + 1], pos[k + 2])
                return out.lerp(contactPoint, (tt - before) / (contactFrame - before))
            }
            const k = after * 3
            toWorld(scratch, pos[k], pos[k + 1], pos[k + 2])
            return out.copy(contactPoint).lerp(scratch, (tt - contactFrame) / (after - contactFrame))
        }

        const i = Math.min(ball.n - 2, Math.floor(tt))
        const f = tt - i
        const k = i * 3
        const q = k + 3
        return toWorld(
            out,
            pos[k] + (pos[q] - pos[k]) * f,
            pos[k + 1] + (pos[q + 1] - pos[k + 1]) * f,
            pos[k + 2] + (pos[q + 2] - pos[k + 2]) * f
        )
    }

    const live = new THREE.Mesh(
        trackIt(new THREE.SphereGeometry(BALL_RADIUS, 24, 18)),
        trackIt(new THREE.MeshStandardMaterial({ color: colour(OPTIC), roughness: 0.7 }))
    )
    live.castShadow = true
    root.add(live)

    /*
      The flight, drawn only as far as the ball has actually flown.

      The whole arc used to be on screen from the first frame, which gave
      away where the serve was going before it was struck and made the
      simulated path look like a measured one. Now the line is laid down
      behind the ball: `setDrawRange` walks forward as the clock does, so
      the path is a record of where it has been rather than a plan.
    */
    const pathFrames = []
    let pathLine = null
    {
        const pts = []
        for (let f = release; f <= last; f++) {
            if (f > contactFrame && pts.length && f - 1 < contactFrame) {
                pts.push(contactPoint.clone())
                pathFrames.push(contactFrame)
            }
            pts.push(ballAt(f, new THREE.Vector3()))
            pathFrames.push(f)
        }
        const line = new THREE.Line(
            trackIt(new THREE.BufferGeometry().setFromPoints(pts)),
            trackIt(new THREE.LineDashedMaterial({
                color: colour(PATH), dashSize: 0.08, gapSize: 0.06,
                transparent: true, opacity: 0.75,
            }))
        )
        line.computeLineDistances()
        root.add(line)
        pathLine = line
    }

    // Where the lab says this serve landed.
    {
        const ring = new THREE.Mesh(
            trackIt(new THREE.RingGeometry(0.2, 0.3, 48)),
            trackIt(new THREE.MeshBasicMaterial({
                color: colour(PATH), side: THREE.DoubleSide, transparent: true, opacity: 0.9,
            }))
        )
        const at = toWorld(new THREE.Vector3(), ball.landPt[0], ball.landPt[1], 0)
        at.y = ground + 0.006
        ring.rotation.x = -Math.PI / 2
        ring.position.copy(at)
        root.add(ring)
    }

    // ---- the contact point itself --------------------------------------

    /*
      Marked permanently, not just as the ball passes through. Contact is
      the one moment everything else is measured against — 2.6 m up, 0.8 m
      inside the baseline — and leaving a marker there lets the height and
      the reach read as distances rather than as numbers in a panel.
    */
    const contact = new THREE.Group()
    /*
      Off by default. It is a useful thing to be able to turn on — it is
      what makes the contact height read as a distance rather than a number
      — but it is also a red line up the middle of the court through every
      step that is not about contact, which is nine of the ten.
    */
    contact.visible = false
    root.add(contact)
    {
        const mat = trackIt(new THREE.MeshStandardMaterial({
            color: colour(CONTACT), roughness: 0.6,
            transparent: true, opacity: 0.42, depthWrite: false,
        }))
        const marker = new THREE.Mesh(trackIt(new THREE.SphereGeometry(0.034, 20, 16)), mat)
        marker.position.copy(contactPoint)
        contact.add(marker)

        const drop = new THREE.Line(
            trackIt(new THREE.BufferGeometry().setFromPoints([
                contactPoint,
                new THREE.Vector3(contactPoint.x, ground + 0.003, contactPoint.z),
            ])),
            trackIt(new THREE.LineDashedMaterial({
                color: colour(CONTACT), dashSize: 0.06, gapSize: 0.05,
                transparent: true, opacity: 0.7,
            }))
        )
        drop.computeLineDistances()
        contact.add(drop)

        const ring = new THREE.Mesh(
            trackIt(new THREE.RingGeometry(0.05, 0.07, 32)),
            trackIt(new THREE.MeshBasicMaterial({
                color: colour(CONTACT), side: THREE.DoubleSide, transparent: true, opacity: 0.85,
            }))
        )
        ring.rotation.x = -Math.PI / 2
        ring.position.set(contactPoint.x, ground + 0.004, contactPoint.z)
        contact.add(ring)
    }

    /*
      No distance compensation on the ball.

      It used to be scaled up with camera distance so it stayed visible from
      the wide framings. That keeps it findable and costs the one thing a
      flight most needs to read: a ball that does not shrink as it goes away
      does not look like it is going away. It is 67 mm and it stays 67 mm.
    */
    /*
      A puff of court dust off the strings at contact.

      Real enough to be worth having: a ball picks up clay and chalk and
      the felt sheds, and a strike at 60 mph throws a little of it. Kept
      small and short — sixteen motes, a third of a second, barely visible
      at full brightness — because at this scale anything more reads as a
      special effect rather than as something that happened.

      Driven by the data clock, not by wall time, so it slows with the
      replay. At 1/50 speed a puff timed in real seconds would be over
      before the frame it belongs to had finished arriving.
    */
    const DUST_COUNT = 16
    const DUST_LIFE = 0.34
    const dustPositions = new Float32Array(DUST_COUNT * 3)
    const dustDirections = []
    {
        let seed = 7817
        const rand = () => {
            seed = (seed * 1664525 + 1013904223) % 4294967296
            return seed / 4294967296
        }
        for (let i = 0; i < DUST_COUNT; i++) {
            const a = rand() * Math.PI * 2
            const spread = 0.35 + rand() * 0.85
            dustDirections.push(
                new THREE.Vector3(Math.cos(a) * spread, 0.45 + rand() * 0.8, Math.sin(a) * spread)
                    .multiplyScalar(0.55 + rand() * 0.9)
            )
        }
    }
    const dustGeo = trackIt(new THREE.BufferGeometry())
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3))
    const dustMat = trackIt(
        new THREE.PointsMaterial({
            color: 0xd9d2c4,
            size: 0.03,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            map: softDot(),
        })
    )
    const dust = new THREE.Points(dustGeo, dustMat)
    dust.frustumCulled = false
    dust.visible = false
    root.add(dust)
    disposables.push(dustMat.map)

    const pose = (t) => {
        // Before release the ball is still in the hand, and the simulated
        // track has it riding there; after the bounce it has stopped
        // mattering. Either way it is drawn, so the toss reads as one
        // continuous thing.
        ballAt(t, live.position)

        // The puff, aged in seconds of serve time since the strike.
        const since = (t - contactFrame) / FPS
        if (since < 0 || since > DUST_LIFE) {
            if (dust.visible) dust.visible = false
        } else {
            dust.visible = true
            const age = since / DUST_LIFE
            for (let i = 0; i < DUST_COUNT; i++) {
                const d = dustDirections[i]
                const k = i * 3
                // Thrown out, then slowed and pulled down, like dust.
                const drift = Math.sqrt(age) * 0.22
                dustPositions[k] = contactPoint.x + d.x * drift
                dustPositions[k + 1] = contactPoint.y + d.y * drift - age * age * 0.07
                dustPositions[k + 2] = contactPoint.z + d.z * drift
            }
            dustGeo.attributes.position.needsUpdate = true
            // Up fast, away slowly.
            dustMat.opacity = 0.26 * Math.min(1, age * 7) * (1 - age) ** 1.6
            dustMat.size = 0.028 + age * 0.05
        }

        /*
          How much of the path has happened. A linear scan from the start is
          fine: the array is a few hundred entries and this runs once a
          frame, where a binary search would save microseconds and cost the
          next reader a minute.
        */
        if (pathLine) {
            let shown = 0
            while (shown < pathFrames.length && pathFrames[shown] <= t) shown++
            pathLine.geometry.setDrawRange(0, Math.max(0, shown))
            pathLine.visible = shown > 1
        }
    }

    const dispose = () => {
        for (const d of disposables) d.dispose?.()
        disposables.length = 0
    }

    const showContactMarker = (on) => {
        contact.visible = on
    }

    return { group: root, pose, contactPoint, showContactMarker, dispose }
}
