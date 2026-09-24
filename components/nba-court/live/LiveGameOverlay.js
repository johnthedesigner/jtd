import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { markerForPlay, MARKER_KINDS } from './live-markers'

/**
 * Floor marks for recent plays — a green circle for a make, a red X for a
 * miss, an amber hexagon for a rebound, a cyan arrow for a steal — plus a
 * shower of sparks thrown outward from each as it lands.
 *
 * Where each one goes, and whether a play gets one at all, is decided by
 * `live-markers.js` rather than here, because the camera has to agree: it
 * only moves to track marks that are actually on the floor. This component
 * still watches `latestPlay` itself rather than taking a scene as a prop —
 * a mark appears for every play that has one, including the quieter tiers
 * the camera barely reacts to.
 *
 * Both marks are real extruded geometry (`Shape` → `ExtrudeGeometry`), not
 * flat planes, matching how everything else in this scene is built —
 * `ScoreboardText`'s `TextGeometry` is an `ExtrudeGeometry` too.
 *
 * `depthWrite: true` on every material here, despite them being
 * transparent — not a style choice. A transparent material with
 * `depthWrite: false` silently never renders at all in this app: `PostFX.js`
 * reads the depth buffer, and anything absent from it is dropped from that
 * pass's compositing entirely. That cost a long debugging session once
 * already; see the journal.
 *
 * Sparks mirror `DFenceShow.js`'s proven particle pattern rather than
 * inventing another — a fixed pool, a burst that sets a random outward
 * angle plus an upward component, and plain ballistic motion from there.
 * Two pools (one per colour) instead of one pool with a per-instance colour
 * attribute: at this size it's simpler, and it sidesteps the instanced
 * colour quirk `Confetti.js` had to work around.
 */

const POOL_SIZE = 12
const MARKER_Y = 0.06

// Entrance: a quick overshoot, a couple of decaying bounces, and a tumble
// that settles flat. First-pass timings, expect to tune in motion.
const RISE_SECONDS = 0.18
const SETTLE_SECONDS = 0.26
/**
 * A mark stays up until the next one lands, so the floor always shows the
 * most recent thing that happened rather than going blank between plays.
 * The floor under that is what keeps a fast exchange readable: a mark
 * superseded a moment after it appeared still gets its own time on screen,
 * and several can overlap while play is quick.
 */
const MIN_VISIBLE_SECONDS = 5
/** Short and decisive — a mark should leave, not dissolve. */
const FADE_SECONDS = 0.1
const OVERSHOOT = 1.18
const BOUNCE_HEIGHT = 0.5

const MARK_RADIUS = 1.35
const MARK_THICKNESS = 0.34
const MARK_DEPTH = 0.18

/**
 * The flash that lands with the mark: a disc lying on the floor that snaps
 * to full in a couple of frames and falls away fast. What draws the eye to
 * a new mark is the sudden change in brightness, not the mark itself —
 * which arrives at the same moment as every other mark in the game and so
 * carries no emphasis on its own.
 *
 * Additive and unlit, so it reads as light on the floor rather than another
 * object standing on it.
 */
const FLASH_RADIUS = MARK_RADIUS * 1.9
/** Essentially a single frame — a flash has no visible rise. */
const FLASH_IN_SECONDS = 0.016
const FLASH_OUT_SECONDS = 0.16
const FLASH_PEAK = 0.15
const FLASH_POOL = 6

const SPARK_POOL = 220
const SPARKS_PER_BURST = 18
/**
 * Each spark gets its own life inside this range, and simply stops existing
 * when it reaches it — see `SparkPool` for why that matters.
 */
const SPARK_LIFE_MIN = 0.26
const SPARK_LIFE_MAX = 0.68
/**
 * A hair over a pixel wide at the live view's framing (~94ft of court
 * across ~1100px, so roughly 12px per foot). Enough to register; anything
 * larger stops reading as sparks and starts reading as debris.
 */
