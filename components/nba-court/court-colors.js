import template from '../../public/nba-courts/template.json'

/**
 * The team colours, taken from the court art itself.
 *
 * Padding on a real stanchion is painted to match the floor, so rather than
 * maintaining a table of thirty team palettes that would still be wrong for
 * the vintage courts, this reads the apron straight out of the atlas. Every
 * image shares one layout, so the apron is always in the same place, and the
 * colour is right for all sixty floors by construction.
 *
 * Saturation decides: aprons are usually the team colour, but some are plain
 * hardwood, and a dull average would give a beige stanchion. Where nothing
 * saturated turns up, the fallback is a neutral charcoal rather than a guess.
 *
 * A second colour is picked the same way: the best-scoring region whose hue
 * is meaningfully different from the first (over 40 degrees apart), so a
 * court with two team colours in its apron (a stripe of one, a wash of the
 * other) yields a genuine pair rather than two samples of the same hue.
 */

const { canvas, court } = template

/** Apron strips, outside the court rect, in source pixels. */
const REGIONS = [
    [70, 300, 170, 400],
    [canvas.width - 240, 300, 170, 400],
    [520, 16, 980, 64],
    [520, canvas.height - 80, 980, 64],
]

const FALLBACK = {
    pad: '#2b3350',
    structure: '#191c22',
    metal: '#33383e',
    // Vivid even in the fallback case — no reason for "we found nothing
    // saturated" to also mean "the ribbon goes dark."
    ribbonPrimary: '#3d6bd6',
    ribbonSecondary: '#d63d8f',
}

function rgbToHsl(r, g, b) {
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const l = (max + min) / 2
    if (max === min) return [0, 0, l]
    const d = max - min
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    let h
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
    return [h, s, l]
}

function hex(r, g, b) {
    const to = (v) => Math.round(Math.max(0, Math.min(255, v)))
        .toString(16)
        .padStart(2, '0')
    return `#${to(r)}${to(g)}${to(b)}`
}

