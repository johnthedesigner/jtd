const TLDRItem = ({ label, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
            lineHeight: 1.65,
            color: 'var(--color-on-surface-body)',
            margin: 0,
        }}>
            {children}
        </p>
    </div>
)

const TLDRBlock = ({ summary, children }) => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '48px',
        padding: '48px',
        background: 'var(--color-primary)',
        borderRadius: '14px',
    }}>
        {/* Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{
                fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.6)',
                margin: 0,
            }}>
                TL;DR
            </p>
            <p style={{
                fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                fontSize: '17px',
                fontWeight: 400,
                lineHeight: 1.7,
                color: 'rgba(255,255,255,0.9)',
                margin: 0,
            }}>
                {summary}
            </p>
        </div>

        {/* Aside metadata */}
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
            paddingLeft: '48px',
            borderLeft: '1px solid rgba(255,255,255,0.2)',
        }}>
            {children}
        </div>
    </div>
)

const TLDRItemWhite = ({ label, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <p style={{
            fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.6)',
            margin: 0,
        }}>
            {label}
        </p>
        <p style={{
            fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
            fontSize: '15px',
            fontWeight: 400,
            lineHeight: 1.65,
            color: 'rgba(255,255,255,0.85)',
            margin: 0,
        }}>
            {children}
        </p>
    </div>
)

export { TLDRBlock, TLDRItem, TLDRItemWhite }
