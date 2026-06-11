import { useState, useEffect, useRef, useContext } from 'react'
import { LockOpen } from 'lucide-react'
import { PasswordProvider } from '@/utils/context'
import Link from 'next/link'

const AuthNotice = () => {
    // Temporarily hidden — no private case studies active
    return null

    const [isOpen, setIsOpen] = useState(false) // eslint-disable-line no-unreachable
    const [hovered, setHovered] = useState(false)
    const ref = useRef(null)
    const { logout } = useContext(PasswordProvider)

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target) && isOpen) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    return (
        <div ref={ref} style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>

            {/* Flyout card */}
            <div style={{
                width: '272px',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                opacity: isOpen ? 1 : 0,
                visibility: isOpen ? 'visible' : 'hidden',
                transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.97)',
                transition: 'opacity 0.2s ease, transform 0.2s ease, visibility 0.2s',
                pointerEvents: isOpen ? 'auto' : 'none',
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <h3 style={{
                        fontFamily: 'var(--font-fraunces), Georgia, serif',
                        fontSize: '22px',
                        fontWeight: 600,
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1,
                        color: 'var(--color-on-surface)',
                        margin: 0,
                    }}>
                        You&apos;re in.
                    </h3>
                    <p style={{
                        fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                        fontSize: '14px',
                        lineHeight: 1.6,
                        color: 'var(--color-on-surface-body)',
                        margin: 0,
                    }}>
                        Private case studies are unlocked. Go take a look!
                    </p>
                </div>

                <Link
                    href="/work"
                    onClick={() => setIsOpen(false)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '40px',
                        background: 'var(--color-primary)',
                        color: 'white',
                        fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                        fontSize: '13px',
                        fontWeight: 700,
                        letterSpacing: '0.01em',
                        textDecoration: 'none',
                        borderRadius: '8px',
                    }}
                >
                    View case studies
                </Link>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                    <button
                        onClick={logout}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                            fontSize: '12px',
                            color: 'var(--color-on-surface-muted)',
                            cursor: 'pointer',
                            display: 'block',
                            width: '100%',
                            textAlign: 'center',
                        }}
                    >
                        Log out
                    </button>
                </div>
            </div>

            {/* FAB */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                aria-label="Private case studies unlocked"
                aria-expanded={isOpen}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    height: '44px',
                    padding: '0 20px',
                    background: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '100px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '0.01em',
                    boxShadow: hovered
                        ? '0 8px 24px rgba(22,131,255,0.4)'
                        : '0 4px 16px rgba(22,131,255,0.3)',
                    transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    whiteSpace: 'nowrap',
                }}
            >
                <LockOpen size={15} strokeWidth={2.5} />
                Private unlocked
            </button>
        </div>
    )
}

export default AuthNotice
