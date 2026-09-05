import Image from 'next/image'
import LogoHeroGPU from '@/components/LogoHeroGPU'
import { COMPACT_FALLBACK_IMAGES } from '@/components/logo-hero-gpu/constants'

// No bottom rule any more: the field's ragged edge is the boundary. What sits
// behind the field is what shows through once it has torn away, so the image
// below the tear lands on this rather than on pure white. A circle centred on
// the bottom edge keeps the tint under the image and lets the corners go white.

/**
 * Runs the ragged edge down behind the hero image.
 *
 * A fixed fraction of the header does not hold: the image is most of the
 * header on a wide screen and a sliver of it on a phone, so the same fraction
 * lands deep inside the image on desktop and barely clips its top edge at
 * 375px. Measuring against the image keeps the edge where it belongs.
 *
 * `tearEndsAt` names the tear's outer envelope, and coverage fades out well
 * before it, so the aim overshoots the image's bottom to put the *visible*
 * edge around its middle.
 */
const TEAR_OVERSHOOT = 1.3

const tearBehindImage = (container) => {
    const image = container.querySelector('img')
    if (!image) return 0.85
    const box = container.getBoundingClientRect()
    const rect = image.getBoundingClientRect()
    if (!box.height) return 0.85
    const top = (rect.top - box.top) / box.height
    const height = (rect.bottom - rect.top) / box.height
    return Math.min(0.98, Math.max(0.5, top + height * TEAR_OVERSHOOT))
}
const HERO_BACKDROP =
    'radial-gradient(circle 70vw at 50% 100%, var(--color-surface-subtle) 0%, var(--color-surface) 100%)'

const CaseStudyHero = ({ title, subtitle, company, imageSrc, imageWidth, imageHeight, imageAlt, imageMaxWidth }) => (
    <header style={{ background: HERO_BACKDROP }}>
        {/* The field replaces what was a flat primary fill. Its height comes
            from the content, so there is no minimum to set. */}
        <LogoHeroGPU
            height="0px"
            animate={false}
            tearEndsAt={tearBehindImage}
            contentLift={0}
            fallbackImages={COMPACT_FALLBACK_IMAGES}
        >
        <div style={{
            // The bottom value is the gap to the hero image below.
            padding: '80px 48px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '20px',
        }}>
            <span style={{
                fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.9)',
                background: 'rgba(255,255,255,0.18)',
                borderRadius: '100px',
                padding: '5px 14px',
            }}>
                {company}
            </span>
            <h1 style={{
                fontFamily: 'var(--font-schmaltzy), Palatino Linotype, serif',
                fontSize: 'clamp(36px, 5.5vw, 68px)',
                fontWeight: 600,
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                maxWidth: '860px',
                margin: 0,
            }}>
                {title}
            </h1>
            {subtitle && (
                <p style={{
                    fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                    fontSize: '19px',
                    lineHeight: 1.6,
                    color: 'rgba(255,255,255,0.9)',
                    maxWidth: '580px',
                    margin: 0,
                }}>
                    {subtitle}
                </p>
            )}
        </div>

        {imageSrc && (
            <Image
                src={imageSrc}
                width={imageWidth}
                height={imageHeight}
                alt={imageAlt ?? title}
                style={{ width: '100%', height: 'auto', display: 'block', maxWidth: imageMaxWidth ?? undefined, margin: '0 auto', padding: '0 48px' }}
            />
        )}
        </LogoHeroGPU>
    </header>
)

export { CaseStudyHero }
