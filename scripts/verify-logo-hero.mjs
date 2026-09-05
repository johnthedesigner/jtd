/**
 * Renders the GPU logo hero headless and checks it against real pixels.
 *
 * Writes a PNG per sampled time and reports, for the band where the headline
 * sits, the WCAG contrast of white text against the worst pixel behind it.
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import * as vgpu from 'vgpu/node'
import { createLogoHeroScene } from '../components/logo-hero-gpu/scene.js'
import { createLogoField } from '../components/logo-hero-gpu/field.js'
import { heroCanvasBleed, heroFieldOptions, heroTearAt } from '../components/logo-hero-gpu/hero-field.js'

const WIDTH = Number(process.env.WIDTH ?? 1440)
const HERO_HEIGHT = Number(process.env.HERO_HEIGHT ?? 900)
// Where the ragged edge finishes, matching the component's prop. The homepage
// lets it hang below the hero; the compact heroes land it at 0.9.
const TEAR_ENDS_AT = process.env.TEAR_ENDS_AT ? Number(process.env.TEAR_ENDS_AT) : null
const OUT = process.argv[2] ?? 'scratch/logo-hero'

function crc32(buf) {
    let c
    const table = crc32.table ?? (crc32.table = (() => {
        const t = new Int32Array(256)
        for (let n = 0; n < 256; n++) {
            c = n
            for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
            t[n] = c
        }
        return t
    })())
    c = -1
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
    return (c ^ -1) >>> 0
}

function chunk(type, data) {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const body = Buffer.concat([Buffer.from(type, 'latin1'), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(body))
    return Buffer.concat([len, body, crc])
}

/** Minimal RGBA PNG encoder, so verification needs no extra dependency. */
function encodePng(rgba, width, height) {
    const raw = Buffer.alloc((width * 4 + 1) * height)
    for (let y = 0; y < height; y++) {
        raw[y * (width * 4 + 1)] = 0
        rgba.subarray(y * width * 4, (y + 1) * width * 4)
            .forEach((v, i) => { raw[y * (width * 4 + 1) + 1 + i] = v })
    }
    const ihdr = Buffer.alloc(13)
    ihdr.writeUInt32BE(width, 0)
    ihdr.writeUInt32BE(height, 4)
    ihdr[8] = 8
    ihdr[9] = 6
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', ihdr),
        chunk('IDAT', deflateSync(raw, { level: 9 })),
        chunk('IEND', Buffer.alloc(0)),
    ])
}

/**
 * The hero renders to a transparent canvas, so flatten it over the page's own
 * white before judging anything. Bytes come back premultiplied.
 */
function overWhite(pixels) {
    const out = new Uint8Array(pixels.length)
    for (let i = 0; i < pixels.length; i += 4) {
        const gap = 255 - pixels[i + 3]
        out[i] = Math.min(255, pixels[i] + gap)
        out[i + 1] = Math.min(255, pixels[i + 1] + gap)
        out[i + 2] = Math.min(255, pixels[i + 2] + gap)
        out[i + 3] = 255
    }
    return out
}

const toLinear = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const luminance = (r, g, b) =>
    0.2126 * toLinear(r / 255) + 0.7152 * toLinear(g / 255) + 0.0722 * toLinear(b / 255)
const contrastWithWhite = (r, g, b) => 1.05 / (luminance(r, g, b) + 0.05)

/**
 * Stats for the band a headline actually occupies.
 *
 * The lower edge follows `tearAt`: below the field's own box the hero is torn
 * away on purpose, and counting that as a coverage hole would fail every
 * compact hero.
 */
function textBandStats(pixels, width, heroHeight) {
    const top = Math.floor(heroHeight * 0.15)
    // Solid coverage runs to the bottom of the field's own box; past that the
    // hero tears away on purpose, so counting it would fail every compact hero.
    const bottom = Math.floor(heroHeight * Math.min(0.85, TEAR_AT))
    const left = Math.floor(width * 0.18)
    const right = Math.floor(width * 0.82)

    let worst = Infinity
    let sum = 0
    let count = 0
    let below3 = 0

    for (let y = top; y < bottom; y++) {
        for (let x = left; x < right; x++) {
            const i = (y * width + x) * 4
            const c = contrastWithWhite(pixels[i], pixels[i + 1], pixels[i + 2])
            worst = Math.min(worst, c)
            sum += c
            count++
            if (c < 3) below3++
        }
    }
    return { worst, mean: sum / count, belowLargeTextAA: below3 / count }
}

