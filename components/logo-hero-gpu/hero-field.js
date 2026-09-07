/**
 * Field settings for a hero of any size.
 *
 * The instance budget is fixed, so the count is held constant and the logo
 * size is derived from the box instead. That keeps coverage depth — and so the
 * look — the same whether the hero is a full-height homepage banner or a
 * 20vh strip on a listing page, and it can never overrun the uniform array.
 *
 * The constants are calibrated so a 1440x828 hero reproduces the tuned
 * homepage field exactly.
 */

/**
 * Logos placed inside the visible box, before overscan adds more around it.
 *
 * This is the size dial. Coverage is held fixed below, so fewer logos means
 * each one is drawn larger: halving the count scales them by √2. Going the
 * other way and keeping the count while raising coverage flattens the field,
 * because the extra layers paint over every silhouette.
 *
 * Quadrupling it halves the drawn size, which is what dialled the field back
 * after planning moved from CSS pixels to device pixels and doubled every
 * logo on a retina screen.
 */
const VISIBLE_COUNT = 848

/** Ink laid down per logo, as a share of its drawn width squared. */
const INK_SHARE = 0.5196 * 0.155

/** Mean of 1/z across the field's depth range. */
const MEAN_INVERSE_DEPTH = 0.573

/** How many times over the field paints the box. Fixed; size is the dial. */
const COVERAGE = 22.3

/** Spread of drawn widths around the mean, matching the tuned hero. */
const SIZE_MIN_RATIO = 0.655
const SIZE_MAX_RATIO = 1.345

/** Height of the logomark's box relative to its width. */
const LOGO_ASPECT = 0.5196

/**
 * Overall strength of the depth of field. The ratios below it are the tuned
 * balance between near and far; this scales all three at once.
 */
export const DEFOCUS = 0.7

/** Where the field's fringe runs out, and how far the tear reaches past it. */
const FRINGE_END = 1.03
const TEAR_DEPTH = 0.667

/** Mean drawn width for a box, which everything else is derived from. */
function meanDrawnWidth(width, height) {
    return Math.sqrt((COVERAGE * width * height) / (VISIBLE_COUNT * INK_SHARE))
}

/**
 * How far the canvas has to run past the hero for a ragged edge to be drawn
 * whole, as a fraction of hero height.
 *
 * The tear is as deep as the logos that make it, so this cannot be a constant:
 * a short strip needs proportionally far more room than a full-height banner.
 * Drawn size grows with √(width × height), so the ratio to hero height depends
 * only on the box's aspect and is the same in CSS or device pixels.
 */
export function heroBleed(width, height) {
    const meanHeight = meanDrawnWidth(width, height) * LOGO_ASPECT
    const bleed = (FRINGE_END - 1) + TEAR_DEPTH * (meanHeight / height)
    return Math.min(0.8, Math.max(0.15, bleed))
}

/**
 * Solves for the box fraction that lands the tear's end at `tearEndsAt` of the
 * container.
 *
 * Tear depth grows with √(width / boxHeight), so a fixed box fraction finishes
 * at a different place on a wide viewport than a narrow one. Callers want to
 * say where the edge should land, not how big to make the box, so invert it:
 * the end sits at `FRINGE_END·t + B·√t` for a box fraction `t`, which is a
 * quadratic in `√t`.
 */
export function heroTearAt(width, height, tearEndsAt) {
    const b = TEAR_DEPTH * LOGO_ASPECT
        * Math.sqrt(COVERAGE / (VISIBLE_COUNT * INK_SHARE))
        * Math.sqrt(width / height)
    const root = (-b + Math.sqrt(b * b + 4 * FRINGE_END * tearEndsAt)) / (2 * FRINGE_END)
    return Math.min(1, Math.max(0.05, root * root))
}

/**
 * How far the canvas must run past its *container* for the tear to be drawn
 * whole, given that the field's own box ends at `tearAt` of the container.
 * Zero once the tear finishes inside the container.
 */
export function heroCanvasBleed(width, height, tearAt = 1) {
    const fieldHeight = height * tearAt
    return Math.max(0, tearAt * (1 + heroBleed(width, fieldHeight)) - 1)
}

/**
 * `width` and `height` are the hero's CSS pixels. Pass `raggedEdge: false` for
 * a box that has to fill completely rather than tear off at the bottom.
 */
export function heroFieldOptions(width, height, { raggedEdge = true } = {}) {
    const meanWidth = meanDrawnWidth(width, height)
    const worldMean = meanWidth / MEAN_INVERSE_DEPTH

    return {
        count: VISIBLE_COUNT,
        field: {
            raggedEdge,
            // A box that has to fill completely needs placement past every
            // edge, not just three of them.
            ...(raggedEdge ? null : { overscanBottom: 0.25 }),
            worldSizeMin: worldMean * SIZE_MIN_RATIO,
            worldSizeMax: worldMean * SIZE_MAX_RATIO,
            // Defocus is a screen-space distance, so it tracks logo size.
            nearBlurPx: meanWidth * 0.055 * DEFOCUS,
            farBlurPx: meanWidth * 0.0265 * DEFOCUS,
            maxBlurPx: meanWidth * 0.053 * DEFOCUS,
        },
    }
}
