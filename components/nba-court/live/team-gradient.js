import { BAND_MID, CARD_GRADIENT_END } from '../overlay-surface'

/**
 * A team's brand colour, pulled far enough down that a logo can sit on top
 * of it.
 *
 * The raw hex ESPN ships is the colour of the jersey, not of a background,
 * and most club logos are drawn *in* that same colour — a Bulls crest on
 * Bulls red is a silhouette. So every colour is pushed into one narrow
 * lightness band before it is used as a fill.
 *
 * The band has a floor as well as a ceiling, which is the part that is easy
 * to miss: Brooklyn and San Antonio are literally `000000`, and Denver,
 * Indiana, New Orleans and the Clippers are navies dark enough to be black
 * on screen. Darkening alone would turn a third of the league into the same
 * invisible rectangle, so near-black brands get lifted *up* into the band
 * instead. Nets rows come out graphite, which is honestly what that
 * identity is.
 *
 * Hue and saturation are kept (saturation only capped), so the result still
 * reads as the team's colour rather than as a generic dark tint.
 */

/**
 * The band every brand colour is mapped into — **relative luminance**, not
 * HSL lightness.
 *
 * This distinction is the whole thing. Clamping HSL lightness looks right
 * in the arithmetic and wrong on screen: at an identical L of 0.29,
 * Charlotte's teal measures 0.144 relative luminance and the Clippers'
 * navy measures 0.012, an 11x spread, so a row of cards came out visibly
 * uneven — three bands glowing, three nearly black, with the rest strung
 * out between. Luminance is also the quantity that actually decides
 * whether a logo separates from what's behind it, which is the thing this
 * is for.
 *
 * Measured across all 30 clubs, this band holds the spread to about 3x.
 */
const MIN_LUM = 0.022
const MAX_LUM = 0.07
/** Keeps a fully saturated brand (Golden State's yellow) from glowing. */
const MAX_S = 0.85

/**
 * For a club with no brand colour of its own. Preseason schedules carry
 * international teams, and those arrive with no `color` field — see
 * `normalize.js`.
 */
export const NEUTRAL_BRAND = '#272c36'

/**
 * The right-hand end of every row's gradient.
 *
 * Not pure black: these cards sit over a rendered arena whose own background
 * is a cool near-black, and a panel ending at absolute black reads as a hole
 * punched through the scene rather than something resting on it. Shared with
 * every other overlay surface so they cannot drift apart again.
 */
export const GRADIENT_END = CARD_GRADIENT_END

function hexToRgb(hex) {
    const clean = String(hex).replace('#', '').trim()
    if (!/^[0-9a-f]{6}$/i.test(clean)) return null
    return [
        parseInt(clean.slice(0, 2), 16) / 255,
        parseInt(clean.slice(2, 4), 16) / 255,
        parseInt(clean.slice(4, 6), 16) / 255,
    ]
}

function rgbToHsl([r, g, b]) {
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const l = (max + min) / 2
    const d = max - min
    if (d === 0) return [0, 0, l]
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    let h
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
    return [h, s, l]
}

function hueToChannel(p, q, t) {
    let x = t
    if (x < 0) x += 1
    if (x > 1) x -= 1
    if (x < 1 / 6) return p + (q - p) * 6 * x
    if (x < 1 / 2) return q
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6
    return p
}

function hslToHex([h, s, l]) {
    let r
    let g
    let b
    if (s === 0) {
        r = l
        g = l
        b = l
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q
        r = hueToChannel(p, q, h + 1 / 3)
        g = hueToChannel(p, q, h)
        b = hueToChannel(p, q, h - 1 / 3)
    }
    const byte = (v) =>
        Math.round(Math.min(Math.max(v, 0), 1) * 255)
            .toString(16)
            .padStart(2, '0')
    return `#${byte(r)}${byte(g)}${byte(b)}`
}

