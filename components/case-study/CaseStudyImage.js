import Image from 'next/image'

const CaseStudyImage = ({ src, alt, width, height, caption, fullWidth = false }) => (
    <figure style={{
        margin: 0,
        padding: fullWidth ? '0 var(--layout-page-gutter)' : 0,
    }}>
        <div style={{
            borderRadius: '10px',
            overflow: 'hidden',
            background: 'var(--color-surface-subtle)',
            padding: 'var(--space-8)',
        }}>
            <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '4px' }}
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
                marginTop: '12px',
                paddingLeft: '4px',
            }}>
                {caption}
            </figcaption>
        )}
    </figure>
)

export { CaseStudyImage }
