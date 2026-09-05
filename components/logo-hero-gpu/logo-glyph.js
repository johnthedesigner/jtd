/**
 * Runtime-agnostic signed-distance-field generator for the JTD logomark.
 *
 * No canvas, no DOM, no build step: the letter outlines are flattened here,
 * scan-converted to a supersampled mask, and turned into an exact Euclidean
 * distance field. The same code runs in the browser and in headless Node,
 * which is what lets the hero be verified against real pixels.
 */

export const LOGO_VIEWBOX = { width: 90, height: 41 }

export const LETTER_PATHS = [
    'M33.748 12.8556C33.6767 12.4504 33.9467 12.0641 34.351 11.9926L53.7972 8.55685C54.2015 8.48541 54.5871 8.75594 54.6584 9.16109L56.2437 18.1702C56.315 18.5753 56.045 18.9617 55.6407 19.0331L51.5113 19.7627C51.3091 19.7985 51.1741 19.9916 51.2098 20.1942L52.8597 29.5701C52.931 29.9752 52.661 30.3616 52.2566 30.433L43.2657 32.0216C42.8614 32.093 42.4758 31.8225 42.4045 31.4173L40.7546 22.0415C40.7189 21.8389 40.5262 21.7036 40.324 21.7393L36.1946 22.4689C35.7902 22.5404 35.4047 22.2698 35.3334 21.8647L33.748 12.8556Z',
    'M22.1508 11.9354C22.1294 11.5246 22.4443 11.1741 22.8543 11.1525L31.9715 10.6737C32.3815 10.6522 32.7313 10.9678 32.7528 11.3786L33.2695 21.2581C33.5763 27.1252 29.0785 32.1307 23.2232 32.4381C17.6175 32.7325 12.8 28.6142 12.1301 23.1142C12.0804 22.7059 12.398 22.3541 12.808 22.3326L22.2964 21.8343C22.5014 21.8236 22.6588 21.6483 22.6481 21.4429L22.1508 11.9354Z',
    'M59.3772 9.62064L69.1003 11.3385C74.8745 12.3588 78.7301 17.8762 77.7119 23.6621C76.6938 29.448 71.1875 33.3113 65.4132 32.2911L55.6901 30.5732C55.2858 30.5018 55.0158 30.1154 55.0871 29.7103L58.516 10.2249C58.5873 9.81973 58.9729 9.5492 59.3772 9.62064Z',
]

const NUMBER = /[MLCZmlcz]|[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g

/** Parses the M/L/C/Z subset the logomark uses into arrays of polygon points. */
function flattenPath(d, scale, offsetX, offsetY, segments) {
    const tokens = d.match(NUMBER) ?? []
    const rings = []
    let ring = null
    let cx = 0
    let cy = 0
    let startX = 0
    let startY = 0
    let command = ''
    let i = 0

    const px = (x) => x * scale + offsetX
    const py = (y) => y * scale + offsetY
    const num = () => parseFloat(tokens[i++])

    while (i < tokens.length) {
        const token = tokens[i]
        if (/^[MLCZmlcz]$/.test(token)) {
            command = token
            i++
        }
        // Anything else repeats the previous command's coordinate pattern.

        if (command === 'M' || command === 'm') {
            const x = num()
            const y = num()
            cx = command === 'm' ? cx + x : x
            cy = command === 'm' ? cy + y : y
            startX = cx
            startY = cy
            ring = [px(cx), py(cy)]
            rings.push(ring)
            command = command === 'm' ? 'l' : 'L'
        } else if (command === 'L' || command === 'l') {
            const x = num()
            const y = num()
            cx = command === 'l' ? cx + x : x
            cy = command === 'l' ? cy + y : y
            ring.push(px(cx), py(cy))
        } else if (command === 'C' || command === 'c') {
            const rel = command === 'c'
            const x1 = (rel ? cx : 0) + num()
            const y1 = (rel ? cy : 0) + num()
            const x2 = (rel ? cx : 0) + num()
            const y2 = (rel ? cy : 0) + num()
            const x3 = (rel ? cx : 0) + num()
            const y3 = (rel ? cy : 0) + num()
            for (let s = 1; s <= segments; s++) {
                const t = s / segments
                const u = 1 - t
                const bx = u * u * u * cx + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3
                const by = u * u * u * cy + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3
                ring.push(px(bx), py(by))
            }
            cx = x3
            cy = y3
        } else if (command === 'Z' || command === 'z') {
            cx = startX
            cy = startY
            ring = null
            i++
            command = ''
        } else {
            i++
        }
    }

    return rings.filter((r) => r.length >= 6)
}

/** Scan-converts closed rings with the nonzero winding rule into a binary mask. */
function rasterize(rings, width, height) {
    const mask = new Uint8Array(width * height)
    const edges = []

    for (const ring of rings) {
        const count = ring.length / 2
        for (let i = 0; i < count; i++) {
            const j = (i + 1) % count
            const x0 = ring[i * 2]
            const y0 = ring[i * 2 + 1]
            const x1 = ring[j * 2]
            const y1 = ring[j * 2 + 1]
            if (y0 !== y1) edges.push(x0, y0, x1, y1)
        }
    }

    const crossings = []
    for (let row = 0; row < height; row++) {
        const y = row + 0.5
        crossings.length = 0
        for (let e = 0; e < edges.length; e += 4) {
            const x0 = edges[e]
            const y0 = edges[e + 1]
            const x1 = edges[e + 2]
            const y1 = edges[e + 3]
            if (y < Math.min(y0, y1) || y >= Math.max(y0, y1)) continue
            const t = (y - y0) / (y1 - y0)
            crossings.push({ x: x0 + t * (x1 - x0), dir: y1 > y0 ? 1 : -1 })
        }
        if (crossings.length === 0) continue
        crossings.sort((a, b) => a.x - b.x)

        let winding = 0
        const base = row * width
        for (let c = 0; c < crossings.length - 1; c++) {
            winding += crossings[c].dir
            if (winding === 0) continue
            const from = Math.max(0, Math.ceil(crossings[c].x - 0.5))
            const to = Math.min(width - 1, Math.floor(crossings[c + 1].x - 0.5))
            for (let col = from; col <= to; col++) mask[base + col] = 1
        }
    }

    return mask
}

// IEEE 754 binary16 conversion. The field is stored as half floats because an
// 8-bit field visibly contours once a logo is magnified and heavily defocused.
const F32 = new Float32Array(1)
const I32 = new Int32Array(F32.buffer)

function toHalf(value) {
    F32[0] = value
    const x = I32[0]
    let bits = (x >> 16) & 0x8000
    let mantissa = (x >> 12) & 0x07ff
    const exponent = (x >> 23) & 0xff
    if (exponent < 103) return bits
    if (exponent > 142) return bits | 0x7c00
    if (exponent < 113) {
        mantissa |= 0x0800
        return bits | ((mantissa >> (114 - exponent)) + ((mantissa >> (113 - exponent)) & 1))
    }
    bits |= ((exponent - 112) << 10) | (mantissa >> 1)
    return bits + (mantissa & 1)
}

const INF = 1e20

/** Felzenszwalb & Huttenlocher exact squared Euclidean distance transform, 1D. */
function edt1d(f, d, v, z, n) {
    let k = 0
    v[0] = 0
    z[0] = -INF
    z[1] = INF
    for (let q = 1; q < n; q++) {
        let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
        while (s <= z[k]) {
            k--
            s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
        }
        k++
        v[k] = q
        z[k] = s
        z[k + 1] = INF
    }
    k = 0
    for (let q = 0; q < n; q++) {
        while (z[k + 1] < q) k++
        d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]
    }
}

