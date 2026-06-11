import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import LogoHero from '@/components/LogoHero'

const TESTIMONIALS = [
    {
        text: '...The best way I can describe working with John is "effortless"... John is collaborative and flexible, while remaining a decisive advocate for his perspective. His sense of humor, positivity, and humbleness uplifts any team he is working with...',
        byline: 'Michelle R.',
        bytitle: 'Director of Product Management',
        byimage: '/endorsements/michelle.jpg',
    },
    {
        text: 'John is one of the most deliberate, thoughtful, and intentional designers I’ve worked with. I was fortunate to collaborate with him on improving our company’s design challenge interview, where he married prior experience with present circumstances to vastly improve the efficacy of our candidate interview process... Any design team would be lucky to have John in their corner!',
        byline: 'Gabe O.',
        bytitle: 'Product Designer',
        byimage: '/endorsements/gabe.jpg',
    },
    {
        text: '...John and I collaborated on two different products (each of us owned one) and it was clear from day one his skillset was unique. He had the innate ability to tackle a problem with scalability and consistency at the forefront, something I believe we really needed across both of our products... I have worked with a number of designers in my career and I would have to say his approach has been one of the most thought out and effective approaches I have seen. Not only did he move fast, every decision was intentional and moved the needle forward...',
        byline: 'Darsh K.',
        bytitle: 'Product Design Manager',
        byimage: '/endorsements/darsh.jpg',
    },
]

function Testimonial({ text, byline, bytitle, byimage }) {
    return (
        <div style={{
            background: 'var(--color-primary)',
            borderRadius: '12px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
        }}>
            <p style={{
                fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                fontSize: '15px',
                fontWeight: 500,
                lineHeight: 1.65,
                color: 'rgba(255,255,255,0.9)',
                margin: 0,
            }}>
                &ldquo;{text}&rdquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {byimage && (
                    <div style={{
                        position: 'relative',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        flexShrink: 0,
                        opacity: 0.9,
                    }}>
                        <Image src={byimage} alt={byline} fill style={{ objectFit: 'cover' }} />
                    </div>
                )}
                <div>
                    <p style={{
                        fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'white',
                        margin: 0,
                        lineHeight: 1.3,
                    }}>
                        {byline}
                    </p>
                    {bytitle && (
                        <p style={{
                            fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                            fontSize: '12px',
                            fontWeight: 400,
                            color: 'rgba(255,255,255,0.7)',
                            margin: 0,
                            lineHeight: 1.3,
                        }}>
                            {bytitle}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

const linkStyle = {
    color: 'var(--color-primary-text)',
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
}

export default function AboutPage() {
    return (
        <>
            <Head>
                <title>About | John the Designer – Boston-Area Product Designer John Livornese</title>
                <meta property="og:title" content="About | John the Designer – Boston-Area Product Designer John Livornese" key="title" />
                <meta name="description" content="John Livornese is a product designer and builder based in the Boston area, currently on the design team at Blitzy. Previously founding designer at ReflexAI and design lead at Tableau." />
                <meta name="og:image" content="/social-img.png" />
            </Head>

            <LogoHero height="30vh" animate={false}>
                <h1 style={{
                    fontFamily: 'var(--font-schmaltzy), Palatino Linotype, serif',
                    fontSize: 'clamp(48px, 8vw, 100px)',
                    fontWeight: 600,
                    lineHeight: 0.95,
                    letterSpacing: '-0.02em',
                    color: 'white',
                    margin: 0,
                    textAlign: 'center',
                    padding: '0 24px',
                }}>
                    About Me
                </h1>
            </LogoHero>

            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Bio */}
                <div style={{
                    maxWidth: '680px',
                    margin: '0 auto',
                    padding: '200px 24px 0',
                }}>
                    <p style={{
                        fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                        fontSize: '18px',
                        lineHeight: 1.7,
                        color: 'var(--color-on-surface-body)',
                        margin: '0 0 24px',
                    }}>
                        I am a creative, strategic product design leader with experience working in difficult
                        problem spaces on teams of all sizes. I love building interfaces that communicate
                        meaning, increase understanding, and make the end user feel smarter. I&apos;m a
                        designer who cares a lot about engineering and product, and I love working with PMs
                        and engineers who care a lot about design.
                    </p>
                    <p style={{
                        fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                        fontSize: '18px',
                        lineHeight: 1.7,
                        color: 'var(--color-on-surface-body)',
                        margin: '0 0 24px',
                    }}>
                        I&apos;ve worked at Fortune 500 companies like{' '}
                        <a href="http://tableau.com" target="_blank" rel="noopener noreferrer" style={linkStyle}>Tableau</a>
                        /
                        <a href="http://salesforce.com" target="_blank" rel="noopener noreferrer" style={linkStyle}>Salesforce</a>
                        {' '}and startups like{' '}
                        <a href="http://luminoso.com" target="_blank" rel="noopener noreferrer" style={linkStyle}>Luminoso</a>
                        {' '}and{' '}
                        <a href="https://www.reflexai.com" target="_blank" rel="noopener noreferrer" style={linkStyle}>ReflexAI</a>
                        . I&apos;ve joined established teams and built from scratch — as founding product
                        designer at ReflexAI I established the design practice and helped to grow the product design
                        team. My work has often been focused on foundational and end-to-end design for new
                        products, building out product design practice and design strategy. Currently I&apos;m on the
                        product design team at{' '}
                        <a href="https://blitzy.com" target="_blank" rel="noopener noreferrer" style={linkStyle}>Blitzy</a>
                        , building tools for autonomous software development at enterprise scale.
                    </p>
                    <p style={{
                        fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                        fontSize: '18px',
                        lineHeight: 1.7,
                        color: 'var(--color-on-surface-body)',
                        margin: 0,
                    }}>
                        Since you&apos;re here, why not check out some of my{' '}
                        <Link href="/work" style={linkStyle}>case studies</Link>, or you could{' '}
                        <Link href="/#contact" style={linkStyle}>get in touch</Link>. We could talk design
                        or whatever, no pressure.
                    </p>
                </div>

                {/* Testimonials */}
                <div style={{
                    maxWidth: '680px',
                    margin: '0 auto',
                    padding: '80px 24px 120px',
                }}>
                    <h2 style={{
                        fontFamily: 'var(--font-fraunces), Georgia, serif',
                        fontSize: 'clamp(28px, 4vw, 42px)',
                        fontWeight: 600,
                        lineHeight: 1.1,
                        letterSpacing: '-0.02em',
                        color: 'var(--color-on-surface)',
                        margin: '0 0 40px',
                    }}>
                        Words from Friends
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {TESTIMONIALS.map((t, i) => (
                            <Testimonial key={i} {...t} />
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}
