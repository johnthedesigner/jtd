import * as THREE from 'three'
import { BACKBOARD, SHOT_CLOCK } from './hoop-spec'

/**
 * Canvas-drawn maps for the two parts of the assembly that are graphics rather
 * than geometry: the silk-screen on the glass, and the shot clock's display.
 * Drawing them at a fixed inches-per-pixel keeps the strokes rule-book exact
 * instead of eyeballed.
 */
const PX_PER_INCH = 10

function canvas(wIn, hIn) {
    const c = document.createElement('canvas')
    c.width = Math.round(wIn * PX_PER_INCH)
    c.height = Math.round(hIn * PX_PER_INCH)
    return c
}

function finish(c, { srgb = true } = {}) {
    const texture = new THREE.CanvasTexture(c)
    texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
    texture.anisotropy = 8
    texture.needsUpdate = true
    return texture
}

/**
 * The white perimeter stripe and the inner square, on transparent glass.
 * The square's lower edge sits level with the rim, which is what makes the
 * bank-shot target line up with the ring when you look at it straight on.
 */
export function createBackboardMarkings() {
    const wIn = BACKBOARD.width * 12
    const hIn = BACKBOARD.height * 12
    const c = canvas(wIn, hIn)
    const ctx = c.getContext('2d')
    const px = (feet) => feet * 12 * PX_PER_INCH

    ctx.clearRect(0, 0, c.width, c.height)
    ctx.strokeStyle = '#ffffff'
    ctx.lineJoin = 'miter'

    // Perimeter stripe.
    const b = px(BACKBOARD.border)
    ctx.lineWidth = b
    ctx.strokeRect(b / 2, b / 2, c.width - b, c.height - b)

    // Inner square, bottom edge level with the rim.
    const sq = BACKBOARD.innerSquare
    const stroke = px(sq.stroke)
    const sqW = px(sq.width)
    const sqH = px(sq.height)
    const rimAboveBoardBottom = 10 - BACKBOARD.bottom
    const bottomY = c.height - px(rimAboveBoardBottom)
    ctx.lineWidth = stroke
    ctx.strokeRect((c.width - sqW) / 2, bottomY - sqH, sqW, sqH)

    return finish(c)
}

/** Segment layout for the digits we need. */
const SEGMENTS = {
    2: ['a', 'b', 'g', 'e', 'd'],
    4: ['f', 'g', 'b', 'c'],
    0: ['a', 'b', 'c', 'd', 'e', 'f'],
    1: ['b', 'c'],
    3: ['a', 'b', 'c', 'd', 'g'],
    5: ['a', 'f', 'g', 'c', 'd'],
    6: ['a', 'f', 'g', 'e', 'c', 'd'],
    7: ['a', 'b', 'c'],
    8: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    9: ['a', 'b', 'c', 'd', 'f', 'g'],
}

function drawDigit(ctx, digit, x, y, w, h, thickness, color) {
    const on = SEGMENTS[digit] || []
    const t = thickness
    const half = h / 2
    const bar = (sx, sy, sw, sh) => {
        ctx.fillStyle = color
        ctx.fillRect(sx, sy, sw, sh)
    }
    const set = new Set(on)
    if (set.has('a')) bar(x + t, y, w - 2 * t, t)
    if (set.has('g')) bar(x + t, y + half - t / 2, w - 2 * t, t)
    if (set.has('d')) bar(x + t, y + h - t, w - 2 * t, t)
    if (set.has('f')) bar(x, y + t, t, half - 1.5 * t)
    if (set.has('b')) bar(x + w - t, y + t, t, half - 1.5 * t)
    if (set.has('e')) bar(x, y + half + t / 2, t, half - 1.5 * t)
    if (set.has('c')) bar(x + w - t, y + half + t / 2, t, half - 1.5 * t)
}

/**
 * Lays out a value like "24.0" — main digits at full size, a decimal point
 * and a tenths digit at a fraction of that size, baseline-aligned with the
 * bottom of the main digits, as a real shot clock reads it. Called twice,
 * once per layer, so the colour and emissive maps always agree on layout.
 */
function drawShotClockValue(ctx, value, c, color) {
    const [mainPart, fracPart] = String(value).split('.')
    const mainDigits = mainPart.padStart(2, ' ').slice(-2)
    const hasFrac = Boolean(fracPart && fracPart.length)

    const digitH = c.height * 0.62
    const digitW = digitH * 0.56
    const thickness = digitH * 0.14
    const gap = digitW * 0.34
    const mainW = digitW * 2 + gap

    // The decimal reads as a subscript — smaller, sitting on the same
    // baseline as the main digits — rather than a full-size third digit,
    // which would read as "twenty four point zero" instead of "24 point 0".
    const fracScale = 0.48
    const fracDigitH = digitH * fracScale
    const fracDigitW = digitW * fracScale
    const fracThickness = thickness * fracScale
    const dotR = thickness * 0.55
    const dotGap = dotR * 2.4
    const fracGap = fracDigitW * 0.3
    const fracW = hasFrac ? dotGap + dotR * 2 + fracGap + fracDigitW : 0

    const totalW = mainW + fracW
    const startX = (c.width - totalW) / 2
    const y = (c.height - digitH) / 2

    mainDigits.split('').forEach((d, i) => {
        if (d === ' ') return
        const x = startX + i * (digitW + gap)
        drawDigit(ctx, d, x, y, digitW, digitH, thickness, color)
    })

    if (hasFrac) {
        const dotCx = startX + mainW + dotGap / 2
        const dotCy = y + digitH - dotR * 1.2
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(dotCx, dotCy, dotR, 0, Math.PI * 2)
        ctx.fill()

        const fracX = startX + mainW + dotGap + dotR * 2 + fracGap
        const fracY = y + digitH - fracDigitH
        drawDigit(ctx, fracPart[0], fracX, fracY, fracDigitW, fracDigitH, fracThickness, color)
    }
}

/**
 * The shot clock face. Returned as a colour map plus a matching emissive map,
 * so the digits actually throw light rather than just being painted red.
 *
 * Both layers set `toneMapped = false` on the material that uses them (see
 * Hoop.js) — ACES filmic pushes a saturated red toward amber at the emissive
 * intensity this display runs at, which is why the clock looked orange rather
 * than red until that was disabled; the LED strip already had it right.
 */
export function createShotClockFace(value = SHOT_CLOCK.value, { drawDigits = true } = {}) {
    const wIn = SHOT_CLOCK.width * 12
    const hIn = SHOT_CLOCK.height * 12
    const c = canvas(wIn, hIn)
    const ctx = c.getContext('2d')

    ctx.fillStyle = '#0a0a0c'
    ctx.fillRect(0, 0, c.width, c.height)
    // Unlit segments still catch a little light on a real display.
    if (drawDigits) drawShotClockValue(ctx, value, c, '#ff2d1a')
    const color = finish(c)

    // Emissive: the digits only, on black.
    const e = canvas(wIn, hIn)
    const ectx = e.getContext('2d')
    ectx.fillStyle = '#000000'
    ectx.fillRect(0, 0, e.width, e.height)
    if (drawDigits) drawShotClockValue(ectx, value, e, '#ff2d1a')

    return { color, emissive: finish(e) }
}
