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

// Two columns only once there is room for them. The block sits inside a 720px
// column, so below the `md` breakpoint each side is too narrow to read and the
// aside's rule belongs across the top rather than down the side.
const TLDRBlock = ({ summary, children }) => (
    <div
        className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 p-6 md:p-12"
        style={{
            background: 'var(--color-primary)',
            borderRadius: '14px',
        }}
    >
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
        <div
            className="pt-8 border-t md:pt-0 md:border-t-0 md:pl-12 md:border-l"
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '28px',
                borderStyle: 'solid',
                borderColor: 'rgba(255,255,255,0.2)',
            }}
        >
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
