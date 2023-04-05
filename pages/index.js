import _ from 'lodash'
import Head from 'next/head'
import copy from 'copy-to-clipboard'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import Link from 'next/link'

import SketchLogo from '../components/SketchLogo'
import { palettes } from '../utils/colorUtils'
import Header from '../components/Header'
import Footer from '../components/Footer'
import pages from '../utils/pages.json'

const { title, description, image, path } = pages.home

export default function Home() {
    const router = useRouter()

    const [emailAddress, setEmailAddress] = useState('')
    const [showCopySuccess, setShowCopySuccess] = useState(false)

    // Update email address after initial render
    useEffect(() => {
        setEmailAddress('john@johnthedesigner.com')
    }, [])

    // Copy email address to clipboard then trigger success message
    const copyEmail = async () => {
        await copy(emailAddress)
        setShowCopySuccess(true)
        setTimeout(() => {
            setShowCopySuccess(false)
        }, 3000)
    }

    const Feature = ({ title, caption, thumbnail, logo, path, flag }) => {
        const itemStyles = {
            backgroundImage: `url(${thumbnail})`,
            width: '100%',
            aspectRatio: '1',
        }

        const thumbnailClick = () => {
            if (path) {
                router.push(path)
            }
        }

        return (
            <button
                className={`home-features__item ${
                    path ? '' : 'home-features__item--disabled'
                }`}
                style={itemStyles}
                onClick={thumbnailClick}
            >
                <div className="home-features__item-text">
                    {flag && <p className="home-features__item-flag">{flag}</p>}
                    <h3 className="home-features__item-title">{title}</h3>
                    <p className="home-features__item-caption">{caption}</p>
                    {logo && (
                        <p className="home-features__item-logo">
                            <Image
                                src={logo}
                                fill
                                style={{ objectFit: 'contain' }}
                                alt="company logo"
                            />
                        </p>
                    )}
                </div>
            </button>
        )
    }

    const Endorsement = ({ palette, text, byline, bytitle, byimage, size }) => {
        return (
            <div
                className="home-features__endorsement"
                style={{ background: palette[2] }}
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
                        fill={palette[2]}
                    />
                </svg>
                <p
                    className="home-features__endorsement-quote"
                    style={{ color: 'white', fontSize: size }}
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
                            style={{ color: palette[6] }}
                        >
                            {byline}
                        </p>
                        {bytitle && (
                            <p
                                className="home-features__endorsement-bytitle"
                                style={{ color: palette[6] }}
                            >
                                {bytitle}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <Head>
                <title>{title}</title>
                <meta property="og:title" content={title} key="title" />
                <meta name="description" content={description} />
                <meta property="og:image" content={image} />
            </Head>
            <Header />
            <div className="home-hero">
                <div className="home-hero__logo">
                    <SketchLogo />
                </div>
                <div className="home-hero__text">
                    <h1 className="home-hero__title">
                        <span className="home-hero__title-top">John the</span>
                        <span className="home-hero__title-bottom">
                            Designer
                        </span>
                    </h1>
                    <h2 className="home-hero__tag-line">
                        I turn complex design problems into simple and beautiful
                        websites & apps.
                    </h2>
                </div>
            </div>
            <div className="home-features">
                <div
                    id="about"
                    className="home-features__intro"
                    style={{ marginTop: '4rem' }}
                >
                    <h2 className="home-features__title">About Me</h2>
                </div>
                <div className="about-me">
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
                <div id="work" className="home-features__intro">
                    <h2 className="home-features__title">Past Work</h2>
                    {/* <p className="home-features__intro-text">
                        I turn complicated design problems into simple and
                        beautiful websites & apps.
                    </p> */}
                </div>
                <div className="home-features__list">
                    <Feature
                        title="Answers First"
                        caption="How to eliminate “Analysis Paralysis”"
                        thumbnail="/work/thumbnails/answers-first.png"
                        logo="/work/logos/luminoso.png"
                        path="/work/answers-first"
                    />
                    <Feature
                        title="Making Great Color Palettes"
                        caption="Which blue should I use?"
                        thumbnail="/work/thumbnails/color-palettes.png"
                        logo="/work/logos/luminoso.png"
                        path="/work/colors"
                    />
                    <Feature
                        title="Tableau Scenario Planner"
                        caption="Planning Better Together"
                        thumbnail="/work/thumbnails/visual-spreadsheet.png"
                        logo="/work/logos/tableau-salesforce.png"
                        path="/work/scenario-planning"
                    />
                    {/* <Feature
                        title="Hit the Ground Running"
                        caption="Foundational product design process"
                        thumbnail="/work/thumbnails/upstart.png"
                        logo="/work/logos/upstart.png"
                        flag="Just Added"
                        path="/work/design-foundation"
                    />
                    <Feature
                        title="The Highlights Page"
                        caption="The cornerstone of our UI"
                        thumbnail="/work/thumbnails/highlights.png"
                        logo="/work/logos/luminoso.png"
                        path="/work/highlights"
                    />
                    <Feature
                        title="Comparing Time Periods"
                        caption="What even happened last week?"
                        thumbnail="/work/thumbnails/comparison.png"
                        logo="/work/logos/luminoso.png"
                        path="/work/comparisons"
                    /> */}
                </div>
                <div
                    className="home-features__intro"
                    style={{ marginTop: '4rem' }}
                >
                    <h2 className="home-features__title">Words from Friends</h2>
                </div>
                <div className="home-features__endorsement-list">
                    <Endorsement
                        palette={palettes.purple}
                        text={
                            '...The best way I can describe working with John is "effortless"... John is collaborative and flexible, while remaining a decisive advocate for his perspective. His sense of humor, positivity, and humbleness uplifts any team he is working with...'
                        }
                        byline={'Michelle R.'}
                        bytitle={'Director of Product Managment'}
                        byimage={'/endorsements/michelle.jpg'}
                        size={'.75em'}
                    />
                    <Endorsement
                        palette={palettes.teal}
                        text={
                            'John is one of the most deliberate, thoughtful, and intentional designers I’ve worked with. I was fortunate to collaborate with him on improving our company’s design challenge interview, where he married prior experience with present circumstances to vastly improve the efficacy of our candidate interview process... Any design team would be lucky to have John in their corner!'
                        }
                        byline={'@Gabe O.'}
                        bytitle={'Product Designer'}
                        byimage={'/endorsements/gabe.jpg'}
                        size={'.675em'}
                    />
                    <Endorsement
                        palette={palettes.blue}
                        text={
                            'John was my manager at Luminoso for just shy of three years. In that time, he was an insightful voice of leadership for the broader team and was clearly interested in empowering me in my career. Whenever I had questions or concerns about a project, he was eager to help me untangle the issue. If I had a new product idea, or a concern, he was always supportive and willing to listen...'
                        }
                        byline={'Steph B.'}
                        bytitle={'Senior Product Designer'}
                        byimage={'/endorsements/steph.jpg'}
                        size={'.675em'}
                    />
                </div>
            </div>
            <div id="contact" className="home-contact">
                <h2 className="home-contact__title">Let's Talk</h2>
                <p className="home-contact__intro-text">
                    Reach out if you’d like to talk about working together, or
                    just talk about design.
                </p>
                <div className="email-block">
                    <input
                        className="email-block__input"
                        value={emailAddress}
                        onClick={(e) => {
                            e.target.select()
                        }}
                        onChange={() => {
                            null
                        }}
                        style={{
                            borderColor: showCopySuccess
                                ? '#6FCF97'
                                : '#5F9DF2',
                        }}
                    />
                    <button
                        className="email-block__button"
                        onClick={copyEmail}
                        style={{
                            background: showCopySuccess ? '#6FCF97' : '#5F9DF2',
                        }}
                        disabled={showCopySuccess}
                    >
                        {showCopySuccess
                            ? 'Copied to Clipboard!'
                            : 'Copy Email Address'}
                    </button>
                </div>
            </div>
            <Footer />
        </>
    )
}
