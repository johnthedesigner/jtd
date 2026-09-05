import Head from 'next/head'
import CaseStudyCard from '@/components/CaseStudyCard'
import LogoHeroGPU from '@/components/LogoHeroGPU'
import { COMPACT_FALLBACK_IMAGES } from '@/components/logo-hero-gpu/constants'
import caseStudies from '@/utils/caseStudies'

export default function WorkIndex() {
    return (
        <>
            <Head>
                <title>Case Studies | John the Designer – Boston-Area Product Designer John Livornese</title>
                <meta property="og:title" content="Case Studies | John the Designer – Boston-Area Product Designer John Livornese" key="title" />
                <meta name="description" content="A selection of product design case studies from John Livornese, covering design systems, data visualization, scenario planning, and more." />
                <meta name="og:image" content="/social-img.png" />
            </Head>

            <main style={{ display: 'flex', flexDirection: 'column' }}>
                <LogoHeroGPU
                height="42vh"
                animate={false}
                tearEndsAt={0.9}
                contentLift={0.06}
                fallbackImages={COMPACT_FALLBACK_IMAGES}
            >
                    <h1 style={{
                        fontFamily: 'var(--font-schmaltzy), Palatino Linotype, serif',
                        fontSize: 'clamp(40px, 6vw, 80px)',
                        fontWeight: 600,
                        lineHeight: 0.95,
                        letterSpacing: '-0.02em',
                        color: 'white',
                        margin: 0,
                        textAlign: 'center',
                        padding: '0 24px',
                    }}>
                        Case Studies
                    </h1>
                </LogoHeroGPU>

                <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                    maxWidth: '880px',
                    margin: '0 auto',
                    width: '100%',
                    // Clears the hero's ragged edge, which tapers off just
                    // inside the hero and needs room before the first card.
                    padding: '48px 24px 120px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '32px',
                }}>
                    {caseStudies.map(cs => (
                        <CaseStudyCard key={cs.href} item={cs} />
                    ))}
                </div>
                </div>
            </main>
        </>
    )
}
