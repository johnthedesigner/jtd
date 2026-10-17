/**
 * The four glyphs the transport needs.
 *
 * Inline rather than from a library: these are four paths, and the page
 * already carries a three.js bundle without adding an icon set to it for
 * a play triangle.
 */
const base = {
    width: 14,
    height: 14,
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    'aria-hidden': true,
    focusable: 'false',
}

export const PlayIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M8 5v14l11-7z" />
    </svg>
)

export const PauseIcon = (props) => (
    <svg {...base} {...props}>
        <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
    </svg>
)

export const ReplayIcon = (props) => (
    <svg {...base} {...props} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11a9 9 0 1 1 2.6 6.4" />
        <path d="M3 4v7h7" />
    </svg>
)

export const ChevronLeft = (props) => (
    <svg {...base} {...props} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 5l-7 7 7 7" />
    </svg>
)

export const ChevronRight = (props) => (
    <svg {...base} {...props} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5l7 7-7 7" />
    </svg>
)
