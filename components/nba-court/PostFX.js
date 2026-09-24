import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { COURT_HALF, LIGHT_RIG } from './constants'
import { debugState } from './debug-state'

/**
 * Depth of field and arena haze, as one extra pass.
 *
 * Both need the same two things a normal object in the scene does not have:
 * the finished frame, and its depth. So the scene renders to an offscreen
 * target first, and this component composites from that — one render target,
 * one full-screen shader, both effects, rather than a postprocessing library
 * pulling in its own render-graph and its own opinions about colour
 * management. Consistent with the rest of this file: an analytic
 * approximation in a shader, tunable from the URL, rather than a general
 * solution imported whole.
 *
 * Every material already in this scene runs its own
 * `#include <tonemapping_fragment>` / `#include <colorspace_fragment>` (the
 * same pattern the built-in materials use), so whatever lands in the render
 * target is already tonemapped and gamma-encoded — final pixels, not linear
 * HDR. The composite shader treats it that way: it never runs those includes
 * itself, or the frame would be tonemapped twice and go flat and pale.
 *
 * Focus is not a fixed distance, because the camera's own distance to its
 * subject changes by pose (18ft at the basket, over 100ft at the wide court
 * shot). Instead the depth at screen centre is sampled and eased toward each
 * frame — "whatever the camera is looking at" — which is centred by
 * construction for every pose this rig has.
 */

/** How strong the photo-grain overlay is, as a fraction of full colour range. */
const GRAIN_STRENGTH = 0.035

const composeVertex = /* glsl */ `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
    }
`

