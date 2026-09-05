/**
 * Field settings for the mobile menu panel.
 *
 * The same treatment as the hero, in near-white instead of blue and with no
 * ragged edge, so it fills its box. Kept apart from the component so the
 * headless check and the fallback generator use the exact same numbers.
 */

// Ends of the ramp each logo is shaded along. Near-white on white, so the
// marks read as texture rather than as content.
import { heroFieldOptions } from './hero-field.js'

export const MENU_COLOR_LOW = '#e9eef4'
export const MENU_COLOR_HIGH = '#ffffff'

/**
 * `width` and `height` are the panel's *device* pixels.
 *
 * Size and defocus come straight from the hero, so the marks and their depth
 * of field read the same here as they do there. Only the palette, the timing,
 * and the missing ragged edge differ.
 */
export function panelOptions(width, height) {
    const { count, field } = heroFieldOptions(width, height, { raggedEdge: false })

    return {
        count,
        field: {
            ...field,
            // Opaque marks, so the texture comes from the shade ramp alone and
            // the settled panel closes completely. Menu text sits on this, so a
            // pinhole would show the page scrolling behind it. Checked by
            // `npm run verify:menu`.
            alphaMin: 1,
            // Quick enough to feel like a menu, not a page load. The reverse
            // runs at 0.7 of this.
            staggerMs: 420,
            fadeMs: 80,
        },
        scene: {
            bleed: 0,
            colorLow: MENU_COLOR_LOW,
            colorHigh: MENU_COLOR_HIGH,
            // Heavier than the hero's: the panel is near-white and largely
            // flat, so it carries more texture before it reads as noise.
            grain: 0.075,
        },
    }
}
