import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Menu, X } from 'lucide-react'
import { LinkedinIcon } from './SocialIcons'
import MenuBackdrop from './MenuBackdrop'

const NAV_LINKS = [
    { label: 'Work',      path: '/work' },
    { label: 'About',     path: '/about' },
    { label: 'My Résumé', path: '/John_L_Res_202507.pdf', external: true },
]

const HEADER_HEIGHT = 60

/** How long the menu itself takes to fade, either way. */
const MENU_FADE_MS = 100

/** Each menu item waits this much longer than the one above it. */
const MENU_ITEM_STAGGER_MS = 70
const MENU_ITEM_FADE_MS = 240

const Logo = () => (
    <svg width="72" height="33" viewBox="0 0 90 41" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="0.125" width="89.75" height="41" rx="6" fill="var(--color-primary)" />
        <path d="M33.748 12.8556C33.6767 12.4504 33.9467 12.0641 34.351 11.9926L53.7972 8.55685C54.2015 8.48541 54.5871 8.75594 54.6584 9.16109L56.2437 18.1702C56.315 18.5753 56.045 18.9617 55.6407 19.0331L51.5113 19.7627C51.3091 19.7985 51.1741 19.9916 51.2098 20.1942L52.8597 29.5701C52.931 29.9752 52.661 30.3616 52.2566 30.433L43.2657 32.0216C42.8614 32.093 42.4758 31.8225 42.4045 31.4173L40.7546 22.0415C40.7189 21.8389 40.5262 21.7036 40.324 21.7393L36.1946 22.4689C35.7902 22.5404 35.4047 22.2698 35.3334 21.8647L33.748 12.8556Z" fill="white" />
        <path d="M22.1508 11.9354C22.1294 11.5246 22.4443 11.1741 22.8543 11.1525L31.9715 10.6737C32.3815 10.6522 32.7313 10.9678 32.7528 11.3786L33.2695 21.2581C33.5763 27.1252 29.0785 32.1307 23.2232 32.4381C17.6175 32.7325 12.8 28.6142 12.1301 23.1142C12.0804 22.7059 12.398 22.3541 12.808 22.3326L22.2964 21.8343C22.5014 21.8236 22.6588 21.6483 22.6481 21.4429L22.1508 11.9354Z" fill="white" />
        <path d="M59.3772 9.62064L69.1003 11.3385C74.8745 12.3588 78.7301 17.8762 77.7119 23.6621C76.6938 29.448 71.1875 33.3113 65.4132 32.2911L55.6901 30.5732C55.2858 30.5018 55.0158 30.1154 55.0871 29.7103L58.516 10.2249C58.5873 9.81973 58.9729 9.5492 59.3772 9.62064Z" fill="white" />
    </svg>
)

