import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import caseStudies from '@/utils/caseStudies'

const NextCaseStudy = ({ current, nextHref }) => {
    const idx = caseStudies.findIndex(cs => cs.href === current)
    if (idx === -1) return null
    const next = nextHref
        ? caseStudies.find(cs => cs.href === nextHref)
        : caseStudies[(idx + 1) % caseStudies.length]
    if (!next) return null

    return (
        <Link href={next.href} style={{ display: 'block', textDecoration: 'none' }}>
            <article
                className="flex flex-col md:flex-row items-end"
                style={{
                    background: 'var(--color-primary)',
                    overflow: 'hidden',
                    borderRadius: '8px',
                }}
            >
                <div style={{
                    flex: 1,
                    padding: '64px 48px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                }}>
                    <p style={{
                        fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.45)',
                        margin: 0,
                    }}>
                        Next case study
                    </p>
                    <span style={{
                        alignSelf: 'flex-start',
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
                        {next.company}
                    </span>
                    <h2 style={{
                        fontFamily: 'var(--font-fraunces), Georgia, serif',
                        fontSize: 'clamp(28px, 4vw, 48px)',
                        fontWeight: 600,
                        lineHeight: 1.1,
                        letterSpacing: '-0.02em',
                        color: '#ffffff',
                        margin: 0,
                    }}>
                        {next.title}
                    </h2>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '8px',
                        fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.85)',
                    }}>
                        View Case Study <ArrowRight size={16} />
                    </div>
                </div>

                <div
                    className="w-full md:w-[45%] flex-shrink-0"
                    style={{ maxHeight: '360px', overflow: 'hidden' }}
                >
                    <Image
                        src={next.imageSharp}
                        alt={`${next.title} case study preview`}
                        width={900}
                        height={1200}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center bottom' }}
                    />
                </div>
            </article>
        </Link>
    )
}

export { NextCaseStudy }
