/**
 * The hero, expressed once and rendered anywhere.
 *
 * This module never touches the DOM. It takes a vgpu namespace (`vgpu` in the
 * browser, `vgpu/node` headless), a device, and a surface, and gives back a
 * `render(seconds)`. The browser component drives it from a frame loop; the
 * verification script drives it frame by frame and reads the pixels back.
 *
 * Two passes: the field draws into a transparent offscreen target, then a
 * composite adds grain on the way to the canvas. Nothing paints a background,
 * so the field's own density is what has to carry white text.
 */

import { oklch, formatRgb, rgb } from 'culori'
import { buildLogoSdf } from './logo-glyph.js'
import { createLogoField, FIELD_DEFAULTS } from './field.js'
import { fieldShader, COMPOSITE_WGSL } from './shaders.js'
import { MAX_INSTANCES, PRIMARY } from './constants.js'

export { PRIMARY, MAX_INSTANCES }

export const SCENE_DEFAULTS = {
    primary: PRIMARY,
    // Lightness spread across the depth ramp, in OKLCH. Wide enough that
    // overlapping logos separate from each other.
    shadeSpread: 0.06,
    // Shifts the whole ramp, so widening it does not cost contrast against
    // the white text sitting on top.
    shadeBias: -0.012,
    // Antialiasing width per sample, in multiples of one pixel. Below 1
    // because four samples per pixel supply the rest of the gradation.
    sharpness: 0.75,
    // Blur ceiling in distance-field units; past ~0.45 a glyph stops reading.
    maxBlur: 0.42,
    grain: 0.056,
    // Grain cell size in device pixels, so it stays visible on retina.
    grainSize: 2,
    // Callers derive their own from the hero's box; see `heroCanvasBleed`.
    bleed: 0,
    // Float, so wide defocus ramps do not band before grain is applied.
    fieldFormat: 'rgba16float',
    // Resolution is set by the largest a logo is ever drawn: the footer's
    // wordmark spans the viewport, and below roughly one texel per pixel the
    // field's own grid shows up as facets along its edges. Supersampling the
    // mask buys sub-texel accuracy that magnification does not need, so the
    // trade is resolution over supersampling at the same build cost.
    sdf: { scale: 14, pad: 140, supersample: 1 },
}

function toRgbTriple(hex) {
    const c = rgb(hex)
    return [c.r, c.g, c.b]
}

function shiftLightness(hex, delta) {
    const c = oklch(hex)
    if (!c) return hex
    return formatRgb({ ...c, l: Math.max(0, Math.min(1, c.l + delta)) })
}

/**
 * Ends of the colour ramp each logo is shaded along. Derived from `primary` by
 * default; pass `colorLow`/`colorHigh` directly for a palette that lightness
 * shifts cannot reach, such as the near-white menu panel.
 */
export function sceneColors(options = {}) {
    const opts = { ...SCENE_DEFAULTS, ...options }
    if (opts.colorLow && opts.colorHigh) {
        return { colorLow: toRgbTriple(opts.colorLow), colorHigh: toRgbTriple(opts.colorHigh) }
    }
    return {
        colorLow: toRgbTriple(shiftLightness(opts.primary, opts.shadeBias - opts.shadeSpread)),
        colorHigh: toRgbTriple(shiftLightness(opts.primary, opts.shadeBias + opts.shadeSpread)),
    }
}

/**
 * Creates the GPU resources and returns a renderer.
 *
 * `vgpu` is the imported namespace, `gpu` the context from its `init()`.
 * Pass `field` to reuse a field across resizes.
 */
