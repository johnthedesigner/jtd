import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import CaseStudyCard from '../components/CaseStudyCard'
import { Button } from '../components/ui/button'
import LogoHeroGPU from '../components/LogoHeroGPU'
import SketchLogo from '../components/SketchLogo'
import pages from '../utils/pages.json'
import caseStudies from '../utils/caseStudies'

const { title, description, image } = pages.home

export default function Home() {
    const featuredStudy = caseStudies.find(cs => cs.homepage)

    return (
        <>
            <Head>
                <title>{title}</title>
                <meta property="og:title" content={title} key="title" />
                <meta name="description" content={description} />
                <meta property="og:image" content={image} />
            </Head>

            <LogoHeroGPU height="90vh" animate>
                <div style={{ textAlign: 'center', padding: '0 24px' }}>
                    <div style={{ width: 'min(480px, 80vw)', marginBottom: '32px', overflow: 'hidden', margin: '0 auto 32px' }}>
                        <SketchLogo />
                    </div>
                    <h1 style={{
                        fontFamily: 'var(--font-schmaltzy), Palatino Linotype, serif',
                        fontSize: 'clamp(72px, 14vw, 180px)',
                        fontWeight: 600,
                        lineHeight: 0.95,
                        letterSpacing: '-0.02em',
                        color: 'white',
                        margin: '0 0 24px',
                    }}>
                        <span style={{ display: 'block' }}>John the</span>
                        <span style={{ display: 'block' }}>Designer</span>
                    </h1>
                    <p style={{
                        fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                        fontSize: 'clamp(16px, 2vw, 22px)',
                        fontWeight: 700,
                        lineHeight: 1.4,
                        color: 'rgba(255,255,255,0.9)',
                        maxWidth: '500px',
                        margin: '0 auto',
                    }}>
                        I turn complex design problems into simple and beautiful websites&nbsp;&amp;&nbsp;apps.
                    </p>
                </div>
            </LogoHeroGPU>

            {/* Case studies section */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                    maxWidth: '880px',
                    margin: '0 auto',
                    // The hero's canvas hangs about 240px past its container
                    // so the ragged edge is drawn whole; this clears it.
                    padding: '250px 24px 120px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '32px',
                }}>
                    <h2 style={{
                        fontFamily: 'var(--font-fraunces), Georgia, serif',
                        fontSize: 'clamp(32px, 4vw, 48px)',
                        fontWeight: 600,
                        lineHeight: 1.1,
                        letterSpacing: '-0.02em',
                        color: 'var(--color-on-surface)',
                        margin: 0,
                    }}>
                        Case Studies
                    </h2>
                    {featuredStudy && <CaseStudyCard item={featuredStudy} />}
                    <Button asChild variant="primary" className="w-full">
                        <Link href="/work">View all case studies</Link>
                    </Button>
                </div>
            </div>

            {/* Personal Projects section */}
            <div style={{
                maxWidth: '880px',
                margin: '0 auto',
                padding: '0 24px 120px',
                display: 'flex',
                flexDirection: 'column',
                gap: '32px',
            }}>
                <h2 style={{
                    fontFamily: 'var(--font-fraunces), Georgia, serif',
                    fontSize: 'clamp(32px, 4vw, 48px)',
                    fontWeight: 600,
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                    color: 'var(--color-on-surface)',
                    margin: 0,
                }}>
                    Personal Projects
                </h2>
                {/* subgrid: each card spans 3 rows so logo/text/buttons align across both cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    columnGap: '24px',
                    rowGap: '24px',
                }}>
                    {[
                        {
                            logo: '/sistema-logo.svg',
                            logoWidth: 583,
                            logoHeight: 192,
                            logoAlt: 'Sistema',
                            description: 'A knowledge base and playbook that gives AI agents reference material from real design systems before they generate. The output looks like it was designed, not statistically averaged.',
                            caseStudyHref: '/work/sistema',
                            projectHref: 'https://sistema.johnthedesigner.com',
                            projectLabel: 'Open Sistema',
                        },
                        {
                            logo: '/paletteer-logo.svg',
                            logoWidth: 500,
                            logoHeight: 124,
                            logoAlt: 'Paletteer',
                            description: 'A color palette generator that builds accessible, flexible token ramps from a seed color. Started as an internal tool, now a Figma plugin with 16,000+ users.',
                            caseStudyHref: '/work/colors',
                            projectHref: 'https://www.figma.com/community/plugin/849144368519969202',
                            projectLabel: 'Open Figma Plugin',
                        },
                    ].map(({ logo, logoWidth, logoHeight, logoAlt, description, caseStudyHref, projectHref, projectLabel }) => (
                        <div key={caseStudyHref} style={{
                            gridRow: 'span 3',
                            display: 'grid',
                            gridTemplateRows: 'subgrid',
                            borderRadius: '16px',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-surface-raised)',
                            boxShadow: '0 2px 8px rgba(14,23,32,0.06), 0 0 1px rgba(14,23,32,0.04)',
                            overflow: 'hidden',
                            textAlign: 'center',
                        }}>
                            {/* Row 1 — logo */}
                            <div style={{ padding: '40px 36px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Image
                                    src={logo}
                                    alt={logoAlt}
                                    width={logoWidth}
                                    height={logoHeight}
                                    style={{ height: '40px', width: 'auto' }}
                                />
                            </div>
                            {/* Row 2 — description */}
                            <p style={{
                                fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                                fontSize: '15px',
                                lineHeight: 1.6,
                                color: 'var(--color-on-surface-body)',
                                margin: 0,
                                padding: '0 36px',
                            }}>
                                {description}
                            </p>
                            {/* Row 3 — buttons */}
                            <div style={{ padding: '0 36px 40px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                                <a
                                    href={projectHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        height: '40px',
                                        padding: '0 18px',
                                        background: 'var(--color-primary)',
                                        color: 'white',
                                        fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        letterSpacing: '0.01em',
                                        textDecoration: 'none',
                                        borderRadius: '8px',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {projectLabel}
                                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                        <path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </a>
                                <Link
                                    href={caseStudyHref}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        height: '40px',
                                        padding: '0 18px',
                                        background: 'transparent',
                                        color: 'var(--color-on-surface)',
                                        border: '1px solid var(--color-border-mid)',
                                        fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        letterSpacing: '0.01em',
                                        textDecoration: 'none',
                                        borderRadius: '8px',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    Case study
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
