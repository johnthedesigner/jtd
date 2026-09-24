import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { applyPoolFalloff } from './pool-falloff'
import { bakeBallTextures, BALL_RADIUS_MM } from './ball-seams'
import { buildLogoMask } from '../logo-hero-gpu/logo-glyph'

/**
 * A game ball, sitting on the floor.
 *
 * The seams are baked into equirectangular maps rather than modelled as
 * tube geometry laid on the sphere — the spec's own recommendation, and for
 * good reason: tubes z-fight against the surface at grazing angles and
 * break the lighting where they meet it, while one bake yields colour,
 * roughness and height together. See `ball-seams.js` for the geometry and
 * for the checks it is verified against.
 *
 * The JTD mark is embossed, not printed: it shows only in the height and
 * roughness maps, sharing the leather's own colour, which is how a moulded
 * mark on a real ball behaves. Its position is computed rather than chosen
 * — the point furthest from every seam — and the bake refuses to place it
 * if it would cross a groove.
 */

/** Feet. A size 7 ball is about 9.4 inches across. */
const BALL_RADIUS = (BALL_RADIUS_MM / 1000) * 3.28084

/**
 * Where the ball sits. Off the centre circle and toward one wing, so the
 * close view has the far basket and the arc behind it rather than an empty
 * stretch of floor.
 */
export const BALL_POSITION = [17, BALL_RADIUS, 7.5]

/**
 * Where the close view looks from. Exported so `camera-poses.js` builds its
 * pose from the same numbers the ball turns itself by — the mark has to
 * face the camera, and two copies of that angle would drift apart the first
 * time either moved.
 */
export const BALL_VIEW_ELEVATION = 4.5
export const BALL_VIEW_AZIMUTH = -34

/**
 * The mark is turned to *this* elevation rather than the camera's.
 *
 * Aiming it straight at a camera 4.5 degrees off the floor put it on the
 * ball's equator, facing sideways — where the overhead rig throws no light
 * across it at all, so an emboss that is unambiguously present in the
 * height map showed as nothing whatever. Relief needs grazing light, not a
 * head-on view. Tilting it up splits the difference: still well inside the
 * silhouette from a low camera, now angled into the house lights.
 */
const LOGO_FACING_ELEVATION = 36

/**
 * Turns the ball so the embossed mark faces the close camera.
 *
 * The spec warns against leaving a ball axis-aligned with the world,
 * because then every ball looks identical and a spin reads wrong. That
 * still holds: the mark's anchor is a computed direction well off any axis,
 * so aligning to it leaves the two great circles at an arbitrary attitude
 * anyway. This just stops the mark being on the far side, which is where an
 * arbitrary rotation put it.
 */
const BALL_ROLL = 0.5

/** Enough that the silhouette is smooth at the close pose. */
const SEGMENTS = 96
/** The bake is a one-off cost on mount; this is a good quality/time trade. */
const MAP_WIDTH = 1024
const MAP_HEIGHT = 512
/** ~100mm across on a size 7 ball, about what a real ball's mark measures. */
const LOGO_ANGULAR_RADIUS = 0.42

function dataTexture(data, width, height, srgb) {
    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat)
    if (srgb) texture.colorSpace = THREE.SRGBColorSpace
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = true
    texture.anisotropy = 8
    texture.needsUpdate = true
    return texture
}

export default function Basketball({ position = BALL_POSITION, visible = true }) {
    const baked = useMemo(() => {
        const logoMask = buildLogoMask({ scale: 4, pad: 6 })
        return bakeBallTextures({
            width: MAP_WIDTH,
            height: MAP_HEIGHT,
            logoMask,
            logoAngularRadius: LOGO_ANGULAR_RADIUS,
        })
    }, [])

    const textures = useMemo(
        () => ({
            map: dataTexture(baked.color, baked.width, baked.height, true),
            bumpMap: dataTexture(baked.bump, baked.width, baked.height, false),
            roughnessMap: dataTexture(baked.rough, baked.width, baked.height, false),
        }),
        [baked]
    )

    /** Where the embossed mark is turned to face. */
    const facing = useMemo(() => {
        const elev = THREE.MathUtils.degToRad(LOGO_FACING_ELEVATION)
        const azim = THREE.MathUtils.degToRad(BALL_VIEW_AZIMUTH)
        return new THREE.Vector3(
            Math.sin(azim) * Math.cos(elev),
            Math.sin(elev),
            Math.cos(azim) * Math.cos(elev)
        ).normalize()
    }, [])

    const quaternion = useMemo(() => {
        const from = new THREE.Vector3(...baked.anchor).normalize()
        const aim = new THREE.Quaternion().setFromUnitVectors(from, facing)
        // A roll about the facing axis, so the mark is not mechanically
        // level and the seams fall across the ball at a natural angle.
        const roll = new THREE.Quaternion().setFromAxisAngle(facing, BALL_ROLL)
        return roll.multiply(aim)
    }, [baked, facing])

    const materialRef = useRef(null)

    useEffect(() => {
        // The bake will not place a mark that crosses a groove, so a failure
        // here means the geometry moved under it — worth saying out loud
        // rather than shipping a logo cut in half by a seam.
        if (!baked.logoFits) {
            console.warn(
                '[Basketball] logo would cross a seam; nearest groove at',
                baked.logoWorstClearance,
                'rad. Reduce LOGO_ANGULAR_RADIUS.'
            )
        }
    }, [baked])

    useEffect(
        () => () => {
            for (const t of Object.values(textures)) t.dispose()
        },
        [textures]
    )

    useEffect(() => {
        if (!materialRef.current) return
        // Lit by the court's own pool like everything else standing on it,
        // so the ball darkens toward the apron rather than staying evenly
        // lit wherever it's put.
        applyPoolFalloff(materialRef.current, { cacheKey: 'basketball' })
    }, [])

    if (!visible) return null

    return (
        <mesh position={position} quaternion={quaternion} castShadow={false}>
            <sphereGeometry args={[BALL_RADIUS, SEGMENTS, SEGMENTS / 2]} />
            <meshStandardMaterial
                ref={materialRef}
                map={textures.map}
                bumpMap={textures.bumpMap}
                // Shallow: the spec puts the emboss at 0.5-1mm against 6mm
                // grooves, and a bump map exaggerates very easily.
                bumpScale={3}
                roughnessMap={textures.roughnessMap}
                roughness={1}
                metalness={0}
            />
        </mesh>
    )
}