const Header = () => {
    // closed -> opening -> open -> closing -> leaving -> closed. Opening fades
    // the menu in while the backdrop field builds; closing runs the field back
    // out first and only then fades the menu away.
    const [menuPhase, setMenuPhase] = useState('closed')
    // The panel and the items fade on their own schedules: the items lead the
    // way in and out, the panel covers the gap at each end.
    const [chromeVisible, setChromeVisible] = useState(false)
    const [itemsVisible, setItemsVisible] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const { pathname } = useRouter()

    const mobileOpen = menuPhase !== 'closed'

    // A route change should not play the whole close sequence.
    useEffect(() => {
        setMenuPhase('closed')
        setChromeVisible(false)
        setItemsVisible(false)
    }, [pathname])

    const closeMenu = useCallback(() => {
        setMenuPhase((phase) => {
            if (phase !== 'opening' && phase !== 'open') return phase
            // Items leave first, in reverse, while the field runs backwards.
            setItemsVisible(false)
            return 'closing'
        })
    }, [])

    const toggleMenu = () => {
        if (menuPhase === 'closed') {
            setChromeVisible(false)
            setItemsVisible(false)
            setMenuPhase('opening')
        } else {
            closeMenu()
        }
    }

    // The backdrop reports when it can draw; the menu starts its fade then, so
    // the two arrive together rather than the text landing on bare page.
    const handleBackdropReady = useCallback(() => {
        setChromeVisible(true)
        setItemsVisible(true)
    }, [])

    const handleBackdropDone = useCallback((which) => {
        if (which === 'in') setMenuPhase((phase) => (phase === 'opening' ? 'open' : phase))
        else if (which === 'out') {
            setMenuPhase((phase) => (phase === 'closing' ? 'leaving' : phase))
            setChromeVisible(false)
        }
    }, [])

    useEffect(() => {
        if (menuPhase !== 'leaving') return
        const id = setTimeout(() => setMenuPhase('closed'), MENU_FADE_MS)
        return () => clearTimeout(id)
    }, [menuPhase])

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10)
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [mobileOpen])

    const isActive = (path) =>
        path === '/work' ? pathname.startsWith('/work') : pathname === path

    // Items arrive top to bottom and leave bottom to top.
    const MENU_ITEM_COUNT = NAV_LINKS.length + 1
    const menuItemStyle = (index) => {
        const delay =
            (itemsVisible ? index : MENU_ITEM_COUNT - 1 - index) * MENU_ITEM_STAGGER_MS
        return {
            opacity: itemsVisible ? 1 : 0,
            transform: itemsVisible ? 'none' : 'translateY(6px)',
            transition:
                `opacity ${MENU_ITEM_FADE_MS}ms ease ${delay}ms, ` +
                `transform ${MENU_ITEM_FADE_MS}ms ease ${delay}ms`,
        }
    }

    const desktopLinkStyle = (path) => ({
        fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
        fontSize: '13px',
        fontWeight: 700,
        letterSpacing: '0.01em',
        textDecoration: 'none',
        color: scrolled
            ? (isActive(path) ? 'var(--color-primary-text)' : 'var(--color-on-surface-muted)')
            : 'rgba(255,255,255,0.9)',
        transition: 'color 0.25s ease',
    })

    return (
        <>
            <header style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                height: `${HEADER_HEIGHT}px`,
                background: scrolled ? 'rgba(255,255,255,0.35)' : 'transparent',
                backdropFilter: scrolled ? 'blur(12px)' : 'none',
                WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
                transition: 'background 0.25s ease, backdrop-filter 0.25s ease',
            }}>
                <nav style={{
                    padding: '0 24px',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <Link href="/" aria-label="John the Designer — Home" style={{ display: 'flex', color: 'var(--color-on-surface)', textDecoration: 'none' }}>
                        <Logo />
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-8">
                        {NAV_LINKS.map(({ label, path, external }) => (
                            <Link
                                key={path}
                                href={path}
                                target={external ? '_blank' : undefined}
                                rel={external ? 'noopener noreferrer' : undefined}
                                style={desktopLinkStyle(path)}
                            >
                                {label}
                            </Link>
                        ))}
                        <Link
                            href="https://www.linkedin.com/in/johnlivornese/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="John Livornese on LinkedIn"
                            style={{ display: 'flex', color: scrolled ? 'var(--color-on-surface-muted)' : 'rgba(255,255,255,0.9)', transition: 'color 0.25s ease' }}
                        >
                            <LinkedinIcon color="currentcolor" />
                        </Link>
                    </div>

                    {/* Mobile toggle */}
                    <button
                        className="flex md:hidden items-center justify-center"
                        style={{
                            width: '44px',
                            height: '44px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            // The menu panel is near-white, so a white glyph
                            // would vanish on it.
                            color: mobileOpen || scrolled ? 'var(--color-on-surface)' : 'rgba(255,255,255,0.9)',
                            borderRadius: '6px',
                            padding: 0,
                        }}
                        onClick={toggleMenu}
                        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </nav>
            </header>

            {/* Mobile menu */}
            {mobileOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 49,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: `${HEADER_HEIGHT}px 24px 24px`,
                        opacity: chromeVisible ? 1 : 0,
                        transition: `opacity ${MENU_FADE_MS}ms ease`,
                    }}
                >
                    <MenuBackdrop
                        phase={menuPhase === 'closing' || menuPhase === 'leaving' ? 'out' : 'in'}
                        onReady={handleBackdropReady}
                        onPhaseDone={handleBackdropDone}
                    />

                    {NAV_LINKS.map(({ label, path, external }, index) => (
                        <Link
                            key={path}
                            href={path}
                            target={external ? '_blank' : undefined}
                            rel={external ? 'noopener noreferrer' : undefined}
                            onClick={closeMenu}
                            style={{
                                ...menuItemStyle(index),
                                position: 'relative',
                                fontFamily: 'var(--font-fraunces), Georgia, serif',
                                fontSize: '40px',
                                fontWeight: 600,
                                lineHeight: 1.15,
                                letterSpacing: '-0.015em',
                                textDecoration: 'none',
                                color: 'var(--color-on-surface)',
                                padding: '10px 0',
                            }}
                        >
                            {label}
                        </Link>
                    ))}

                    <Link
                        href="https://www.linkedin.com/in/johnlivornese/"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="John Livornese on LinkedIn"
                        style={{
                            ...menuItemStyle(NAV_LINKS.length),
                            position: 'relative',
                            display: 'flex',
                            marginTop: '16px',
                            color: 'var(--color-on-surface)',
                        }}
                    >
                        <LinkedinIcon color="currentcolor" />
                    </Link>
                </div>
            )}

        </>
    )
}

export default Header