const SPARK_SIZE = 0.075
/**
 * Real gravity, in the same feet-per-second this whole scene is built in.
 *
 * Softening it to get a longer arc was a mistake: everything downstream is
 * measured in real feet, so a third of true gravity doesn't read as a
 * gentler arc, it reads as the same arc filmed in slow motion — the eye
 * knows how fast a thrown spark should fall and is not fooled by the path
 * being the right shape. The arc comes from throwing them faster instead.
 */
const SPARK_GRAVITY = -32.2
/** Ceiling on spark brightness — see the note where it's applied. */
const SPARK_OPACITY = 0.6
/**
 * Sparks are sparks: hot metal reads warm white almost regardless of what
 * threw it off. The mark's colour survives only as a tint, enough to tell a
 * make's burst from a miss's out of the corner of your eye without turning
 * them into coloured confetti.
 */
const SPARK_WHITE = new THREE.Color('#fff0d6')
const SPARK_TINT = 0.16

const tmpObj = new THREE.Object3D()

/** Symbol and colour per marker kind — see `live-markers.js` for placement. */
const MARKS = {
    [MARKER_KINDS.MAKE]: { color: new THREE.Color('#41e08a'), shape: makeCircleShape },
    [MARKER_KINDS.MISS]: { color: new THREE.Color('#ff4f42'), shape: makeXShape },
    [MARKER_KINDS.REBOUND]: { color: new THREE.Color('#ffc24a'), shape: makeHexShape },
    [MARKER_KINDS.STEAL]: { color: new THREE.Color('#4ad4ff'), shape: makeArrowShape },
    [MARKER_KINDS.TURNOVER]: { color: new THREE.Color('#ff9a3c'), shape: makeDiamondShape },
    [MARKER_KINDS.FOUL]: { color: new THREE.Color('#b98cff'), shape: makeTriangleShape },
}
const MARK_KIND_LIST = Object.keys(MARKS)

/** An annulus — the "circle" mark reads better as a ring than a filled disc. */
function makeCircleShape() {
    const shape = new THREE.Shape()
    shape.absarc(0, 0, MARK_RADIUS, 0, Math.PI * 2, false)
    const hole = new THREE.Path()
    hole.absarc(0, 0, MARK_RADIUS - MARK_THICKNESS, 0, Math.PI * 2, true)
    shape.holes.push(hole)
    return shape
}

/**
 * An X as a single closed contour: the twelve-point outline of a plus sign,
 * rotated 45°. Drawing it as one polygon (rather than two crossed bars)
 * keeps it a single extrudable shape with no overlapping interior faces.
 */
function makeXShape() {
    const w = MARK_THICKNESS / 2
    const l = MARK_RADIUS
    const pts = [
        [w, w], [l, w], [l, -w], [w, -w], [w, -l], [-w, -l],
        [-w, -w], [-l, -w], [-l, w], [-w, w], [-w, l], [w, l],
    ]
    const cos = Math.cos(Math.PI / 4)
    const sin = Math.sin(Math.PI / 4)
    const shape = new THREE.Shape()
    pts.forEach(([x, y], i) => {
        const rx = x * cos - y * sin
        const ry = x * sin + y * cos
        if (i === 0) shape.moveTo(rx, ry)
        else shape.lineTo(rx, ry)
    })
    shape.closePath()
    return shape
}

/** A regular polygon ring, centred on the origin. */
function makePolygonShape(sides, rotation = 0, radius = MARK_RADIUS, thickness = MARK_THICKNESS) {
    const ring = (r, path) => {
        for (let i = 0; i < sides; i++) {
            const a = (i / sides) * Math.PI * 2 + rotation
            const x = Math.cos(a) * r
            const y = Math.sin(a) * r
            if (i === 0) path.moveTo(x, y)
            else path.lineTo(x, y)
        }
        path.closePath()
    }
    const shape = new THREE.Shape()
    ring(radius, shape)
    const hole = new THREE.Path()
    ring(radius - thickness, hole)
    shape.holes.push(hole)
    return shape
}

