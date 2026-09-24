import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import {
    COURT_HALF,
    COURT_LENGTH,
    COURT_WIDTH,
    LIGHT_RIG,
    PLANE_LENGTH,
    PLANE_WIDTH,
} from './constants'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import {
    SHADER_SIGNATURE,
    defaultUniformValues,
    fragmentShader,
    vertexShader,
} from './court-shader'
import { posePosition, solveDistance } from './camera-poses'
import { grainMaskFallback } from './court-grain'
import { debugState } from './debug-state'
import Hoop from './Hoop'
import ShotColumns from './ShotColumns'
import { ArenaBowl, ArenaSeating } from './Arena'
import DFenceShow from './DFenceShow'
import Basketball from './Basketball'
import FloorReflection from './FloorReflection'
import Confetti from './Confetti'
import LiveGameOverlay from './live/LiveGameOverlay'
import ScoreboardText, { scoreboardLights } from './live/ScoreboardText'
import { PANEL_DEFAULTS } from './sign-material'

const EMPTY_SIGN_LIGHTS = []
/** The scoreboard's own panel colour — it is the thing doing the lighting. */
const SIGN_LIGHT_COLOR = PANEL_DEFAULTS.color
/** How far the spill carries across the deck, in feet. */
const SIGN_LIGHT_REACH = 26
/** Scales panel brightness into a floor-spill term. */
const SIGN_FLOOR_GAIN = 0.16
/** ...and into a point light for the chairs, which are standard materials. */
const SIGN_CHAIR_GAIN = 52
/** The lamp sits a little proud of the faces; its height comes with them. */
const SIGN_LIGHT_FORWARD = 3
/** Beyond this the chairs are lit by the house, not the scoreboard. */
const SIGN_LIGHT_DISTANCE = 52
/** Wide — this is a tall panel washing what's in front of it, not a beam. */
const SIGN_LIGHT_ANGLE = 1.15
/** How far forward the wash is aimed. */
const SIGN_LIGHT_THROW = 22

/**
 * One scoreboard character's light, washing forward onto the chairs and the
 * deck in front of it.
 *
 * A spot with an explicit target rather than a point light: light leaves
 * the front of the characters and nowhere else, and a point light spilled
 * backward into the bowl standing behind the scoreboard. The target has to
 * be set explicitly too — a spot's default target is the world origin,
 * which from either sign aims diagonally across at centre court and leaves
 * the chairs immediately in front of it outside the cone.
 */
function SignSpotLight({ light }) {
    const ref = useRef(null)
    const targetRef = useRef(null)

    useEffect(() => {
        if (!ref.current || !targetRef.current) return
        ref.current.target = targetRef.current
        targetRef.current.updateMatrixWorld()
    }, [light])

    return (
        <>
            <spotLight
                ref={ref}
                position={[light.x, light.y, light.z + SIGN_LIGHT_FORWARD]}
                color={SIGN_LIGHT_COLOR}
                intensity={light.intensity * SIGN_CHAIR_GAIN}
                distance={SIGN_LIGHT_DISTANCE}
                angle={SIGN_LIGHT_ANGLE}
                penumbra={1}
                decay={2}
            />
            {/* Straight out from the face, angled down onto the seats. */}
            <object3D ref={targetRef} position={[light.x, 0, light.z + SIGN_LIGHT_THROW]} />
        </>
    )
}

/** Length of the court-to-court dissolve. */
const CROSSFADE_SECONDS = 0.45
// Long enough that a reaction reads as the camera deciding to look
// somewhere rather than being cut there. Comfortably shorter than the
// briefest scene hold (HOLD_SECONDS.nudge, 2.5s), so a move still settles
// before the scene releases — but the rig no longer depends on that: an
// interrupted move now continues from wherever it got to.
const POSE_MOVE_SECONDS = 1.8

const tmpPos = new THREE.Vector3()
const tmpTarget = new THREE.Vector3()

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** A camera state in the same terms a pose is described in. */
const makeRigState = () => ({
    elevation: 0,
    azimuth: 0,
    dist: 0,
    fov: 0,
    target: [0, 0, 0],
    valid: false,
})

function copyRigState(dst, src) {
    dst.elevation = src.elevation
    dst.azimuth = src.azimuth
    dst.dist = src.dist
    dst.fov = src.fov
    dst.target[0] = src.target[0]
    dst.target[1] = src.target[1]
    dst.target[2] = src.target[2]
    dst.valid = src.valid
}

