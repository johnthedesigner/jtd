import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const navItems = [
    { label: 'Tokens',     href: '/design' },
    { label: 'Components', href: '/design/components' },
    { label: 'Patterns',   href: '/design/patterns' },
    { label: 'Pages',      href: '/design/pages' },
]

const DesignLayout = ({ children, fullWidth = false }) => {
    const { pathname } = useRouter()

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'D' && e.shiftKey && !e.metaKey && !e.ctrlKey) {
                const current = document.documentElement.getAttribute('data-color-scheme')
                if (current) {
                    document.documentElement.removeAttribute('data-color-scheme')
                } else {
                    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                    document.documentElement.setAttribute('data-color-scheme', systemDark ? 'light' : 'dark')
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const nav = (
        <nav style={{ display: 'flex', gap: '32px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
            {navItems.map(({ label, href }) => {
                const active = href === '/design'
                    ? pathname === '/design'
                    : pathname.startsWith(href)
                return (
                    <Link
                        key={href}
                        href={href}
                        style={{
                            fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                            fontSize: '13px',
                            fontWeight: 700,
                            textDecoration: 'none',
                            color: active ? 'var(--color-primary-text)' : 'var(--color-on-surface-muted)',
                        }}
                    >
                        {label}
                    </Link>
                )
            })}
        </nav>
    )

    if (fullWidth) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface)', color: 'var(--color-on-surface)', fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif' }}>
                <div style={{ maxWidth: '880px', margin: '0 auto', padding: '48px 24px 0' }}>
                    {nav}
                </div>
                {children}
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface)', color: 'var(--color-on-surface)', fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif' }}>
            <div style={{ maxWidth: '880px', margin: '0 auto', padding: '48px 24px 96px' }}>
                {nav}
                <div style={{ marginTop: '48px' }}>
                    {children}
                </div>
            </div>
        </div>
    )
}

export default DesignLayout