const composeFragment = /* glsl */ `
    precision highp float;

    uniform sampler2D tColor;
    uniform sampler2D tDepth;
    uniform vec2  uResolution;
    uniform float uNear;
    uniform float uFar;
    uniform mat4  uInverseProjection;
    uniform mat4  uInverseView;
    uniform vec3  uCameraPos;

    uniform float uFocusDistance;
    uniform float uFocusRange;
    uniform float uFocusFalloff;
    uniform float uMaxBlurPx;
    uniform float uDofStrength;

    uniform float uHazeStrength;
    uniform float uHazeHeight;
    uniform float uHazeThickness;
    uniform float uHazeExtent;
    uniform vec3  uHazeColor;
    uniform float uHazeShaftStrength;

    uniform float uGrainStrength;
    uniform float uGrainSeed;

    varying vec2 vUv;

    // Standard inverse of three's perspective depth packing — the same
    // formula the engine's own packing.glsl uses, inlined because a raw
    // ShaderMaterial does not pull in that chunk automatically.
    float linearizeDepth(float z) {
        float clipZ = z * 2.0 - 1.0;
        return (2.0 * uNear * uFar) / (uFar + uNear - clipZ * (uFar - uNear));
    }

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    vec3 worldFromDepth(vec2 uv, float depthRaw) {
        vec4 clip = vec4(uv * 2.0 - 1.0, depthRaw * 2.0 - 1.0, 1.0);
        vec4 view = uInverseProjection * clip;
        view /= view.w;
        vec4 world = uInverseView * view;
        return world.xyz;
    }

    // A dozen taps in two rings, scaled by the circle of confusion. Cheap
    // scatter-as-gather DOF — plenty for "barely soft at the edges", which is
    // all this scene ever asks of it.
    const int TAPS = 12;
    vec2 ring(int i) {
        float a = float(i) * 0.5235988; // 2pi/12
        float r = (i < 6) ? 0.5 : 1.0;
        return vec2(cos(a), sin(a)) * r;
    }

    void main() {
        vec4 base = texture2D(tColor, vUv);
        float depthRaw = texture2D(tDepth, vUv).x;
        float viewZ = linearizeDepth(depthRaw);

        // Circle of confusion: zero inside the focus band, ramping up over
        // uFocusFalloff beyond it, in front of and behind the subject alike.
        float dist = abs(viewZ - uFocusDistance) - uFocusRange;
        float coc = clamp(dist / max(uFocusFalloff, 0.01), 0.0, 1.0) * uDofStrength;
        float radiusPx = coc * uMaxBlurPx;

        vec3 color = base.rgb;
        if (radiusPx > 0.4) {
            vec2 px = radiusPx / uResolution;
            vec3 sum = base.rgb;
            float wsum = 1.0;
            for (int i = 0; i < TAPS; i++) {
                vec2 o = ring(i) * px;
                sum += texture2D(tColor, vUv + o).rgb;
                wsum += 1.0;
            }
            color = sum / wsum;
        }

        // Haze: a short raymarch from the camera to this pixel's surface (or
        // out to uHazeExtent, for rays that miss everything and read the
        // clear colour instead — the empty bowl still has haze in it).
        vec3 worldPos = worldFromDepth(vUv, depthRaw);
        float travel = distance(uCameraPos, worldPos);
        bool hitSky = depthRaw > 0.9999;
        float marchDist = hitSky ? uHazeExtent : min(travel, uHazeExtent);

        vec3 rayDir = hitSky
            ? normalize(worldFromDepth(vUv, 0.5) - uCameraPos)
            : (worldPos - uCameraPos) / max(travel, 0.001);

        const int STEPS = 14;
        float stepLen = marchDist / float(STEPS);
        // Averaged over the steps taken, not summed in raw feet. A sky ray
        // marches the full uHazeExtent (190ft) while a ray hitting the near
        // floor marches only a few feet — summing raw path length meant the
        // sky rays integrated to several times the near ones and blew the
        // whole frame out white. Averaged, both land in a comparable 0..1
        // range regardless of how far the ray actually travels.
        float haze = 0.0;
        float shaft = 0.0;

        for (int i = 0; i < STEPS; i++) {
            float t = (float(i) + 0.5) * stepLen;
            vec3 p = uCameraPos + rayDir * t;

            // Denser in a band around the light rig's height, thinning
            // toward the floor and clearing above the catwalk — real arena
            // haze sits in the roof structure, not underfoot.
            float band = exp(-pow((p.y - uHazeHeight) / uHazeThickness, 2.0));

            // Bounded roughly to the bowl over the court, not the infinite
            // floor plane.
            vec2 d = abs(p.xz) - (COURT_HALF_VEC + vec2(uHazeExtent * 0.35));
            float inside = 1.0 - smoothstep(0.0, uHazeExtent * 0.4, length(max(d, vec2(0.0))));

            haze += band * inside;

            // Shafts: brighter where the ray sample sits close to one of the
            // two light-bank rows, at roughly their height — a coarse stand-
            // in for real light-through-haze scattering, not a per-fixture
            // occlusion test, which a raymarch this short cannot afford.
            float rowDist = min(abs(p.z - ROW_Z), abs(p.z + ROW_Z));
            float nearRow = exp(-pow(rowDist / 6.0, 2.0));
            float nearHeight = exp(-pow((p.y - RIG_HEIGHT) / 5.0, 2.0));
            shaft += nearRow * nearHeight * inside;
        }

        haze /= float(STEPS);
        shaft /= float(STEPS);

        vec3 hazeColor = uHazeColor * (haze * uHazeStrength + shaft * uHazeShaftStrength);
        color += hazeColor;

        // Photo grain: fresh per-pixel noise every frame (uGrainSeed changes
        // each frame), not a fixed dither pattern — real film grain is a new
        // random exposure each frame, not a texture stamped on top, and a
        // static pattern would just read as a dirty lens rather than grain.
        // Signed and small, so it adds texture without visibly lifting or
        // crushing anything.
        float grain = (hash(vUv * uResolution + uGrainSeed) - 0.5) * uGrainStrength;
        color += grain;

        gl_FragColor = vec4(color, 1.0);
    }
`

