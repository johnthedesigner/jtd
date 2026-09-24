import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COURT_HALF } from './constants'
import { makePoolFalloffCompiler } from './pool-falloff'

/**
 * Confetti rain for the celebration view: real-scale flat cards that flutter
 * down, land, sit on the floor for a while, then get recycled back to the
 * top. The view opens on an empty floor; a beat later, a dense cannon burst
 * fires, and a continuous spawner starts running at the same instant and
 * never stops for as long as the view is open.
 *
 * That spawner is the actual fix for a gap that used to open up after the
 * burst: the first version of this let every piece's own random 35-75
 * second land timer decide when it fell again, which meant the *entire*
 * pool finished its first fall-and-land cycle within one bounded window and
 * then nothing at all was scheduled to happen again until those timers
 * — started at roughly the same time — happened to expire. A land timer is
 * fine for how long a piece rests, but it is the wrong thing to put in
 * charge of how often new pieces fall; those need to be two separate
 * questions. So a piece landing now just marks itself eligible for reuse
 * after MIN_LAND_SECONDS, and a separate, continuously-running spawner
 * decides, at a steady rate, when to actually pull an eligible piece back
 * out — first from the never-yet-used reserve, then by recycling whatever
 * has been sitting on the floor the longest. That rate is the only thing
 * that ever decides when a new piece falls, from the moment the burst fires
 * onward, so there is nothing left to fall silent.
 *
 * Colour is a hand-declared instanced attribute (`pieceColor`), read by a
 * custom `onBeforeCompile` patch, rather than three's own built-in
 * InstancedMesh colour path (`material.vertexColors` + `mesh.setColorAt`).
 * That built-in path turned out to render every instance solid black here —
 * the per-instance colour was computed correctly (confirmed by forcing every
 * instance to the same hardcoded colour and still getting black), so
 * something about how this project's three.js version wires
 * `USE_INSTANCING_COLOR` into the compiled program was the culprit, not
 * this file's own logic. Declaring the attribute and doing the multiply by
 * hand sidesteps whatever that was — the exact same reasoning the light
 * columns already use their own hand-rolled instanced attributes for.
 *
 * State otherwise lives in a plain array of plain objects rather than a
 * typed buffer. A few thousand pieces touched once a frame is nowhere near
 * where that would start to matter, and a plain array keeps the per-piece
 * state machine (released, falling vs landed) readable.
 */

const COUNT = 12000
const FALL_HEIGHT = 55
// How far past the court's own edges the rain actually falls — wider than
// the court so the field of confetti reads as spreading out into the arena,
// not as a rain confined to a box exactly the size of the floor.
const SPREAD_X = COURT_HALF[0] + 25
const SPREAD_Z = COURT_HALF[1] + 25
// Real confetti is nearly all drag: tiny and flat, it drifts down far
// slower than its weight alone would suggest.
const MIN_SPEED = 2.2
const MAX_SPEED = 4.5
// A gentle flutter, not a breeze — this is what was reading as wind in the
// arena. Real confetti drifts a little as it falls; it doesn't sway back
// and forth across several feet.
const SWAY_SPEED_MIN = 0.7
const SWAY_SPEED_MAX = 1.6
// Fast enough that a flat card sweeps light on and off several times a
// second as it tumbles — the flicker is the point, not a side effect.
const MIN_SPIN = 12
const MAX_SPIN = 36
// The minimum a piece rests once landed before the spawner is allowed to
// pull it back into service — not how long it typically sits, which
// depends on how quickly the spawner actually needs it back given how many
// other pieces are also waiting their turn.
const MIN_LAND_SECONDS = 20
// Big enough to actually resolve as a lit surface at typical viewing
// distance — true 1-inch scale rendered as only a pixel or two of coverage,
// which anti-aliasing quietly blends down toward the dark background
// regardless of how the material itself is tuned.
const PIECE_WIDTH = 0.16
const PIECE_HEIGHT = 0.22
// Beat of empty floor before the cannon fires, so the burst reads as an
// event rather than something that was already happening when the view
// opened.
const BURST_DELAY_SECONDS = 0.5
// How much of the pool goes off at once as the dense cannon burst; the rest
// is the spawner's reserve, released gradually rather than in that same
// instant, so it never looks like it had already been falling.
const BURST_FRACTION = 0.5
// New pieces released per second, forever, starting the moment the burst
// fires — the one thing in charge of "is the rain still going".
const STEADY_RATE = 220
// How far into the (large) pool the spawner will search for an eligible
// landed piece before giving up for this frame and trying again next frame
// with the search picking up where it left off. Cheap insurance against a
// full 12,000-entry scan on frames where nothing is actually ready yet.
const RECYCLE_SCAN_LIMIT = 600

