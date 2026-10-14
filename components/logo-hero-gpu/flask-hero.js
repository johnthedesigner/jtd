import { heroFieldOptions } from './hero-field.js'
import { FLASK_PATHS, FLASK_VIEWBOX } from './flask-glyph.js'

/**
 * The experiments header's field settings, in one place.
 *
 * Shared by the page and by `scripts/generate-fallbacks.mjs` on purpose: the
 * fallback image is what every browser without WebGPU actually sees, and if
 * it were generated from its own copy of these numbers it would quietly stop
 * matching the live hero. It already did once — the page was switched to the
 * flask while the fallback kept rendering the logomark, so most visitors saw
 * the wrong shape.
 */

/**
 * `sdf` replaces the scene default wholesale rather than merging into it, so
 * the sizing numbers are repeated here. They are not the hero's defaults: the
 * flask is a square 24-unit icon where the logomark is a wide 90x41 one, and
 * the padding has to stay in proportion to the glyph or the field renders it
 * small inside a mostly-empty distance field.
 */
export const FLASK_SDF = {
    scale: 14,
    pad: 40,
    supersample: 2,
    paths: FLASK_PATHS,
    viewBox: FLASK_VIEWBOX,
}

/**
 * The field sizes a glyph by its *width*, and the logomark is a wide 90x41
 * where the flask is a square 24x24 — so a flask given the logomark's width
 * comes out well over twice as tall. At full size they overlapped into a
 * solid slab that the canvas simply clipped, which is why the header had a
 * hard bottom edge instead of the ragged one: the ragged edge is made of the
 * marks themselves hanging past the fill, and there were no gaps left for it
 * to show through.
 *
 * Matching the logomark's *height* is what works. Area-matching was tried and
 * is too dense: at that size the flasks close back up into a slab and the
 * ragged edge all but disappears.
 */
export const FLASK_SIZE_RATIO = 41 / 90

export function flaskField(width, height) {
    const { field } = heroFieldOptions(width, height, { raggedEdge: true })
    return {
        worldSizeMin: field.worldSizeMin * FLASK_SIZE_RATIO,
        worldSizeMax: field.worldSizeMax * FLASK_SIZE_RATIO,
    }
}
