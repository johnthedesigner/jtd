/**
 * Values the page needs before, or without, the GPU scene.
 *
 * Kept apart from `scene.js` so importing them does not pull culori, the
 * distance-field builder, and the shaders into the main bundle.
 */

export const PRIMARY = '#1683ff'

/**
 * Instances the field shader's uniform array holds. 1920 logos is 60KB, inside
 * the 64KB uniform binding WebGPU guarantees everywhere.
 */
export const MAX_INSTANCES = 1920

/** Viewport width at or below which the hero uses its narrow settings. */
export const MOBILE_MAX_WIDTH = 768

/**
 * Pre-rendered stand-ins for each GPU treatment, used where WebGPU is
 * unavailable and wherever the visitor has asked for reduced motion. Generated
 * from the same scenes by `npm run fallbacks`.
 */
export const FALLBACK_IMAGES = {
    wide: '/hero-fallback-wide.webp',
    tall: '/hero-fallback-tall.webp',
}

export const COMPACT_FALLBACK_IMAGES = {
    wide: '/hero-compact-wide.webp',
    tall: '/hero-compact-tall.webp',
}

export const FOOTER_FALLBACK_IMAGES = {
    wide: '/footer-wide.webp',
    tall: '/footer-tall.webp',
}

export const MENU_FALLBACK_IMAGE = '/menu-backdrop.webp'
