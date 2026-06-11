const ProseSection = ({ children }) => (
    <div style={{
        maxWidth: '720px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    }}>
        {children}
    </div>
)

const ProseSectionKicker = ({ children }) => (
    <p style={{
        fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--color-on-surface-muted)',
        margin: 0,
    }}>
        {children}
    </p>
)

const ProseSectionHeading = ({ children, as: Tag = 'h2' }) => (
    <Tag style={{
        fontFamily: 'var(--font-fraunces), Georgia, serif',
        fontSize: '34px',
        fontWeight: 600,
        lineHeight: 1.15,
        letterSpacing: '-0.015em',
        color: 'var(--color-on-surface)',
        margin: 0,
    }}>
        {children}
    </Tag>
)

const ProseSectionSubheading = ({ children, as: Tag = 'h3' }) => (
    <Tag style={{
        fontFamily: 'var(--font-fraunces), Georgia, serif',
        fontSize: '22px',
        fontWeight: 400,
        lineHeight: 1.25,
        letterSpacing: '-0.01em',
        color: 'var(--color-on-surface)',
        margin: 0,
    }}>
        {children}
    </Tag>
)

const ProseSectionBody = ({ children }) => (
    <div style={{
        fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
        fontSize: '17px',
        fontWeight: 500,
        lineHeight: 1.7,
        color: 'var(--color-on-surface-body)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    }}>
        {children}
    </div>
)

export {
    ProseSection,
    ProseSectionKicker,
    ProseSectionHeading,
    ProseSectionSubheading,
    ProseSectionBody,
}