function edt2d(grid, width, height) {
    const size = Math.max(width, height)
    const f = new Float64Array(size)
    const d = new Float64Array(size)
    const v = new Int32Array(size)
    const z = new Float64Array(size + 1)

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) f[y] = grid[y * width + x]
        edt1d(f, d, v, z, height)
        for (let y = 0; y < height; y++) grid[y * width + x] = d[y]
    }
    for (let y = 0; y < height; y++) {
        const base = y * width
        for (let x = 0; x < width; x++) f[x] = grid[base + x]
        edt1d(f, d, v, z, width)
        for (let x = 0; x < width; x++) grid[base + x] = d[x]
    }
    return grid
}

/**
 * Builds an 8-bit signed distance field of the logomark.
 *
 * `scale` is texture pixels per viewBox unit, `pad` the border in texture
 * pixels (which is also the distance the field encodes), and `supersample`
 * the mask oversampling used before the field is averaged back down.
 */
export function buildLogoSdf({ scale = 6, pad = 60, supersample = 2 } = {}) {
    const unitWidth = Math.round(LOGO_VIEWBOX.width * scale)
    const unitHeight = Math.round(LOGO_VIEWBOX.height * scale)
    const width = unitWidth + pad * 2
    const height = unitHeight + pad * 2

    const ss = supersample
    const maskWidth = width * ss
    const maskHeight = height * ss

    const rings = []
    for (const d of LETTER_PATHS) {
        rings.push(...flattenPath(d, scale * ss, pad * ss, pad * ss, 24))
    }
    const mask = rasterize(rings, maskWidth, maskHeight)

    const outside = new Float64Array(maskWidth * maskHeight)
    const inside = new Float64Array(maskWidth * maskHeight)
    for (let i = 0; i < mask.length; i++) {
        outside[i] = mask[i] ? 0 : INF
        inside[i] = mask[i] ? INF : 0
    }
    edt2d(outside, maskWidth, maskHeight)
    edt2d(inside, maskWidth, maskHeight)

    // Positive inside the glyph, negative outside, in supersampled pixels.
    const spread = pad * ss
    const data = new Uint16Array(width * height)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let sum = 0
            for (let sy = 0; sy < ss; sy++) {
                const row = (y * ss + sy) * maskWidth
                for (let sx = 0; sx < ss; sx++) {
                    const i = row + x * ss + sx
                    sum += Math.sqrt(inside[i]) - Math.sqrt(outside[i])
                }
            }
            const signed = sum / (ss * ss)
            data[y * width + x] = toHalf(0.5 + 0.5 * Math.max(-1, Math.min(1, signed / spread)))
        }
    }

    return {
        data,
        width,
        height,
        // Quad geometry: the drawn size refers to the viewBox, the texture is padded.
        padFraction: pad / unitWidth,
        quadScale: width / unitWidth,
        aspect: height / width,
        // Distance-field units per texture texel, used to turn a circle of
        // confusion in screen pixels into a threshold width.
        sdfScale: width / (2 * pad),
        spread,
        supersample: ss,
    }
}
