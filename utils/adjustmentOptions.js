export const typeStyles = {
    families: [
        {
            id: 'sans',
            name: 'Sans-serif',
            value: "'Source Sans Pro', Frutiger, 'Frutiger Linotype', Univers, Calibri, 'Gill Sans', 'Gill Sans MT', 'Myriad Pro', Myriad, 'DejaVu Sans Condensed', 'Liberation Sans', 'Nimbus Sans L', Tahoma, Geneva, 'Helvetica Neue', Helvetica, Arial, sans-serif",
            weights: [400, 700],
            hasItalic: true,
        },
        {
            id: 'mono',
            name: 'Monospace',
            value: "'IBM Plex Mono', Consolas, 'Andale Mono WT', 'Andale Mono', 'Lucida Console', 'Lucida Sans Typewriter', 'DejaVu Sans Mono', 'Bitstream Vera Sans Mono', 'Liberation Mono', 'Nimbus Mono L', Monaco, 'Courier New', Courier, monospace",
            weights: [400, 700],
            hasItalic: false,
        },
        {
            id: 'blackletter',
            name: 'Blackletter',
            value: "'Schmaltzy', 'Palatino Linotype', Palatino, Palladio,'URW Palladio L', 'Book Antiqua', Baskerville, 'Bookman Old Style', 'Bitstream Charter', 'Nimbus Roman No9 L', Garamond, 'Apple Garamond', 'ITC Garamond Narrow', 'New Century Schoolbook', 'Century Schoolbook', 'Century Schoolbook L', Georgia, serif",
            weights: [400, 700],
            hasItalic: false,
        },
    ],
}

export const fontSizes = [6, 8, 12, 16, 18, 24, 28, 32, 36, 48, 60, 72, 96, 144]

export const fillTypes = [
    { type: 'color', name: 'Color' },
    { type: 'gradient', name: 'Gradient' },
]
