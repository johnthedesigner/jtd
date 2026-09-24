import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { hexbin, prepareBins } from './hexbin'
import { LEAGUE_PPS } from './shot-data'

/**
 * Shot bins as narrow shafts of light, each capped by a translucent
 * basketball riding at its tip.
 *
 * A weakness comes with the column form: height is hard to read on a soft
 * glow. Two things fix that here — a bright cap at the tip so the eye has a
 * hard edge to land on, and the ball itself, which reads as a landmark that
 * unambiguously marks "this is the top" the way a plain glow cannot.
 *
 * Additive blending blows out wherever bins crowd, which on a shot chart is
 * exactly the rim, the single most important area. So intensity is compressed
 * against the busiest bin rather than scaled linearly, and the column is kept
 * narrow enough that neighbours do not merge into one smear.
 */

const COLUMN_SEGMENTS = 12
const BALL_SEGMENTS = 14
/** Fraction of the timeline spent staggering; the rest is a shaft's own rise. */
const SWEEP_SPREAD = 0.72
const RISE_SPAN = 1 - SWEEP_SPREAD
/** Seconds for the whole chart to arrive or leave. */
const SWEEP_SECONDS = 1.8
/** Seconds the ball's arrival spin takes to ease to a stop, and its mirror. */
const SPIN_DECAY_SECONDS = 2.0
/** Full turns burned off over that decay. */
const SPIN_REVOLUTIONS = 3.2
/** A real NBA ball: 29.5in circumference, so about a 9.4in diameter. */
const BALL_RADIUS_FT = 29.5 / Math.PI / 12 / 2

/** Cool below league average, white at it, warm above. */
function binColor(pps, out) {
    const t = THREE.MathUtils.clamp((pps - LEAGUE_PPS) / 0.42, -1, 1)
    if (t >= 0) {
        // White into amber.
        return out.setRGB(1, 0.92 - t * 0.28, 0.78 - t * 0.62)
    }
    // White into a cold indigo.
    const k = -t
    return out.setRGB(0.62 - k * 0.34, 0.76 - k * 0.22, 1)
}

const columnVertex = /* glsl */ `
    attribute vec3 instanceColor;
    attribute float instanceIntensity;
    attribute float instanceDelay;
    uniform float uProgress;
    uniform float uRiseSpan;
    varying vec3 vColor;
    varying float vIntensity;
    varying float vUnit;
    varying float vGrow;
    varying vec3 vViewNormal;
    varying vec3 vViewDir;

    void main() {
        vColor = instanceColor;
        vIntensity = instanceIntensity;
        // The geometry is a unit cylinder with its base at y=0, so the local
        // height doubles as the 0..1 position up the shaft.
        vUnit = position.y;

        // Each bin has its own place in the sweep. Back-out easing gives the
        // overshoot that makes a shaft pop rather than merely grow.
        float local = clamp((uProgress - instanceDelay) / uRiseSpan, 0.0, 1.0);
        float eased = 1.0 + 2.2 * pow(local - 1.0, 3.0) + 1.2 * pow(local - 1.0, 2.0);
        vGrow = local;

        vec3 p = position;
        p.y *= max(eased, 0.0);

        vec4 view = modelViewMatrix * instanceMatrix * vec4(p, 1.0);
        vViewDir = normalize(-view.xyz);
        vViewNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
        gl_Position = projectionMatrix * view;
    }
`

const columnFragment = /* glsl */ `
    precision highp float;
    uniform float uFade;
    uniform float uCapSharpness;
    uniform float uEdgeBoost;
    varying vec3 vColor;
    varying float vIntensity;
    varying float vUnit;
    varying float vGrow;
    varying vec3 vViewNormal;
    varying vec3 vViewDir;

    void main() {
        // Falls off toward the tip, the way a real shaft of light thins out.
        float body = pow(1.0 - vUnit, uFade);

        // The cap: a hard bright band at the very top. This is what makes
        // height readable on something that is otherwise a soft glow.
        float cap = smoothstep(uCapSharpness, 1.0, vUnit);

        // Edge-on surfaces show more of the shaft, so the silhouette lifts.
        float facing = abs(dot(normalize(vViewNormal), normalize(vViewDir)));
        float edge = pow(1.0 - facing, uEdgeBoost);

        // Flares a little brighter as it arrives, then settles.
        float arrive = smoothstep(0.0, 0.5, vGrow) * (1.0 + 0.7 * (1.0 - vGrow));
        float a = (body * (0.5 + edge * 0.75) + cap * 0.8) * vIntensity * arrive;
        gl_FragColor = vec4(vColor * a, a);

        #include <tonemapping_fragment>
        #include <colorspace_fragment>
    }
`