/**
 * Drives the camera from named poses.
 *
 * Moves are staged rather than instant: the rig eases from wherever it
 * currently is to the incoming pose, solving the framing distance for the
 * current aspect. Pointer parallax rides on top and is suppressed while a
 * move is in flight, so the two never fight.
 *
 * **The move interpolates in pose terms — elevation, azimuth, distance,
 * target, fov — not between two world positions.** Lerping world positions
 * cuts a straight chord between two points on an orbit, so the camera dips
 * toward the floor mid-move and climbs back out; going through the angles
 * instead sweeps a real arc, which is what a pan actually looks like.
 *
 * **And the move starts from what's on screen, not from the previous
 * pose.** The rig watches for a retarget itself, inside the frame loop, and
 * snapshots its own current state as the new starting point. Handing it the
 * outgoing *pose* instead — which is what it used to get — meant that
 * retargeting while a move was still in flight teleported the camera to the
 * unreached old target before easing on to the new one. Live play arrives
 * faster than a move completes (a scene holds for a few seconds, then
 * releases back to the base pose, and the next play can land on top of
 * either), so that was most transitions, and it read as a hard cut no
 * amount of easing could soften.
 */
function CameraRig({ pointer, reducedMotion, pose, moveRef, tuning }) {
    const { camera, size } = useThree()
    const current = useRef({ yaw: 0, lift: 0 })
    const fit = useRef({ aspect: 0, cache: new Map() })
    // What went on screen last frame, and where the current move began.
    // Separate objects, never aliased: both are mutated in place each frame.
    const live = useRef(makeRigState())
    const from = useRef(makeRigState())
    const lastPoseId = useRef(null)
    // Free-running, unlike the parallax yaw above — a pose that wants to
    // keep orbiting shouldn't ease toward a settled value the way pointer
    // parallax does, it should just keep going.
    const orbitRef = useRef(0)

    useFrame((_, delta) => {
        const aspect = size.width / Math.max(size.height, 1)
        if (fit.current.aspect !== aspect) {
            fit.current = { aspect, cache: new Map() }
        }
        // ?zoom= multiplies the framing distance, for inspecting detail at
        // the scale it will actually be judged at. Kept as a dial rather than a
        // temporary edit because close inspection is how most of this work gets
        // reviewed.
        const zoom = tuning && tuning.zoom != null ? Math.max(0.05, tuning.zoom) : 1
        const distFor = (p) => {
            let d = fit.current.cache.get(p.id)
            if (d === undefined) {
                d = solveDistance(p, aspect)
                // Live scenes mint a pose id per play, so without a bound
                // this grows for the whole length of a game. The working
                // set is two poses (the move's start and end), so any small
                // cap does the job; drop it wholesale rather than tracking
                // recency for what is a handful of cheap solves.
                if (fit.current.cache.size > 32) fit.current.cache.clear()
                fit.current.cache.set(p.id, d)
            }
            return d * zoom
        }

        const toDist = distFor(pose)

        // Retarget detection lives here, not in an effect, so the snapshot
        // it takes is the state that was actually rendered rather than
        // whatever a parent believed the camera had reached.
        if (lastPoseId.current !== pose.id) {
            lastPoseId.current = pose.id
            if (live.current.valid) {
                copyRigState(from.current, live.current)
                moveRef.current = 0
            } else {
                // First frame: nothing to move from, so take the pose whole.
                moveRef.current = 1
            }
        }

        if (moveRef.current < 1) {
            moveRef.current = Math.min(
                1,
                moveRef.current + delta / (reducedMotion ? 0.001 : POSE_MOVE_SECONDS)
            )
        }
        const k = easeInOut(moveRef.current)

        // Parallax is held back until the move lands. A pose that's already
        // driving its own continuous orbit drops the horizontal parallax
        // entirely — pointer jitter riding on top of a steady rotation reads
        // as stutter, not added depth, the way it does on a pose that's
        // otherwise sitting still.
        const settle = k * k
        const targetYaw = reducedMotion || pose.orbitSpeed ? 0 : pointer.current.x * 0.055 * settle
        const targetLift = reducedMotion ? 0 : pointer.current.y * 0.045 * settle
        const ease = 1 - Math.pow(0.0015, delta)
        current.current.yaw += (targetYaw - current.current.yaw) * ease
        current.current.lift += (targetLift - current.current.lift) * ease

        if (pose.orbitSpeed) {
            // Clamped like Confetti's own dt: the render loop can go fully
            // idle while this tab is backgrounded (see CourtViewer's
            // useRenderActive), and an unclamped delta on the frame it
            // resumes would fast-forward this by however long that was —
            // one real frame's worth of rotation is enough to land
            // anywhere, so cap it rather than let the orbit visibly pop.
            const orbitDelta = Math.min(delta, 0.1)
            orbitRef.current += THREE.MathUtils.degToRad(pose.orbitSpeed) * orbitDelta
        }
        const yaw = current.current.yaw + orbitRef.current

        // Straight lerps rather than shortest-arc: every azimuth in the pose
        // set is an absolute bearing well inside ±180°, so there's no wrap to
        // take the short way round.
        const L = THREE.MathUtils.lerp
        const s = live.current
        const f = from.current
        const blend = k < 1 && f.valid
        s.elevation = blend ? L(f.elevation, pose.elevation, k) : pose.elevation
        s.azimuth = blend ? L(f.azimuth, pose.azimuth, k) : pose.azimuth
        s.dist = blend ? L(f.dist, toDist, k) : toDist
        s.fov = blend ? L(f.fov, pose.fov, k) : pose.fov
        for (let i = 0; i < 3; i++) {
            s.target[i] = blend ? L(f.target[i], pose.target[i], k) : pose.target[i]
        }
        s.valid = true

        posePosition(s, s.dist, yaw, current.current.lift, tmpPos)
        tmpTarget.set(s.target[0], s.target[1], s.target[2])

        camera.position.copy(tmpPos)
        camera.lookAt(tmpTarget)

        if (Math.abs(camera.fov - s.fov) > 0.001) {
            camera.fov = s.fov
            camera.updateProjectionMatrix()
        }
    })

    return null
}

