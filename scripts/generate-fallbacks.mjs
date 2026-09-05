/**
 * Renders every GPU treatment headless and writes its fallback image.
 *
 * These stand in wherever WebGPU is unavailable and wherever the visitor has
 * asked for reduced motion. They come out of the same scenes the live paths
 * use, so a fallback cannot drift from the real thing: re-run
 * `npm run fallbacks` after changing the field, the shaders, or any of the
 * per-treatment settings.
 *
 * Each treatment gets a wide and a narrow variant, picked by media query. The
 * field has no fixed subject, so the components stretch whichever one they
 * pick; that keeps a ragged edge on its box's bottom line at any aspect ratio.
 */

import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import * as vgpu from 'vgpu/node'
import { createLogoHeroScene } from '../components/logo-hero-gpu/scene.js'
import { createLogoField } from '../components/logo-hero-gpu/field.js'
import { heroCanvasBleed, heroFieldOptions, heroTearAt } from '../components/logo-hero-gpu/hero-field.js'
import { panelOptions } from '../components/logo-hero-gpu/menu-panel.js'
import { footerField } from '../components/logo-hero-gpu/footer-field.js'

const OUT = process.argv[2] ?? 'public'
const QUALITY = Number(process.env.QUALITY ?? 75)
// Fixed, so regenerating gives the same images rather than new ones.
const SEED = 20260904

/**
 * A hero: ragged bottom edge, so the canvas runs past its box by the bleed.
 * `tearEndsAt` mirrors the component's prop — leave it off and the tear hangs
 * below the hero, set it and the edge lands there instead.
 */
function hero(name, width, height, tearEndsAt = null) {
    const tearAt = tearEndsAt === null ? 1 : heroTearAt(width, height, tearEndsAt)
    const fieldHeight = height * tearAt
    const { count, field } = heroFieldOptions(width, fieldHeight)
    const bleed = heroCanvasBleed(width, height, tearAt)
    return {
        name,
        width,
        height: Math.round(height * (1 + bleed)),
        boxHeight: fieldHeight,
        count,
        fieldOptions: field,
        sceneOptions: { bleed },
    }
}

/** The footer: fills its box, with the wordmark drawn as one large logo. */
function footer(name, width, height) {
    const { count, field } = heroFieldOptions(width, height, { raggedEdge: false })
    return {
        name,
        width,
        height,
        boxHeight: height,
        count,
        fieldOptions: { ...field, ...footerField(width, height) },
        sceneOptions: { bleed: 0 },
    }
}

/** The menu panel: no ragged edge, so it fills its box exactly. */
function panel(name, width, height) {
    const { count, field, scene } = panelOptions(width, height)
    return { name, width, height, boxHeight: height, count, fieldOptions: field, sceneOptions: scene }
}

// Rendered near the size they are usually shown at, so the stretch stays mild
// and logo proportions hold. Grain is most of the file size, which is why
// these are not larger.
const VARIANTS = [
    hero('hero-fallback-wide', 1440, 820),
    hero('hero-fallback-tall', 520, 700),
    // One compact pair covers both the 20vh and 30vh strips; the aspect
    // between them differs by less than a fifth.
    hero('hero-compact-wide', 1440, 340, 0.9),
    hero('hero-compact-tall', 480, 300, 0.9),
    footer('footer-wide', 1440, 721),
    footer('footer-tall', 480, 460),
    panel('menu-backdrop', 520, 940),
]

/**
 * `target.read()` hands back premultiplied bytes, which is what the canvas
 * wants but not what an image file stores. Divide the colour back out.
 */
function unpremultiply(pixels) {
    const out = Buffer.allocUnsafe(pixels.length)
    for (let i = 0; i < pixels.length; i += 4) {
        const a = pixels[i + 3]
        if (a === 0) {
            out[i] = out[i + 1] = out[i + 2] = out[i + 3] = 0
            continue
        }
        const scale = 255 / a
        out[i] = Math.min(255, Math.round(pixels[i] * scale))
        out[i + 1] = Math.min(255, Math.round(pixels[i + 1] * scale))
        out[i + 2] = Math.min(255, Math.round(pixels[i + 2] * scale))
        out[i + 3] = a
    }
    return out
}

mkdirSync(OUT, { recursive: true })
const gpu = await vgpu.init()

for (const variant of VARIANTS) {
    const { name, width, height, boxHeight, count, fieldOptions, sceneOptions } = variant
    const field = createLogoField({ count, seed: SEED, ...fieldOptions })
    const scene = createLogoHeroScene({ vgpu, gpu, field, options: { ...fieldOptions, ...sceneOptions } })
    const target = vgpu.target(gpu, { size: [width, height], format: 'rgba8unorm' })

    scene.render(scene.durationSec, target, boxHeight)
    const pixels = await target.read()

    const file = join(OUT, `${name}.webp`)
    const info = await sharp(unpremultiply(pixels), { raw: { width, height, channels: 4 } })
        .webp({ quality: QUALITY, alphaQuality: 100, effort: 6 })
        .toFile(file)

    console.log(
        `${file.padEnd(34)} ${String(width + 'x' + height).padEnd(10)} ${String(scene.drawn).padStart(5)} logos  ` +
        `${(info.size / 1024).toFixed(1).padStart(6)} KB`,
    )
    scene.dispose()
}

gpu.dispose()