/** WCAG relative luminance, from linearised sRGB. */
function relativeLuminance([r, g, b]) {
    const lin = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function hslToRgb([h, s, l]) {
    if (s === 0) return [l, l, l]
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    return [
        hueToChannel(p, q, h + 1 / 3),
        hueToChannel(p, q, h),
        hueToChannel(p, q, h - 1 / 3),
    ]
}

/**
 * The lightness at which this hue hits a given luminance.
 *
 * Solved by bisection rather than algebraically: luminance is a weighted
 * sum of three separately gamma-decoded channels, and HSL lightness drives
 * all three through a piecewise function, so there is no clean inverse.
 * Luminance is monotonic in L for a fixed hue and saturation, which is all
 * bisection needs. Twenty steps lands well inside a single 8-bit code.
 */
function lightnessForLuminance(h, s, target) {
    let lo = 0
    let hi = 1
    for (let i = 0; i < 20; i += 1) {
        const mid = (lo + hi) / 2
        if (relativeLuminance(hslToRgb([h, s, mid])) < target) lo = mid
        else hi = mid
    }
    return (lo + hi) / 2
}

/** The brand colour as a background: same hue, forced into the band. */
export function brandFill(hex) {
    const rgb = hexToRgb(hex)
    if (!rgb) return NEUTRAL_BRAND
    const [h, rawS, l] = rgbToHsl(rgb)
    const s = Math.min(rawS, MAX_S)
    // Measured after the saturation cap, since capping moves it.
    const lum = relativeLuminance(hslToRgb([h, s, l]))
    if (lum >= MIN_LUM && lum <= MAX_LUM) return hslToHex([h, s, l])
    const target = Math.min(Math.max(lum, MIN_LUM), MAX_LUM)
    return hslToHex([h, s, lightnessForLuminance(h, s, target)])
}

/**
 * The brand colour lifted *above* the fill band, for marks that sit on top
 * of a panel already painted in it.
 *
 * The timeout notches were drawn in the shipped brand hex, which is close
 * in luminance to the `brandFill` behind them — two steps apart at most,
 * and at 3px wide that is not enough separation to count them at a glance.
 * This is the same hue, taken well clear of the band the background lives
 * in, so the pips read as marks rather than as texture.
 */
const BRIGHT_MIN_LUM = 0.26
const BRIGHT_MAX_LUM = 0.46

export function brandBright(hex) {
    const rgb = hexToRgb(hex)
    if (!rgb) return '#9aa6b8'
    const [h, rawS, l] = rgbToHsl(rgb)
    const s = Math.min(rawS, MAX_S)
    const lum = relativeLuminance(hslToRgb([h, s, l]))
    if (lum >= BRIGHT_MIN_LUM && lum <= BRIGHT_MAX_LUM) return hslToHex([h, s, l])
    const target = Math.min(Math.max(lum, BRIGHT_MIN_LUM), BRIGHT_MAX_LUM)
    return hslToHex([h, s, lightnessForLuminance(h, s, target)])
}

/**
 * A team badge: the brand colour as shipped, with text that survives it.
 *
 * Unlike `brandFill`, the hex is *not* pulled into the dark band — a badge
 * is small and wants to be the team's actual colour. What that costs is a
 * readable foreground, since the league runs from Brooklyn's black to
 * Golden State's yellow. The split is on relative luminance rather than on
 * HSL lightness, for the same reason the fill band is: at equal lightness a
 * yellow and a navy are nowhere near equally bright.
 */
const BADGE_DARK_TEXT_ABOVE = 0.38

export function brandBadge(hex) {
    const rgb = hexToRgb(hex)
    if (!rgb) return { background: NEUTRAL_BRAND, color: '#ffffff' }
    const clean = String(hex).replace('#', '').trim()
    return {
        background: `#${clean}`,
        color: relativeLuminance(rgb) > BADGE_DARK_TEXT_ABOVE ? '#0b0d12' : '#ffffff',
    }
}

/**
 * The score bug's stripe: one team's colour at each end, both falling away
 * to neutral through the middle.
 *
 * Symmetrical, unlike a card row — a card belongs to one team and reads
 * left to right, while this belongs to two facing each other, so the
 * neutral centre is where the clock lives and neither side owns it. The
 * ends use `brandFill` for the same reason the cards do: shipped brand hex
 * is jersey colour, and a logo sitting on it disappears.
 */
export function scoreBandGradient(awayHex, homeHex) {
    return (
        `linear-gradient(90deg, ${brandFill(awayHex)} 0%, ` +
        `${BAND_MID} 34%, ${BAND_MID} 66%, ${brandFill(homeHex)} 100%)`
    )
}

/** The row's full background: brand on the left, black on the right. */
export function brandGradient(hex) {
    return `linear-gradient(90deg, ${brandFill(hex)} 0%, ${GRADIENT_END} 100%)`
}