/**
 * The house rig as real lights.
 *
 * The court floor is lit analytically inside its own shader, but the hoop
 * assemblies are actual geometry with actual materials, so they need actual
 * lights. These stand in for the same fixtures the shader reflects — same
 * height, same spacing — so both halves of the scene read as one room.
 * RectAreaLight has no shadow support, which is why the stanchions carry
 * their own contact shadows.
 */
function HouseLights() {
    const lights = useMemo(() => {
        RectAreaLightUniformsLib.init()
        const out = []
        // A subset of the shader's rig — enough angles that the hoops pick up
        // the same cross-lighting without paying for a real light per head.
        const pitch =
            LIGHT_RIG.groupSize * LIGHT_RIG.inGroupSpacing + LIGHT_RIG.groupGap
        const groups = LIGHT_RIG.perRow / LIGHT_RIG.groupSize
        const spanHalf =
            ((groups - 1) * pitch +
                (LIGHT_RIG.groupSize - 1) * LIGHT_RIG.inGroupSpacing) / 2
        for (const side of [-1, 1]) {
            for (let i = 0; i < LIGHT_RIG.perRow; i += 2) {
                const grp = Math.floor(i / LIGHT_RIG.groupSize)
                const w = i % LIGHT_RIG.groupSize
                const x = grp * pitch + w * LIGHT_RIG.inGroupSpacing - spanHalf
                const t = LIGHT_RIG.groupSize > 1 ? w / (LIGHT_RIG.groupSize - 1) : 0.5
                out.push({
                    key: `${side}:${i}`,
                    position: [x, LIGHT_RIG.height, side * LIGHT_RIG.rowZ],
                    target: [
                        x + (t - 0.5) * LIGHT_RIG.sweepSpan,
                        0,
                        -side * LIGHT_RIG.aimCross,
                    ],
                })
            }
        }
        return out
    }, [])

    return (
        <>
            {lights.map(({ key, ...light }) => (
                <BankSpot key={key} {...light} />
            ))}
            <hemisphereLight args={['#93a7c4', '#2a2016', 0.75]} />
            <ambientLight intensity={0.22} />
        </>
    )
}