/** Alpha coverage per row, as a fraction, to show where the field tears off. */
function coverageProfile(pixels, width, height, rows = 24) {
    const profile = []
    for (let r = 0; r < rows; r++) {
        const from = Math.floor((r / rows) * height)
        const to = Math.floor(((r + 1) / rows) * height)
        let sum = 0
        let count = 0
        for (let y = from; y < to; y += 2) {
            for (let x = 0; x < width; x += 4) {
                sum += pixels[(y * width + x) * 4 + 3]
                count++
            }
        }
        profile.push(sum / count / 255)
    }
    return profile
}

mkdirSync(OUT, { recursive: true })

const gpu = await vgpu.init()
// The same settings the component derives from its own box, so this checks
// what actually ships.
const TEAR_AT = TEAR_ENDS_AT === null ? 1 : heroTearAt(WIDTH, HERO_HEIGHT, TEAR_ENDS_AT)
const FIELD_HEIGHT = HERO_HEIGHT * TEAR_AT
const BLEED = heroCanvasBleed(WIDTH, HERO_HEIGHT, TEAR_AT)
const sized = heroFieldOptions(WIDTH, FIELD_HEIGHT)
const field = createLogoField({ count: sized.count, seed: 20260904, ...sized.field })
const scene = createLogoHeroScene({ vgpu, gpu, field, options: { ...sized.field, bleed: BLEED } })
const HEIGHT = Math.round(HERO_HEIGHT * (1 + BLEED))
const target = vgpu.target(gpu, { size: [WIDTH, HEIGHT], format: 'rgba8unorm' })

console.log(`field: ${field.count} logos, sdf ${scene.sdf.width}x${scene.sdf.height}`)
console.log(`canvas ${WIDTH}x${HEIGHT}, hero ${WIDTH}x${HERO_HEIGHT}, tearAt ${TEAR_AT.toFixed(3)}, bleed ${BLEED.toFixed(3)}`)
console.log(`scene duration: ${scene.durationSec.toFixed(2)}s\n`)

const times = [0, 0.25, 0.5, 0.8, 1.2, 1.6, 2.0, 2.4, 3.0]
const rows = []

let finalPixels
for (const t of times) {
    scene.render(t, target, FIELD_HEIGHT)
    const raw = await target.read()
    const flat = overWhite(raw)
    finalPixels = raw
    rows.push({ t, ...textBandStats(flat, WIDTH, HERO_HEIGHT) })
    writeFileSync(`${OUT}/frame-${t.toFixed(2)}.png`, encodePng(flat, WIDTH, HEIGHT))
}

console.log('time(s)  worst-contrast  mean-contrast  %below-3:1')
for (const r of rows) {
    console.log(
        `${r.t.toFixed(2).padStart(6)}  ${r.worst.toFixed(2).padStart(14)}  ` +
        `${r.mean.toFixed(2).padStart(13)}  ${(r.belowLargeTextAA * 100).toFixed(2).padStart(10)}`,
    )
}

const final = rows[rows.length - 1]
console.log(`\nfinal frame worst contrast: ${final.worst.toFixed(2)}:1`)
console.log(final.worst >= 3 ? 'PASS: white large text is legible everywhere behind it' : 'FAIL: gaps remain')

// Where the field starts thinning, in hero-height fractions, so it can be
// compared against where the hero's own text ends.
const fine = coverageProfile(finalPixels, WIDTH, HEIGHT, 120)
const crossing = (threshold) => {
    const i = fine.findIndex((v) => v < threshold)
    return i < 0 ? Infinity : ((i + 0.5) / fine.length) * HEIGHT / HERO_HEIGHT
}
console.log('\nfield thins below, as a fraction of hero height:')
for (const t of [0.98, 0.9, 0.5]) {
    const y = crossing(t)
    console.log(`  ${(t * 100).toFixed(0).padStart(3)}% coverage ends at  ${y.toFixed(3)}  (${Math.round(y * HERO_HEIGHT)}px of ${HERO_HEIGHT})`)
}

console.log('\ncoverage down the canvas (| = hero bottom):')
const profile = coverageProfile(finalPixels, WIDTH, HEIGHT)
profile.forEach((v, i) => {
    const y = (i + 0.5) / profile.length
    const marker = Math.abs(y - HERO_HEIGHT / HEIGHT) < 0.5 / profile.length ? ' <- hero bottom' : ''
    console.log(`${(y * 100).toFixed(0).padStart(3)}%  ${'#'.repeat(Math.round(v * 40)).padEnd(40)} ${(v * 100).toFixed(0).padStart(3)}%${marker}`)
})
console.log(`\nPNGs written to ${OUT}/`)

gpu.dispose()