/** A triangle ring for a foul — the warning-sign read, at a glance. */
function makeTriangleShape() {
    return makePolygonShape(3, Math.PI / 2)
}

/** A diamond ring for a turnover that nobody took the ball on. */
function makeDiamondShape() {
    return makePolygonShape(4, Math.PI / 2)
}

/** A hexagon ring for a rebound — flat sides read as clearly not-a-circle. */
function makeHexShape() {
    const ring = (r, path) => {
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + Math.PI / 6
            const x = Math.cos(a) * r
            const y = Math.sin(a) * r
            if (i === 0) path.moveTo(x, y)
            else path.lineTo(x, y)
        }
        path.closePath()
    }
    const shape = new THREE.Shape()
    ring(MARK_RADIUS, shape)
    const hole = new THREE.Path()
    ring(MARK_RADIUS - MARK_THICKNESS, hole)
    shape.holes.push(hole)
    return shape
}

/**
 * A chevron for a steal, pointing along +X — the mark is yawed at spawn to
 * face whichever basket the stealing team is now attacking, so it reads as
 * possession turning over rather than as an event at a spot.
 */
function makeArrowShape() {
    const l = MARK_RADIUS * 1.15
    const h = MARK_RADIUS
    const a = MARK_RADIUS * 1.3
    const t = MARK_THICKNESS * 1.5
    const pts = [
        [l, 0],
        [l - a, h],
        [l - a - t, h],
        [l - t, 0],
        [l - a - t, -h],
        [l - a, -h],
    ]
    const shape = new THREE.Shape()
    pts.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)))
    shape.closePath()
    return shape
}

function extrude(shape) {
    const geo = new THREE.ExtrudeGeometry(shape, {
        depth: MARK_DEPTH,
        bevelEnabled: true,
        bevelThickness: 0.04,
        bevelSize: 0.04,
        bevelSegments: 2,
        curveSegments: 24,
    })
    // Centre the extrusion on its own origin, so a mark sits *on* the floor
    // rather than starting at it, and so it spins and scales about its own
    // middle. The circle and X are symmetric already; the chevron is not,
    // so this is measured rather than assumed.
    geo.computeBoundingBox()
    const b = geo.boundingBox
    geo.translate(-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, -MARK_DEPTH / 2)
    return geo
}

function glowMaterial(color) {
    return new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.9,
        roughness: 0.35,
        metalness: 0,
        transparent: true,
        opacity: 0,
        depthWrite: true,
        side: THREE.DoubleSide,
    })
}

/**
 * Unlit and additive: the flash is light cast on the floor, so it must not
 * pick up the scene's own lighting or occlude what's under it. Radial
 * falloff comes from a tiny generated texture rather than a shader patch —
 * one 64px gradient is cheaper than a custom program and does the same job.
 */
