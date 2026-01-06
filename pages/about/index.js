import Link from 'next/link';
import Image from 'next/image';

import { palettes } from '../../utils/colorUtils';
import SimpleHeader from '../../components/SimpleHeader';

const Endorsement = ({ palette, text, byline, bytitle, byimage, size }) => {
    return (
        <div
            className="home-features__endorsement"
            style={{ background: palette[4].value }}
        >
            <svg
                width="86"
                height="90"
                viewBox="0 0 86 90"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    position: 'absolute',
                    right: '2rem',
                    bottom: '-2.75rem',
                }}
            >
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M20 0H86L56 30L26 60H40L0 90L10 60H0L10 30L20 0Z"
                    fill={palette[4].value}
                />
            </svg>
            <p
                className="home-features__endorsement-quote"
                style={{ color: 'white', fontSize: size, fontWeight: 'bold' }}
            >
                {text}
            </p>
            <div className="home-features__endorsement-footer">
                {byimage && (
                    <div className="home-features__endorsement-avatar">
                        <Image
                            src={byimage}
                            alt={byline}
                            className="home-features__endorsement-image"
                            fill
                        />
                    </div>
                )}
                <div className="home-features__endorsement-footer-text">
                    <p
                        className="home-features__endorsement-byline"
                        style={{ color: 'white', fontWeight: 'bold' }}
                    >
                        {byline}
                    </p>
                    {bytitle && (
                        <p
                            className="home-features__endorsement-bytitle"
                            style={{ color: 'white' }}
                        >
                            {bytitle}
                        </p>
                    )}
                </div>
            </div >
        </div >
    )
}

const AboutPage = () => {
    return (
        <>
            <SimpleHeader title="About Me" />
            <div className="page-body" style={{ padding: "0 4rem", margin: "0 auto", maxWidth: "800px" }}>
                <div className="about-me">
                    <div style={{ margin: '2rem', border: `4px solid ${palettes['navy-blue'][5].value}`, borderRadius: '.5rem', overflow: 'hidden' }}>
                        <img src="https://placehold.co/600x400" alt="John Livornese" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    </div>
                    <p className="about-me__paragraph">
                        Hi! I’m John Livornese. I am a creative, strategic,
                        product design leader with experience working in
                        difficult problem spaces on teams of all sizes. I love
                        building interfaces that communicate meaning, increase
                        understanding, and make the end user feel smarter. My
                        dream job is a place where people are proud of what
                        they’re building and they have fun doing it. I’m a
                        designer who cares a lot about engineering and product,
                        and I love working with PMs and engineers who care a lot
                        about design.
                    </p>
                    <p className="about-me__paragraph">
                        I’ve worked at both Fortune 500 companies like{' '}
                        <a
                            href="http://tableau.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Tableau"
                        >
                            Tableau
                        </a>
                        /
                        <a
                            href="http://salesforce.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Salesforce"
                        >
                            Salesforce
                        </a>
                        , and small startups like{' '}
                        <a
                            href="http://luminoso.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Luminoso"
                        >
                            Luminoso
                        </a>
                        . Most recently I was Principal Product Designer at
                        Upstart, where I was brought in to design a brand new
                        product. I have joined established teams and built teams
                        from the ground up. My work has often been focused on
                        foundational and end-to-end design for new products,
                        building out product design practice and design
                        strategy.
                    </p>
                    <p className="about-me__paragraph">
                        Since you&apos;re here, why not check out some of my{' '}
                        <Link href="/#work">work</Link>, or you could&nbsp;
                        <Link href="/#contact">get in touch</Link>. We could
                        talk design or whatever, no pressure.
                    </p>
                </div>
            </div>
            <div
                className="home-features__intro"
                style={{ marginTop: '4rem' }}
            >
                <h2 className="home-features__title">Words from Friends</h2>
            </div>
            <div className="home-features__endorsement-list">
                <Endorsement
                    palette={palettes['navy-blue']}
                    text={
                        '...The best way I can describe working with John is "effortless"... John is collaborative and flexible, while remaining a decisive advocate for his perspective. His sense of humor, positivity, and humbleness uplifts any team he is working with...'
                    }
                    byline={'Michelle R.'}
                    bytitle={'Director of Product Managment'}
                    byimage={'/endorsements/michelle.jpg'}
                    size={'.75em'}
                />
                <Endorsement
                    palette={palettes['caribbean-green']}
                    text={
                        'John is one of the most deliberate, thoughtful, and intentional designers I’ve worked with. I was fortunate to collaborate with him on improving our company’s design challenge interview, where he married prior experience with present circumstances to vastly improve the efficacy of our candidate interview process... Any design team would be lucky to have John in their corner!'
                    }
                    byline={'@Gabe O.'}
                    bytitle={'Product Designer'}
                    byimage={'/endorsements/gabe.jpg'}
                    size={'.675em'}
                />
                <Endorsement
                    palette={palettes['sunset-red']}
                    text={
                        '...John and I collaborated on two different products (each of us owned one) and it was clear from day one his skillset was unique. He had the innate ability to tackle a problem with scalability and consistency at the forefront, something I believe we really needed across both of our products... I have worked with a number of designers in my career and I would have to say his approach has been one of the most thought out and effective approaches I have seen. Not only did he move fast, every decision was intentional and moved the needle forward...'
                    }
                    byline={'Darsh K.'}
                    bytitle={'Product Design Manager'}
                    byimage={'/endorsements/darsh.jpg'}
                    size={'.6125em'}
                />            </div>
        </>
    );
}

export default AboutPage;