function randomBetween(a, b) {
    return a + Math.random() * (b - a)
}

function respawn(p, colors) {
    p.x = randomBetween(-SPREAD_X, SPREAD_X)
    p.z = randomBetween(-SPREAD_Z, SPREAD_Z)
    p.speed = randomBetween(MIN_SPEED, MAX_SPEED)
    p.swaySpeed = randomBetween(SWAY_SPEED_MIN, SWAY_SPEED_MAX)
    p.swayPhase = Math.random() * Math.PI * 2
    p.swayAmp = randomBetween(0.15, 0.6)
    p.spin = new THREE.Vector3(
        randomBetween(-MAX_SPIN, MAX_SPIN),
        randomBetween(-MAX_SPIN, MAX_SPIN),
        randomBetween(-MAX_SPIN, MAX_SPIN)
    )
    p.spin.setLength(randomBetween(MIN_SPIN, MAX_SPIN))
    p.rot = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
    p.scale = randomBetween(0.7, 1.4)
    p.color = colors[(Math.random() * colors.length) | 0]
    p.colorDirty = true
    p.landed = false
    p.landTimer = 0
}

/** Sets a freshly (re)released piece falling from near the top. */
function release(p, colors) {
    respawn(p, colors)
    p.y = randomBetween(FALL_HEIGHT * 0.85, FALL_HEIGHT)
    p.released = true
}

/** Lay a landed piece flat, with just enough random tilt that a floor full
 *  of them doesn't read as a perfectly even tiled layer. */
function land(p) {
    p.landed = true
    p.landTimer = 0
    p.y = PIECE_HEIGHT * 0.5 * p.scale * 0.3
    p.rot.set(Math.PI / 2 + randomBetween(-0.2, 0.2), 0, randomBetween(0, Math.PI * 2))
}

const tmpObj = new THREE.Object3D()

