import Head from 'next/head'
import CaseStudyCard from '@/components/CaseStudyCard'
import LogoHero from '@/components/LogoHero'
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
                <LogoHero height="20vh" animate={false}>
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
                </LogoHero>

                <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                    maxWidth: '880px',
                    margin: '0 auto',
                    width: '100%',
                    padding: '0 24px 120px',
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