/** One head of a bank, aimed the same way the shader aims its counterpart. */
function BankSpot({ position, target }) {
    const ref = useRef(null)
    useEffect(() => {
        if (!ref.current) return
        ref.current.target.position.set(target[0], target[1], target[2])
        ref.current.target.updateMatrixWorld()
    }, [target])
    return (
        <spotLight
            ref={ref}
            position={position}
            angle={THREE.MathUtils.degToRad(LIGHT_RIG.coneOuter)}
            penumbra={0.7}
            distance={0}
            // Real inverse-square falloff. With decay 0 every surface took the
            // same illuminance regardless of distance or angle, which is why
            // the stanchion padding read as one flat colour per face while the
            // floor beside it fell off convincingly — the floor's gradient is
            // computed analytically in its own shader, so it never depended on
            // these. Intensity is scaled up to compensate for the d^2 divisor.
            decay={2}
            intensity={1500}
            color="#fff4e2"
        />
    )
}

/**
 * The bowl floor the court sits on. Not a backdrop image — a plane wide enough
 * to run past the frame, carrying only the bounce that escapes the pool, so
 * the apron has something to fall off into.
 */
/**
 * The deck the whole arena sits on.
 *
 * It carries its own shader rather than a lit material, which means scene
 * lights do nothing to it — so the scoreboard's spill onto the floor in
 * front of it has to be an explicit term here. `signLights` is where the
 * lit faces are and how hard each is burning; the courtside chairs get the
 * same spill from real point lights, because those *are* standard materials.
 */
function ArenaFloor({ signLights = EMPTY_SIGN_LIGHTS }) {
    const material = useMemo(
        () =>
            new THREE.ShaderMaterial({
                uniforms: {
                    uCourtHalf: { value: new THREE.Vector2(...COURT_HALF) },
                    uColor: { value: new THREE.Color('#0b0d12') },
                    uBounce: { value: new THREE.Color('#1d2433') },
                    uSignPos: {
                        value: [new THREE.Vector3(), new THREE.Vector3()],
                    },
                    uSignIntensity: { value: [0, 0] },
                    uSignColor: { value: new THREE.Color(SIGN_LIGHT_COLOR) },
                    uSignReach: { value: SIGN_LIGHT_REACH },
                },
                vertexShader: /* glsl */ `
                    varying vec3 vWorld;
                    void main() {
                        vec4 world = modelMatrix * vec4(position, 1.0);
                        vWorld = world.xyz;
                        gl_Position = projectionMatrix * viewMatrix * world;
                    }
                `,
                fragmentShader: /* glsl */ `
                    uniform vec2 uCourtHalf;
                    uniform vec3 uColor;
                    uniform vec3 uBounce;
                    uniform vec3 uSignPos[2];
                    uniform float uSignIntensity[2];
                    uniform vec3 uSignColor;
                    uniform float uSignReach;
                    varying vec3 vWorld;
                    void main() {
                        vec2 d = abs(vWorld.xz) - uCourtHalf;
                        float edge = max(max(d.x, d.y), 0.0);
                        float bounce = exp(-edge * 0.035);
                        vec3 color = mix(uColor, uBounce, bounce * 0.55);

                        // Spill from the scoreboard's lit faces. Falls off
                        // with distance, and only forward: the light leaves
                        // the front of each character and nowhere else, so
                        // the deck behind them stays dark.
                        for (int i = 0; i < 2; i++) {
                            vec3 sp = uSignPos[i];
                            float dist = distance(vWorld.xz, sp.xz);
                            float fall = 1.0 / (1.0 + (dist / uSignReach) * (dist / uSignReach));
                            float front = smoothstep(-2.0, 10.0, vWorld.z - sp.z);
                            color += uSignColor * (uSignIntensity[i] * fall * front);
                        }

                        gl_FragColor = vec4(color, 1.0);
                        #include <tonemapping_fragment>
                        #include <colorspace_fragment>
                    }
                `,
            }),
        []
    )

    useEffect(() => {
        const u = material.uniforms
        for (let i = 0; i < 2; i++) {
            const light = signLights[i]
            u.uSignPos.value[i].set(light ? light.x : 0, 0, light ? light.z : 0)
            u.uSignIntensity.value[i] = light ? light.intensity * SIGN_FLOOR_GAIN : 0
        }
    }, [material, signLights])

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
            <planeGeometry args={[900, 900]} />
            <primitive object={material} attach="material" />
        </mesh>
    )
}

/**
 * The court. One quad, one shader; see court-shader.js for why the lighting
 * lives entirely in the fragment stage.
 */
