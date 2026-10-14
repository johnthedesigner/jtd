import { CARD_BG } from '../overlay-surface'
import { LOGO_SIZE, ROW_HEIGHT, TEXT_INSET } from './GameCard'
import { brandGradient } from './team-gradient'

/**
 * The card's own shape, with nothing in it yet.
 *
 * Built from the same exported constants the real card lays itself out
 * with, so the two cannot drift apart — the point of a skeleton is that
 * what arrives lands exactly where the placeholder was, and a skeleton with
 * its own copy of the numbers stops being true the first time the card is
 * touched.
 *
 * The variant now only decides whether the score blocks are drawn: the
 * footer became two fixed rows for every card, so both kinds are the same
 * height and there is no longer a layout difference to mirror. The score is
 * still worth getting right, because a block appearing where there was
 * nothing is the same flinch at a smaller scale.
 */

/**
 * A dim block standing in for a run of text.
 *
 * The pulse lives here and on the disc, never on the card.
 * `animate-pulse` animates *opacity*, and a card is sitting directly over a
 * lit WebGL court — pulsing the whole thing faded the court straight
 * through it twice a second. Only the placeholders breathe; the card and
 * its rows stay opaque.
 */
function Bar({ width, className = '' }) {
    return (
        <span
            aria-hidden
            className={`block animate-pulse rounded-[2px] bg-white/10 ${className}`}
            style={{ width }}
        />
    )
}

function SkeletonRow({ showScore, divider }) {
    return (
        <div
            className={`relative flex items-center overflow-hidden ${
                divider ? 'border-b border-black/40' : ''
            }`}
            // The colourless case of the real row's own gradient, rather
            // than a translucent grey: the rows have to be opaque, because
            // the court is rendering directly behind this strip and showed
            // straight through the first version.
            style={{ height: ROW_HEIGHT, backgroundImage: brandGradient(null) }}
        >
            {/*
              A disc where the mark will be, cropped by the row exactly as
              the real logo is — same size, same negative offset.
            */}
            <span
                aria-hidden
                className="absolute top-1/2 -translate-y-1/2 animate-pulse rounded-full bg-white/[0.07]"
                style={{ left: -10, height: LOGO_SIZE, width: LOGO_SIZE }}
            />
            <span className="relative min-w-0 flex-1" style={{ paddingLeft: TEXT_INSET }}>
                <Bar width={46} className="h-3.5" />
            </span>
            {showScore && (
                <span className="relative shrink-0 pr-3">
                    <Bar width={30} className="h-4" />
                </span>
            )}
        </div>
    )
}

export default function GameCardSkeleton({ variant = 'upcoming' }) {
    // Replays are the variant that shows scores and a dated second line.
    const past = variant === 'past'
    return (
        <div
            // `aria-hidden` and no live region: the strip itself announces
            // that it is loading, and nine identical placeholders read out
            // to a screen reader would be noise.
            aria-hidden
            className="w-full overflow-hidden rounded-sm border border-white/10"
            style={{ backgroundColor: CARD_BG }}
        >
            <SkeletonRow showScore={past} divider />
            <SkeletonRow showScore={past} />
            <div className="px-3 pb-3 pt-2">
                {/* When on the left, state on the right — the real first line. */}
                <div className="flex items-center justify-between gap-2">
                    <Bar width={96} className="h-2.5" />
                    <Bar width={past ? 34 : 50} className="h-2.5" />
                </div>
                {/* The call to action, which every card carries. */}
                <Bar width={past ? 62 : 84} className="mt-2 h-[28px]" />
            </div>
        </div>
    )
}
