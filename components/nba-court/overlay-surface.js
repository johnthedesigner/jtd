/**
 * The colour every overlay panel sits on.
 *
 * These controls float over a rendered arena, and they had drifted to pure
 * black (`bg-black/40`, `/60`, `/80` in six different files, plus a card
 * gradient ending at `#000`). Against a scene whose own background is
 * `#0b0d12` — a cool near-black, not an absolute one — true black reads as a
 * hole cut in the picture rather than as a panel resting on top of it.
 *
 * So the surface is a few steps up from black and carries the scene's own
 * hue. Kept here, as values rather than as Tailwind classes, because
 * Tailwind only sees class names it can find literally in the source: the
 * one thing a shared constant has to do is make every panel change together,
 * and `bg-[${COLOR}]` would silently compile to nothing.
 */

/** Cool near-black with a blue cast, a few steps above the scene's own. */
export const OVERLAY_RGB = '22, 27, 36'

/**
 * Standard panel: buttons, chips, the speed selector, the court picker.
 *
 * Panels using this want a hairline too (`ring-1 ring-white/10`). Moving off
 * black cost them their edges — against a scene this dark, the fill alone no
 * longer separates a control from the arena behind it, and the speed
 * selector in particular read as loose text floating over the court.
 */
export const OVERLAY_BG = `rgba(${OVERLAY_RGB}, 0.82)`

/** For panels carrying dense text, where contrast matters more than depth. */
export const OVERLAY_BG_STRONG = `rgba(${OVERLAY_RGB}, 0.88)`

/** A full-screen scrim, e.g. behind the court picker's grid. */
export const OVERLAY_SCRIM = `rgba(${OVERLAY_RGB}, 0.86)`

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
