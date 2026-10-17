/**
 * Two hues, opposite each other.
 *
 * The court is cyan and the racket is orange, and those sit almost exactly
 * across the wheel from one another — 196 and 16 degrees. Everything added
 * to the scene draws from that pair rather than introducing a third or
 * fourth hue, so a measurement reads as part of the picture instead of as
 * a chart laid over it.
 *
 * The UI stays out of it deliberately: the control strip is neutral, and
 * two saturated complements plus a tinted panel is one thing too many.
 *
 * The ball is the one exception. A tennis ball is optic yellow, everybody
 * knows what colour a tennis ball is, and recolouring it to fit a palette
 * would be the single most noticeable wrong note on the page.
 */

export const PALETTE = {
    /** The court, and anything measuring the body's own geometry. */
    cyan: '#39a5cc',
    cyanBright: '#34c6eb',
    /**
     * The racket. A lit `MeshStandardMaterial`, so the tone curve sees it
     * after the lights have had their way with it.
     */
    orange: '#ff711f',
    /**
     * The same orange, for things that are *not* lit.
     *
     * Lines and arcs are `MeshBasicMaterial`: their colour goes into ACES
     * at full saturation with nothing to soften it, and the curve rolls a
     * saturated orange hard toward red. Using the racket's own hex for
     * them produced annotations that read as red beside a racket that read
     * as orange — the same number, two different colours on screen. This
     * is shifted up the spectrum and desaturated so that it *renders*
     * where the racket does.
     */
    orangeLine: '#ffac45',
    /** Not negotiable. */
    optic: '#d4ec2a',
}

/**
 * The scene's black point, and the haze it fades into.
 *
 * Here rather than in `ServeArena` because the page needs the background
 * colour for its `theme-color` meta and for pinning the document, and
 * importing it from the arena would pull three.js into the page bundle —
 * which is the exact thing the viewer's dynamic import exists to prevent.
 *
 * Barely a colour at 6% value, but every shadow and falloff bottoms out
 * here, so a neutral one quietly greys the whole palette against a cyan
 * court.
 */
export const SCENE_BG = '#070e11'

/**
 * Deliberately *not* the background. Exponential fog toward the background
 * colour is invisible on a dark scene: it fades things to black, which
 * distance was already doing. Fading toward something lighter is what
 * reads as air in the room.
 */
export const FOG_COLOR = '#152329'
