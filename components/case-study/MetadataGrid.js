const MetadataGrid = ({ children }) => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '1px',
        background: 'var(--color-border)',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
    }}>
        {children}
    </div>
)

const MetadataItem = ({ label, children }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '24px',
        background: 'var(--color-surface)',
    }}>
        <p style={{
            fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-on-surface-muted)',
            margin: 0,
        }}>
            {label}
        </p>
        <p style={{
            fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
            fontSize: '15px',
            fontWeight: 400,
            lineHeight: 1.5,
            color: 'var(--color-on-surface-body)',
            margin: 0,
        }}>
            {children}
        </p>
    </div>
)

export { MetadataGrid, MetadataItem }
