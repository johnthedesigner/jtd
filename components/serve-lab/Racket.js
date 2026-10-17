import * as THREE from 'three'
import { RACKET } from './serve-frame'
import { racketSurface } from './serve-textures'
import { LOGO_PATHS, LOGO_VIEWBOX } from './serve-mark'

/**
 * The racket, and the ribbon its head sweeps behind it.
 *
 * Built once in its own space — head centred on the origin, long axis up —
 * and then placed each frame by a matrix made from the three measured
 * marker directions. No Euler angles anywhere: the face angle at contact is
 * one of the numbers this page reports, and recomposing it from angles
 * would be a chance to lose a degree to rounding.
 *
 * The strings are drawn, not textured. At the distances these cameras work
 * at the racket is often a tenth of the frame, and a string pattern that is
 * really there catches the light at the right angles when it turns.
 */

import { PALETTE } from './palette'

const RACKET_COLOR = PALETTE.orange
/*
  Not black. Pure black carries no shading, so against a dark court the
  black sections simply vanished into the shadows and the racket read as a
  broken hoop. A very dark grey still catches the lamps enough to hold its
  shape.
*/
const FRAME_DARK = '#1b1d20'
/** The J, painted on the strings. Index 1 of the logo's three shapes. */
const J_PATH = 1
/** Optic yellow, for the sweep and the ball. */
const OPTIC = PALETTE.optic

/** Frames of head travel in the ribbon. */
const TRAIL_FRAMES = 26

/**
 * @param options.material  One translucent material for the whole racket,
 *                          for the comparison serve. Skips the strings and
 *                          the sweep, which at that opacity are noise.
 */
