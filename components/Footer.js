import { useEffect, useState } from 'react'

const Footer = () => {
    const [email, setEmail] = useState('')
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        setEmail('john@johnthedesigner.com')
    }, [])

    const copyEmail = async () => {
        await navigator.clipboard.writeText(email)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
    }

    return (
        <footer id="contact" style={{ background: 'var(--color-primary)' }}>

            {/* CTA */}
            <div style={{
                maxWidth: '600px',
                margin: '0 auto',
                padding: '96px 24px 80px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '20px',
            }}>
                <h2 style={{
                    fontFamily: 'var(--font-schmaltzy), Palatino Linotype, serif',
                    fontSize: 'clamp(48px, 7vw, 80px)',
                    fontWeight: 600,
                    lineHeight: 1.0,
                    letterSpacing: '-0.02em',
                    color: '#ffffff',
                    margin: 0,
                }}>
                    Let&rsquo;s Talk
                </h2>
                <p style={{
                    fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                    fontSize: '17px',
                    lineHeight: 1.65,
                    color: 'rgba(255,255,255,0.65)',
                    margin: 0,
                    maxWidth: '400px',
                }}>
                    Reach out if you&rsquo;d like to talk about working together, or just talk about design.
                </p>

                {/* Email copy widget */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    width: '100%',
                    maxWidth: '440px',
                    marginTop: '8px',
                }}>
                    <input
                        readOnly
                        value={email}
                        onClick={e => e.target.select()}
                        style={{
                            flex: 1,
                            minWidth: 0,
                            fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                            fontSize: '14px',
                            fontWeight: 400,
                            height: '44px',
                            padding: '0 14px',
                            background: 'rgba(255,255,255,0.12)',
                            border: `1px solid ${copied ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)'}`,
                            borderRadius: '6px',
                            color: '#ffffff',
                            outline: 'none',
                            transition: 'border-color 0.25s',
                            cursor: 'text',
                        }}
                    />
                    <button
                        onClick={copyEmail}
                        disabled={copied}
                        style={{
                            flexShrink: 0,
                            fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                            fontSize: '13px',
                            fontWeight: 700,
                            letterSpacing: '0.01em',
                            height: '44px',
                            padding: '0 18px',
                            background: copied ? 'var(--color-success)' : '#ffffff',
                            color: copied ? '#052e16' : 'var(--color-primary)',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: copied ? 'default' : 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'background 0.3s, color 0.3s',
                        }}
                    >
                        {copied ? 'Copied!' : 'Copy Email'}
                    </button>
                </div>
            </div>

            {/* Decorative JTD wordmark */}
            <svg
                width="100%"
                viewBox="0 0 1729 380"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: 'block' }}
                aria-hidden="true"
            >
                <g clipPath="url(#footer-clip)">
                    <path
                        d="M413.077 97.6396C412.652 89.5634 418.875 82.6733 426.975 82.25L607.1 72.8384C615.2 72.4152 622.111 78.6191 622.536 86.6952L632.744 280.903C638.807 396.237 549.944 494.634 434.263 500.678C323.514 506.465 228.335 425.508 215.102 317.391C214.119 309.363 220.394 302.449 228.494 302.025L415.952 292.231C420.002 292.019 423.114 288.574 422.901 284.536L413.077 97.6396Z"
                        fill="rgba(255,255,255,0.12)"
                    />
                    <path
                        d="M642.198 115.729C640.79 107.764 646.124 100.169 654.112 98.7651L1038.3 31.2249C1046.29 29.8206 1053.91 35.1385 1055.32 43.1029L1086.64 220.202C1088.05 228.166 1082.71 235.761 1074.72 237.166L993.141 251.508C989.147 252.21 986.48 256.007 987.184 259.99L1019.78 444.299C1021.19 452.263 1015.86 459.858 1007.87 461.263L830.236 492.49C822.247 493.894 814.63 488.576 813.221 480.612L780.625 296.302C779.921 292.32 776.112 289.661 772.118 290.363L690.534 304.706C682.546 306.11 674.928 300.792 673.519 292.828L642.198 115.729Z"
                        fill="rgba(255,255,255,0.12)"
                    />
                    <path
                        d="M1148.55 52.1367L1340.64 85.9068C1454.72 105.962 1530.89 214.422 1510.78 328.16C1490.66 441.898 1381.88 517.843 1267.8 497.788L1075.7 464.018C1067.71 462.614 1062.38 455.019 1063.79 447.054L1131.53 64.0147C1132.94 56.0503 1140.56 50.7324 1148.55 52.1367Z"
                        fill="rgba(255,255,255,0.12)"
                    />
                </g>
                <defs>
                    <clipPath id="footer-clip">
                        <rect width="1729" height="380" fill="white" />
                    </clipPath>
                </defs>
            </svg>

        </footer>
    )
}

export default Footer
