/**
 * A basketball court, drawn flat, to real proportions.
 *
 * The viewBox *is* the court: 94 feet by 50, so every marking below is in
 * feet straight off the rulebook rather than eyeballed against a box of
 * some other shape. Anything using this gets the court's aspect ratio for
 * free by matching the viewBox.
 *
 * The three-point line is the one piece worth checking rather than
 * trusting: the corner is a straight 14ft run 3ft in from the sideline,
 * and the arc is struck at 23.75ft from the basket centre, which sits 5.25ft
 * off the baseline. Those three numbers have to agree — the distance from
 * (5.25, 25) to the corner's end at (14, 3) comes out 23.68ft, which is the
 * arc's own radius to within an inch, so the straight meets the curve
 * without a kink. That is why the corner line is 14ft and not a rounder
 * number.
 */

export const COURT_LENGTH = 94
export const COURT_WIDTH = 50
export const COURT_ASPECT = COURT_LENGTH / COURT_WIDTH

export default function CourtGlyph({ className = '', stroke = 'currentColor', ...rest }) {
    return (
        <svg
            viewBox={`0 0 ${COURT_LENGTH} ${COURT_WIDTH}`}
            className={className}
            fill="none"
            stroke={stroke}
            strokeWidth={0.9}
            vectorEffect="non-scaling-stroke"
            aria-hidden
            focusable="false"
            {...rest}
        >
            {/* Boundary and halfcourt */}
            <rect x="0.45" y="0.45" width="93.1" height="49.1" />
            <line x1="47" y1="0" x2="47" y2="50" />
            <circle cx="47" cy="25" r="6" />

            {/* Lane, free-throw circle and restricted arc, both ends */}
            <rect x="0" y="17" width="19" height="16" />
            <circle cx="19" cy="25" r="6" />
            <path d="M 1.25 21 A 4 4 0 0 1 1.25 29" />
            <rect x="75" y="17" width="19" height="16" />
            <circle cx="75" cy="25" r="6" />
            <path d="M 92.75 21 A 4 4 0 0 0 92.75 29" />

            {/* Three-point line: corner run, then the arc */}
            <path d="M 0 3 L 14 3 A 23.75 23.75 0 0 1 14 47 L 0 47" />
            <path d="M 94 3 L 80 3 A 23.75 23.75 0 0 0 80 47 L 94 47" />
        </svg>
    )
}
