const PullQuote = ({ quote, attribution }) => (
    <figure style={{
        margin: '0 auto',
        maxWidth: '760px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
    }}>
        <span aria-hidden="true" style={{
            fontFamily: 'var(--font-fraunces), Georgia, serif',
            fontSize: '96px',
            lineHeight: 0.75,
            color: 'var(--color-primary)',
            display: 'block',
            marginBottom: '8px',
        }}>
            &#8220;
        </span>
        <blockquote style={{
            fontFamily: 'var(--font-fraunces), Georgia, serif',
            fontSize: '28px',
            fontStyle: 'italic',
            fontWeight: 'var(--type-heading-lg-font-weight)',
            lineHeight: 1.45,
            letterSpacing: '-0.005em',
            color: 'var(--color-on-surface)',
            margin: 0,
        }}>
            {quote}
        </blockquote>
        {attribution && (
            <figcaption style={{
                marginTop: '24px',
                fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-primary)',
            }}>
                — {attribution}
            </figcaption>
        )}
    </figure>
)

export { PullQuote }
