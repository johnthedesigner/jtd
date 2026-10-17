import * as THREE from 'three'

/**
 * Surface detail, generated rather than authored.
 *
 * Everything in this scene was a flat colour with one roughness value, and
 * it read as plastic: a hard court is granular acrylic over asphalt, and a
 * wooden mannequin has grain running the length of each limb. What gives
 * either of them away is not the colour, it is that a perfectly uniform
 * surface returns a perfectly uniform highlight, and real surfaces never
 * do.
 *
 * Canvas rather than image files: these are noise, and shipping a megabyte
 * of PNG to deliver noise is worse than spending a few milliseconds making
 * it. Each is built once and shared by every material that wants it.
 */

/** Value noise on a grid, smoothed, so it has structure rather than static. */
function valueNoise(size, cells, seed) {
    const grid = new Float32Array((cells + 1) * (cells + 1))
    let s = seed
    const rand = () => {
        s = (s * 1664525 + 1013904223) % 4294967296
        return s / 4294967296
    }
    for (let i = 0; i < grid.length; i++) grid[i] = rand()

    const out = new Float32Array(size * size)
    const smooth = (t) => t * t * (3 - 2 * t)
    for (let y = 0; y < size; y++) {
        const gy = (y / size) * cells
        const y0 = Math.floor(gy)
        const fy = smooth(gy - y0)
        for (let x = 0; x < size; x++) {
            const gx = (x / size) * cells
            const x0 = Math.floor(gx)
            const fx = smooth(gx - x0)
            const a = grid[y0 * (cells + 1) + x0]
            const b = grid[y0 * (cells + 1) + x0 + 1]
            const c = grid[(y0 + 1) * (cells + 1) + x0]
            const d = grid[(y0 + 1) * (cells + 1) + x0 + 1]
            out[y * size + x] = (a + (b - a) * fx) + ((c + (d - c) * fx) - (a + (b - a) * fx)) * fy
        }
    }
    return out
}

/** Several octaves of it, so there is both blotch and grit. */
function fbm(size, octaves, baseCells, seed) {
    const out = new Float32Array(size * size)
    let amp = 1
    let total = 0
    for (let o = 0; o < octaves; o++) {
        const layer = valueNoise(size, baseCells * 2 ** o, seed + o * 977)
        for (let i = 0; i < out.length; i++) out[i] += layer[i] * amp
        total += amp
        amp *= 0.5
    }
    for (let i = 0; i < out.length; i++) out[i] /= total
    return out
}

function toTexture(size, write, { srgb = false, repeat = 1 } = {}) {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')
    const image = ctx.createImageData(size, size)
    write(image.data, size)
    ctx.putImageData(image, 0, 0)
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(repeat, repeat)
    texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
    texture.anisotropy = 8
    return texture
}

/** A normal map from a height field, by central differences. */
function normalFrom(size, height, strength) {
    return toTexture(size, (data) => {
        const at = (x, y) => height[((y + size) % size) * size + ((x + size) % size)]
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = (at(x + 1, y) - at(x - 1, y)) * strength
                const dy = (at(x, y + 1) - at(x, y - 1)) * strength
                // Normalise (-dx, -dy, 1) into 0..255.
                const len = Math.hypot(dx, dy, 1)
                const i = (y * size + x) * 4
                data[i] = ((-dx / len) * 0.5 + 0.5) * 255
                data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255
                data[i + 2] = (1 / len) * 0.5 * 255 + 127.5
                data[i + 3] = 255
            }
        }
    })
}

let courtCache = null

/**
 * Acrylic hard court, at three scales.
 *
 * Each goes on its own map with its own repeat, because each is a different
 * physical thing and they are metres apart in size:
 *
 * - **Grit**, the aggregate in the paint, a few millimetres across and
 *   tiled three times a metre. Normal map only. At any camera distance this
 *   page actually uses it is sub-pixel, so it contributes a faint sparkle
 *   up close and nothing at all down the court, which is correct.
 * - **Sheen**, half a metre across: squeegee marks, overlaps where the
 *   paint was laid in passes, patches that have been walked on more. This
 *   is the one you can see from the baseline, and it goes on roughness,
 *   because what varies is how the surface returns the light, not its
 *   colour.
 * - **Fade**, metres across and tiled once every fourteen, on albedo.
 *
 * The first attempt put grit and fade together on one 2 m tile with 48
 * noise cells and a heavy normal. That makes the aggregate four centimetres
 * across: not grit but pile, and the court looked carpeted. Dropping it to
 * a realistic size then made the court look like glass, because millimetre
 * detail genuinely is invisible at ten metres. The sheen layer is what was
 * missing in both.
 */
const GRIT_REPEAT = 3
/*
  One tile per nine metres, not per two.

  At two metres the sheen layer's four noise cells landed on a half-metre
  grid that tiled twice across the court's width, and it read as big square
  tiles — which is how a basketball floor is laid and emphatically not how
  an acrylic court is made. At nine metres the court is barely two tiles
  across and the variation has no grid in it.
*/
const SHEEN_REPEAT = 0.11
const FADE_REPEAT = 0.07

