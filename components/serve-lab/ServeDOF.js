import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * A shallow depth of field, always focused on the server.
 *
 * Not an effect for its own sake. The arena is 40 m deep and the thing
 * worth looking at is a 1.9 m figure, and with everything equally sharp the
 * eye has nothing telling it where to go — the net, the far baseline and
 * the stands all compete with the serve. Throwing the far end slightly out
 * does what a long lens does at a real match.
 *
 * **Focus is computed, never searched for.** The usual approach is to
 * raycast through the centre of the screen and focus on whatever is there,
 * which breaks the moment the subject is off-centre or something crosses in
 * front. Here the subject's world position is already known every frame, so
 * the focal distance is just the distance to it, and the server cannot drift
 * out of focus however the camera moves.
 *
 * One blur pass, small radius. The scene is already dark and foggy; a
 * heavier blur reads as a smeared render rather than as a lens.
 */

/*
  Retuned after the first pass was, in John's words, not visible at all.
  It was not: 2.2 m of sharp either side with a 14 m falloff and a 3 px
  ceiling means nothing reaches even half blur until it is 9 m from the
  subject, and the far baseline is the only thing in the scene that far
  away. A real long lens on a tennis court throws the net soft.
*/

/** Metres either side of the subject that stay effectively sharp. */
const FOCUS_RANGE = 1.0
/** How quickly it falls off past that, and the ceiling on the blur. */
const FOCUS_FALLOFF = 3.4
const MAX_BLUR_PIXELS = 13

const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
}`

const fragmentShader = `
precision highp float;
varying vec2 vUv;
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform vec2 uTexel;
uniform float uNear;
uniform float uFar;
uniform float uFocus;
uniform float uRange;
uniform float uFalloff;
uniform float uMaxBlur;
uniform float uSuper;
uniform float uGrain;
uniform float uTime;

/* Perspective depth is not linear; the blur has to be driven by metres. */
float viewDistance(vec2 uv) {
    float z = texture2D(tDepth, uv).x * 2.0 - 1.0;
    return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear));
}

/*
  Film grain.

  Everything in this scene is procedurally clean — generated noise on
  mathematically exact geometry under analytic lights — and that cleanliness
  is itself a tell. A little sensor noise is what a camera would have put
  there, and it also breaks up the banding that a dark scene with long
  gradients is prone to.

  Scaled down in the highlights: real film and real sensors are noisiest in
  the shadows, and uniform grain over a bright court looks like dirt.
*/
vec3 grain(vec2 uv) {
    // The multiplier is the grain's fineness: lower means each speck
    // covers more pixels. 1024 across the frame put a speck inside a
    // pixel and a half, which reads as digital hash rather than as film.
    float n = fract(sin(dot(uv * 560.0 + uTime, vec2(12.9898, 78.233))) * 43758.5453);
    float luma = dot(texture2D(tColor, uv).rgb, vec3(0.299, 0.587, 0.114));
    return vec3((n - 0.5) * uGrain * (1.0 - 0.7 * clamp(luma, 0.0, 1.0)));
}

float circleOfConfusion(vec2 uv) {
    float d = viewDistance(uv);
    float past = max(0.0, abs(d - uFocus) - uRange);
    return clamp(past / uFalloff, 0.0, 1.0);
}