function flashMaterial(color) {
    return new THREE.MeshBasicMaterial({
        color,
        map: radialFalloffTexture(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        toneMapped: false,
    })
}

let falloffTexture = null
function radialFalloffTexture() {
    if (falloffTexture) return falloffTexture
    const size = 64
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.35, 'rgba(255,255,255,0.55)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    falloffTexture = new THREE.CanvasTexture(canvas)
    falloffTexture.colorSpace = THREE.SRGBColorSpace
    return falloffTexture
}

function makeMarkerPool() {
    return Array.from({ length: POOL_SIZE }, () => ({
        active: false,
        x: 0,
        z: 0,
        age: 0,
        wobbleX: 0,
        wobbleZ: 0,
        spinY: 0,
        // Age at which this mark starts fading. Pushed forward to
        // `MIN_VISIBLE_SECONDS` on spawn, then pulled back in when a newer
        // mark supersedes it.
        expireAt: MIN_VISIBLE_SECONDS,
        // Fixed in-plane facing, for marks that mean a direction (the steal
        // chevron). Zero for symmetric marks, which read the same any way up.
        yaw: 0,
    }))
}

function makeSparkPool() {
    return Array.from({ length: SPARK_POOL }, () => ({
        active: false,
        age: 0,
        life: SPARK_LIFE_MAX,
        dim: 0.3,
        origin: new THREE.Vector3(),
        vel: new THREE.Vector3(),
    }))
}

/** Finds a free slot, or recycles the oldest active one if the pool is full. */
function claimSlot(pool) {
    let oldest = pool[0]
    for (const p of pool) {
        if (!p.active) return p
        if (p.age > oldest.age) oldest = p
    }
    return oldest
}

const easeOut = (t) => 1 - Math.pow(1 - t, 3)

function markerScale(age) {
    if (age < RISE_SECONDS) return easeOut(age / RISE_SECONDS) * OVERSHOOT
    if (age < RISE_SECONDS + SETTLE_SECONDS) {
        const t = (age - RISE_SECONDS) / SETTLE_SECONDS
        return OVERSHOOT - (OVERSHOOT - 1) * easeOut(t)
    }
    return 1
}

function markerOpacity(age, expireAt) {
    if (age < RISE_SECONDS) return age / RISE_SECONDS
    if (age < expireAt) return 1
    return Math.max(0, 1 - (age - expireAt) / FADE_SECONDS)
}

function MarkerPool({ pool, geometry, material, onLand }) {
    const meshRef = useRef(null)

    useFrame((_, delta) => {
        const mesh = meshRef.current
        if (!mesh) return
        const dt = Math.min(delta, 0.05)
        let peakOpacity = 0

        pool.forEach((p, i) => {
            if (!p.active) {
                tmpObj.position.set(0, -9999, 0)
                tmpObj.scale.setScalar(0.0001)
                tmpObj.updateMatrix()
                mesh.setMatrixAt(i, tmpObj.matrix)
                return
            }

            const wasBeforeLanding = p.age < RISE_SECONDS
            p.age += dt
            if (p.age >= p.expireAt + FADE_SECONDS) {
                p.active = false
                tmpObj.position.set(0, -9999, 0)
                tmpObj.scale.setScalar(0.0001)
                tmpObj.updateMatrix()
                mesh.setMatrixAt(i, tmpObj.matrix)
                return
            }

            // Sparks fire once, on the frame the mark finishes dropping in.
            if (wasBeforeLanding && p.age >= RISE_SECONDS && onLand) onLand(p.x, p.z)

            const decay = Math.exp(-p.age * 3.2)
            const bounce = BOUNCE_HEIGHT * Math.abs(Math.cos(p.age * 11)) * decay

            tmpObj.position.set(p.x, MARKER_Y + bounce, p.z)
            // With the X rotation laying the shape flat, the Y term is an
            // in-plane spin about the mark's own face — so the tumble and
            // the fixed facing simply add.
            tmpObj.rotation.set(
                -Math.PI / 2 + p.wobbleX * Math.cos(p.age * 9) * decay,
                p.yaw + p.spinY * decay,
                p.wobbleZ * Math.cos(p.age * 7 + 1) * decay
            )
            tmpObj.scale.setScalar(markerScale(p.age))
            tmpObj.updateMatrix()
            mesh.setMatrixAt(i, tmpObj.matrix)

            peakOpacity = Math.max(peakOpacity, markerOpacity(p.age, p.expireAt))
        })

        // Per-instance opacity isn't available on a shared material, so the
        // pool tracks whichever mark is most visible. Acceptable at this
        // size — marks rarely sit at very different fade stages at once,
        // and one already fading is unobtrusive by the time it would matter.
        material.opacity = peakOpacity * 0.85
        mesh.instanceMatrix.needsUpdate = true
    })

    return <instancedMesh ref={meshRef} args={[geometry, material, POOL_SIZE]} frustumCulled={false} />
}

const tmpSparkColor = new THREE.Color()

/**
 * Embers thrown off a landing mark.
 *
 * **Each spark dies on its own schedule, and dies abruptly.** A real spark
 * cools a little, holding most of its brightness, and then stops — it does
 * not ease to zero, and no two go out together. Fading the whole pool out
 * on one curve, which is what this did first, reads as an animation being
 * played rather than as sparks: every ember dimming in perfect lockstep is
 * the giveaway.
 *
 * That needs per-instance brightness, which a shared material can't give —
 * `material.opacity` is one number for the whole pool. So brightness rides
 * on `instanceColor` instead (`setColorAt`), which means the material has
 * to be one whose output `instanceColor` actually modulates: an unlit
 * `MeshBasicMaterial`, not the emissive standard material the marks use,
 * where the emissive term would swamp it.
 */
function SparkPool({ pool, color }) {
    const meshRef = useRef(null)
    const geometry = useMemo(
        () => new THREE.BoxGeometry(SPARK_SIZE, SPARK_SIZE, SPARK_SIZE * 2.4),
        []
    )
    const material = useMemo(
        () =>
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: SPARK_OPACITY,
                // Transparent *and* depth-writing, like everything else in
                // this file: PostFX drops anything missing from the depth
                // buffer. See the note at the top.
                depthWrite: true,
                toneMapped: false,
            }),
        []
    )
    useEffect(() => () => material.dispose(), [material])

    useFrame((_, delta) => {
        const mesh = meshRef.current
        if (!mesh) return
        const dt = Math.min(delta, 0.05)

        pool.forEach((p, i) => {
            if (!p.active) {
                tmpObj.position.set(0, -9999, 0)
                tmpObj.scale.setScalar(0.0001)
                tmpObj.updateMatrix()
                mesh.setMatrixAt(i, tmpObj.matrix)
                return
            }

            p.age += dt
            // Snuffed: no fade-out ramp at all, it is simply gone.
            if (p.age >= p.life) {
                p.active = false
                tmpObj.position.set(0, -9999, 0)
                tmpObj.scale.setScalar(0.0001)
                tmpObj.updateMatrix()
                mesh.setMatrixAt(i, tmpObj.matrix)
                return
            }

            const t = p.age
            const x = p.origin.x + p.vel.x * t
            const y = p.origin.y + p.vel.y * t + 0.5 * SPARK_GRAVITY * t * t
            const z = p.origin.z + p.vel.z * t
            const yy = Math.max(y, 0.02)

            tmpObj.position.set(x, yy, z)
            // Point each spark along its own travel, so it streaks rather
            // than tumbling as a cube.
            tmpObj.lookAt(x + p.vel.x, yy + p.vel.y, z + p.vel.z)
            tmpObj.scale.set(1, 1, 1.6)
            tmpObj.updateMatrix()
            mesh.setMatrixAt(i, tmpObj.matrix)

            // Cools a little across its life — never to nothing, because
            // what ends it is the snuff above, not this.
            const cooled = 1 - p.dim * (t / p.life)
            tmpSparkColor.copy(color).multiplyScalar(cooled)
            mesh.setColorAt(i, tmpSparkColor)
        })

        mesh.instanceMatrix.needsUpdate = true
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    })

    return (
        <instancedMesh
            ref={meshRef}
            args={[geometry, material, SPARK_POOL]}
            frustumCulled={false}
        />
    )
}

