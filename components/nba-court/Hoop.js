import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COURT_LENGTH } from './constants'
import {
    BACKBOARD,
    RIM,
    SHOT_CLOCK,
    STANCHION,
    boardFaceX,
    rimCentreX,
} from './hoop-spec'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { createBackboardMarkings, createShotClockFace } from './hoop-textures'
import { centeredTextGeometry, useTypeface } from './typeface'
import { buildNetGeometry } from './net-geometry'
import {
    buildBumperBar,
    buildStanchionMetal,
    buildStanchionPad,
    buildStanchionPanel,
} from './stanchion-geometry'
import { applyPoolFalloff } from './pool-falloff'

const HALF_LENGTH = COURT_LENGTH / 2

/**
 * The shot clock's digits, as real extruded geometry rather than the
 * canvas-drawn texture they used to be. LCD14 is a genuine 14-segment
 * display face (OFL-1.1), converted to typeface.json through the same
 * one-off pipeline as the Montserrat weights — see `public/fonts/`.
 * Sized against the clock housing: the face is `SHOT_CLOCK.height * 0.74`
 * tall, and real shot-clock digits fill most of it.
 */
const LCD_FONT_URL = '/fonts/lcd14.typeface.json'
const CLOCK_TEXT_SIZE = SHOT_CLOCK.height * 0.46
/** Subtle — it should read as segments standing off the panel, not a slab. */
const CLOCK_TEXT_DEPTH = 0.03

/** Flashes per second the backboard LED and shot-clock face fire at during the celebration view. */
const CELEBRATE_FLASH_HZ = 2.2

/**
 * A sharp strobe, not a smooth pulse: mostly off, briefly at full — a short
 * ramp up, a hold, a short ramp down, over most of a cycle spent dark. A
 * sine wave never actually reaches "off" or stays at "on"; it just drifts
 * between them, which is what read as pulsing rather than flashing.
 */
function flashPulse(t, hz, duty = 0.16, edge = 0.035) {
    const phase = (t * hz) % 1
    if (phase < edge) return phase / edge
    if (phase < duty) return 1
    if (phase < duty + edge) return 1 - (phase - duty) / edge
    return 0
}

/** How far the LED strip sits in from the board's raw edge — past the
 *  painted border stripe, not just past the glass edge, so the strip reads
 *  as its own inset ring rather than a line buried under the border. */
const LED_INSET = BACKBOARD.border + 0.1

/**
 * Standard material that sits under the court's light pool. Everything in the
 * assembly uses these so the rig darkens past the lines like the floor does.
 */
function PoolMaterial(props) {
    const ref = useRef(null)
    useLayoutEffect(() => applyPoolFalloff(ref.current), [])
    return <meshStandardMaterial ref={ref} {...props} />
}

function PoolPhysicalMaterial(props) {
    const ref = useRef(null)
    useLayoutEffect(() => applyPoolFalloff(ref.current), [])
    return <meshPhysicalMaterial ref={ref} {...props} />
}

/** A dark strut between two points, for the truss behind the glass. */
function Strut({ from, to, radius = 0.075, color }) {
    const { position, quaternion, length } = useMemo(() => {
        const a = new THREE.Vector3(...from)
        const b = new THREE.Vector3(...to)
        const dir = new THREE.Vector3().subVectors(b, a)
        return {
            length: dir.length(),
            position: a.clone().add(b).multiplyScalar(0.5),
            quaternion: new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                dir.clone().normalize()
            ),
        }
    }, [from, to])

    return (
        <mesh position={position} quaternion={quaternion}>
            <cylinderGeometry args={[radius, radius, length, 10]} />
            <PoolMaterial color={color} roughness={0.5} metalness={0.6} />
        </mesh>
    )
}

/**
 * One basket, modelled from the real thing.
 *
 * The padded shell is a single extruded profile rather than stacked
 * primitives, the board padding wraps the bottom edge and up both sides in a
 * U, and the truss carrying the shot clock stands behind the glass where it
 * shows through. `padColor` and `structureColor` are sampled from the court
 * art, so the rig repaints itself for every floor.
 *
 * `end` is +1 or -1, picking which baseline the basket stands at.
 */