function hslToRgb(h, s, l) {
    if (s === 0) {
        const v = l * 255
        return [v, v, v]
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    const toChannel = (t) => {
        let tt = t
        if (tt < 0) tt += 1
        if (tt > 1) tt -= 1
        if (tt < 1 / 6) return p + (q - p) * 6 * tt
        if (tt < 1 / 2) return q
        if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
        return p
    }
    return [toChannel(h + 1 / 3) * 255, toChannel(h) * 255, toChannel(h - 1 / 3) * 255]
}

/**
 * Forces a colour to LED brightness: same hue, saturation and lightness both
 * pulled up into a vivid band. The ribbon is meant to be a lit sign, and the
 * apron sample behind it is paint under house lighting — sampling that
 * directly can hand back something dark or muted (a shadowed strip, a black
 * trim colour), which is exactly what made whole ribbon sections read as
 * unlit rather than colourful. This keeps the court's actual hue and rebuilds
 * the brightness a real LED strip would have.
 */
function vivid(r, g, b) {
    const [h] = rgbToHsl(r / 255, g / 255, b / 255)
    const [vr, vg, vb] = hslToRgb(h, 0.9, 0.56)
    return hex(vr, vg, vb)
}

/**
 * Courts whose sampled apron colour lands on yellow, which is a poor colour
 * for a stanchion pad — it reads as caution tape rather than team branding.
 * Each maps to the team's other recognisable colour, picked by hand since
 * "the other colour" is not something hue math can find on its own.
 */
const YELLOW_OVERRIDE = {
    gsw: '#1d428a', // Warriors: blue, over the sampled gold
    lal: '#552583', // Lakers: purple, over the sampled gold
    ind: '#002d62', // Pacers: navy, over the sampled gold (vintage court)
}

function isYellowish(r, g, b) {
    const [h, s] = rgbToHsl(r / 255, g / 255, b / 255)
    const deg = h * 360
    return deg >= 40 && deg <= 70 && s > 0.25
}

export function sampleCourtColors(image, team) {
    try {
        const scale = 0.25
        const c = document.createElement('canvas')
        c.width = Math.round(canvas.width * scale)
        c.height = Math.round(canvas.height * scale)
        const ctx = c.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(image, 0, 0, c.width, c.height)

        const candidates = []

        for (const [rx, ry, rw, rh] of REGIONS) {
            const x = Math.round(rx * scale)
            const y = Math.round(ry * scale)
            const w = Math.max(1, Math.round(rw * scale))
            const h = Math.max(1, Math.round(rh * scale))
            const data = ctx.getImageData(x, y, w, h).data

            let r = 0
            let g = 0
            let b = 0
            let n = 0
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] < 200) continue
                r += data[i]
                g += data[i + 1]
                b += data[i + 2]
                n++
            }
            if (n < 20) continue
            r /= n
            g /= n
            b /= n

            const [h2, s, l] = rgbToHsl(r / 255, g / 255, b / 255)
            // Ignore near-white and near-black strips; they are trim, not team.
            //
            // HSL saturation blows up spuriously near black: at low lightness,
            // s = delta/(max+min), and a handful of stray bright pixels in an
            // otherwise dark strip (shadow under a tunnel, say) can produce a
            // tiny delta over a tiny max+min and read as "80% saturated" —
            // which is how black ended up winning the vote on several courts.
            // A floor on the raw channel value does not have that blow-up, so
            // it is what actually decides here; the lightness cutoff stays as
            // a second, cheap check.
            if (l > 0.9 || l < 0.05) continue
            if (Math.max(r, g, b) < 60) continue
            candidates.push({ score: s, r, g, b, hue: h2 * 360 })
        }

        candidates.sort((a, b) => b.score - a.score)
        const best = candidates[0]
        if (!best || best.score < 0.16) return FALLBACK

        // The second colour is the best-scoring candidate whose hue is
        // meaningfully different from the first — otherwise two samples of
        // the same team colour would masquerade as a pair.
        const second = candidates.find((c) => {
            const diff = Math.abs(c.hue - best.hue)
            return Math.min(diff, 360 - diff) > 40 && c.score > 0.14
        })

        // Three colours for the stanchion, not two. The padding takes the team
        // colour outright, overridden per team where that colour is yellow (see
        // YELLOW_OVERRIDE — yellow padding reads as caution tape, not branding).
        // The structure — trusses, braces — reads darkest. The stanchion's
        // metal sits between: dark painted steel with only a faint team tint,
        // deliberately low-key so the arm reads as structure holding the board
        // up rather than as an object competing with the court for attention.
        const steel = (c) => c * 0.22 + 46 * 0.78
        const override = team && YELLOW_OVERRIDE[team]
        const padHex =
            override && isYellowish(best.r, best.g, best.b) ? override : hex(best.r, best.g, best.b)

        // The ribbon is an LED sign, not paint under house lights, so its two
        // colours are forced vivid — same hue as the court, but rebuilt at LED
        // brightness rather than sampled directly. Sampled directly, a dark or
        // desaturated apron region (black trim, a shadowed strip) came back
        // dark, and whole stretches of the ribbon read as unlit rather than
        // coloured. The fallback secondary, when the apron only has one real
        // hue, is a shifted accent rather than a darker shade of the same
        // colour — a darker shade would have the identical problem.
        const [bestHue] = rgbToHsl(best.r / 255, best.g / 255, best.b / 255)
        const ribbonPrimary = vivid(best.r, best.g, best.b)
        const ribbonSecondary = second
            ? vivid(second.r, second.g, second.b)
            : hex(...hslToRgb((bestHue + 0.42) % 1, 0.9, 0.56))

        return {
            pad: padHex,
            structure: hex(best.r * 0.3, best.g * 0.3, best.b * 0.3),
            metal: hex(steel(best.r), steel(best.g), steel(best.b)),
            ribbonPrimary,
            ribbonSecondary,
        }
    } catch {
        return FALLBACK
    }
}
