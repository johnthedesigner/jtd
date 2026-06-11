import Image from 'next/image'

const CaseStudyHero = ({ title, subtitle, company, imageSrc, imageWidth, imageHeight, imageAlt, imageMaxWidth }) => (
    <header style={{ background: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{
            padding: '80px 48px 56px',
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
    </header>
)

export { CaseStudyHero }