void main() {
    float coc = circleOfConfusion(vUv);

    /*
      The sharp path is also the downsample. At 2x, four taps half a target
      texel off centre is exactly a 2x2 box filter, which is what resolves
      the lines; at 1x the offsets collapse and this is a plain fetch.
    */
    vec2 o = uTexel * (uSuper - 1.0);
    vec4 base;
    if (o.x > 0.0) {
        /*
          A tent, not a box. A 2x2 box is the exact downsample and still
          drops a line thinner than a target texel out of alternate
          destination pixels, which is the dashing this is here to fix.
          Reaching a full texel out and weighting the centre double covers
          the gap, at the cost of a hair of sharpness.
        */
        base = texture2D(tColor, vUv) * 0.36;
        base += texture2D(tColor, vUv + vec2(-o.x, 0.0)) * 0.16;
        base += texture2D(tColor, vUv + vec2(o.x, 0.0)) * 0.16;
        base += texture2D(tColor, vUv + vec2(0.0, -o.y)) * 0.16;
        base += texture2D(tColor, vUv + vec2(0.0, o.y)) * 0.16;
    } else {
        base = texture2D(tColor, vUv);
    }

    if (coc < 0.004) {
        gl_FragColor = base;
        gl_FragColor.rgb += grain(vUv);
        return;
    }

    /*
      A twelve-tap ring pair rather than a box: a lens blurs into a disc,
      and two offset rings approximate one far better than a square kernel
      of the same cost. Each tap is rejected if it comes from something
      much nearer than this pixel, which is what stops the sharp figure
      bleeding outward onto the blurred court behind it.
    */
    float radius = coc * uMaxBlur * uSuper;
    float here = viewDistance(vUv);
    vec4 sum = base;
    float weight = 1.0;
    for (int i = 0; i < 12; i++) {
        float a = (float(i) / 12.0) * 6.2831853;
        float r = (i < 6 ? 0.6 : 1.0) * radius;
        vec2 uv = vUv + vec2(cos(a), sin(a)) * r * uTexel;
        float d = viewDistance(uv);
        float ok = d > here - 0.6 ? 1.0 : 0.25;
        sum += texture2D(tColor, uv) * ok;
        weight += ok;
    }
    gl_FragColor = sum / weight;
    gl_FragColor.rgb += grain(vUv);
}`

export default function ServeDOF({ focusPoint }) {
    const { gl, scene, camera, size, viewport } = useThree()
    const dpr = viewport.dpr

    const target = useMemo(() => {
        const t = new THREE.WebGLRenderTarget(1, 1, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            type: THREE.HalfFloatType,
        })
        t.depthTexture = new THREE.DepthTexture(1, 1)
        t.depthTexture.type = THREE.UnsignedIntType
        return t
    }, [])

    const material = useMemo(
        () =>
            new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                depthTest: false,
                depthWrite: false,
                uniforms: {
                    tColor: { value: null },
                    tDepth: { value: null },
                    uTexel: { value: new THREE.Vector2() },
                    uNear: { value: 0.05 },
                    uFar: { value: 260 },
                    uFocus: { value: 8 },
                    uRange: { value: FOCUS_RANGE },
                    uFalloff: { value: FOCUS_FALLOFF },
                    uMaxBlur: { value: MAX_BLUR_PIXELS },
                    uSuper: { value: 1 },
                    uGrain: { value: 0.07 },
                    uTime: { value: 0 },
                },
            }),
        []
    )

    /*
      The quad lives in its own scene. Adding it to the main one would mean
      compositing the previous frame into the target it is about to be
      composited from, and R3F has no notion of a pass that should be
      excluded from the scene render.
    */
    const pass = useMemo(() => {
        const quadScene = new THREE.Scene()
        const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
        const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
        quad.frustumCulled = false
        quadScene.add(quad)
        return { quadScene, quadCamera, quad }
    }, [material])

    /*
      Antialiasing, the long way round.

      The canvas gets MSAA for free; an offscreen target does not, and the
      court lines are a couple of pixels wide and nearly horizontal in most
      of these views, so without it they break into regular dashes as they
      cross the pixel grid. It reads as a dashed line someone drew rather
      than as aliasing, which is what made it worth chasing.

      `samples: 4` on the target is the obvious answer and is wrong here:
      with a `DepthTexture` attached the depth never resolves, the blur
      reads garbage out of it, and the scene fills with black streaks. So
      the target is rendered at double resolution instead and box-filtered
      back down in the composite. Only when the device is not already
      dense — at dpr 2 the canvas has the samples anyway, and 4x the
      fragments for it would not be a fair trade.
    */
    const supersample = dpr >= 1.5 ? 1 : 2

    useEffect(() => {
        // Ask the renderer for the buffer size rather than recomputing it.
        // A target even a pixel off the canvas resamples the whole frame
        // through a linear filter, which softens everything by a hair and
        // is miserable to spot.
        const buffer = gl.getDrawingBufferSize(new THREE.Vector2())
        const w = Math.max(1, Math.round(buffer.x * supersample))
        const h = Math.max(1, Math.round(buffer.y * supersample))
        target.setSize(w, h)
        material.uniforms.tColor.value = target.texture
        material.uniforms.tDepth.value = target.depthTexture
        material.uniforms.uTexel.value.set(1 / w, 1 / h)
        material.uniforms.uSuper.value = supersample
    }, [gl, size.width, size.height, dpr, supersample, target, material])

    useEffect(
        () => () => {
            target.dispose()
            target.depthTexture?.dispose()
            material.dispose()
            pass.quad.geometry.dispose()
        },
        [target, material, pass]
    )

    /*
      Priority 1, which takes rendering over from R3F entirely. It also runs
      after the default-priority frame callbacks, so the figure has already
      been posed for this frame and the focus point is current rather than
      one frame stale.
    */
    useFrame(() => {
        // Re-seeded every frame, so the grain moves the way sensor noise
        // does rather than sitting on the image like a texture.
        /*
          Re-seeded about 24 times a second, not every frame. A fresh seed
          at 60 fps makes every speck independent three times over in the
          time the eye integrates one impression, which reads as flicker
          rather than as grain. Film exposes 24 times a second and so does
          this.
        */
        material.uniforms.uTime.value = Math.floor(performance.now() / 42) % 10000
        material.uniforms.uNear.value = camera.near
        material.uniforms.uFar.value = camera.far
        if (focusPoint?.current) {
            material.uniforms.uFocus.value = camera.position.distanceTo(focusPoint.current)
        }

        gl.setRenderTarget(target)
        gl.clear()
        gl.render(scene, camera)
        gl.setRenderTarget(null)
        gl.render(pass.quadScene, pass.quadCamera)
    }, 1)

    return null
}