function CourtSurface({
    texture,
    prevTexture,
    mixRef,
    dim = 1,
    debugSpec = false,
    tuning = null,
    ribbonColors,
    celebrate = false,
    celebrateColor,
    materialRef,
    meshRef,
}) {
    const dimRef = useRef(1)
    const baseRef = useRef(null)
    const timeRef = useRef(0)
    const keyColorRef = useRef(null)
    const celebratePrimaryRef = useRef(new THREE.Color())

    const uniforms = useMemo(() => {
        const v = defaultUniformValues()
        return {
            uMap: { value: null },
            uMapPrev: { value: null },
            uMix: { value: 1 },
            uCourtHalf: { value: new THREE.Vector2(...COURT_HALF) },
            // Filled in each frame by `FloorReflection`; null until the
            // first pass has run, which the shader handles via w <= 0.
            uReflectMap: { value: null },
            uReflectMatrix: { value: new THREE.Matrix4() },
            uReflectStrength: { value: v.reflectStrength },
            uReflectBlur: { value: v.reflectBlur },
            uReflectDebug: { value: v.reflectDebug },
            uReflectBlack: { value: v.reflectBlack },
            uReflectMinF: { value: v.reflectMinF },
            uReflectRipple: { value: v.reflectRipple },
            uReflectOcclude: { value: v.reflectOcclude },
            uEdgeFeather: { value: v.edgeFeather },
            uSpill: { value: v.spill },
            uKeyColor: { value: new THREE.Color(v.keyColor) },
            uKey: { value: v.key },
            uAmbientColor: { value: new THREE.Color(v.ambientColor) },
            uAmbient: { value: v.ambient },
            uCenterFalloff: { value: v.centerFalloff },
            uLightHeight: { value: LIGHT_RIG.height },
            uRowZ: { value: LIGHT_RIG.rowZ },
            uInGroupSpacing: { value: LIGHT_RIG.inGroupSpacing },
            uGroupGap: { value: LIGHT_RIG.groupGap },
            uFixtureRadius: { value: LIGHT_RIG.fixtureRadius },
            uGroupSize: { value: LIGHT_RIG.groupSize },
            uSweepSpan: { value: LIGHT_RIG.sweepSpan },
            uAimCross: { value: LIGHT_RIG.aimCross },
            uConeInner: { value: Math.cos(THREE.MathUtils.degToRad(LIGHT_RIG.coneInner)) },
            uConeOuter: { value: Math.cos(THREE.MathUtils.degToRad(LIGHT_RIG.coneOuter)) },
            uCornerRadius: { value: v.cornerRadius },
            uCeilingFill: { value: v.ceilingFill },
            uCeilingSpacing: { value: v.ceilingSpacing },
            uFillFlatten: { value: v.fillFlatten },
            uPoolExpand: { value: v.poolExpand },
            uRibbonOffset: { value: v.ribbonOffset },
            uRibbonHeight: { value: v.ribbonHeight },
            uRibbonBandHalf: { value: v.ribbonBandHalf },
            uRibbonBlockSize: { value: v.ribbonBlockSize },
            uRibbonIntensity: { value: v.ribbonIntensity },
            uRibbonSpeed: { value: v.ribbonSpeed },
            uRibbonColorSwap: { value: v.ribbonColorSwap },
            uRibbonPrimary: { value: new THREE.Color(ribbonColors?.ribbonPrimary || '#2b3350') },
            uRibbonSecondary: { value: new THREE.Color(ribbonColors?.ribbonSecondary || '#171a26') },
            uTime: { value: 0 },
            uPaintGrain: { value: v.paintGrain },
            uPaintScale: { value: v.paintScale },
            uPlaneHalf: { value: new THREE.Vector2(PLANE_LENGTH / 2, PLANE_WIDTH / 2) },
            uGrainMask: { value: grainMaskFallback() },
            uMapSize: { value: new THREE.Vector2(2016, 992) },
            uGrainStrength: { value: v.grainStrength },
            uRippleAmp: { value: v.rippleAmp },
            uRippleScale: { value: v.rippleScale },
            uMatte: { value: v.matte },
            uGlossVar: { value: v.glossVar },
            uRoughness: { value: v.roughness },
            uSpecular: { value: v.specular },
            uGrain: { value: v.grain },
            uDebugSpec: { value: 0 },
        }
    }, [])

    useFrame((_, delta) => {
        const m = materialRef.current
        if (!m) return
        // The viewer resets the mix to 0 when the court changes; drive the
        // dissolve here so it stays tied to render time rather than a timer.
        if (mixRef.current < 1) {
            mixRef.current = Math.min(1, mixRef.current + delta / CROSSFADE_SECONDS)
        }
        // Free-running clock for the ribbon's crawl — never resets, so the
        // pattern doesn't jump when a court switch resets mixRef above.
        timeRef.current += delta
        m.uniforms.uTime.value = timeRef.current
        // Ease the house lights down when an overlay needs the contrast.
        // The baselines are captured on first frame rather than read from
        // userData: a throw in here aborts every later useFrame in the same
        // frame, which silently took the overlay's own animation with it.
        if (!baseRef.current) {
            baseRef.current = {
                key: m.uniforms.uKey.value,
                specular: m.uniforms.uSpecular.value,
                ambient: m.uniforms.uAmbient.value,
                ribbon: m.uniforms.uRibbonIntensity.value,
            }
            keyColorRef.current = m.uniforms.uKeyColor.value.clone()
        }
        const base = baseRef.current

        // URL overrides, applied every frame so they can be swept live. These
        // exist because tuning by editing a file, reloading and describing the
        // result to each other is a slow and unreliable way to agree on a
        // number — far better that the person looking at it holds the dial.
        if (tuning) {
            if (tuning.key != null) base.key = tuning.key
            if (tuning.spec != null) base.specular = tuning.spec
            if (tuning.grain != null) m.uniforms.uGrainStrength.value = tuning.grain
            if (tuning.matte != null) m.uniforms.uMatte.value = tuning.matte
            if (tuning.reflect != null) m.uniforms.uReflectStrength.value = tuning.reflect
            if (tuning.reflectblur != null) m.uniforms.uReflectBlur.value = tuning.reflectblur
            if (tuning.reflectdebug != null) m.uniforms.uReflectDebug.value = tuning.reflectdebug
            if (tuning.reflectblack != null) m.uniforms.uReflectBlack.value = tuning.reflectblack
            if (tuning.reflectminf != null) m.uniforms.uReflectMinF.value = tuning.reflectminf
            if (tuning.reflectripple != null) m.uniforms.uReflectRipple.value = tuning.reflectripple
            if (tuning.reflectocclude != null) m.uniforms.uReflectOcclude.value = tuning.reflectocclude
            if (tuning.glossvar != null) m.uniforms.uGlossVar.value = tuning.glossvar
            if (tuning.ripple != null) m.uniforms.uRippleAmp.value = tuning.ripple
            if (tuning.ripplescale != null) m.uniforms.uRippleScale.value = tuning.ripplescale
            if (tuning.rough != null) m.uniforms.uRoughness.value = tuning.rough
            if (tuning.corner != null) m.uniforms.uCornerRadius.value = tuning.corner
            if (tuning.fill != null) m.uniforms.uCeilingFill.value = tuning.fill
            if (tuning.expand != null) m.uniforms.uPoolExpand.value = tuning.expand
            if (tuning.ribbonoffset != null) m.uniforms.uRibbonOffset.value = tuning.ribbonoffset
            if (tuning.ribbonheight != null) m.uniforms.uRibbonHeight.value = tuning.ribbonheight
            if (tuning.ribbonband != null) m.uniforms.uRibbonBandHalf.value = tuning.ribbonband
            if (tuning.ribbonblock != null) m.uniforms.uRibbonBlockSize.value = tuning.ribbonblock
            if (tuning.ribbonspeed != null) m.uniforms.uRibbonSpeed.value = tuning.ribbonspeed
            if (tuning.ribbonswap != null) m.uniforms.uRibbonColorSwap.value = tuning.ribbonswap
            if (tuning.ribbon != null) base.ribbon = tuning.ribbon
            if (tuning.paintgrain != null) m.uniforms.uPaintGrain.value = tuning.paintgrain
            if (tuning.paintscale != null) m.uniforms.uPaintScale.value = tuning.paintscale
            if (tuning.fillspacing != null) m.uniforms.uCeilingSpacing.value = tuning.fillspacing
            if (tuning.fillflatten != null) m.uniforms.uFillFlatten.value = tuning.fillflatten
            if (tuning.rowz != null) m.uniforms.uRowZ.value = tuning.rowz
            if (tuning.lheight != null) m.uniforms.uLightHeight.value = tuning.lheight
            if (tuning.fspacing != null) m.uniforms.uInGroupSpacing.value = tuning.fspacing
            if (tuning.gap != null) m.uniforms.uGroupGap.value = tuning.gap
            if (tuning.fradius != null) m.uniforms.uFixtureRadius.value = tuning.fradius
            if (tuning.group != null) m.uniforms.uGroupSize.value = tuning.group
            if (tuning.sweep != null) m.uniforms.uSweepSpan.value = tuning.sweep
            if (tuning.aim != null) m.uniforms.uAimCross.value = tuning.aim
            if (tuning.cone != null) {
                m.uniforms.uConeOuter.value = Math.cos(THREE.MathUtils.degToRad(tuning.cone))
            }
        }

        const k = 1 - Math.pow(0.02, delta)
        dimRef.current += (dim - dimRef.current) * k
        m.uniforms.uKey.value = base.key * dimRef.current
        m.uniforms.uSpecular.value = base.specular * dimRef.current
        m.uniforms.uAmbient.value = base.ambient * (0.45 + 0.55 * dimRef.current)
        // The ribbon dims with everything else now — it was deliberately left
        // independent of dim at first so it would "pop" against the dark shot
        // map, but the actual ask was that it behave like the heads do, which
        // it now does exactly: same dimRef, same curve.
        m.uniforms.uRibbonIntensity.value = base.ribbon * dimRef.current

        // The celebration view shifts the house lights themselves toward the
        // court's own primary colour — eased, so it reads as the rig
        // actually changing gel rather than a hard cut, and eased back the
        // same way the moment the view is left.
        if (keyColorRef.current) {
            // Toward the primary colour, but not all the way — a house
            // light run at full saturation reads as a coloured gel slapped
            // over the lens rather than a coloured light actually lighting
            // the floor, so this settles for mostly-there.
            // The winning team's colour when a game has just been won,
            // which is not necessarily the colour of the court being played
            // on — the away team wins on the home team's floor about half
            // the time.
            celebratePrimaryRef.current
                .set(celebrateColor || ribbonColors?.ribbonPrimary || '#2b3350')
                .lerp(keyColorRef.current, 0.3)
            const target = celebrate ? celebratePrimaryRef.current : keyColorRef.current
            m.uniforms.uKeyColor.value.lerp(target, 1 - Math.pow(0.001, delta))
        }

        m.uniforms.uDebugSpec.value = debugSpec ? 1 : 0

        // Report what the GPU is really running, not what the file says.
        if (debugState.active) {
            const mask = m.uniforms.uGrainMask.value
            debugState.values = {
                grainStrength: m.uniforms.uGrainStrength.value,
                matte: m.uniforms.uMatte.value,
                glossVar: m.uniforms.uGlossVar.value,
                rippleAmp: m.uniforms.uRippleAmp.value,
                rippleScale: m.uniforms.uRippleScale.value,
                roughness: m.uniforms.uRoughness.value,
                specular: m.uniforms.uSpecular.value,
                key: m.uniforms.uKey.value,
                cornerRadius: m.uniforms.uCornerRadius.value,
                ceilingFill: m.uniforms.uCeilingFill.value,
                fillFlatten: m.uniforms.uFillFlatten.value,
                lightHeight: m.uniforms.uLightHeight.value,
                poolExpand: m.uniforms.uPoolExpand.value,
                paintGrain: m.uniforms.uPaintGrain.value,
                ribbonIntensity: m.uniforms.uRibbonIntensity.value,
                ribbonOffset: m.uniforms.uRibbonOffset.value,
                ribbonHeight: m.uniforms.uRibbonHeight.value,
                fixtureRadius: m.uniforms.uFixtureRadius.value,
                groupSize: m.uniforms.uGroupSize.value,
                inGroupSpacing: m.uniforms.uInGroupSpacing.value,
                groupGap: m.uniforms.uGroupGap.value,
                sweepSpan: m.uniforms.uSweepSpan.value,
            }
            debugState.maskSize = mask ? `${mask.image.width}x${mask.image.height}` : 'none'
            debugState.maskMeanWood =
                mask && mask.userData && typeof mask.userData.meanWood === 'number'
                    ? mask.userData.meanWood
                    : null
        }
        if (ribbonColors) {
            m.uniforms.uRibbonPrimary.value.set(ribbonColors.ribbonPrimary || '#2b3350')
            m.uniforms.uRibbonSecondary.value.set(ribbonColors.ribbonSecondary || '#171a26')
        }

        m.uniforms.uGrainMask.value =
            texture?.userData?.grainMask || grainMaskFallback()
        m.uniforms.uMap.value = texture
        m.uniforms.uMapPrev.value = prevTexture || texture
        m.uniforms.uMix.value = mixRef.current
    })

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[PLANE_LENGTH, PLANE_WIDTH]} />
            <shaderMaterial
                ref={materialRef}
                uniforms={uniforms}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                transparent
            />
        </mesh>
    )
}

