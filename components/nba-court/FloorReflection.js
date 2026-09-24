import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

/**
 * A planar reflection of the whole scene in the court floor.
 *
 * Until this existed, the floor's reflections were entirely analytic: the
 * court shader ray-traces the mirror direction against *described* shapes —
 * the ceiling light banks and the balcony LED ribbon — neither of which is
 * ever actually drawn. That gives a convincing shine, but it means the
 * floor cannot reflect anything that genuinely is in the room. Objects
 * standing on it read as pasted on, which is exactly how the scoreboard
 * numerals behind the courtside seats looked.
 *
 * So this renders the scene a second time from a camera mirrored through
 * the floor plane, and hands the result to the court shader, which samples
 * it through the same Fresnel and roughness terms the analytic reflections
 * already use (see `sceneReflection` in `court-shader.js`). The analytic
 * terms stay: they describe light sources that have no geometry, so this
 * adds to them rather than replacing them.
 *
 * **The floor itself is hidden for the pass.** Not an optimization — the
 * court material samples the very target being drawn into, and leaving it
 * visible feeds a render target into its own render.
 *
 * **An oblique near plane clips everything below the floor.** Without it
 * the mirrored camera sees the underside of the world and reflects things
 * that are, from the floor's point of view, behind it.
 *
 * Runs at priority 0 so it lands before `PostFX`'s priority-1 pass, which
 * has already taken over rendering for the whole scene.
 */

/** Half the drawing buffer's resolution. Fresnel and blur eat the rest. */
const SCALE = 0.5
/** Nudges the clip plane below the floor so the floor's own contact shadowing
 *  doesn't self-clip along the plane. */
const CLIP_BIAS = 0.06

export default function FloorReflection({ courtRef, materialRef }) {
    const { gl, scene, camera, size, viewport } = useThree()

    const rig = useMemo(
        () => ({
            target: new THREE.WebGLRenderTarget(1, 1, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                type: THREE.UnsignedByteType,
                depthBuffer: true,
            }),
            virtualCamera: new THREE.PerspectiveCamera(),
            textureMatrix: new THREE.Matrix4(),
            reflectorPos: new THREE.Vector3(0, 0, 0),
            normal: new THREE.Vector3(0, 1, 0),
            view: new THREE.Vector3(),
            target3: new THREE.Vector3(),
            lookAt: new THREE.Vector3(),
            camPos: new THREE.Vector3(),
            rotation: new THREE.Matrix4(),
            clipPlane: new THREE.Plane(),
            clipVector: new THREE.Vector4(),
            q: new THREE.Vector4(),
        }),
        []
    )

    useEffect(() => () => rig.target.dispose(), [rig])

    useEffect(() => {
        const dpr = viewport.dpr || 1
        rig.target.setSize(
            Math.max(1, Math.floor(size.width * dpr * SCALE)),
            Math.max(1, Math.floor(size.height * dpr * SCALE))
        )
    }, [rig, size.width, size.height, viewport.dpr])

    useFrame(() => {
        const material = materialRef?.current
        const court = courtRef?.current
        if (!material) return

        const {
            target, virtualCamera, textureMatrix, reflectorPos, normal,
            view, target3, lookAt, camPos, rotation, clipPlane, clipVector, q,
        } = rig

        camPos.setFromMatrixPosition(camera.matrixWorld)

        // Under the floor: there is no reflection to show, and the maths
        // below would put the virtual camera on the wrong side.
        view.subVectors(reflectorPos, camPos)
        if (view.dot(normal) > 0) return

        // Mirror the camera's position and its aim through the plane. This
        // is three.js's own `Reflector` construction, specialised to the
        // y = 0 plane the court sits on.
        view.reflect(normal).negate().add(reflectorPos)

        rotation.extractRotation(camera.matrixWorld)
        lookAt.set(0, 0, -1).applyMatrix4(rotation).add(camPos)
        target3.subVectors(reflectorPos, lookAt).reflect(normal).negate().add(reflectorPos)

        virtualCamera.position.copy(view)
        virtualCamera.up.set(0, 1, 0).applyMatrix4(rotation).reflect(normal)
        virtualCamera.lookAt(target3)
        virtualCamera.near = camera.near
        virtualCamera.far = camera.far
        virtualCamera.fov = camera.fov
        virtualCamera.aspect = camera.aspect
        virtualCamera.updateProjectionMatrix()
        virtualCamera.updateMatrixWorld()

        // Clip space -> texture space, folded into the view-projection so the
        // vertex shader can produce a coordinate the fragment just divides.
        textureMatrix.set(
            0.5, 0.0, 0.0, 0.5,
            0.0, 0.5, 0.0, 0.5,
            0.0, 0.0, 0.5, 0.5,
            0.0, 0.0, 0.0, 1.0
        )
        textureMatrix.multiply(virtualCamera.projectionMatrix)
        textureMatrix.multiply(virtualCamera.matrixWorldInverse)

        // Oblique near plane: push the camera's near plane onto the mirror
        // plane itself, so geometry below the floor is clipped by the
        // projection rather than drawn and then hidden.
        clipPlane.setFromNormalAndCoplanarPoint(normal, reflectorPos)
        clipPlane.applyMatrix4(virtualCamera.matrixWorldInverse)
        clipVector.set(clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.constant)

        const projection = virtualCamera.projectionMatrix
        q.x = (Math.sign(clipVector.x) + projection.elements[8]) / projection.elements[0]
        q.y = (Math.sign(clipVector.y) + projection.elements[9]) / projection.elements[5]
        q.z = -1.0
        q.w = (1.0 + projection.elements[10]) / projection.elements[14]
        clipVector.multiplyScalar(2.0 / clipVector.dot(q))
        projection.elements[2] = clipVector.x
        projection.elements[6] = clipVector.y
        projection.elements[10] = clipVector.z + 1.0 - CLIP_BIAS
        projection.elements[14] = clipVector.w

        // The court samples this target, so it cannot also be in it.
        const courtWasVisible = court ? court.visible : false
        if (court) court.visible = false

        const prevTarget = gl.getRenderTarget()
        const prevXr = gl.xr.enabled
        const prevShadowAuto = gl.shadowMap.autoUpdate
        const prevClearAlpha = gl.getClearAlpha()
        gl.xr.enabled = false
        gl.shadowMap.autoUpdate = false
        // Cleared transparent so the target's alpha channel becomes a
        // coverage mask: 1 wherever real geometry stands above the floor,
        // 0 where the mirror looks through to nothing. The court shader
        // uses that to let the scoreboard block the analytic reflections it
        // stands in front of.
        gl.setClearAlpha(0)

        gl.setRenderTarget(target)
        gl.clear()
        gl.render(scene, virtualCamera)

        gl.setRenderTarget(prevTarget)
        gl.setClearAlpha(prevClearAlpha)
        gl.xr.enabled = prevXr
        gl.shadowMap.autoUpdate = prevShadowAuto
        if (court) court.visible = courtWasVisible

        material.uniforms.uReflectMap.value = target.texture
        material.uniforms.uReflectMatrix.value.copy(textureMatrix)
    }, 0)

    return null
}
