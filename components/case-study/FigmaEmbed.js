const FigmaEmbed = ({ src, title, caption, aspectRatio = '16/9', fullWidth = false }) => {
    const embedSrc = `${src}&viewport-controls=false`
    return (
    <figure style={{ margin: 0, padding: fullWidth ? '0 var(--layout-page-gutter)' : 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {title && (
            <p style={{
                fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-on-surface-muted)',
                margin: 0,
            }}>
                {title}
            </p>
        )}
        <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio,
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface-subtle)',
        }}>
            <iframe
                src={embedSrc}
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block',
                }}
                allowFullScreen
            />
        </div>
        {caption && (
            <figcaption style={{
                fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                fontSize: '12px',
                fontWeight: 400,
                lineHeight: 1.5,
                letterSpacing: '0.01em',
                color: 'var(--color-on-surface-muted)',
                paddingLeft: '4px',
            }}>
                {caption}
            </figcaption>
        )}
    </figure>
    )
}

export { FigmaEmbed }