export default function CourtScene({
    texture,
    prevTexture,
    mixRef,
    pointer,
    reducedMotion,
    pose,
    moveRef,
    shots,
    showShots,
    hexSize,
    minAttempts,
    courtColors,
    courtDim = 1,
    debugSpec = false,
    tuning = null,
    led = 0,
    showDFence = false,
    celebrate = false,
    celebrateColor = null,
    showLive = false,
    liveLatestPlay = null,
    liveTypography = null,
    liveScore = null,
    liveHomeColor = null,
    shotClockValue = undefined,
}) {
    const { gl } = useThree()
    // Only while a game is on screen: nothing else puts a scoreboard out
    // there to light anything.
    const signLights = useMemo(
        () => (showLive ? scoreboardLights(liveScore) : EMPTY_SIGN_LIGHTS),
        [showLive, liveScore]
    )
    // Shared with `FloorReflection`: it needs the material to feed the
    // reflection into, and the mesh to hide while rendering it.
    const courtMaterialRef = useRef(null)
    const courtMeshRef = useRef(null)

    useEffect(() => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05

        if (!debugState.active) return
        debugState.signature = SHADER_SIGNATURE
        try {
            const ctx = gl.getContext()
            const ext = ctx.getExtension('WEBGL_debug_renderer_info')
            debugState.renderer = ext
                ? ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL)
                : ctx.getParameter(ctx.RENDERER)
        } catch {
            debugState.renderer = 'unavailable'
        }
    }, [gl])

    if (!texture) return null

    return (
        <>
            <CameraRig
                pointer={pointer}
                reducedMotion={reducedMotion}
                pose={pose}
                moveRef={moveRef}
                tuning={tuning}
            />
            <HouseLights />
            <ArenaFloor signLights={signLights} />
            <Basketball />
            {/*
              The scoreboard lighting the room it stands in. The deck takes
              this as a shader term (it has no lit material); the chairs are
              standard materials, so for them it is a real light.
            */}
            {signLights.map((light, i) => (
                <SignSpotLight key={i} light={light} />
            ))}
            <ArenaBowl />
            <ArenaSeating padColor={courtColors?.pad} metalColor={courtColors?.metal} />
            <CourtSurface
                // Remounts when the shader source changes, so edits reach an
                // already-open page instead of silently doing nothing.
                key={SHADER_SIGNATURE}
                texture={texture}
                prevTexture={prevTexture}
                mixRef={mixRef}
                dim={courtDim}
                debugSpec={debugSpec}
                tuning={tuning}
                ribbonColors={courtColors}
                celebrate={celebrate}
                celebrateColor={celebrateColor}
                materialRef={courtMaterialRef}
                meshRef={courtMeshRef}
            />
            <FloorReflection courtRef={courtMeshRef} materialRef={courtMaterialRef} />
            <Hoop
                end={1}
                padColor={courtColors?.pad}
                structureColor={courtColors?.structure}
                metalColor={courtColors?.metal}
                tuning={tuning}
                led={led}
                celebrate={celebrate}
                shotClockValue={shotClockValue}
            />
            <Hoop
                end={-1}
                padColor={courtColors?.pad}
                structureColor={courtColors?.structure}
                metalColor={courtColors?.metal}
                tuning={tuning}
                led={led}
                celebrate={celebrate}
                shotClockValue={shotClockValue}
            />
            <ShotColumns
                shots={shots}
                visible={showShots}
                moveRef={moveRef}
                hexSize={hexSize}
                minAttempts={minAttempts}
            />
            <DFenceShow active={showDFence} accentColor={courtColors?.pad} />
            <Confetti
                active={celebrate}
                colors={[celebrateColor || courtColors?.ribbonPrimary, '#ffffff']}
            />
            <LiveGameOverlay active={showLive} latestPlay={liveLatestPlay} />
            {showLive && (
                <ScoreboardText
                    score={liveScore}
                    typography={liveTypography}
                    ribbonColor={liveHomeColor ?? courtColors?.ribbonPrimary}
                />
            )}
        </>
    )
}