export function buildRacket(data, sampler, racketAt, options = {}) {
    const override = options.material ?? null
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

    const scuff = racketSurface()
    const frameMat = override ? track(override) : track(
        new THREE.MeshStandardMaterial({
            color: colour(RACKET_COLOR),
            // Matte. It was emissive so the frame would hold its colour at
            // the dark end of the court, which also made it read as a light
            // rather than as a painted object.
            roughness: 0.74, metalness: 0.05,
            roughnessMap: scuff.roughnessMap,
            normalMap: scuff.normalMap,
            normalScale: new THREE.Vector2(0.18, 0.18),
        })
    )

    const racket = new THREE.Group()
    racket.matrixAutoUpdate = false
    root.add(racket)

    const A = RACKET.HALF_LENGTH
    const B = RACKET.HALF_WIDTH

    /*
      The rim, in sections.
      ...........
      Two black panels at the shoulders of the hoop with a short bright
      ferrule either side of each, which is roughly where a real frame
      carries its paint break and its grommet strip. They are separate
      meshes rather than vertex colours, which cannot darken a material
      independently of its own shading.
    */
    const blackMat = override || track(
        new THREE.MeshStandardMaterial({ color: colour(FRAME_DARK), roughness: 0.78, metalness: 0.05 })
    )
    {
        const rimPoint = (deg) => {
            const a = (deg * Math.PI) / 180
            return new THREE.Vector3(B * Math.cos(a), A * Math.sin(a), 0)
        }
        const arc = (from, to, mat) => {
            const pts = []
            const steps = Math.max(4, Math.round(Math.abs(to - from) / 3))
            for (let i = 0; i <= steps; i++) pts.push(rimPoint(from + ((to - from) * i) / steps))
            const mesh = new THREE.Mesh(
                track(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), steps * 2, 0.009, 8, false)),
                mat
            )
            mesh.castShadow = true
            racket.add(mesh)
        }
        /*
          The hoop in quarters, alternating. Simpler than the two panels
          and four ferrules it replaces, which at racket scale read as a
          scatter of small black and yellow details rather than as a paint
          scheme.
        */
        for (const [from, to, mat] of [
            [0, 90, blackMat],
            [90, 180, frameMat],
            [180, 270, blackMat],
            [270, 360, frameMat],
        ]) {
            arc(from, to, mat)
        }
    }

    // A barely-there face, so the head reads as a surface edge-on.
    {
        const shape = new THREE.Shape()
        shape.absellipse(0, 0, B - 0.006, A - 0.006, 0, Math.PI * 2, false, 0)
        racket.add(
            new THREE.Mesh(
                track(new THREE.ShapeGeometry(shape, 48)),
                track(new THREE.MeshBasicMaterial({
                    color: 0xffffff, transparent: true, opacity: 0.12,
                    side: THREE.DoubleSide, depthWrite: false,
                }))
            )
        )
    }

    if (!override) {
    /*
      Strings, with a white J painted across them.

      Drawn as many short segments rather than one line per string, because
      a string spans the whole face and a glyph painted on it has to be
      resolved somewhere along its length. Each segment takes its colour
      from whether its own midpoint falls inside the letter, which gives a
      hard edge; colouring the endpoints instead would gradient every
      string across the boundary.

      The test is `isPointInPath` against the real logo outline rather than
      anything hand-drawn, so the J on the strings is the J from the mark.
    */
    {
        const ctx = document.createElement('canvas').getContext('2d')
        const glyph = new Path2D(LOGO_PATHS[J_PATH])

        // The path's own bounds, found by sampling: there is no bbox on a
        // Path2D, and hardcoding numbers read off the `d` attribute is the
        // kind of thing that silently rots when the logo is redrawn.
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
        for (let gx = 0; gx <= LOGO_VIEWBOX[0]; gx += 0.5) {
            for (let gy = 0; gy <= LOGO_VIEWBOX[1]; gy += 0.5) {
                if (!ctx.isPointInPath(glyph, gx, gy)) continue
                if (gx < x0) x0 = gx
                if (gx > x1) x1 = gx
                if (gy < y0) y0 = gy
                if (gy > y1) y1 = gy
            }
        }
        const glyphW = x1 - x0
        const glyphH = y1 - y0
        // Sized to most of the face, and centred on it.
        const fit = Math.min((A * 1.5) / glyphH, (B * 1.5) / glyphW)
        const toGlyph = (x, y) => [
            x0 + glyphW / 2 + x / fit,
            // Canvas y runs down, the racket face runs up.
            y0 + glyphH / 2 - y / fit,
        ]
        const inJ = (x, y) => ctx.isPointInPath(glyph, ...toGlyph(x, y))

        const pos = []
        const col = []
        // Off-white, not paper white: at full strength it glared against
        // the dimmed strings and read as a light source rather than paint.
        const white = new THREE.Color('#d8d2c6')
        /*
          The unpainted strings are dimmed well below the frame's own
          colour. At full strength they sit so close to the neon that the
          painted J reads as a slightly lighter patch rather than as a
          letter; taking them down is what gives the white something to be
          white against.
        */
        const frameColour = colour(RACKET_COLOR).multiplyScalar(0.38)
        const STEP = 0.006
        const addRun = (ax, ay, bx, by) => {
            const len = Math.hypot(bx - ax, by - ay)
            const n = Math.max(1, Math.round(len / STEP))
            for (let i = 0; i < n; i++) {
                const t0 = i / n
                const t1 = (i + 1) / n
                const p0 = [ax + (bx - ax) * t0, ay + (by - ay) * t0]
                const p1 = [ax + (bx - ax) * t1, ay + (by - ay) * t1]
                const c = inJ((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2) ? white : frameColour
                pos.push(p0[0], p0[1], 0, p1[0], p1[1], 0)
                col.push(c.r, c.g, c.b, c.r, c.g, c.b)
            }
        }

        for (let i = -7; i <= 7; i++) {
            const x = i * 0.016
            const y = A * Math.sqrt(Math.max(0, 1 - (x / B) ** 2)) - 0.006
            addRun(x, -y, x, y)
        }
        for (let j = -10; j <= 10; j++) {
            const y = j * 0.016
            const x = B * Math.sqrt(Math.max(0, 1 - (y / A) ** 2)) - 0.006
            addRun(-x, y, x, y)
        }

        const g = track(new THREE.BufferGeometry())
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
        g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
        racket.add(
            new THREE.LineSegments(
                g,
                track(new THREE.LineBasicMaterial({
                    vertexColors: true, transparent: true, opacity: 0.92,
                }))
            )
        )
    }
    }

    // Throat and handle.
    {
        const stick = (from, to, r, mat = frameMat) => {
            const d = new THREE.Vector3().subVectors(to, from)
            const len = d.length()
            const mesh = new THREE.Mesh(track(new THREE.CylinderGeometry(r, r, len, 12)), mat)
            mesh.position.addVectors(from, to).multiplyScalar(0.5)
            mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
            mesh.castShadow = true
            racket.add(mesh)
        }
        const throat = new THREE.Vector3(0, -A - 0.085, 0)
        stick(new THREE.Vector3(-0.07, -A + 0.04, 0), throat, 0.008)
        stick(new THREE.Vector3(0.07, -A + 0.04, 0), throat, 0.008)
        // Shaft down to where the hand starts, then grip.
        stick(throat, new THREE.Vector3(0, -A - 0.13, 0), 0.015)
        /*
          The overgrip: black, and fractionally fatter than the shaft it
          wraps, because that is what a grip is. It also gives the eye
          somewhere to read the racket's roll from, which a single
          continuous orange stick does not.
        */
        stick(
            new THREE.Vector3(0, -A - 0.125, 0),
            new THREE.Vector3(0, -A - 0.3, 0),
            0.0175,
            blackMat
        )
        stick(new THREE.Vector3(0, -A - 0.3, 0), new THREE.Vector3(0, -A - 0.315, 0), 0.019, blackMat)
    }

    // ---- sweep ----------------------------------------------------------

    /*
      The head's own outline, swept.

      This used to be a flat ribbon between the racket's tip and its throat,
      which drew a glowing line straight up the middle of the strings and
      trailed that line behind the swing. Wrong shape: what a racket leaves
      in a long exposure is the edge of its head, a tube the width of the
      face, not a stripe through the centre of it.

      So each of the last `TRAIL_FRAMES` positions contributes the ellipse
      of the rim, and consecutive rings are stitched into a surface.
    */
    const RIM_POINTS = 18
    const trailGeo = track(new THREE.BufferGeometry())
    const trailVertices = (TRAIL_FRAMES + 1) * RIM_POINTS
    const trailPos = new Float32Array(trailVertices * 3)
    const trailAlpha = new Float32Array(trailVertices)
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3))
    trailGeo.setAttribute('alpha', new THREE.BufferAttribute(trailAlpha, 1))
    {
        const idx = []
        for (let k = 0; k < TRAIL_FRAMES; k++) {
            for (let i = 0; i < RIM_POINTS; i++) {
                const next = (i + 1) % RIM_POINTS
                const a = k * RIM_POINTS + i
                const b = k * RIM_POINTS + next
                const c = (k + 1) * RIM_POINTS + i
                const d = (k + 1) * RIM_POINTS + next
                idx.push(a, b, c, b, d, c)
            }
        }
        trailGeo.setIndex(idx)
    }
    /*
      The sweep is a speed heatmap, not one colour.

      The trail already shows where the head went; colouring it by how fast
      it was going at each point makes it show the thing the page is
      actually about. Cyan at the slow end, orange at the fast end — the
      scene's own two hues, so the ribbon reads as part of the picture — and
      because almost all of a serve's speed arrives in the last fraction of
      a second, the gradient sits overwhelmingly at the cyan end with a
      short hot tip. That shape is the argument of chapter two, drawn on the
      swing itself.
    */
    const trailColor = new Float32Array(trailVertices * 3)
    trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColor, 3))
    const SLOW = colour(PALETTE.cyanBright)
    const FAST = colour(PALETTE.orangeLine)
    let peakSpeed = 0
    for (const v of data.speed) if (v > peakSpeed) peakSpeed = v
    const heat = new THREE.Color()

    const trailMat = track(
        new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            vertexShader:
                'attribute float alpha; attribute vec3 color; varying float vA; varying vec3 vC;' +
                'void main(){ vA = alpha; vC = color; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
            fragmentShader:
                'varying float vA; varying vec3 vC;' +
                'void main(){ gl_FragColor = vec4(vC, vA); }',
        })
    )
    const trail = new THREE.Mesh(trailGeo, trailMat)
    trail.frustumCulled = false
    root.add(trail)

    // Precomputed, since the ring is the same shape every frame.
    const RIM_COS = new Float32Array(RIM_POINTS)
    const RIM_SIN = new Float32Array(RIM_POINTS)
    for (let i = 0; i < RIM_POINTS; i++) {
        const a = (i / RIM_POINTS) * Math.PI * 2
        RIM_COS[i] = Math.cos(a) * RACKET.HALF_WIDTH
        RIM_SIN[i] = Math.sin(a) * RACKET.HALF_LENGTH
    }

    const matrix = new THREE.Matrix4()

    const pose = (t, { showTrail = !override } = {}) => {
        if (trail.visible !== showTrail) trail.visible = showTrail
        if (showTrail) {
            for (let k = 0; k <= TRAIL_FRAMES; k++) {
                const sampleAt = Math.max(0, t - (TRAIL_FRAMES - k))
                const r = racketAt(sampleAt)
                /*
                  Much fainter than the old ribbon carried, because this
                  shape is far bigger on screen: a tube the width of the
                  head, seen side-on, with both faces drawn. At the ribbon's
                  alpha it painted the player green wherever the swing
                  passed in front of them.
                */
                const alpha = Math.pow(k / TRAIL_FRAMES, 2.0) * 0.17
                // Squared, so the hot end is reached only by genuinely fast
                // frames rather than by everything past the midpoint.
                const at = Math.max(0, Math.min(data.speed.length - 1, Math.round(sampleAt)))
                heat.copy(SLOW).lerp(FAST, Math.pow(data.speed[at] / peakSpeed, 2))
                for (let i = 0; i < RIM_POINTS; i++) {
                    const v = (k * RIM_POINTS + i) * 3
                    trailPos[v] = r.centre.x + r.across.x * RIM_COS[i] + r.along.x * RIM_SIN[i]
                    trailPos[v + 1] = r.centre.y + r.across.y * RIM_COS[i] + r.along.y * RIM_SIN[i]
                    trailPos[v + 2] = r.centre.z + r.across.z * RIM_COS[i] + r.along.z * RIM_SIN[i]
                    trailAlpha[k * RIM_POINTS + i] = alpha
                    trailColor[v] = heat.r
                    trailColor[v + 1] = heat.g
                    trailColor[v + 2] = heat.b
                }
            }
            trailGeo.attributes.position.needsUpdate = true
            trailGeo.attributes.alpha.needsUpdate = true
            trailGeo.attributes.color.needsUpdate = true
        }

        const r = racketAt(t)
        matrix.makeBasis(r.across, r.along, r.normal)
        matrix.setPosition(r.centre)
        racket.matrix.copy(matrix)
        racket.matrixWorldNeedsUpdate = true
    }

    const dispose = () => {
        for (const d of disposables) d.dispose?.()
        disposables.length = 0
    }

    return { group: root, pose, dispose }
}
