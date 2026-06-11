import { useState } from 'react'

const MONO = "'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', monospace"

function CopyIcon() {
    return (
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none">
            <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
            <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.7" />
        </svg>
    )
}

function CheckIcon() {
    return (
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none">
            <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

const PromptBlock = ({ type = 'campaign', slug, refCount = 0, body, maxHeight = 420 }) => {
    const [copied, setCopied] = useState(false)

    async function handleCopy() {
        await navigator.clipboard.writeText(body)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div style={{
            borderRadius: '14px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface-raised)',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(14,23,32,0.08), 0 0 1px rgba(14,23,32,0.06)',
        }}>

            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                borderBottom: '1px solid var(--color-border)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                        display: 'block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--color-primary)',
                        boxShadow: '0 0 0 3px rgba(22,131,255,0.15)',
                        flexShrink: 0,
                    }} />
                    <span style={{
                        fontFamily: MONO,
                        fontSize: '11px',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: 'var(--color-on-surface-muted)',
                    }}>
                        {type} · {slug}
                    </span>
                </div>
                <button
                    onClick={handleCopy}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        height: '32px',
                        padding: '0 14px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'var(--color-primary)',
                        color: 'white',
                        fontSize: '12px',
                        fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 1px 2px rgba(22,131,255,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                        flexShrink: 0,
                    }}
                >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>

            {/* Body */}
            <div style={{
                padding: '20px',
                fontFamily: MONO,
                fontSize: '12.5px',
                lineHeight: 1.7,
                color: 'var(--color-on-surface-body)',
                whiteSpace: 'pre-wrap',
                overflowY: 'auto',
                maxHeight,
            }}>
                {body}
            </div>

            {/* Footer */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 16px',
                borderTop: '1px solid var(--color-border)',
                background: 'var(--color-surface-subtle)',
            }}>
                <span style={{
                    fontFamily: MONO,
                    fontSize: '11px',
                    color: 'var(--color-on-surface-muted)',
                }}>
                    {refCount > 0 ? `${refCount} KB ref${refCount !== 1 ? 's' : ''}` : ''}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <span style={{ fontFamily: MONO, fontSize: '11px', color: 'var(--color-on-surface-muted)' }}>
                        paste into
                    </span>
                    {['Claude Code', 'Cursor'].map(tool => (
                        <span key={tool} style={{
                            fontFamily: MONO,
                            fontSize: '11px',
                            padding: '2px 8px',
                            border: '1px solid var(--color-border-mid)',
                            borderRadius: '6px',
                            color: 'var(--color-on-surface-muted)',
                        }}>
                            {tool}
                        </span>
                    ))}
                </div>
            </div>

        </div>
    )
}

export default PromptBlock
