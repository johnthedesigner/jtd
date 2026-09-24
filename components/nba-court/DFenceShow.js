import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { buildFenceGeometry, buildLetterDGeometry, DFENCE_HEIGHT } from './dfence-geometry'
import { applyPoolFalloff } from './pool-falloff'

/**
 * The "D-FENCE" show: a giant D and a fence icon, alternating, falling in
 * from above, bouncing, holding a beat, then dissolving into particles.
 *
 * Every drop is timed off one free-running clock rather than component
 * lifecycle — the same reasoning as the shot columns' spin decay: a show
 * that is meant to repeat for as long as the view is open should never be
 * able to drift out of sync with itself just because React re-rendered.
 */

/** Seconds between the start of one drop and the next, alternating shape. */
export const DROP_INTERVAL_SECONDS = 2

const START_HEIGHT = 46
const FALL_SECONDS = 0.55
const BOUNCE_1_SECONDS = 0.32
const BOUNCE_1_HEIGHT = DFENCE_HEIGHT * 0.16
const BOUNCE_2_SECONDS = 0.22
const BOUNCE_2_HEIGHT = DFENCE_HEIGHT * 0.05
const HOLD_SECONDS = 0.45
const DISSOLVE_SECONDS = 0.4
const LAND_TIME = FALL_SECONDS
const BOUNCE1_END = LAND_TIME + BOUNCE_1_SECONDS
const BOUNCE2_END = BOUNCE1_END + BOUNCE_2_SECONDS
const HOLD_END = BOUNCE2_END + HOLD_SECONDS
const DISSOLVE_END = HOLD_END + DISSOLVE_SECONDS

const SLOTS_PER_TYPE = 2
const PARTICLES_PER_DISSOLVE = 26
const PARTICLE_POOL = SLOTS_PER_TYPE * 2 * PARTICLES_PER_DISSOLVE
const PARTICLE_LIFE = 0.7
const GRAVITY = 60

/** Eased fall: fast at the end, the way something actually dropping looks. */
function fallEase(t) {
    return t * t
}

/** Height of a simple parabolic bounce, peak `h`, over duration `d`, at local time `t`. */
function bounceHeight(t, d, h) {
    const u = THREE.MathUtils.clamp(t / d, 0, 1)
    return h * 4 * u * (1 - u)
}

const tmpObj = new THREE.Object3D()
const tmpColor = new THREE.Color()

