import { useEffect, useState } from 'react'
import { oklch, formatHex } from 'culori'

function shiftL(hex, delta) {
    const c = oklch(hex)
    if (!c) return hex
    return formatHex({ ...c, l: Math.max(0, Math.min(1, c.l + delta)) }) ?? hex
}

const PRIMARY = '#1683ff'
const COLORS = [shiftL(PRIMARY, 0.01), PRIMARY, shiftL(PRIMARY, -0.01)]

const LETTER_PATHS = [
    'M33.748 12.8556C33.6767 12.4504 33.9467 12.0641 34.351 11.9926L53.7972 8.55685C54.2015 8.48541 54.5871 8.75594 54.6584 9.16109L56.2437 18.1702C56.315 18.5753 56.045 18.9617 55.6407 19.0331L51.5113 19.7627C51.3091 19.7985 51.1741 19.9916 51.2098 20.1942L52.8597 29.5701C52.931 29.9752 52.661 30.3616 52.2566 30.433L43.2657 32.0216C42.8614 32.093 42.4758 31.8225 42.4045 31.4173L40.7546 22.0415C40.7189 21.8389 40.5262 21.7036 40.324 21.7393L36.1946 22.4689C35.7902 22.5404 35.4047 22.2698 35.3334 21.8647L33.748 12.8556Z',
    'M22.1508 11.9354C22.1294 11.5246 22.4443 11.1741 22.8543 11.1525L31.9715 10.6737C32.3815 10.6522 32.7313 10.9678 32.7528 11.3786L33.2695 21.2581C33.5763 27.1252 29.0785 32.1307 23.2232 32.4381C17.6175 32.7325 12.8 28.6142 12.1301 23.1142C12.0804 22.7059 12.398 22.3541 12.808 22.3326L22.2964 21.8343C22.5014 21.8236 22.6588 21.6483 22.6481 21.4429L22.1508 11.9354Z',
    'M59.3772 9.62064L69.1003 11.3385C74.8745 12.3588 78.7301 17.8762 77.7119 23.6621C76.6938 29.448 71.1875 33.3113 65.4132 32.2911L55.6901 30.5732C55.2858 30.5018 55.0158 30.1154 55.0871 29.7103L58.516 10.2249C58.5873 9.81973 58.9729 9.5492 59.3772 9.62064Z',
]

const SIZE_MIN = 40
const SIZE_MAX = 800
const STAGGER_MS = 2000
const FADE_MS = 40

// Scale logo count proportionally to the vh value in the height string
function logoCountFromHeight(height, isMobile = true) {
    const LOGO_COUNT_FACTOR = isMobile ? 100 : 500
    const vh = parseFloat(height)
    if (!isNaN(vh)) return Math.round((vh / 100) * LOGO_COUNT_FACTOR)
    return isMobile ? 60 : 200
}

function LogoMark({ color, size }) {
    return (
        <svg
            width={size}
            height={Math.round(size * 41 / 90)}
            viewBox="0 0 90 41"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            {LETTER_PATHS.map((d, i) => (
                <path key={i} d={d} fill={color} />
            ))}
        </svg>
    )
}

export default function LogoHero({ height = '60vh', animate = true, children }) {
    const [logos, setLogos] = useState([])
    const [animating, setAnimating] = useState(false)
    const [bgReady, setBgReady] = useState(false)
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
        setPrefersReducedMotion(mq.matches)
        const handler = (e) => setPrefersReducedMotion(e.matches)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [])

    useEffect(() => {
        const isMobile = window.matchMedia('(max-width: 768px)').matches
        const shouldAnimate = animate && !prefersReducedMotion
        const count = logoCountFromHeight(height, isMobile)
        const items = Array.from({ length: count }, (_, i) => {
            const y = Math.random() * 100
            return {
                id: i,
                x: Math.random() * 100,
                y,
                rotate: (Math.random() - 0.5) * 60,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                size: Math.round(SIZE_MIN + Math.random() * (SIZE_MAX - SIZE_MIN)),
                rotateOffset: (Math.random() - 0.5) * 20,
                delay: shouldAnimate
                    ? Math.pow(y / 100, 2) * STAGGER_MS * 0.75 + Math.random() * STAGGER_MS * 0.25
                    : 0,
            }
        })
        setLogos(items)
        if (shouldAnimate) {
            requestAnimationFrame(() => requestAnimationFrame(() => setAnimating(true)))
            const maxDelay = Math.max(...items.map(l => l.delay))
            const timer = setTimeout(() => setBgReady(true), maxDelay + FADE_MS + 100)
            return () => clearTimeout(timer)
        } else {
            setAnimating(true)
            setBgReady(true)
        }
    }, [height, animate, prefersReducedMotion])

    const shouldAnimate = animate && !prefersReducedMotion

    return (
        <div style={{
            position: 'relative',
            isolation: 'isolate',
            width: '100%',
            minHeight: height,
            overflowX: 'clip',
            background: bgReady ? PRIMARY : 'white',
            transition: shouldAnimate ? `background ${FADE_MS}ms ease-out` : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {logos.map(logo => (
                    <div
                        key={logo.id}
                        style={{
                            position: 'absolute',
                            left: `${logo.x}%`,
                            top: `${logo.y}%`,
                            transform: animating
                                ? `translate(-50%, -50%) rotate(${logo.rotate}deg)`
                                : `translate(-50%, -50%) rotate(${logo.rotate + logo.rotateOffset}deg)`,
                            opacity: animating ? 1 : 0,
                            transition: shouldAnimate
                                ? `opacity ${FADE_MS}ms ease-out ${logo.delay}ms, transform ${FADE_MS}ms ease-out ${logo.delay}ms`
                                : 'none',
                            willChange: shouldAnimate ? 'opacity' : undefined,
                        }}
                    >
                        <LogoMark color={logo.color} size={logo.size} />
                    </div>
                ))}
            </div>

            {children && (
                <div style={{ position: 'relative', zIndex: 10 }}>
                    {children}
                </div>
            )}
        </div>
    )
}