export function createLogoHeroScene({ vgpu, gpu, field, options = {} }) {
    const opts = { ...SCENE_DEFAULTS, ...FIELD_DEFAULTS, ...options }
    const colors = sceneColors(opts)
    const logoField = field ?? createLogoField({ count: 700, ...opts })

    // `createLogoField` already trims to this, so the clamp is only a guard
    // against a caller passing its own oversized field.
    const drawn = Math.min(logoField.count, MAX_INSTANCES)

    const sdf = buildLogoSdf(opts.sdf)
    const glyph = gpu.device.createTexture({
        size: [sdf.width, sdf.height],
        format: 'r16float',
        usage: ['texture_binding', 'copy_dst'],
        label: 'jtd-logo-sdf',
    })
    gpu.device.gpu.queue.writeTexture(
        { texture: glyph.gpu },
        sdf.data,
        { bytesPerRow: sdf.width * 2, rowsPerImage: sdf.height },
        { width: sdf.width, height: sdf.height },
    )

    const glyphSampler = vgpu.sampler(gpu, { filter: 'linear', wrap: 'clamp' })

    // The uniform array is fixed-length and reflected as structs, so the packed
    // field is expanded once here and the tail padded with zero-width logos.
    const instances = new Array(MAX_INSTANCES)
    for (let i = 0; i < MAX_INSTANCES; i++) {
        const o = i * logoField.floatsPerInstance
        const live = i < drawn
        instances[i] = {
            place: live
                ? [logoField.data[o], logoField.data[o + 1], logoField.data[o + 2], logoField.data[o + 3]]
                : [0, 0, 0, 0],
            style: live
                ? [logoField.data[o + 4], logoField.data[o + 5], logoField.data[o + 6], logoField.data[o + 7]]
                : [0, 0, 0, 0],
        }
    }

    const logos = vgpu.draw(gpu, {
        shader: fieldShader(MAX_INSTANCES),
        label: 'hero-logo-field',
        vertices: 6,
        instances: drawn,
        blend: 'premultiplied',
    })
    logos.set({
        instances,
        glyph,
        glyphSampler,
        params: {
            resolution: [1, 1],
            heroHeight: 1,
            time: 0,
            fade: opts.fadeMs / 1000,
            quadScale: sdf.quadScale,
            aspect: sdf.aspect,
            sdfScale: sdf.sdfScale,
            sharpness: opts.sharpness,
            maxBlur: opts.maxBlur,
            _pad: [0, 0],
            colorLow: [...colors.colorLow, 1],
            colorHigh: [...colors.colorHigh, 1],
        },
    })

    // Offscreen so grain lands once over the finished field, not per logo.
    const scene = vgpu.target(gpu, { size: [16, 16], format: opts.fieldFormat, label: 'hero-field' })
    const sceneSampler = vgpu.sampler(gpu, { filter: 'linear', wrap: 'clamp' })
    const composite = vgpu.effect(gpu, COMPOSITE_WGSL, {
        label: 'hero-composite',
        set: {
            scene,
            sceneSampler,
            post: { resolution: [1, 1], grain: opts.grain, grainSize: opts.grainSize },
        },
    })

    let lastWidth = 0
    let lastHeight = 0
    let lastHero = 0

    function resize(width, height, heroHeight) {
        if (width === lastWidth && height === lastHeight && heroHeight === lastHero) return
        lastWidth = width
        lastHeight = height
        lastHero = heroHeight
        scene.resize([width, height])
        // The offscreen colour texture is a new resource after a resize.
        composite.set({ scene, post: { resolution: [width, height] } })
        logos.set({ params: { resolution: [width, height], heroHeight } })
    }

    /** Encodes the hero at `seconds` into an already-open frame. */
    function encode(frame, seconds, target, heroHeightPx) {
        const [width, height] = target.size
        const hero = heroHeightPx ?? height / (1 + opts.bleed)
        resize(width, height, hero)
        logos.set({ params: { time: seconds } })

        frame.pass({ target: scene, clear: [0, 0, 0, 0] }, (pass) => pass.draw(logos))
        frame.pass({ target, clear: [0, 0, 0, 0] }, (pass) => pass.draw(composite))
    }

    /** Draws and submits one standalone frame. Not valid inside a frame loop. */
    function render(seconds, target, heroHeightPx) {
        vgpu.frame(gpu, (frame) => encode(frame, seconds, target, heroHeightPx))
    }

    return {
        render,
        encode,
        resize,
        field: logoField,
        drawn,
        sdf,
        colors,
        bleed: opts.bleed,
        durationSec: logoField.durationSec,
        dispose() {
            glyph.dispose?.()
            scene.dispose?.()
        },
    }
}
