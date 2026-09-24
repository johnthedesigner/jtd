/**
 * Finds the bare wood in a court image.
 *
 * The first version used fixed hue, saturation and lightness bounds. It failed
 * badly and silently: the old Boston parquet is a richer orange than modern
 * maple (saturation 0.62–0.72 against a 0.62 cap), Brooklyn's is a grey wash
 * (0.07–0.09 against a 0.10 floor) and Portland's is very pale (lightness
 * 0.85–0.88 against a 0.88 cap). Each fell outside by a hair, producing an
 * empty mask and therefore no floor grain at all, on those courts only.
 *
 * Hue was right every time. So rather than hardcode what wood looks like, this
 * finds the dominant warm colour cluster in each court and takes that to be its
 * wood. Every floor is mostly wood, so the biggest warm cluster is the floor by
 * construction, whatever shade that particular arena happens to be.
 *
 * Local variance was measured as an alternative and rejected: the Lakers'
 * yellow key has the same variance as its wood, so it cannot separate warm
 * paint from timber.
 *
 * Two details stop the search latching onto paint. It looks only inside the
 * boundary lines, because the apron is often a large slab of saturated team
 * colour and on several courts it beat the floor outright. And candidates are
 * scored by how many pixels fall inside the whole tolerance window rather than
 * by the tallest single bin — a bare histogram peak rewards flat colour, since
 * paint piles into one bin while wood spreads across many and dilutes itself.
 */

/** Hue in degrees, saturation and lightness in 0..1. */
export function rgbToHsl(r, g, b) {
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min
    const lightness = (max + min) / 510
    const sat = max === 0 ? 0 : delta / max
    if (delta === 0) return [0, 0, lightness]

    let hue
    if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0)
    else if (max === g) hue = (b - r) / delta + 2
    else hue = (r - g) / delta + 4
    return [hue * 60, sat, lightness]
}

/** Court wood is always warm. Nothing outside this can be timber. */
const HUE_MIN = 5
const HUE_MAX = 75
const HUE_BIN = 2
const SAT_BIN = 0.04

/** How far from the cluster centre still counts as the same wood. */
const HUE_TOLERANCE = 13
const SAT_TOLERANCE = 0.17
const LUM_MARGIN = 0.14

/**
 * Locates the dominant warm cluster. Returns null when a court has no
 * meaningful warm region at all, which would mean something is very wrong.
 */
export function findWoodCluster(rgba, width, height, region = null) {
    const x0 = region ? Math.max(0, Math.floor(region.x0 * width)) : 0
    const x1 = region ? Math.min(width, Math.ceil(region.x1 * width)) : width
    const y0 = region ? Math.max(0, Math.floor(region.y0 * height)) : 0
    const y1 = region ? Math.min(height, Math.ceil(region.y1 * height)) : height

    const hueBins = Math.ceil((HUE_MAX - HUE_MIN) / HUE_BIN)
    const satBins = Math.ceil(1 / SAT_BIN)
    const hist = new Int32Array(hueBins * satBins)

    for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
            const i = (y * width + x) * 4
            if (rgba[i + 3] < 200) continue
            const [h, s, l] = rgbToHsl(rgba[i], rgba[i + 1], rgba[i + 2])
            if (h < HUE_MIN || h > HUE_MAX) continue
            if (l < 0.1 || l > 0.97) continue
            const hb = Math.min(hueBins - 1, Math.floor((h - HUE_MIN) / HUE_BIN))
            const sb = Math.min(satBins - 1, Math.floor(s / SAT_BIN))
            hist[hb * satBins + sb]++
        }
    }

    // Score each candidate by its whole tolerance window, not its own bin.
    const hueSpan = Math.round(HUE_TOLERANCE / HUE_BIN)
    const satSpan = Math.round(SAT_TOLERANCE / SAT_BIN)
    let best = -1
    let bestCount = 0
    for (let hb = 0; hb < hueBins; hb++) {
        for (let sb = 0; sb < satBins; sb++) {
            let total = 0
            for (let dh = -hueSpan; dh <= hueSpan; dh++) {
                const h2 = hb + dh
                if (h2 < 0 || h2 >= hueBins) continue
                for (let ds = -satSpan; ds <= satSpan; ds++) {
                    const s2 = sb + ds
                    if (s2 < 0 || s2 >= satBins) continue
                    total += hist[h2 * satBins + s2]
                }
            }
            if (total > bestCount) {
                bestCount = total
                best = hb * satBins + sb
            }
        }
    }
    if (best < 0 || bestCount < 200) return null

    const hueCentre = HUE_MIN + (Math.floor(best / satBins) + 0.5) * HUE_BIN
    const satCentre = ((best % satBins) + 0.5) * SAT_BIN

    // Lightness varies hugely within one floor — parquet alternates light and
    // dark blocks — so it is measured from the cluster rather than assumed.
    const lums = []
    for (let i = 0; i < rgba.length; i += 4) {
        if (rgba[i + 3] < 200) continue
        const [h, s, l] = rgbToHsl(rgba[i], rgba[i + 1], rgba[i + 2])
        if (Math.abs(h - hueCentre) > HUE_TOLERANCE) continue
        if (Math.abs(s - satCentre) > SAT_TOLERANCE) continue
        lums.push(l)
    }
    if (lums.length < 200) return null
    lums.sort((a, b) => a - b)

    return {
        hue: hueCentre,
        sat: satCentre,
        lumMin: Math.max(0, lums[Math.floor(lums.length * 0.02)] - LUM_MARGIN),
        lumMax: Math.min(1, lums[Math.floor(lums.length * 0.98)] + LUM_MARGIN),
        coverage: lums.length / (width * height),
    }
}

