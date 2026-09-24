import * as THREE from 'three'
import { COURT_HALF } from './constants'

/**
 * Puts scene geometry under the same light pool as the floor.
 *
 * The court's falloff lives inside its own fragment shader, so anything lit by
 * the RectAreaLights instead — the hoops, the stanchions — stayed evenly lit
 * while the floor around them fell away to black. That reads as objects pasted
 * onto the scene rather than standing in it.
 *
 * This patches a standard material so its outgoing light is multiplied by the
 * same box mask the court uses. Geometry over the court (board, rim, net) stays
 * lit; the stanchion, which really does stand outside the lines, recedes into
 * the dark exactly as it should.
 */
export const POOL_DEFAULTS = {
    feather: 2.6,
    spill: 0.11,
    /** How much light survives outside the pool. Never zero, or edges crush. */
    floor: 0.12,
    /** Fixtures are overhead, so tall things catch a little more. */
    heightGain: 0.006,
    /** How fast the spill dies off with distance past the pool edge, per
     *  foot. The hoops and stanchions sit close enough to the line that the
     *  default reads fine; something that spreads much further out (falling
     *  confetti, say) needs a much gentler rate or the light reads as a hard
     *  box around the court rather than a gradual fade. */
    decay: 0.075,
}

/**
 * Builds the onBeforeCompile callback on its own, so a caller that also needs
 * to patch the same material for something else (an instanced per-vertex
 * colour, say) can compose it with their own compiler instead of it
 * overwriting theirs — `material.onBeforeCompile` can only hold one function.
 */
export function makePoolFalloffCompiler(options = {}) {
    const o = { ...POOL_DEFAULTS, ...options }

    return (shader) => {
        shader.uniforms.uPoolHalf = {
            value: new THREE.Vector2(COURT_HALF[0], COURT_HALF[1]),
        }
        shader.uniforms.uPoolFeather = { value: o.feather }
        shader.uniforms.uPoolSpill = { value: o.spill }
        shader.uniforms.uPoolFloor = { value: o.floor }
        shader.uniforms.uPoolHeightGain = { value: o.heightGain }
        shader.uniforms.uPoolDecay = { value: o.decay }

        shader.vertexShader =
            'varying vec3 vPoolWorld;\n' +
            shader.vertexShader.replace(
                '#include <begin_vertex>',
                `#include <begin_vertex>
                 vPoolWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`
            )

        shader.fragmentShader =
            `varying vec3 vPoolWorld;
             uniform vec2  uPoolHalf;
             uniform float uPoolFeather;
             uniform float uPoolSpill;
             uniform float uPoolFloor;
             uniform float uPoolHeightGain;
             uniform float uPoolDecay;\n` +
            shader.fragmentShader.replace(
                '#include <tonemapping_fragment>',
                `{
                    vec2 pd = abs(vPoolWorld.xz) - uPoolHalf;
                    float pedge = max(pd.x, pd.y);
                    float pool = 1.0 - smoothstep(-uPoolFeather, uPoolFeather, pedge);
                    float pspill = uPoolSpill * exp(-max(pedge, 0.0) * uPoolDecay);
                    float lift = uPoolHeightGain * max(vPoolWorld.y, 0.0);
                    float factor = clamp(uPoolFloor + pool + pspill + lift, 0.0, 1.35);
                    gl_FragColor.rgb *= factor;
                 }
                 #include <tonemapping_fragment>`
            )
    }
}

export function applyPoolFalloff(material, options = {}) {
    if (!material || material.userData.poolPatched) return
    const { cacheKey = '', ...falloffOptions } = options

    material.onBeforeCompile = makePoolFalloffCompiler(falloffOptions)

    // Patched and unpatched variants must not share a compiled program.
    material.customProgramCacheKey = () => 'nba-pool-falloff' + cacheKey
    material.userData.poolPatched = true
    material.needsUpdate = true
}