export function courtSurface() {
    if (courtCache) return courtCache
    const size = 512
    const grit = fbm(size, 4, 56, 11)
    // More octaves at the larger scale, so the variation is organic rather
    // than a handful of soft blobs.
    const sheen = fbm(size, 5, 3, 8803)
    const fade = fbm(size, 4, 2, 404)

    courtCache = {
        normalMap: normalFrom(size, grit, 7),
        roughnessMap: toTexture(size, (data) => {
            for (let i = 0; i < size * size; i++) {
                // High and nearly flat: acrylic is matte, and the court was
                // throwing a specular sheet back at some camera angles.
                const v = 236 + (sheen[i] - 0.5) * 26
                const k = i * 4
                data[k] = data[k + 1] = data[k + 2] = Math.max(0, Math.min(255, v))
                data[k + 3] = 255
            }
        }),
        map: courtAlbedo(size, fade),
    }
    courtCache.normalMap.repeat.set(GRIT_REPEAT, GRIT_REPEAT)
    courtCache.roughnessMap.repeat.set(SHEEN_REPEAT, SHEEN_REPEAT)
    courtCache.map.repeat.set(FADE_REPEAT, FADE_REPEAT)
    return courtCache
}

/**
 * Court albedo: slow fading, plus the marks balls leave.
 *
 * Drawn on a canvas rather than written as pixels, because the marks are
 * shapes. Each is an ellipse stretched down the court, since a ball
 * arriving on a serve is travelling that way and skids as it bites, and
 * they are clustered — impacts land where serves land, so a few busy
 * patches and a lot of untouched paint.
 */
function courtAlbedo(size, fade) {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')
    const image = ctx.createImageData(size, size)
    for (let i = 0; i < size * size; i++) {
        const v = 249 + (fade[i] - 0.5) * 14
        const k = i * 4
        image.data[k] = image.data[k + 1] = image.data[k + 2] = Math.max(0, Math.min(255, v))
        image.data[k + 3] = 255
    }
    ctx.putImageData(image, 0, 0)

    /*
      Ball marks, at the size a ball actually makes them.

      A regulation ball is 67 mm. At this tile scale that is under three
      pixels across, so every mark is the same small ellipse stretched down
      the court — a ball arriving on a serve is travelling that way and
      skids as it bites. The first pass varied them from tiny to enormous,
      which is not a thing one ball can do.

      Lighter, not darker: a ball scuffs felt and a little rubber *onto* the
      paint rather than taking colour out of it, and marks on a blue court
      read as pale smudges.
    */
    ctx.fillStyle = '#ffffff'
    let seed = 20260117
    const rand = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296
        return seed / 4294967296
    }
    const mark = (x, y) => {
        const rx = 1.15 + rand() * 0.35
        ctx.globalAlpha = 0.016 + rand() * 0.022
        ctx.beginPath()
        ctx.ellipse(x, y, rx, rx * (2.3 + rand() * 0.5), (rand() - 0.5) * 0.22, 0, Math.PI * 2)
        ctx.fill()
    }
    // Loose clusters rather than tight clumps, plus a scatter between them:
    // serves land in a region, not on a spot.
    for (let c = 0; c < 16; c++) {
        const cx = rand() * size
        const cy = rand() * size
        const hits = 4 + Math.floor(rand() * 7)
        for (let i = 0; i < hits; i++) {
            mark(cx + (rand() + rand() - 1) * 46, cy + (rand() + rand() - 1) * 64)
        }
    }
    for (let i = 0; i < 70; i++) mark(rand() * size, rand() * size)
    ctx.globalAlpha = 1

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    return texture
}

let woodCache = null

/**
 * Wood: grain running the length of a limb, with the odd darker streak.
 *
 * Lathe and sphere geometries both put `v` along the long axis, so grain
 * that runs lengthwise is noise that varies quickly across `u` and slowly
 * along `v`. The texture is built anisotropic to match rather than being
 * square noise rotated afterwards.
 */
export function woodSurface() {
    if (woodCache) return woodCache
    const size = 512
    const across = fbm(size, 4, 40, 7)
    const along = fbm(size, 3, 4, 313)
    const grain = new Float32Array(size * size)
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = y * size + x
            // Stretch the fast axis across `u` only, and let the slow one
            // drift along `v`, which is what gives it long fibres.
            const streak = across[y * size + ((x * 7) % size)]
            grain[i] = streak * 0.72 + along[i] * 0.28
        }
    }

    woodCache = {
        map: toTexture(
            size,
            (data) => {
                for (let i = 0; i < size * size; i++) {
                    // Multiplies the wood colour: darker fibres, never lighter.
                    const v = 222 + (grain[i] - 0.5) * 38
                    const k = i * 4
                    data[k] = Math.max(0, Math.min(255, v))
                    data[k + 1] = Math.max(0, Math.min(255, v * 0.985))
                    data[k + 2] = Math.max(0, Math.min(255, v * 0.95))
                    data[k + 3] = 255
                }
            },
            { srgb: true }
        ),
        roughnessMap: toTexture(size, (data) => {
            for (let i = 0; i < size * size; i++) {
                // Lacquered wood: the fibres take the finish unevenly.
                const v = 158 + (grain[i] - 0.5) * 44
                const k = i * 4
                data[k] = data[k + 1] = data[k + 2] = Math.max(0, Math.min(255, v))
                data[k + 3] = 255
            }
        }),
        normalMap: normalFrom(size, grain, 3.5),
    }
    return woodCache
}

let metalCache = null

/** A racket frame: fine lengthwise brushing, and a scuffed clear coat. */
export function racketSurface() {
    if (metalCache) return metalCache
    const size = 256
    const brushed = fbm(size, 3, 64, 5101)
    metalCache = {
        roughnessMap: toTexture(size, (data) => {
            for (let i = 0; i < size * size; i++) {
                const v = 96 + (brushed[i] - 0.5) * 120
                const k = i * 4
                data[k] = data[k + 1] = data[k + 2] = Math.max(0, Math.min(255, v))
                data[k + 3] = 255
            }
        }),
        normalMap: normalFrom(size, brushed, 7),
    }
    return metalCache
}