export function isWoodPixel(r, g, b, cluster) {
    const [h, s, l] = rgbToHsl(r, g, b)
    if (Math.abs(h - cluster.hue) > HUE_TOLERANCE) return 0
    if (Math.abs(s - cluster.sat) > SAT_TOLERANCE) return 0
    if (l < cluster.lumMin || l > cluster.lumMax) return 0
    return 1
}

/** Separable min filter. */
export function erode(src, w, h, radius) {
    const tmp = new Float32Array(src.length)
    const out = new Float32Array(src.length)
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let m = 1
            for (let k = -radius; k <= radius; k++) {
                m = Math.min(m, src[y * w + Math.min(w - 1, Math.max(0, x + k))])
                if (m === 0) break
            }
            tmp[y * w + x] = m
        }
    }
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let m = 1
            for (let k = -radius; k <= radius; k++) {
                m = Math.min(m, tmp[Math.min(h - 1, Math.max(0, y + k)) * w + x])
                if (m === 0) break
            }
            out[y * w + x] = m
        }
    }
    return out
}

/** Separable max filter. */
export function dilate(src, w, h, radius) {
    const tmp = new Float32Array(src.length)
    const out = new Float32Array(src.length)
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let m = 0
            for (let k = -radius; k <= radius; k++) {
                m = Math.max(m, src[y * w + Math.min(w - 1, Math.max(0, x + k))])
                if (m === 1) break
            }
            tmp[y * w + x] = m
        }
    }
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let m = 0
            for (let k = -radius; k <= radius; k++) {
                m = Math.max(m, tmp[Math.min(h - 1, Math.max(0, y + k)) * w + x])
                if (m === 1) break
            }
            out[y * w + x] = m
        }
    }
    return out
}

/** Separable box blur. */
export function blur(src, w, h, radius) {
    const tmp = new Float32Array(src.length)
    const out = new Float32Array(src.length)
    const span = radius * 2 + 1
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let sum = 0
            for (let k = -radius; k <= radius; k++) {
                sum += src[y * w + Math.min(w - 1, Math.max(0, x + k))]
            }
            tmp[y * w + x] = sum / span
        }
    }
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let sum = 0
            for (let k = -radius; k <= radius; k++) {
                sum += tmp[Math.min(h - 1, Math.max(0, y + k)) * w + x]
            }
            out[y * w + x] = sum / span
        }
    }
    return out
}

/**
 * The full mask: detect, close, erode, blur.
 *
 * The closing pass matters more than it looks. Parquet alternates light and
 * dark blocks, so a few scattered pixels always fail the test in the middle of
 * perfectly good wood. Eroding straight after detection lets every one of those
 * specks eat a hole the size of the erode radius, which is how the old Boston
 * floor went from 10% wood to zero. Closing fills them first.
 *
 * The erode radius is deliberately small now. It originally had to keep the
 * grain well clear of paint edges, but the shader's own slope backstop rejects
 * those edges per-pixel at full atlas resolution, which is far more precise
 * than this mask can be. A wide erode instead leaves a ring of bare wood with
 * no grain around every painted shape — wood-coloured but flat, which reads as
 * a step in the surface rather than as a smooth transition.
 */
export function buildWoodMask(rgba, width, height, options = {}) {
    const {
        closeRadius = 4,
        erodeRadius = 1,
        blurRadius = 2,
        blurPasses = 1,
        region = null,
    } = options

    const cluster = findWoodCluster(rgba, width, height, region)
    if (!cluster) return { mask: new Float32Array(width * height), cluster: null }

    let mask = new Float32Array(width * height)
    for (let i = 0, p = 0; i < rgba.length; i += 4, p++) {
        mask[p] =
            rgba[i + 3] < 200 ? 0 : isWoodPixel(rgba[i], rgba[i + 1], rgba[i + 2], cluster)
    }

    mask = dilate(mask, width, height, closeRadius)
    mask = erode(mask, width, height, closeRadius)
    mask = erode(mask, width, height, erodeRadius)
    for (let i = 0; i < blurPasses; i++) {
        mask = blur(mask, width, height, blurRadius)
    }

    return { mask, cluster }
}