function makeFlashPool() {
    return Array.from({ length: FLASH_POOL }, () => ({ active: false, age: 0, x: 0, z: 0 }))
}

/**
 * The landing flash. A flat disc on the floor, additive, facing up —
 * drawn after the mark so it washes over it for the instant it lasts.
 *
 * Additive blending is the one place in this file where `depthWrite` is
 * false and that's correct rather than a bug: an additive pass contributes
 * light without occluding, and it's explicitly excluded from the PostFX
 * depth read for that reason (it has no depth of its own to contribute —
 * it's lying on a floor that already wrote depth there).
 */
function FlashPool({ pool, material }) {
    const meshRef = useRef(null)
    const geometry = useMemo(() => new THREE.CircleGeometry(FLASH_RADIUS, 32), [])

    useFrame((_, delta) => {
        const mesh = meshRef.current
        if (!mesh) return
        const dt = Math.min(delta, 0.05)
        let peak = 0

        pool.forEach((p, i) => {
            if (!p.active) {
                tmpObj.position.set(0, -9999, 0)
                tmpObj.scale.setScalar(0.0001)
                tmpObj.updateMatrix()
                mesh.setMatrixAt(i, tmpObj.matrix)
                return
            }
            p.age += dt
            if (p.age >= FLASH_IN_SECONDS + FLASH_OUT_SECONDS) {
                p.active = false
                tmpObj.position.set(0, -9999, 0)
                tmpObj.scale.setScalar(0.0001)
                tmpObj.updateMatrix()
                mesh.setMatrixAt(i, tmpObj.matrix)
                return
            }

            // Snap on, fall away steeply. The decay is a fourth power
            // rather than a square: at a square it still reads as a ramp
            // being animated, which is the one thing a flash must not look
            // like. The spread barely moves, so what the eye catches is the
            // change in brightness, not something growing.
            let level
            let spread
            if (p.age < FLASH_IN_SECONDS) {
                const t = p.age / FLASH_IN_SECONDS
                level = t
                spread = 0.85 + t * 0.1
            } else {
                const t = (p.age - FLASH_IN_SECONDS) / FLASH_OUT_SECONDS
                const k = 1 - t
                level = k * k * k * k
                spread = 0.95 + t * 0.12
            }

            tmpObj.position.set(p.x, MARKER_Y + 0.02, p.z)
            tmpObj.rotation.set(-Math.PI / 2, 0, 0)
            tmpObj.scale.setScalar(spread)
            tmpObj.updateMatrix()
            mesh.setMatrixAt(i, tmpObj.matrix)
            peak = Math.max(peak, level)
        })

        material.opacity = peak * FLASH_PEAK
        mesh.instanceMatrix.needsUpdate = true
    })

    return (
        <instancedMesh
            ref={meshRef}
            args={[geometry, material, FLASH_POOL]}
            frustumCulled={false}
            renderOrder={3}
        />
    )
}

