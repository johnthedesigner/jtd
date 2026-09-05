/**
 * Checks that the settled menu panel is fully opaque.
 *
 * Menu text sits directly on this field, so any pinhole would show the page
 * behind it. Run after changing the panel's field settings.
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import sharp from 'sharp'
import * as vgpu from 'vgpu/node'
import { createLogoHeroScene } from '../components/logo-hero-gpu/scene.js'
import { createLogoField } from '../components/logo-hero-gpu/field.js'
import { panelOptions } from '../components/logo-hero-gpu/menu-panel.js'

const OUT = process.argv[2] ?? 'scratch/menu'
mkdirSync(OUT, { recursive: true })

// Device pixels, which is what the panel is planned in. Phones are mostly 2x
// or 3x, and the runtime caps the ratio at 2.
const CASES = [
    ['iPhone SE @2x', 750, 1214], ['iPhone 15 @2x', 786, 1584], ['Pixel 8 @2x', 824, 1710],
    ['large phone @2x', 960, 1800], ['small tablet @2x', 1534, 2048],
    ['iPhone 15 @1x', 393, 792],
]

const gpu = await vgpu.init()
console.log('case          panel      logos  min alpha  %<250  mean luminance')

for (const [name, width, height] of CASES) {
    const { count, field: fieldOptions, scene: sceneOptions } = panelOptions(width, height)
    const field = createLogoField({ count, seed: 20260904, ...fieldOptions })
    const scene = createLogoHeroScene({ vgpu, gpu, field, options: { ...fieldOptions, ...sceneOptions } })
    const target = vgpu.target(gpu, { size: [width, height], format: 'rgba8unorm' })

    scene.render(scene.durationSec, target, height)
    const pixels = await target.read()

    let minAlpha = 255
    let thin = 0
    let luminance = 0
    const total = width * height
    for (let i = 0; i < pixels.length; i += 4) {
        const a = pixels[i + 3]
        if (a < minAlpha) minAlpha = a
        if (a < 250) thin++
        luminance += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3
    }

    console.log(
        `${name.padEnd(13)} ${String(width + 'x' + height).padEnd(10)} ${String(scene.drawn).padStart(5)}  ` +
        `${String(minAlpha).padStart(9)}  ${(thin / total * 100).toFixed(2).padStart(5)}  ` +
        `${(luminance / total).toFixed(1).padStart(14)}`,
    )

    if (name === 'iPhone 15') {
        await sharp(Buffer.from(pixels), { raw: { width, height, channels: 4 } })
            .png()
            .toFile(`${OUT}/panel.png`)
    }
    scene.dispose()
}

gpu.dispose()