const discVertex = /* glsl */ `
    attribute vec3 instanceColor;
    attribute float instanceIntensity;
    attribute float instanceDelay;
    uniform float uProgress;
    uniform float uRiseSpan;
    varying vec3 vColor;
    varying float vIntensity;
    varying vec2 vLocal;
    varying float vGrow;

    void main() {
        vColor = instanceColor;
        vIntensity = instanceIntensity;
        vLocal = position.xy;
        vGrow = clamp((uProgress - instanceDelay) / uRiseSpan, 0.0, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    }
`

const discFragment = /* glsl */ `
    precision highp float;
    varying vec3 vColor;
    varying float vIntensity;
    varying vec2 vLocal;
    varying float vGrow;

    void main() {
        float r = length(vLocal) * 2.0;
        float a = pow(max(1.0 - r, 0.0), 2.2) * vIntensity * 0.9 * vGrow;
        gl_FragColor = vec4(vColor * a, a);

        #include <tonemapping_fragment>
        #include <colorspace_fragment>
    }
`

/**
 * The ball. Rises with its column (same eased-overshoot growth, driven by the
 * same instanceDelay), then spins in place once it arrives — fast at first,
 * easing to a stop over SPIN_DECAY_SECONDS. Leaving mirrors this: the spin
 * ramps back up from rest as the exit begins, while the column shrinks away
 * underneath it on its own timeline.
 *
 * The spin needs real elapsed time, not the 0..1 sweep progress: progress
 * saturates once every bin has arrived, but the last-arriving ball still
 * needs two more seconds of decay after that point. uClock is a free-running
 * seconds counter for that reason, anchored to uEnterClock / uExitClock —
 * wall-clock timestamps recorded in JS the instant `visible` last flipped.
 */
const ballVertex = /* glsl */ `
    attribute vec3 instanceColor;
    attribute float instanceIntensity;
    attribute float instanceDelay;
    attribute float instanceHeight;
    uniform float uProgress;
    uniform float uRiseSpan;
    uniform float uBallRadius;
    uniform float uClock;
    uniform float uEnterClock;
    uniform float uExitClock;
    uniform float uEntering;
    uniform float uSweepSeconds;
    uniform float uSpinDecay;
    uniform float uSpinRevolutions;
    varying vec3 vColor;
    varying float vIntensity;
    varying vec3 vLocalDir;
    varying vec3 vViewNormal;
    varying vec3 vViewDir;
    varying float vArrive;

    // Rodrigues' rotation formula: v rotated about a unit axis by angle.
    vec3 spin(vec3 v, vec3 axis, float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c);
    }

    void main() {
        vColor = instanceColor;
        vIntensity = instanceIntensity;

        float local = clamp((uProgress - instanceDelay) / uRiseSpan, 0.0, 1.0);
        float eased = 1.0 + 2.2 * pow(local - 1.0, 3.0) + 1.2 * pow(local - 1.0, 2.0);
        eased = max(eased, 0.0);
        vArrive = smoothstep(0.0, 0.5, local) * (1.0 + 0.7 * (1.0 - local));

        // Ease-out on arrival (fast, decaying to a stop); mirrored ease-in on
        // departure (from rest, spinning back up). A constant-deceleration
        // profile: angle(t) = w0*t - w0*t^2/(2*decay), zero velocity at
        // t=decay, which is what "ease out of the spin" means physically.
        float arrivalClock = uEnterClock + (instanceDelay + uRiseSpan) * uSweepSeconds;
        float departClock = uExitClock + instanceDelay * uSweepSeconds;
        float w0 = uSpinRevolutions * 6.28318;

        float angle;
        if (uEntering > 0.5) {
            float t = clamp(uClock - arrivalClock, 0.0, uSpinDecay);
            angle = w0 * t - w0 * t * t / (2.0 * uSpinDecay);
        } else {
            float t = clamp(uClock - departClock, 0.0, uSpinDecay);
            // The reverse of the enter curve, run forward: t2 counts down
            // from uSpinDecay as t counts up, so this traces the same shape
            // back-to-front — starting at rest, ending at full speed.
            float t2 = uSpinDecay - t;
            float settled = w0 * uSpinDecay - w0 * uSpinDecay * uSpinDecay / (2.0 * uSpinDecay);
            angle = settled - (w0 * t2 - w0 * t2 * t2 / (2.0 * uSpinDecay));
        }

        vec3 axis = normalize(vec3(0.3, 1.0, 0.2));
        vec3 spun = spin(position, axis, angle);
        vLocalDir = normalize(position);

        vec3 local3 = spun * uBallRadius;
        vec4 world = instanceMatrix * vec4(local3, 1.0);
        // Rides the column's own tip, with a slight overlap so it reads as
        // capping the shaft rather than floating above it.
        world.y += instanceHeight * eased + uBallRadius * 0.5;

        vec4 view = modelViewMatrix * world;
        vViewDir = normalize(-view.xyz);
        vViewNormal = normalize(normalMatrix * spun);
        gl_Position = projectionMatrix * view;
    }
`

