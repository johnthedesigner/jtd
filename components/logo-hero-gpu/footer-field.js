/**
 * Field settings for the site footer.
 *
 * The same treatment as the hero, filling its box, plus one large logo where
 * the decorative SVG wordmark used to sit. Kept apart from the component so
 * the fallback generator renders the identical field.
 */

/**
 * Places the wordmark as the old artwork sat: full bleed, its lower half
 * cropped by the footer's bottom edge. Both numbers come from that artwork's
 * own geometry, so the mark lands in the same place.
 */
export const WORDMARK_WIDTH = 1.0285
export const WORDMARK_RISE = 0.066

/** Height the old artwork occupied, as a fraction of the footer's width. */
export const WORDMARK_BAND = 0.2198

/**
 * The wordmark is one of the field's own logos, so it reads as part of the
 * texture rather than as pasted-on artwork. It stands out by sitting nearer
 * the focal plane than the logos behind it, not by being brighter: it carries
 * its own touch of softness, and the backdrop is only lightly defocused so its
 * shapes stay readable.
 */
const WORDMARK_SHADE = 0.95
const WORDMARK_SOFTNESS = 0.003
const BACKDROP_DEFOCUS = 1.15

/** `width` and `height` are the footer's box in device pixels. */
export function footerField(width, height) {
    return {
        raggedEdge: false,
        nearBlurPx: width * 0.055 * BACKDROP_DEFOCUS * 0.42,
        farBlurPx: width * 0.0265 * BACKDROP_DEFOCUS * 0.42,
        maxBlurPx: width * 0.053 * BACKDROP_DEFOCUS * 0.42,
        feature: {
            x: 0.5,
            y: (height - WORDMARK_RISE * width) / height,
            width: WORDMARK_WIDTH * width,
            blur: WORDMARK_SOFTNESS * width,
            shade: WORDMARK_SHADE,
        },
    }
}