export default function Hoop({
    end = 1,
    padColor = '#2b3350',
    structureColor = '#191c22',
    metalColor = '#6f757d',
    tuning = null,
    /** 0..1. Drives the LED strip for shot-clock and period alerts. */
    led = 0,
    ledColor = '#ff2d1a',
    /** True while the celebration view is active — flashes the backboard
     *  LED and the shot-clock face together, overriding `led`'s static
     *  value for as long as it's on. */
    celebrate = false,
    /** What the shot clock reads. ESPN's feed carries no shot-clock seconds
     *  at all — only a game clock — so this stays at the parked 24.0 and
     *  drops to 0.0 at a period buzzer, which is the honest version of
     *  "real" rather than inventing a count. */
    shotClockValue = SHOT_CLOCK.value,
}) {
    const markings = useMemo(() => createBackboardMarkings(), [])
    // The digits themselves are extruded geometry below, so the texture is
    // just the dark panel they sit on.
    const clockFace = useMemo(() => createShotClockFace(SHOT_CLOCK.value, { drawDigits: false }), [])
    const lcdFont = useTypeface(LCD_FONT_URL)
    const clockGeometry = useMemo(
        () =>
            lcdFont
                ? centeredTextGeometry(TextGeometry, lcdFont, shotClockValue, CLOCK_TEXT_SIZE, CLOCK_TEXT_DEPTH)
                : null,
        [lcdFont, shotClockValue]
    )
    const netGeometry = useMemo(() => buildNetGeometry(), [])
    const flashRef = useRef(0)
    const clockMatRef = useRef(null)
    const ledMaterial = useMemo(
        () =>
            new THREE.MeshBasicMaterial({
                color: ledColor,
                transparent: true,
                opacity: Math.min(1, led),
                toneMapped: false,
            }),
        []
    )

    useLayoutEffect(() => {
        ledMaterial.color.set(ledColor)
    }, [ledMaterial, ledColor])

    useLayoutEffect(() => {
        applyPoolFalloff(clockMatRef.current)
    }, [])

    useFrame((_, delta) => {
        if (celebrate) {
            flashRef.current += delta
            const flash = flashPulse(flashRef.current, CELEBRATE_FLASH_HZ)
            ledMaterial.opacity = flash
            // A flash reads as brighter than a pulse mostly because it's
            // brief and total, not dimmed toward a floor — pushed past 1 so
            // the colour itself blows toward white at the peak instead of
            // just reaching its own flat, unblown hue.
            ledMaterial.color.set(ledColor).multiplyScalar(2)
            if (clockMatRef.current) clockMatRef.current.emissiveIntensity = 2.8 * (0.4 + 4.4 * flash)
        } else {
            ledMaterial.opacity = Math.min(1, led)
            ledMaterial.color.set(ledColor)
            if (clockMatRef.current) clockMatRef.current.emissiveIntensity = 2.8
        }
    })
    const contactShadow = useContactShadow()

    const faceX = boardFaceX(end, HALF_LENGTH)
    const rimX = rimCentreX(end, HALF_LENGTH)
    const boardCentreY = BACKBOARD.bottom + BACKBOARD.height / 2
    const boardTopY = BACKBOARD.bottom + BACKBOARD.height
    const boardBackX = faceX + end * BACKBOARD.thickness

    // The column stands behind the baseline; the arm reaches from its front
    // face forward to the back of the glass.
    const columnFrontX = end * (HALF_LENGTH + STANCHION.columnBehindBaseline)
    // Less the bevel: ExtrudeGeometry grows the profile outward by bevelSize,
    // so an arm authored to end exactly at the glass pokes bevelSize through
    // it — 3.4in at the current chamfer, which is what was spearing the board.
    const armReach =
        Math.abs(columnFrontX - boardBackX) - STANCHION.metalBevel

    const padBody = useMemo(() => buildStanchionPad(), [])
    const padPanel = useMemo(() => buildStanchionPanel(), [])
    const metal = useMemo(() => buildStanchionMetal(armReach), [armReach])

    const halfW = BACKBOARD.width / 2

    // Bumper geometry, in feet, with URL overrides given in inches. Its depth
    // is the board's own thickness, so it can never reach past either face.
    const IN = 1 / 12
    const padDrop = tuning?.paddrop != null ? tuning.paddrop * IN : BACKBOARD.padDrop
    const padSide = tuning?.padside != null ? tuning.padside * IN : BACKBOARD.padSide
    const padRise = tuning?.padrise != null ? tuning.padrise * IN : BACKBOARD.padRise
    const padCentreX = faceX + end * (BACKBOARD.thickness / 2)
    const padBottomY = BACKBOARD.bottom - padDrop

    // Chamfer radius scales with the pad's own cross-section, so a URL
    // override that thins or thickens the bumper keeps a proportionate,
    // never-too-big round rather than eating the whole pad.
    const bumperRadius = Math.min(padDrop, padSide) * 0.4
    const bumperBottom = useMemo(
        () => buildBumperBar(BACKBOARD.thickness, padDrop, BACKBOARD.width + padSide * 2, bumperRadius, {
            // The top edge meets the board's bottom edge flush — rounding it
            // would open a visible gap at that seam. Only the underside,
            // genuinely exposed, gets the soft corner.
            roundTop: false,
            roundBottom: true,
        }),
        [padDrop, padSide, bumperRadius]
    )
    const bumperSide = useMemo(
        () => buildBumperBar(BACKBOARD.thickness, padSide, padRise, bumperRadius, {
            // Both corners rounded: the inward one sits flush against the
            // board's side edge either way, and at a two-inch cross-section
            // the difference is a sliver too small to read.
            roundTop: true,
            roundBottom: true,
        }),
        [padSide, padRise, bumperRadius]
    )

    // Truss anchors, all behind the glass.
    const trussX = boardBackX + end * 0.55
    const mastTopY = boardTopY + SHOT_CLOCK.mastHeight

    return (
        <group>
            {/* Glass. */}
            <mesh position={[boardBackX - end * (BACKBOARD.thickness / 2), boardCentreY, 0]}>
                <boxGeometry args={[BACKBOARD.thickness, BACKBOARD.height, BACKBOARD.width]} />
                <PoolPhysicalMaterial
                    color="#cfe3e8"
                    transparent
                    opacity={0.15}
                    roughness={0.03}
                    metalness={0}
                    clearcoat={1}
                    clearcoatRoughness={0.02}
                    ior={1.52}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Silk-screened border and inner square. */}
            <mesh
                position={[faceX - end * 0.004, boardCentreY, 0]}
                rotation={[0, end > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}
            >
                <planeGeometry args={[BACKBOARD.width, BACKBOARD.height]} />
                <PoolMaterial
                    map={markings}
                    transparent
                    roughness={0.35}
                    metalness={0}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* White structural frame around the glass. */}
            {[1, -1].map((vert) => (
                <mesh
                    key={`frameH${vert}`}
                    position={[
                        boardBackX - end * 0.06,
                        boardCentreY + vert * (BACKBOARD.height / 2 + 0.07),
                        0,
                    ]}
                >
                    <boxGeometry args={[0.2, 0.16, BACKBOARD.width + 0.3]} />
                    <PoolMaterial color="#9aa1a8" roughness={0.5} metalness={0.15} />
                </mesh>
            ))}
            {[-1, 1].map((side) => (
                <mesh
                    key={`frameV${side}`}
                    position={[boardBackX - end * 0.06, boardCentreY, side * (halfW + 0.07)]}
                >
                    <boxGeometry args={[0.2, BACKBOARD.height + 0.3, 0.16]} />
                    <PoolMaterial color="#9aa1a8" roughness={0.5} metalness={0.15} />
                </mesh>
            ))}

            {/* LED strip: a thin emissive frame just inside the glass, as on a
                real board, where it fires when the shot clock expires and at
                period ends. Driven by `led` so transitions can use it. Kept as
                four bars rather than a ring so it follows the board's corners,
                and additive so it reads as light rather than paint. Inset
                past the width of the painted border (`BACKBOARD.border`), not
                just past the board's raw edge — sitting inside that border
                is what actually reads as "an LED ring inset from the frame"
                instead of a strip buried under the painted stripe. */}
            {(led > 0.001 || celebrate) &&
                [
                    { k: 'top', pos: [0, BACKBOARD.height / 2 - LED_INSET, 0], size: [0.06, BACKBOARD.width - LED_INSET * 2] },
                    { k: 'bot', pos: [0, -BACKBOARD.height / 2 + LED_INSET, 0], size: [0.06, BACKBOARD.width - LED_INSET * 2] },
                ].map((bar) => (
                    <mesh
                        key={bar.k}
                        position={[boardBackX - end * 0.03, boardCentreY + bar.pos[1], 0]}
                        material={ledMaterial}
                    >
                        <boxGeometry args={[0.05, bar.size[0], bar.size[1]]} />
                    </mesh>
                ))}
            {(led > 0.001 || celebrate) &&
                [-1, 1].map((side) => (
                    <mesh
                        key={`led${side}`}
                        position={[
                            boardBackX - end * 0.03,
                            boardCentreY,
                            side * (halfW - LED_INSET),
                        ]}
                        material={ledMaterial}
                    >
                        <boxGeometry args={[0.05, BACKBOARD.height - LED_INSET * 2, 0.06]} />
                    </mesh>
                ))}

            {/* Bumper: a soft-edged shell on the board's edge faces, not
                either flat face. The bottom bar sits under the lower edge and
                runs past both corners; the side bars stand outboard of the
                side edges and run partway up. Chamfered on every exposed
                corner so it reads as rubber, not moulded plastic. */}
            <mesh position={[padCentreX, padBottomY + padDrop / 2, 0]} geometry={bumperBottom}>
                <PoolMaterial color={padColor} roughness={0.75} metalness={0} />
            </mesh>
            {[-1, 1].map((side) => (
                <mesh
                    key={`pad${side}`}
                    position={[padCentreX, padBottomY + padRise / 2, side * (halfW + padSide / 2)]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    geometry={bumperSide}
                >
                    <PoolMaterial color={padColor} roughness={0.75} metalness={0} />
                </mesh>
            ))}

            {/* Rim and its mounting collar. */}
            {/* Centreline is the inside radius plus the stock radius, so the
                clear inside diameter is a true 18in; and the whole ring drops
                one stock radius so its top edge is at exactly 10ft. */}
            <mesh
                position={[rimX, RIM.height - RIM.tubeRadius, 0]}
                rotation={[Math.PI / 2, 0, 0]}
            >
                <torusGeometry
                    args={[RIM.innerRadius + RIM.tubeRadius, RIM.tubeRadius, 12, 48]}
                />
                <PoolMaterial color="#e2572a" roughness={0.32} metalness={0.72} />
            </mesh>
            {/* Bridges the glass to the back of the ring and no further. Run
                out to the ring's centre it reads as a block protruding across
                the middle of the hoop. */}
            <mesh position={[faceX - end * (RIM.gap / 2), RIM.height - RIM.tubeRadius, 0]}>
                <boxGeometry args={[RIM.gap, 0.14, 0.4]} />
                <PoolMaterial color="#e2572a" roughness={0.38} metalness={0.72} />
            </mesh>

            {/* Net. */}
            <mesh position={[rimX, RIM.height - RIM.tubeRadius, 0]} geometry={netGeometry}>
                <PoolMaterial
                    color="#f2f2ee"
                    roughness={0.85}
                    metalness={0}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Truss behind the glass: a mast up to the shot clock, braced
                diagonally into the board's upper corners. It shows through the
                glass, which is where a lot of the realism comes from. */}
            <Strut
                from={[trussX, boardCentreY - 0.6, 0]}
                to={[trussX, mastTopY, 0]}
                radius={0.11}
                color={structureColor}
            />
            {[-1, 1].map((side) => (
                <Strut
                    key={`brace${side}`}
                    from={[trussX, boardCentreY + 0.2, 0]}
                    to={[trussX, boardTopY - 0.35, side * (halfW - 0.5)]}
                    radius={0.07}
                    color={structureColor}
                />
            ))}
            {/* Two brackets from the base of the clock housing back to the
                rear top corners of the board, which is how the clock is
                actually carried — the mast alone reads as a flagpole. */}
            {[-1, 1].map((side) => (
                <Strut
                    key={`clockBracket${side}`}
                    from={[trussX, mastTopY, 0]}
                    to={[boardBackX + end * 0.04, boardTopY - 0.1, side * (halfW - 0.25)]}
                    radius={0.055}
                    color={structureColor}
                />
            ))}

            {/* Shot clock, raised above the board on the mast. */}
            <group position={[trussX, mastTopY + SHOT_CLOCK.height / 2, 0]}>
                <mesh>
                    <boxGeometry args={[SHOT_CLOCK.depth, SHOT_CLOCK.height, SHOT_CLOCK.width]} />
                    <PoolMaterial color="#0d0e12" roughness={0.8} metalness={0.1} />
                </mesh>
                <mesh
                    position={[-end * (SHOT_CLOCK.depth / 2 + 0.004), 0, 0]}
                    rotation={[0, end > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}
                >
                    <planeGeometry args={[SHOT_CLOCK.width * 0.9, SHOT_CLOCK.height * 0.74]} />
                    <meshStandardMaterial
                        ref={clockMatRef}
                        map={clockFace.color}
                        emissiveMap={clockFace.emissive}
                        emissive="#ffffff"
                        emissiveIntensity={2.8}
                        roughness={0.4}
                        metalness={0}
                        // ACES filmic pushes a saturated red toward amber at
                        // this emissive intensity — the same shift the LED
                        // strip needed toneMapped=false to avoid.
                        toneMapped={false}
                    />
                </mesh>
                {/* The digits themselves, standing just off the panel. Same
                    facing as the panel, so the text's own reading axis maps
                    to the housing's width. `toneMapped={false}` for the same
                    reason the panel needs it — ACES pushes this red amber. */}
                {clockGeometry && (
                    <mesh
                        geometry={clockGeometry}
                        position={[-end * (SHOT_CLOCK.depth / 2 + 0.02), 0, 0]}
                        rotation={[0, end > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}
                    >
                        <meshStandardMaterial
                            color="#ff2d1a"
                            emissive="#ff2d1a"
                            emissiveIntensity={2.6}
                            roughness={0.45}
                            metalness={0}
                            toneMapped={false}
                        />
                    </mesh>
                )}
            </group>

            {/* Stanchion. The profile is authored with +X toward centre
                court, so the near basket rotates rather than mirrors: a
                negative scale would invert the winding and break the lighting
                on the padding. */}
            <group
                position={[columnFrontX, 0, 0]}
                rotation={[0, end > 0 ? Math.PI : 0, 0]}
            >
                <mesh geometry={padBody}>
                    <PoolMaterial color={padColor} roughness={0.85} metalness={0.02} />
                </mesh>
                <mesh geometry={padPanel}>
                    <PoolMaterial color={padColor} roughness={0.8} metalness={0.02} />
                </mesh>
                <mesh geometry={metal}>
                    {/* Brushed rather than mirror: enough metalness to catch
                        the same heads the floor reflects, rough enough that it
                        reads as an extrusion and not chrome. */}
                    {/* Deliberately not chrome. High metalness gave the arm a
                        hot specular that flared as the camera moved, which drew
                        the eye straight to it — painted steel, not polished. */}
                    <PoolMaterial
                        color={metalColor}
                        roughness={0.62}
                        metalness={0.3}
                    />
                </mesh>
            </group>

            {/* Contact shadow: there are no shadow maps here, and the court is
                a custom shader that would not receive them. */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[columnFrontX + end * (STANCHION.baseBack / 2 - 1), 0.02, 0]}
            >
                <planeGeometry args={[STANCHION.baseBack * 2.1, STANCHION.bodyWidth * 2.3]} />
                <meshBasicMaterial
                    color="#000000"
                    transparent
                    opacity={0.5}
                    depthWrite={false}
                    map={contactShadow}
                />
            </mesh>
        </group>
    )
}

/** A soft radial falloff used as the stanchion's contact shadow. */
let contactShadowTexture = null
function useContactShadow() {
    return useMemo(() => {
        if (contactShadowTexture) return contactShadowTexture
        const c = document.createElement('canvas')
        c.width = c.height = 128
        const ctx = c.getContext('2d')
        const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62)
        g.addColorStop(0, 'rgba(255,255,255,1)')
        g.addColorStop(0.45, 'rgba(255,255,255,0.5)')
        g.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, 128, 128)
        contactShadowTexture = new THREE.CanvasTexture(c)
        contactShadowTexture.colorSpace = THREE.NoColorSpace
        return contactShadowTexture
    }, [])
}
