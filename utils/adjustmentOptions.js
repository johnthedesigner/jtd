export const typeStyles = {
    families: [
        {
            id: 'sans',
            name: 'Sans-serif',
            value: "'Source Sans Pro', sans-serif",
            weights: [400, 700],
            hasItalic: true,
        },
        {
            id: 'mono',
            name: 'Monospace',
            value: "'Source Code Pro', 'IBM Plex Mono', sans-serif",
            weights: [400, 700],
            hasItalic: false,
        },
        {
            id: 'blackletter',
            name: 'Blackletter',
            value: "'Schmaltzy', sans-serif",
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
