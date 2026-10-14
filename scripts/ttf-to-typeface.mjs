/**
 * TTF -> three.js `typeface.json`.
 *
 * A straight port of the conversion `three/examples/jsm/loaders/TTFLoader.js`
 * performs at runtime, run once as a build step so the browser downloads
 * JSON rather than a font plus a converter.
 *
 * **The input must have had its overlaps removed first.** Montserrat, like
 * many families, draws glyphs as self-overlapping contours that rely on the
 * nonzero winding rule — its capital B ships with two contours rather than
 * an outline plus two counters, and its lowercase 'e' with one. Browsers
 * fill that correctly. `ExtrudeGeometry` does not: it triangulates an
 * outline against a list of holes, and a counter that only exists as a
 * winding result is not a hole, so it fills solid. That is what made the
 * B's upper bowl disappear.
 *
 * `fontTools.ttLib.removeOverlaps` (skia-pathops) resolves the booleans and
 * yields real outline-plus-counter contours: B goes 2 -> 3, 'e' 1 -> 2.
 * `verifyContours` below fails rather than emit a font with a counter
 * missing, because the symptom only shows up as a rendering oddity much
 * later.
 *
 * The contour floor is per-profile, because it is a claim about how a
 * typeface is *drawn*, not a universal truth. Birthstone's lowercase 'a'
 * and 'b' have one contour each and stay at one through `removeOverlaps`:
 * their bowls are genuinely open, the way a connected script draws them, so
 * there is no counter to lose. Checking them against the sans floor would
 * fail a perfectly good font and invite someone to delete the gate.
 *
 * Usage:
 *   python3 -c "from fontTools.ttLib import TTFont; \
 *       from fontTools.ttLib.removeOverlaps import removeOverlaps; \
 *       f=TTFont('in.ttf'); removeOverlaps(f); f.save('clean.ttf')"
 *   node scripts/ttf-to-typeface.mjs clean.ttf out.typeface.json [--profile=sans|script]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const opentype = require('opentype.js')

/** Contours each glyph must have, as a floor — outline plus counters. */
const CONTOUR_PROFILES = {
    sans: {
        B: 3, O: 2, P: 2, R: 2, D: 2, Q: 2, A: 2, '0': 2,
        '6': 2, '8': 3, '9': 2, a: 2, b: 2, d: 2, e: 2, g: 2, o: 2, p: 2, q: 2,
    },
    // A connected script closes fewer bowls than a sans does. Everything
    // here is a letter that is still unambiguously counter-bearing in that
    // idiom; 'a' and 'b' are the ones that are not, and they are the whole
    // reason this profile exists.
    script: {
        B: 2, O: 2, P: 2, R: 2, D: 2, Q: 2, '0': 2,
        '6': 2, '8': 3, '9': 2, d: 2, e: 2, g: 2, o: 2, p: 2, q: 2,
    },
}

function convert(font, reversed = false) {
    const round = Math.round
    const result = { glyphs: {} }

    const scale = (100000) / ((font.unitsPerEm || 2048) * 72)
    const glyphIndexMap = font.encoding.cmap.glyphIndexMap
    const unicodes = Object.keys(glyphIndexMap)

    for (const unicode of unicodes) {
        const glyph = font.glyphs.glyphs[glyphIndexMap[unicode]]
        if (glyph.unicode === undefined) continue

        const token = { ha: round(glyph.advanceWidth * scale), x_min: 0, x_max: 0, o: '' }
        const commands = []

        glyph.path.commands.forEach((command) => {
            let type = command.type.toLowerCase()
            if (type === 'c') type = 'b'
            commands.push({ type, x: command.x, y: command.y, x1: command.x1, y1: command.y1, x2: command.x2, y2: command.y2 })
        })

        token.x_min = round(glyph.xMin * scale)
        token.x_max = round(glyph.xMax * scale)

        const parts = []
        for (const c of reversed ? commands.reverse() : commands) {
            if (c.type === 'm') parts.push('m', round(c.x * scale), round(c.y * scale))
            else if (c.type === 'l') parts.push('l', round(c.x * scale), round(c.y * scale))
            else if (c.type === 'q') parts.push('q', round(c.x * scale), round(c.y * scale), round(c.x1 * scale), round(c.y1 * scale))
            else if (c.type === 'b') parts.push('b', round(c.x * scale), round(c.y * scale), round(c.x1 * scale), round(c.y1 * scale), round(c.x2 * scale), round(c.y2 * scale))
            else if (c.type === 'z') parts.push('z')
        }
        token.o = parts.join(' ')
        result.glyphs[String.fromCodePoint(glyph.unicode)] = token
    }

    const names = font.names
    result.familyName = names.fullName?.en ?? 'Unknown'
    result.ascender = round(font.ascender * scale)
    result.descender = round(font.descender * scale)
    result.underlinePosition = font.tables.post.underlinePosition
    result.underlineThickness = font.tables.post.underlineThickness
    result.boundingBox = {
        yMin: font.tables.head.yMin,
        xMin: font.tables.head.xMin,
        yMax: font.tables.head.yMax,
        xMax: font.tables.head.xMax,
    }
    result.resolution = 1000
    result.original_font_information = font.tables.name
    return result
}

/** Fails loudly if a glyph lost a counter on the way through. */
function verifyContours(data, expectations) {
    const problems = []
    for (const [ch, expected] of Object.entries(expectations)) {
        const glyph = data.glyphs[ch]
        if (!glyph) continue
        const contours = (glyph.o.match(/(^|\s)m(\s|$)/g) || []).length
        if (contours < expected) problems.push(`'${ch}': ${contours} contours, expected at least ${expected}`)
    }
    return problems
}

const args = process.argv.slice(2)
const profileArg = args.find((a) => a.startsWith('--profile='))
const profile = profileArg ? profileArg.split('=')[1] : 'sans'
const [input, output] = args.filter((a) => !a.startsWith('--'))
if (!input || !output || !CONTOUR_PROFILES[profile]) {
    console.error(
        'usage: node scripts/ttf-to-typeface.mjs <in.ttf> <out.json> ' +
            `[--profile=${Object.keys(CONTOUR_PROFILES).join('|')}]`
    )
    process.exit(1)
}
const buffer = readFileSync(input)
const font = opentype.parse(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
)
const data = convert(font)
const problems = verifyContours(data, CONTOUR_PROFILES[profile])
if (problems.length) {
    console.error(`${input}: contour check FAILED (${profile} profile)`)
    for (const p of problems) console.error('  ', p)
    process.exit(1)
}
writeFileSync(output, JSON.stringify(data))
console.log(
    `${output}  ${data.familyName}  ${Object.keys(data.glyphs).length} glyphs  ` +
        `contour check passed (${profile})`
)
