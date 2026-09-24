import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { applyPoolFalloff } from './pool-falloff'
import { buildFoldingChairGeometry } from './chair-geometry'
import {
    TABLE,
    buildArenaBowlGeometry,
    buildBaselineChairPlacements,
    buildSidelineChairPlacements,
    buildTablePlacements,
} from './arena-layout'

const tmpObj = new THREE.Object3D()

/** One long table, front panel facing +Z locally; placement rotates it to face the court. */
function CourtsideTable({ position, yaw, topMaterial, panelMaterial, legMaterial }) {
    const t = TABLE
    const panelH = t.height - t.topThickness - 0.2
    const legInset = 0.15
    const legHeight = t.height - t.topThickness

    return (
        <group position={position} rotation={[0, yaw, 0]}>
            <mesh position={[0, t.height - t.topThickness / 2, 0]} material={topMaterial}>
                <boxGeometry args={[t.length, t.topThickness, t.depth]} />
            </mesh>
            <mesh
                position={[0, panelH / 2 + 0.2, t.depth / 2 - t.panelInset]}
                material={panelMaterial}
            >
                <boxGeometry args={[t.length - t.panelInset * 2, panelH, 0.05]} />
            </mesh>
            {[-1, 1].map((sx) =>
                [-1, 1].map((sz) => (
                    <mesh
                        key={`${sx}-${sz}`}
                        position={[
                            sx * (t.length / 2 - legInset),
                            legHeight / 2,
                            sz * (t.depth / 2 - legInset),
                        ]}
                        material={legMaterial}
                    >
                        <boxGeometry args={[t.legSize, legHeight, t.legSize]} />
                    </mesh>
                ))
            )}
        </group>
    )
}

/**
 * Everything at floor level beyond the court: the folding-chair sections set
 * back off every line, running the sidelines corner to corner, and the
 * scorer's and commentary tables at half court. The tunnel mouths are not
 * modelled here — they're gaps left in the chair rows (see `arena-layout`'s
 * `TUNNEL` gap) and in the bowl behind them. One InstancedMesh carries every
 * chair — a few hundred of them, one draw call — under the same pool falloff
 * the hoops use, so the rows recede into the dark exactly as the floor does.
 */
export function ArenaSeating({ padColor = '#2b3350', metalColor = '#33383e' }) {
    const chairGeometry = useMemo(() => buildFoldingChairGeometry(), [])
    const placements = useMemo(
        () => [...buildBaselineChairPlacements(), ...buildSidelineChairPlacements()],
        []
    )
    const tablePlacements = useMemo(() => buildTablePlacements(), [])

    const meshRef = useRef(null)

    const chairMaterial = useMemo(
        () => new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.5 }),
        []
    )
    const tableTop = useMemo(
        () => new THREE.MeshStandardMaterial({ color: '#14161c', roughness: 0.5, metalness: 0.15 }),
        []
    )
    const tablePanel = useMemo(
        () => new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0 }),
        []
    )
    const tableLeg = useMemo(
        () => new THREE.MeshStandardMaterial({ color: '#101114', roughness: 0.5, metalness: 0.5 }),
        []
    )

    useLayoutEffect(() => {
        // A touch brighter than the hoops' own falloff — this is the only
        // light on the chairs and tables, and at the defaults they read as
        // near-silhouettes with nothing to tell one piece from another.
        const glow = { floor: 0.34, spill: 0.26 }
        applyPoolFalloff(chairMaterial, glow)
        applyPoolFalloff(tableTop, glow)
        applyPoolFalloff(tablePanel, glow)
        applyPoolFalloff(tableLeg, glow)
    }, [chairMaterial, tableTop, tablePanel, tableLeg])

    useLayoutEffect(() => {
        chairMaterial.color.set(metalColor)
    }, [chairMaterial, metalColor])

    useLayoutEffect(() => {
        tablePanel.color.set(padColor)
    }, [tablePanel, padColor])

    useLayoutEffect(() => {
        const mesh = meshRef.current
        if (!mesh) return
        placements.forEach((p, i) => {
            tmpObj.position.set(p.position[0], p.position[1], p.position[2])
            tmpObj.rotation.set(0, p.yaw, 0)
            tmpObj.updateMatrix()
            mesh.setMatrixAt(i, tmpObj.matrix)
        })
        mesh.instanceMatrix.needsUpdate = true
    }, [placements])

    return (
        <>
            <instancedMesh
                ref={meshRef}
                args={[chairGeometry, chairMaterial, placements.length]}
                frustumCulled={false}
            />
            {tablePlacements.map((tp, i) => (
                <CourtsideTable
                    key={i}
                    position={tp.position}
                    yaw={tp.yaw}
                    topMaterial={tableTop}
                    panelMaterial={tablePanel}
                    legMaterial={tableLeg}
                />
            ))}
        </>
    )
}

/**
 * The permanent seating rising around everything: twenty simplified rows,
 * one mesh, dimmed by the same pool falloff as the rest of this file but with
 * its floor pulled to zero — unlike the hoops, which should never go fully
 * dark, the whole point here is that the last row does.
 */
export function ArenaBowl() {
    const geometry = useMemo(() => buildArenaBowlGeometry(), [])
    const material = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: '#12141c',
                roughness: 0.95,
                metalness: 0,
                side: THREE.DoubleSide,
            }),
        []
    )

    useLayoutEffect(() => {
        applyPoolFalloff(material, { floor: 0, feather: 6, spill: 0.32 })
    }, [material])

    return <mesh geometry={geometry} material={material} />
}