const ballFragment = /* glsl */ `
    precision highp float;
    varying vec3 vColor;
    varying float vIntensity;
    varying vec3 vLocalDir;
    varying vec3 vViewNormal;
    varying vec3 vViewDir;
    varying float vArrive;

    void main() {
        // Three great-circle bands stand in for a basketball's seams — cheap,
        // and because they are computed from the ROTATED local direction they
        // visibly turn with the spin, which is the whole point of the seams
        // existing rather than a plain glowing orb.
        float seamA = smoothstep(0.07, 0.0, abs(vLocalDir.y));
        float seamB = smoothstep(0.07, 0.0, abs(vLocalDir.x));
        float seamC = smoothstep(0.07, 0.0, abs(vLocalDir.z));
        float seams = max(seamA, max(seamB, seamC));

        // Translucent: a fresnel rim rather than a flat disc, so it reads as
        // glassy rather than solid, glowing the same colour as its column.
        float facing = abs(dot(normalize(vViewNormal), normalize(vViewDir)));
        float fresnel = pow(1.0 - facing, 2.0);

        float a = (mix(0.16, 0.75, seams) + fresnel * 0.4) * vIntensity * vArrive;
        gl_FragColor = vec4(vColor * a, a);

        #include <tonemapping_fragment>
        #include <colorspace_fragment>
    }
`

function useInstanced(bins, maxAttempts, options) {
    return useMemo(() => {
        const { hexSize, maxHeight, columnScale, discScale } = options

        const n = bins.length
        const m = new THREE.Matrix4()
        const color = new THREE.Color()

        const columnMatrices = new Float32Array(n * 16)
        const discMatrices = new Float32Array(n * 16)
        const ballMatrices = new Float32Array(n * 16)
        const colors = new Float32Array(n * 3)
        const delays = new Float32Array(n)
        const heights = new Float32Array(n)

        // The sweep is the chart's own argument: the most efficient shots
        // arrive first and leave last, so the eye is walked down the scale
        // rather than watching an arbitrary spatial wipe.
        const byEfficiency = bins
            .map((bin, i) => ({ i, pps: bin.pps }))
            .sort((a, b) => b.pps - a.pps)
        byEfficiency.forEach((entry, rank) => {
            delays[entry.i] = n > 1 ? (rank / (n - 1)) * SWEEP_SPREAD : 0
        })

        const columnIntensity = new Float32Array(n)
        const discIntensity = new Float32Array(n)
        const ballIntensity = new Float32Array(n)

        bins.forEach((bin, i) => {
            // Compressed, not linear. Linear scaling lets the rim bin tower
            // over everything and blow out its neighbours.
            const volume = Math.pow(bin.attempts / maxAttempts, 0.62)
            const height = 1.3 + volume * maxHeight
            heights[i] = height

            binColor(bin.pps, color)
            color.toArray(colors, i * 3)

            m.makeScale(hexSize * columnScale, height, hexSize * columnScale)
            m.setPosition(bin.x, 0, bin.z)
            m.toArray(columnMatrices, i * 16)

            m.makeRotationX(-Math.PI / 2)
            m.scale(new THREE.Vector3(hexSize * discScale, hexSize * discScale, 1))
            m.setPosition(bin.x, 0.03, bin.z)
            m.toArray(discMatrices, i * 16)

            // The ball's own matrix carries only its floor position — height
            // is added dynamically in the vertex shader, since it animates
            // every frame and a static instance matrix cannot.
            m.identity()
            m.setPosition(bin.x, 0, bin.z)
            m.toArray(ballMatrices, i * 16)

            // Additive light has to compete with a lit hardwood floor, so
            // these run far hotter than they would over a dark backdrop. The
            // court dims while the overlay is up for the same reason.
            columnIntensity[i] = 0.8 + volume * 0.92
            discIntensity[i] = 0.26 + volume * 0.4
            ballIntensity[i] = 0.55 + volume * 0.7
        })

        return {
            n,
            delays,
            heights,
            columnMatrices,
            discMatrices,
            ballMatrices,
            colors,
            columnIntensity,
            discIntensity,
            ballIntensity,
        }
    }, [bins, maxAttempts, options])
}