export default function Confetti({ active, colors }) {
    const meshRef = useRef(null)
    const geometry = useMemo(() => {
        const g = new THREE.PlaneGeometry(PIECE_WIDTH, PIECE_HEIGHT)
        g.setAttribute('pieceColor', new THREE.InstancedBufferAttribute(new Float32Array(COUNT * 3), 3))
        return g
    }, [])
    const material = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                side: THREE.DoubleSide,
                // Paper, not foil: no shine, no metallic tint. What makes it
                // "catch" the light is being bright and well lit, not a
                // specular glint.
                roughness: 0.95,
                metalness: 0,
            }),
        []
    )

    useLayoutEffect(() => {
        // Composed by hand rather than via applyPoolFalloff: this material
        // also needs the pieceColor attribute wired in, and
        // onBeforeCompile can only hold one function.
        // A wide feather and a slow decay, not the hoops' tight ones — those
        // read as a hard box around the court once confetti was spread out
        // this far past the edges, like the court sat inside a lit
        // aquarium. This fades across most of the spread instead, so there
        // is no line to see at all.
        const poolCompile = makePoolFalloffCompiler({ floor: 0.55, spill: 0.4, feather: 18, decay: 0.025 })
        material.onBeforeCompile = (shader) => {
            poolCompile(shader)
            shader.vertexShader = shader.vertexShader
                .replace(
                    'void main() {',
                    'attribute vec3 pieceColor;\nvarying vec3 vPieceColor;\nvoid main() {'
                )
                .replace('#include <begin_vertex>', '#include <begin_vertex>\n vPieceColor = pieceColor;')
            shader.fragmentShader = shader.fragmentShader
                .replace('void main() {', 'varying vec3 vPieceColor;\nvoid main() {')
                .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb *= vPieceColor;')
        }
        material.customProgramCacheKey = () => 'nba-confetti'
        material.needsUpdate = true
    }, [material])

    const palette = useMemo(
        () => (colors && colors.length ? colors.map((c) => new THREE.Color(c)) : [new THREE.Color('#ffffff')]),
        [colors]
    )

    // Every piece starts unreleased — the view opens on an empty floor, not
    // a rain already in progress.
    const particles = useRef(null)
    if (!particles.current) {
        particles.current = Array.from({ length: COUNT }, () => {
            const p = { released: false }
            respawn(p, palette)
            p.y = 0
            return p
        })
    }

    const show = useRef({
        prevActive: false,
        burstAt: 0,
        burstFired: false,
        reserveIndex: 0,
        spawnAccumulator: 0,
        scanFrom: 0,
    })

    // Colour only needs writing when it actually changes (on spawn/respawn),
    // not every frame — position and rotation are the only per-frame state.
    useLayoutEffect(() => {
        const mesh = meshRef.current
        if (!mesh) return
        const colorAttr = mesh.geometry.getAttribute('pieceColor')
        particles.current.forEach((p, i) => {
            respawn(p, palette)
            colorAttr.setXYZ(i, p.color.r, p.color.g, p.color.b)
        })
        colorAttr.needsUpdate = true
    }, [palette])

    useFrame((_, delta) => {
        if (!active) {
            show.current.prevActive = false
            return
        }
        const mesh = meshRef.current
        if (!mesh) return
        const dt = Math.min(delta, 0.05)
        const s = show.current

        // Opening the view resets every piece to unreleased and arms the
        // burst — re-entering the celebration always starts the same way,
        // empty floor then one cannon, rather than picking up wherever the
        // last visit left off.
        if (!s.prevActive) {
            s.prevActive = true
            s.burstAt = BURST_DELAY_SECONDS
            s.burstFired = false
            s.reserveIndex = Math.floor(COUNT * BURST_FRACTION)
            s.spawnAccumulator = 0
            s.scanFrom = 0
            particles.current.forEach((p) => {
                p.released = false
            })
        }

        if (s.burstAt > 0) {
            s.burstAt -= dt
            if (s.burstAt <= 0) {
                s.burstFired = true
                // The cannon: the first BURST_FRACTION of the pool let go
                // at once, close to the very top, so it reads as one dense
                // wave. Everything from reserveIndex on is left unreleased
                // for the spawner below to work through on its own
                // schedule, starting on this exact same frame.
                const burstCount = Math.floor(COUNT * BURST_FRACTION)
                for (let i = 0; i < burstCount; i++) {
                    release(particles.current[i], palette)
                }
            }
        }

        if (s.burstFired) {
            // The spawner: the only thing that ever decides a new piece
            // falls, from this point on for as long as the view stays
            // open. It never runs out of something to do — first it works
            // through the untouched reserve, then, once that's gone, it
            // recycles whatever has been sitting on the floor longest.
            // Nothing here depends on any individual piece's own timer, so
            // there is nothing that can leave it with nothing scheduled.
            s.spawnAccumulator += STEADY_RATE * dt
            let guard = 0
            while (s.spawnAccumulator >= 1 && guard < 400) {
                s.spawnAccumulator -= 1
                guard++

                if (s.reserveIndex < COUNT) {
                    release(particles.current[s.reserveIndex], palette)
                    s.reserveIndex++
                    continue
                }

                let picked = -1
                for (let k = 0; k < Math.min(RECYCLE_SCAN_LIMIT, COUNT); k++) {
                    const idx = (s.scanFrom + k) % COUNT
                    const p = particles.current[idx]
                    if (p.released && p.landed && p.landTimer >= MIN_LAND_SECONDS) {
                        picked = idx
                        s.scanFrom = (idx + 1) % COUNT
                        break
                    }
                }
                if (picked < 0) {
                    // Nothing eligible yet anywhere in this frame's search
                    // window — give the accumulated credit back and try
                    // again next frame rather than spinning further now.
                    s.spawnAccumulator += 1
                    break
                }
                release(particles.current[picked], palette)
            }
        }

        const colorAttr = mesh.geometry.getAttribute('pieceColor')
        let colorChanged = false

        particles.current.forEach((p, i) => {
            if (!p.released) {
                tmpObj.position.set(0, -9999, 0)
                tmpObj.scale.setScalar(0.0001)
                tmpObj.updateMatrix()
                mesh.setMatrixAt(i, tmpObj.matrix)
                return
            }

            if (p.landed) {
                // Just sits — the spawner above is solely responsible for
                // when (and whether) this gets pulled back into service.
                p.landTimer += dt
            } else {
                p.y -= p.speed * dt
                p.swayPhase += p.swaySpeed * dt
                p.rot.x += p.spin.x * dt
                p.rot.y += p.spin.y * dt
                p.rot.z += p.spin.z * dt
                if (p.y <= 0) land(p)
            }

            if (p.colorDirty) {
                colorAttr.setXYZ(i, p.color.r, p.color.g, p.color.b)
                p.colorDirty = false
                colorChanged = true
            }

            const sway = p.landed ? 0 : Math.sin(p.swayPhase) * p.swayAmp
            tmpObj.position.set(p.x + sway, p.y, p.z)
            tmpObj.rotation.copy(p.rot)
            tmpObj.scale.setScalar(p.scale)
            tmpObj.updateMatrix()
            mesh.setMatrixAt(i, tmpObj.matrix)
        })
        mesh.instanceMatrix.needsUpdate = true
        if (colorChanged) colorAttr.needsUpdate = true
    })

    if (!active) return null

    return <instancedMesh ref={meshRef} args={[geometry, material, COUNT]} frustumCulled={false} />
}
