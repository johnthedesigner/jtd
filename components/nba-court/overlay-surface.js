/**
 * Court-specific surfaces, on top of the shared overlay palette.
 *
 * The panel colours themselves moved to `components/webgl/overlay-surface`
 * when a second experiment needed them; they are re-exported here so the
 * dozen call sites in this folder keep one import.
 */
// Imported as well as re-exported: `export ... from` forwards a binding
// without introducing it locally, and `CARD_BG` below interpolates it.
import { OVERLAY_RGB } from '../webgl/overlay-surface'

export {
    OVERLAY_RGB,
    OVERLAY_BG,
    OVERLAY_BG_STRONG,
    OVERLAY_SCRIM,
} from '../webgl/overlay-surface'

/**
 * Where a game card's team gradient lands on its right-hand end. Opaque:
 * the card is the one surface the court must not show through, since a lit
 * floor behind a score is the thing that made them hard to read.
 */
export const CARD_GRADIENT_END = '#12161e'

/**
 * The middle of the score bug's stripe, where the two teams' colours have
 * both faded out. A step lighter than `OVERLAY_BG` so the stripe still
 * reads as its own band inside the panel rather than as a hole in it.
 */
export const BAND_MID = '#1b212c'

/** The card body behind the rows and footer. */
export const CARD_BG = `rgba(${OVERLAY_RGB}, 0.92)`