export default function PostFX({
    tuning = null,
    focusOverride = null,
    focusRange = null,
}) {
    const { gl, scene, camera, size } = useThree()
    const focusRef = useRef(60)
    const raycaster = useMemo(() => new THREE.Raycaster(), [])
    const centerNdc = useMemo(() => new THREE.Vector2(0, 0), [])

    const target = useMemo(() => {
        const t = new THREE.WebGLRenderTarget(1, 1, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            depthBuffer: true,
            stencilBuffer: false,
        })
        t.depthTexture = new THREE.DepthTexture(1, 1)
        t.depthTexture.type = THREE.UnsignedIntType
        t.depthTexture.format = THREE.DepthFormat
        return t
    }, [])

    useEffect(() => () => target.dispose(), [target])

    useEffect(() => {
        // The canvas's own drawing-buffer size, not a recomputed
        // size*pixelRatio — R3F sets gl.domElement.width/height authoritatively
        // when it applies dpr, and a separately recomputed value only has to
        // disagree with it once (a dpr clamped to the Canvas's [1,2] range, a
        // resize mid-frame) to size this target wrong. That showed up as the
        // render appearing zoomed into one corner: the scene painted correctly
        // into a target smaller than assumed, and sampling the full 0..1 UV
        // range across it stretched that corner over the whole screen.
        const w = Math.max(1, gl.domElement.width)
        const h = Math.max(1, gl.domElement.height)
        target.setSize(w, h)
    }, [gl, size, target])

    const uniforms = useMemo(
        () => ({
            tColor: { value: target.texture },
            tDepth: { value: target.depthTexture },
            uResolution: { value: new THREE.Vector2(1, 1) },
            uNear: { value: camera.near },
            uFar: { value: camera.far },
            uInverseProjection: { value: new THREE.Matrix4() },
            uInverseView: { value: new THREE.Matrix4() },
            uCameraPos: { value: new THREE.Vector3() },

            uFocusDistance: { value: 60 },
            uFocusRange: { value: 2 },
            uFocusFalloff: { value: 35 },
            uMaxBlurPx: { value: 6.5 },
            uDofStrength: { value: 1 },

            uHazeStrength: { value: 0.32 },
            uHazeHeight: { value: 66 },
            uHazeThickness: { value: 96 },
            uHazeExtent: { value: 100 },
            uHazeColor: { value: new THREE.Color('#aab6d6') },
            uHazeShaftStrength: { value: 0.95 },

            uGrainStrength: { value: GRAIN_STRENGTH },
            uGrainSeed: { value: 0 },
        }),
        [target, camera]
    )

    const quad = useMemo(() => {
        const geometry = new THREE.PlaneGeometry(2, 2)
        const material = new THREE.ShaderMaterial({
            vertexShader: composeVertex,
            fragmentShader: composeFragment
                .replaceAll('COURT_HALF_VEC', `vec2(${COURT_HALF[0].toFixed(3)}, ${COURT_HALF[1].toFixed(3)})`)
                .replaceAll('ROW_Z', LIGHT_RIG.rowZ.toFixed(3))
                .replaceAll('RIG_HEIGHT', LIGHT_RIG.height.toFixed(3)),
            uniforms,
            depthTest: false,
            depthWrite: false,
            // The vertex shader writes clip space directly and ignores the
            // camera, which sidesteps three's normal winding computation —
            // whichever way that happens to come out, cull nothing rather
            // than gamble on it matching FrontSide's assumption.
            side: THREE.DoubleSide,
            // Already tonemapped and encoded by the materials that filled the
            // render target — running this again would double-apply ACES.
            toneMapped: false,
        })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.frustumCulled = false
        // On its own layer, inside the REAL scene rather than an ad-hoc
        // THREE.Scene — a raw `new THREE.Scene()` that R3F never adopted
        // rendered nothing here, silently and without any GL error, on this
        // exact three/R3F combination; using the real scene sidesteps
        // whatever internal state that path was missing. The real camera
        // defaults to layer 0, so it never sees this on its own; the compose
        // pass switches the camera onto layer 1 for one render call.
        mesh.layers.set(1)
        return mesh
    }, [uniforms])

    useEffect(() => {
        scene.add(quad)
        return () => {
            scene.remove(quad)
            quad.geometry.dispose()
            quad.material.dispose()
        }
    }, [scene, quad])

    useFrame((_state, delta) => {
        // Same authoritative source as the target's own size — see the sizing
        // effect above for why a recomputed size*pixelRatio is the wrong thing
        // to match it against.
        uniforms.uResolution.value.set(gl.domElement.width, gl.domElement.height)
        // A view can widen its own depth of field. The live view does,
        // because its scoreboard stands ~35ft beyond whatever the camera is
        // focused on — at the default 2ft band that put it at 94% blur,
        // which is right for a stanchion in the dark and wrong for the one
        // element the view exists to read. Scoped to the view rather than
        // changed globally, so the compositions that were tuned around a
        // shallow field keep it.
        if (focusRange != null) uniforms.uFocusRange.value = focusRange

        uniforms.uNear.value = camera.near
        uniforms.uFar.value = camera.far
        uniforms.uInverseProjection.value.copy(camera.projectionMatrixInverse)
        uniforms.uInverseView.value.copy(camera.matrixWorld)
        camera.getWorldPosition(uniforms.uCameraPos.value)

        // A fresh seed every frame is what makes it read as grain rather
        // than a static overlay — the exact value doesn't matter, only that
        // it never repeats frame to frame.
        uniforms.uGrainSeed.value = Math.random() * 1000.0

        if (tuning) {
            if (tuning.dof != null) uniforms.uDofStrength.value = tuning.dof
            if (tuning.dofrange != null) uniforms.uFocusRange.value = tuning.dofrange
            if (tuning.doffalloff != null) uniforms.uFocusFalloff.value = tuning.doffalloff
            if (tuning.dofblur != null) uniforms.uMaxBlurPx.value = tuning.dofblur
            if (tuning.doffocus != null) focusRef.current = tuning.doffocus
            if (tuning.haze != null) uniforms.uHazeStrength.value = tuning.haze
            if (tuning.hazeheight != null) uniforms.uHazeHeight.value = tuning.hazeheight
            if (tuning.hazethickness != null) uniforms.uHazeThickness.value = tuning.hazethickness
            if (tuning.hazeextent != null) uniforms.uHazeExtent.value = tuning.hazeextent
            if (tuning.hazeshaft != null) uniforms.uHazeShaftStrength.value = tuning.hazeshaft
            // Named apart from the court shader's own ?grain= (the wood
            // grain texture strength) — same word, different effect.
            if (tuning.filmgrain != null) uniforms.uGrainStrength.value = tuning.filmgrain
        }

        // Real runtime numbers, not assumptions — the exact ones needed to
        // diagnose a sizing mismatch, since my own test environment reports
        // devicePixelRatio 1 and has never once reproduced the bug this is
        // for.
        if (debugState.active) {
            debugState.postfx = {
                domW: gl.domElement.width,
                domH: gl.domElement.height,
                domStyleW: gl.domElement.style.width,
                domStyleH: gl.domElement.style.height,
                targetW: target.width,
                targetH: target.height,
                bufW: gl.getDrawingBufferSize(new THREE.Vector2()).x,
                bufH: gl.getDrawingBufferSize(new THREE.Vector2()).y,
                pixelRatio: gl.getPixelRatio(),
                devicePixelRatio:
                    typeof window !== 'undefined' ? window.devicePixelRatio : null,
                sizeW: size.width,
                sizeH: size.height,
                camAspect: camera.aspect,
            }
        }

        // Render the real scene into the offscreen target first. The quad
        // lives on layer 1, which the camera does not see by default, so it
        // is naturally absent from this pass without needing to be hidden.
        gl.setRenderTarget(target)
        gl.clear()
        gl.render(scene, camera)
        gl.setRenderTarget(null)
        // gl.setViewport takes logical (CSS) pixels — three multiplies by its
        // own pixelRatio internally to reach the physical framebuffer size.
        // Passing gl.domElement.width/height (already physical) here doubled
        // that on any dpr!=1 display, producing a viewport twice the real
        // framebuffer, anchored at the origin — exactly the "zoomed into the
        // lower-left corner" crop reported on a real hiDPI screen and never
        // reproduced in this project's dpr=1 test environment.
        gl.setViewport(0, 0, size.width, size.height)

        // Autofocus: ease toward the distance to whatever is at screen centre,
        // unless a URL override pins it. Reading the depth texture itself back
        // to the CPU means an async GPU readback, which is worth avoiding on a
        // value that only needs to be roughly right — a CPU-side raycast
        // through the same scene the target was just built from, cast once
        // through the centre pixel, is far cheaper and gives the same answer
        // for a solid, opaque scene like this one.
        if (focusOverride != null) {
            uniforms.uFocusDistance.value = focusOverride
        } else if (tuning?.doffocus != null) {
            uniforms.uFocusDistance.value = tuning.doffocus
        } else {
            raycaster.setFromCamera(centerNdc, camera)
            const hits = raycaster.intersectObjects(scene.children, true)
            const dist = hits.length ? hits[0].distance : focusRef.current
            const k = 1 - Math.pow(0.0005, delta)
            focusRef.current += (dist - focusRef.current) * k
            uniforms.uFocusDistance.value = focusRef.current
        }

        // Composite: blur + haze, straight to the screen. Switching the real
        // camera onto layer 1 for this one call makes it see only the quad —
        // its vertex shader ignores the camera's own matrices regardless, so
        // which camera object draws it has never been the relevant thing.
        camera.layers.set(1)
        gl.render(scene, camera)
        camera.layers.set(0)
    }, 1)

    return null
}
