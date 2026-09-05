import { useEffect, useState } from 'react'
import LogoHeroGPU from '@/components/LogoHeroGPU'
import { FOOTER_FALLBACK_IMAGES } from '@/components/logo-hero-gpu/constants'
import { footerField, WORDMARK_BAND } from '@/components/logo-hero-gpu/footer-field'

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
        <footer id="contact" style={{ position: 'relative', background: 'var(--color-primary)' }}>
            <LogoHeroGPU
                height="0px"
                animate={false}
                ragged={false}
                contentLift={0}
                fieldOptions={footerField}
                fallbackImages={FOOTER_FALLBACK_IMAGES}
            >

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

            {/* The wordmark that used to live here is now drawn by the field
                itself, as one large logo on top of the scattered ones. This
                spacer holds the height it occupied. */}
            <div style={{ height: `${WORDMARK_BAND * 100}vw` }} />
            </LogoHeroGPU>

            {/* Suggests the page body sitting over the footer's top edge. */}
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '24px',
                    background: 'linear-gradient(to bottom, rgba(6,32,64,0.22), rgba(6,32,64,0))',
                    pointerEvents: 'none',
                }}
            />
        </footer>
    )
}

export default Footer