function usePlayWatcher(latestPlay, onMark) {
    const lastActionNumberRef = useRef(null)
    useLayoutEffect(() => {
        if (!latestPlay || latestPlay.actionNumber === lastActionNumberRef.current) return
        lastActionNumberRef.current = latestPlay.actionNumber
        const mark = markerForPlay(latestPlay)
        if (mark) onMark(mark)
    }, [latestPlay, onMark])
}

export default function LiveGameOverlay({ active, latestPlay }) {
    // One marker pool and one spark pool per kind, built once. Kept keyed by
    // kind rather than as four named refs so adding a symbol is a `MARKS`
    // entry and nothing else.
    const pools = useRef(null)
    if (!pools.current) {
        pools.current = Object.fromEntries(
            MARK_KIND_LIST.map((kind) => [
                kind,
                { marks: makeMarkerPool(), sparks: makeSparkPool(), flashes: makeFlashPool() },
            ])
        )
    }

    const assets = useMemo(
        () =>
            Object.fromEntries(
                MARK_KIND_LIST.map((kind) => [
                    kind,
                    {
                        geometry: extrude(MARKS[kind].shape()),
                        material: glowMaterial(MARKS[kind].color),
                        sparkColor: SPARK_WHITE.clone().lerp(MARKS[kind].color, SPARK_TINT),
                        flashMaterial: flashMaterial(MARKS[kind].color),
                    },
                ])
            ),
        []
    )

    const burst = useMemo(
        () => (pool, x, z) => {
            for (let i = 0; i < SPARKS_PER_BURST; i++) {
                const s = claimSlot(pool)
                s.active = true
                s.age = 0
                s.origin.set(x, MARKER_Y + 0.1, z)
                const angle = Math.random() * Math.PI * 2
                // Cube-rooted so speeds spread through the disc instead of
                // clustering at the rim — a uniform random radius puts most
                // sparks at a similar distance and reads as a ring.
                // Kept tight to the mark: under real gravity these still
                // arc and fall, but the burst stays a few feet across
                // rather than spraying over the paint.
                const speed = 1.8 + Math.cbrt(Math.random()) * 4.2
                s.vel.set(
                    Math.cos(angle) * speed,
                    3.2 + Math.random() * 4.2,
                    Math.sin(angle) * speed
                )
                s.spin = (Math.random() - 0.5) * 6
                s.life = SPARK_LIFE_MIN + Math.random() * (SPARK_LIFE_MAX - SPARK_LIFE_MIN)
                // A little variation in how much each one dims before it
                // goes, so they don't all dim in lockstep either.
                s.dim = 0.2 + Math.random() * 0.3
            }
        },
        []
    )

    // The flash and the sparks fire together, on the frame the mark lands.
    const onLand = useMemo(
        () =>
            Object.fromEntries(
                MARK_KIND_LIST.map((kind) => [
                    kind,
                    (x, z) => {
                        burst(pools.current[kind].sparks, x, z)
                        const f = claimSlot(pools.current[kind].flashes)
                        f.active = true
                        f.age = 0
                        f.x = x
                        f.z = z
                    },
                ])
            ),
        [burst]
    )

    const onMark = useMemo(
        () => (mark) => {
            const pool = pools.current[mark.kind]
            if (!pool) return

            // Retire whatever is already on the floor. Across every pool,
            // not just this one: "the next mark" means the next mark of any
            // kind, and a miss should clear a rebound as readily as another
            // miss. A mark that hasn't had its minimum yet is left to run
            // out that time instead of being cut short.
            for (const kind of MARK_KIND_LIST) {
                for (const other of pools.current[kind].marks) {
                    if (!other.active) continue
                    other.expireAt = Math.min(
                        other.expireAt,
                        Math.max(other.age, MIN_VISIBLE_SECONDS)
                    )
                }
            }

            const slot = claimSlot(pool.marks)
            slot.active = true
            slot.age = 0
            slot.expireAt = MIN_VISIBLE_SECONDS
            slot.x = mark.x
            slot.z = mark.z
            slot.wobbleX = (Math.random() - 0.5) * 0.7
            slot.wobbleZ = (Math.random() - 0.5) * 0.7
            // A directional mark keeps its facing: only the symmetric ones
            // get a random settling spin, which would otherwise leave an
            // arrow pointing somewhere it doesn't mean.
            if (mark.direction) {
                slot.yaw = mark.direction > 0 ? 0 : Math.PI
                slot.spinY = 0
            } else {
                slot.yaw = 0
                slot.spinY = (Math.random() - 0.5) * 1.6
            }
        },
        []
    )

    usePlayWatcher(active ? latestPlay : null, onMark)

    if (!active) return null

    return (
        <>
            {MARK_KIND_LIST.map((kind) => (
                <MarkerPool
                    key={kind}
                    pool={pools.current[kind].marks}
                    geometry={assets[kind].geometry}
                    material={assets[kind].material}
                    onLand={onLand[kind]}
                />
            ))}
            {MARK_KIND_LIST.map((kind) => (
                <SparkPool
                    key={kind}
                    pool={pools.current[kind].sparks}
                    color={assets[kind].sparkColor}
                />
            ))}
            {MARK_KIND_LIST.map((kind) => (
                <FlashPool
                    key={kind}
                    pool={pools.current[kind].flashes}
                    material={assets[kind].flashMaterial}
                />
            ))}
        </>
    )
}
