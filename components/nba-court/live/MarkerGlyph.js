import { MARKER_KINDS } from './live-markers'

/**
 * Flat 2D counterparts to the floor marks, for the live HUD.
 *
 * Deliberately simpler than the extruded shapes they stand for — same
 * silhouette and same colour, but drawn as a stroke at 14px rather than a
 * scaled-down rendering of an annulus with a chamfer. At this size the
 * chamfer and the ring thickness are noise, and what has to survive is only
 * "circle, cross, hexagon, arrow, diamond, triangle" at a glance.
 *
 * Colours are duplicated from `LiveGameOverlay`'s `MARKS` rather than
 * imported: that table's values are `THREE.Color` instances built for a
 * lit, tonemapped 3D scene, and these are CSS strokes on a dark panel. They
 * are meant to match by eye, not by value, and tying them together would
 * mean every future tweak to one silently changed the other.
 */

/**
 * The miss marker's red.
 *
 * `#ff4f42` measured 0.272 relative luminance against a 0.522 mean for the
 * other four marks — about half as bright, and on a lit parquet floor it
 * read as a dark smudge where the green, amber and cyan all popped.
 *
 * This sits halfway between it and a version raised to the others' level.
 * That version, `#ff877e`, was bright enough but had drifted to a pale
 * coral: lifting lightness at full saturation walks a hue toward white, and
 * the channel spread fell from 189 to 129. At this midpoint the spread is
 * 159 and the luminance 0.326 — brighter than it was, still unmistakably
 * red.
 */
const MISS_RED = '#ff6b60'

const GLYPHS = {
    [MARKER_KINDS.MAKE]: { color: '#41e08a', label: 'Made' },
    [MARKER_KINDS.MISS]: { color: MISS_RED, label: 'Missed' },
    [MARKER_KINDS.REBOUND]: { color: '#ffc24a', label: 'Rebound' },
    [MARKER_KINDS.STEAL]: { color: '#4ad4ff', label: 'Steal' },
    [MARKER_KINDS.TURNOVER]: { color: '#ff9a3c', label: 'Turnover' },
    [MARKER_KINDS.FOUL]: { color: '#b98cff', label: 'Foul' },
}

/** Regular polygon points on a circle of radius r, centred at 8,8. */
function polygon(sides, radius, rotation) {
    return Array.from({ length: sides }, (_, i) => {
        const a = (i / sides) * Math.PI * 2 + rotation
        return `${(8 + Math.cos(a) * radius).toFixed(2)},${(8 + Math.sin(a) * radius).toFixed(2)}`
    }).join(' ')
}

function Shape({ kind }) {
    switch (kind) {
        case MARKER_KINDS.MAKE:
            return <circle cx="8" cy="8" r="5.2" />
        case MARKER_KINDS.MISS:
            return (
                <>
                    <line x1="4.4" y1="4.4" x2="11.6" y2="11.6" />
                    <line x1="11.6" y1="4.4" x2="4.4" y2="11.6" />
                </>
            )
        case MARKER_KINDS.REBOUND:
            return <polygon points={polygon(6, 5.6, Math.PI / 6)} />
        case MARKER_KINDS.TURNOVER:
            return <polygon points={polygon(4, 5.8, Math.PI / 2)} />
        case MARKER_KINDS.FOUL:
            return <polygon points={polygon(3, 6, -Math.PI / 2)} />
        case MARKER_KINDS.STEAL:
            // The chevron, pointing right — the possession arrow.
            return <polyline points="5,3.4 10.4,8 5,12.6" />
        default:
            return null
    }
}

export default function MarkerGlyph({ kind, size = 14, className = '' }) {
    const glyph = GLYPHS[kind]
    // No symbol for this play: an empty box the same width, so the text
    // column stays aligned down the feed instead of ragging.
    if (!glyph) {
        return <span aria-hidden className={`shrink-0 ${className}`} style={{ width: size, height: size }} />
    }

    return (
        <svg
            viewBox="0 0 16 16"
            width={size}
            height={size}
            className={`shrink-0 ${className}`}
            fill="none"
            stroke={glyph.color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            role="img"
            aria-label={glyph.label}
        >
            <Shape kind={kind} />
        </svg>
    )
}