/**
 * Instanced meshes, shared plumbing.
 *
 * Matrices go in through setMatrixAt rather than by swapping the mesh's
 * instanceMatrix attribute: replacing the attribute that InstancedMesh built
 * for itself silently leaves most instances at the identity. The material is
 * built here rather than declared as JSX, and the geometry is cloned per
 * instance group — letting the renderer own the uniforms object cost a long
 * debugging detour where the JS side read the right value and the shader
 * never saw it.
 */
function Instances({
    geometry,
    matrices,
    colors,
    intensity,
    delays,
    heights,
    count,
    vertex,
    fragment,
    values,
}) {
    const ref = useRef(null)
    const tmp = useMemo(() => new THREE.Matrix4(), [])

    const own = useMemo(() => {
        const g = geometry.clone()
        g.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(colors, 3))
        g.setAttribute('instanceIntensity', new THREE.InstancedBufferAttribute(intensity, 1))
        g.setAttribute('instanceDelay', new THREE.InstancedBufferAttribute(delays, 1))
        if (heights) {
            g.setAttribute('instanceHeight', new THREE.InstancedBufferAttribute(heights, 1))
        }
        return g
    }, [geometry, colors, intensity, delays, heights])

    const material = useMemo(
        () =>
            new THREE.ShaderMaterial({
                vertexShader: vertex,
                fragmentShader: fragment,
                uniforms: values,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
            }),
        [vertex, fragment, values]
    )

    useLayoutEffect(() => {
        const mesh = ref.current
        if (!mesh) return
        for (let i = 0; i < count; i++) {
            tmp.fromArray(matrices, i * 16)
            mesh.setMatrixAt(i, tmp)
        }
        mesh.count = count
        mesh.instanceMatrix.needsUpdate = true
    }, [matrices, count, tmp, own])

    useLayoutEffect(() => () => own.dispose(), [own])

    return (
        <instancedMesh
            ref={ref}
            args={[own, material, Math.max(count, 1)]}
            frustumCulled={false}
            // The court is a transparent material and sorts into the same
            // pass, so without an explicit order it can paint straight over
            // these.
            renderOrder={10}
        />
    )
}