export default function DFenceShow({ active, accentColor = '#2b3350' }) {
    const dGeometry = useMemo(() => buildLetterDGeometry(), [])
    const fenceGeometry = useMemo(() => buildFenceGeometry(), [])
    const particleGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])

    const dMeshRef = useRef(null)
    const fenceMeshRef = useRef(null)
    const particleMeshRef = useRef(null)

    const material = useMemo(
        () => new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.1 }),
        []
    )
    const particleMaterial = useMemo(
        () => new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.1, toneMapped: false }),
        []
    )

    useLayoutEffect(() => {
        applyPoolFalloff(material, { floor: 0.3, spill: 0.25 })
    }, [material])

    useLayoutEffect(() => {
        material.color.set(accentColor)
    }, [material, accentColor])

    // Two fixed spots — D always drops on one, the fence icon on the other —
    // so the alternation reads as a rhythm between two places, not one spot
    // re-rolling what it is each time.
    const spots = useMemo(() => ({ D: [-8.5, 0, 12], fence: [8.5, 0, 12] }), [])

    // Slot pools: a couple of instances per shape so a drop that is still
    // dissolving never has to be cut off by the next one of the same type.
    const slots = useRef(
        Array.from({ length: SLOTS_PER_TYPE * 2 }, (_, i) => ({
            type: i % 2 === 0 ? 'D' : 'fence',
            spawnedAt: -Infinity,
            used: false,
        }))
    )
    const clockRef = useRef(0)
    const nextDropRef = useRef(0)
    const nextTypeRef = useRef('D')
    const particles = useRef(
        Array.from({ length: PARTICLE_POOL }, () => ({
            spawnedAt: -Infinity,
            origin: new THREE.Vector3(),
            vel: new THREE.Vector3(),
        }))
    )
    const nextParticleRef = useRef(0)

    const spawnParticles = (originArr, count) => {
        for (let i = 0; i < count; i++) {
            const p = particles.current[nextParticleRef.current]
            nextParticleRef.current = (nextParticleRef.current + 1) % PARTICLE_POOL
            p.spawnedAt = clockRef.current
            p.origin.set(
                originArr[0] + (Math.random() - 0.5) * 3,
                originArr[1] + Math.random() * DFENCE_HEIGHT * 0.6,
                originArr[2] + (Math.random() - 0.5) * 2
            )
            const angle = Math.random() * Math.PI * 2
            const speed = 4 + Math.random() * 7
            p.vel.set(Math.cos(angle) * speed, Math.random() * 6 + 2, Math.sin(angle) * speed)
        }
    }

    const prevActive = useRef(false)

    useFrame((_, delta) => {
        if (!active) {
            prevActive.current = false
            return
        }
        clockRef.current += delta

        // Reset the cadence to start fresh, D first, the moment this view
        // becomes active rather than wherever the free-running clock
        // happens to be.
        if (!prevActive.current) {
            nextDropRef.current = clockRef.current
            nextTypeRef.current = 'D'
        }
        prevActive.current = true

        // Spawn on schedule, alternating type, into whichever slot of that
        // type finished its cycle longest ago.
        if (clockRef.current >= nextDropRef.current) {
            const type = nextTypeRef.current
            const candidates = slots.current.filter((s) => s.type === type)
            candidates.sort((a, b) => a.spawnedAt - b.spawnedAt)
            candidates[0].spawnedAt = clockRef.current
            nextDropRef.current += DROP_INTERVAL_SECONDS
            nextTypeRef.current = type === 'D' ? 'fence' : 'D'
        }

        let dIndex = 0
        let fenceIndex = 0
        for (const slot of slots.current) {
            const mesh = slot.type === 'D' ? dMeshRef.current : fenceMeshRef.current
            if (!mesh) continue
            const index = slot.type === 'D' ? dIndex++ : fenceIndex++
            const t = clockRef.current - slot.spawnedAt
            const spot = spots[slot.type]

            let y = -9999
            let scale = 1
            if (t >= 0 && t < LAND_TIME) {
                y = START_HEIGHT * (1 - fallEase(t / FALL_SECONDS))
            } else if (t < BOUNCE1_END) {
                y = bounceHeight(t - LAND_TIME, BOUNCE_1_SECONDS, BOUNCE_1_HEIGHT)
            } else if (t < BOUNCE2_END) {
                y = bounceHeight(t - BOUNCE1_END, BOUNCE_2_SECONDS, BOUNCE_2_HEIGHT)
            } else if (t < HOLD_END) {
                y = 0
            } else if (t < DISSOLVE_END) {
                const u = (t - HOLD_END) / DISSOLVE_SECONDS
                y = 0
                scale = Math.max(0.001, 1 - u)
                // Fire the particle burst once, right as the dissolve starts.
                if (!slot.used) {
                    slot.used = true
                    spawnParticles(spot, PARTICLES_PER_DISSOLVE)
                }
            } else {
                y = -9999
            }

            if (t >= 0 && t < HOLD_END) slot.used = false

            tmpObj.position.set(spot[0], y, spot[2])
            tmpObj.scale.setScalar(scale)
            tmpObj.rotation.set(0, 0, 0)
            tmpObj.updateMatrix()
            mesh.setMatrixAt(index, tmpObj.matrix)
        }
        if (dMeshRef.current) dMeshRef.current.instanceMatrix.needsUpdate = true
        if (fenceMeshRef.current) fenceMeshRef.current.instanceMatrix.needsUpdate = true

        const pMesh = particleMeshRef.current
        if (pMesh) {
            particles.current.forEach((p, i) => {
                const t = clockRef.current - p.spawnedAt
                if (t < 0 || t > PARTICLE_LIFE) {
                    tmpObj.position.set(0, -9999, 0)
                    tmpObj.scale.setScalar(0.0001)
                } else {
                    const x = p.origin.x + p.vel.x * t
                    const y = p.origin.y + p.vel.y * t - 0.5 * GRAVITY * t * t
                    const z = p.origin.z + p.vel.z * t
                    tmpObj.position.set(x, Math.max(y, 0.02), z)
                    tmpObj.scale.setScalar(0.28 * (1 - t / PARTICLE_LIFE))
                }
                tmpObj.rotation.set(0, 0, 0)
                tmpObj.updateMatrix()
                pMesh.setMatrixAt(i, tmpObj.matrix)
            })
            pMesh.instanceMatrix.needsUpdate = true
        }
    })

    useLayoutEffect(() => {
        applyPoolFalloff(particleMaterial, { floor: 0.4, spill: 0.3 })
    }, [particleMaterial])
    useLayoutEffect(() => {
        tmpColor.set(accentColor)
        particleMaterial.color.copy(tmpColor).lerp(new THREE.Color('#ffffff'), 0.4)
    }, [particleMaterial, accentColor])

    if (!active) return null

    return (
        <>
            <instancedMesh ref={dMeshRef} args={[dGeometry, material, SLOTS_PER_TYPE]} frustumCulled={false} />
            <instancedMesh
                ref={fenceMeshRef}
                args={[fenceGeometry, material, SLOTS_PER_TYPE]}
                frustumCulled={false}
            />
            <instancedMesh
                ref={particleMeshRef}
                args={[particleGeometry, particleMaterial, PARTICLE_POOL]}
                frustumCulled={false}
            />
        </>
    )
}
