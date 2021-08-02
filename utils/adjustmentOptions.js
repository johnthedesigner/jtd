export const typeStyles = {
    families: [
        {
            id: 'sans',
            name: 'Sans-serif',
            value: "'Source Sans Pro', sans-serif",
            weights: [300, 400, 700, 900],
            hasItalic: true,
        },
        {
            id: 'mono',
            name: 'Monospace',
            value: "'IBM Plex Mono', sans-serif",
            weights: [200, 400],
            hasItalic: false,
        },
    ],
}

export const fontSizes = [6, 8, 12, 16, 18, 24, 28, 32, 36, 48, 60, 72, 96, 144]

export const fillTypes = [
    { type: 'color', name: 'Color' },
    { type: 'gradient', name: 'Gradient' },
]