export default function ShotColumns({
    shots,
    hexSize = 2.6,
    minAttempts = 4,
    maxHeight = 9,
    end = 1,
    visible = true,
    moveRef,
}) {
    // Progress runs 0..1 in and back out. The group stays mounted while it
    // unwinds, or the chart would vanish instead of leaving.
    const progressRef = useRef(0)
    const [settled, setSettled] = useState(false)

    // A free-running clock, plus wall-clock anchors for the ball's spin — see
    // the ballVertex comment for why the 0..1 sweep progress alone cannot
    // drive a fixed-duration decay that outlives the sweep itself.
    const clockRef = useRef(0)
    const enterClockRef = useRef(0)
    const exitClockRef = useRef(-1000)
    const prevVisibleRef = useRef(visible)

    useFrame((_, delta) => {
        clockRef.current += delta

        if (visible !== prevVisibleRef.current) {
            if (visible) enterClockRef.current = clockRef.current
            else exitClockRef.current = clockRef.current
            prevVisibleRef.current = visible
        }

        // Staged, not simultaneous: the chart holds until the camera move has
        // mostly landed, so the two readable events do not overlap. Leaving is
        // not gated, so the chart clears out of the way first.
        const arrived = !moveRef || moveRef.current > 0.55
        if (visible && !arrived) return

        const target = visible ? 1 : 0
        const step = delta / SWEEP_SECONDS
        const p = progressRef.current
        progressRef.current =
            target > p ? Math.min(target, p + step) : Math.max(target, p - step)

        for (const u of progressUniforms) u.uProgress.value = progressRef.current
        ballUniforms.uClock.value = clockRef.current
        ballUniforms.uEnterClock.value = enterClockRef.current
        ballUniforms.uExitClock.value = exitClockRef.current
        ballUniforms.uEntering.value = visible ? 1 : 0

        const done = progressRef.current === 0 && !visible
        if (done !== !settled) setSettled(!done)
    })
    const { bins, maxAttempts } = useMemo(() => {
        if (!shots) return { bins: [], maxAttempts: 1 }
        const raw = hexbin(shots.xs, shots.zs, shots.made, shots.count, hexSize)
        return prepareBins(raw, { minAttempts, end })
    }, [shots, hexSize, minAttempts, end])

    const options = useMemo(
        () => ({
            hexSize,
            maxHeight,
            // A single column, a quarter the diameter of the old shell — the
            // ball at its tip is now the thing that reads as "the marker";
            // the shaft only needs to be wide enough to still register as a
            // column of light underneath it.
            columnScale: 0.075,
            discScale: 1.5,
        }),
        [hexSize, maxHeight]
    )

    const data = useInstanced(bins, maxAttempts, options)

    const columnUniforms = useMemo(
        () => ({
            uFade: { value: 1.4 },
            uCapSharpness: { value: 0.88 },
            uEdgeBoost: { value: 1.2 },
            uProgress: { value: 0 },
            uRiseSpan: { value: RISE_SPAN },
        }),
        []
    )
    const discUniforms = useMemo(
        () => ({ uProgress: { value: 0 }, uRiseSpan: { value: RISE_SPAN } }),
        []
    )
    const ballUniforms = useMemo(
        () => ({
            uProgress: { value: 0 },
            uRiseSpan: { value: RISE_SPAN },
            uBallRadius: { value: BALL_RADIUS_FT },
            uClock: { value: 0 },
            uEnterClock: { value: 0 },
            uExitClock: { value: -1000 },
            uEntering: { value: 1 },
            uSweepSeconds: { value: SWEEP_SECONDS },
            uSpinDecay: { value: SPIN_DECAY_SECONDS },
            uSpinRevolutions: { value: SPIN_REVOLUTIONS },
        }),
        []
    )
    const progressUniforms = useMemo(
        () => [columnUniforms, discUniforms, ballUniforms],
        [columnUniforms, discUniforms, ballUniforms]
    )

    const discGeometry = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
    const columnGeometry = useMemo(() => {
        const g = new THREE.CylinderGeometry(1, 1, 1, COLUMN_SEGMENTS, 1, true)
        // Base at the floor rather than centred, so scaling grows upward.
        g.translate(0, 0.5, 0)
        return g
    }, [])
    const ballGeometry = useMemo(
        () => new THREE.SphereGeometry(1, BALL_SEGMENTS, BALL_SEGMENTS),
        []
    )

    if (data.n === 0) return null
    if (!visible && progressRef.current === 0) return null

    return (
        <group>
            <Instances
                geometry={columnGeometry}
                matrices={data.columnMatrices}
                colors={data.colors}
                intensity={data.columnIntensity}
                delays={data.delays}
                count={data.n}
                vertex={columnVertex}
                fragment={columnFragment}
                values={columnUniforms}
            />
            <Instances
                geometry={discGeometry}
                matrices={data.discMatrices}
                colors={data.colors}
                intensity={data.discIntensity}
                delays={data.delays}
                count={data.n}
                vertex={discVertex}
                fragment={discFragment}
                values={discUniforms}
            />
            <Instances
                geometry={ballGeometry}
                matrices={data.ballMatrices}
                colors={data.colors}
                intensity={data.ballIntensity}
                delays={data.delays}
                heights={data.heights}
                count={data.n}
                vertex={ballVertex}
                fragment={ballFragment}
                values={ballUniforms}
            />
        </group>
    )
}
