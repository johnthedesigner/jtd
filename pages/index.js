import _ from 'lodash'
import Head from 'next/head'
import copy from 'copy-to-clipboard'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'

import SketchLogo from '../components/SketchLogo'
import { palettes } from '../utils/colorUtils'
import Header from '../components/Header'
import ResetButton from '../components/RefreshButton'

const title = 'John the Designer – Boston-Area Product Designer John Livornese'
const description =
    'This is my "personal website", but you know, not too personal. Check out my work, or get in touch and we can talk product design, engineering or Celtics basketball.'

export default function Home() {
    const router = useRouter()

    const [emailAddress, setEmailAddress] = useState('')
    const [showCopySuccess, setShowCopySuccess] = useState(false)

    const footerColors = [palettes.red[3], palettes.yellow[2], palettes.blue[3]]

    // Update email address after initial render
    useEffect(() => {
        setEmailAddress('john@johnthedesigner.com')
    })

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

    const Endorsement = ({ palette, text, byline, bytitle, byimage }) => {
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
                        bottom: '-2.5rem',
                    }}
                >
                    <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M20 0H86L56 30L26 60H40L0 90L10 60H0L10 30L20 0Z"
                        fill={palette[2]}
                    />
                </svg>
                <p
                    className="home-features__endorsement-quote"
                    style={{ color: palette[0] }}
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
                        I turn complicated design problems into simple and
                        beautiful websites & apps.
                    </h2>
                </div>
            </div>
            <div id="work" className="home-features">
                <div className="home-features__intro">
                    <h2 className="home-features__title">Past Work</h2>
                    <p className="home-features__intro-text">
                        I turn complicated design problems into simple and
                        beautiful websites & apps.
                    </p>
                </div>
                <div className="home-features__list">
                    <Feature
                        title="Hit the Ground Running"
                        caption="Foundational product design process"
                        thumbnail="/work/thumbnails/upstart.png"
                        logo="/work/logos/upstart.png"
                        flag="Coming Soon"
                    />
                    <Feature
                        title="A Visual Spreadsheet Model"
                        caption="Lorem ipsum dolor sit amet"
                        thumbnail="/work/thumbnails/visual-spreadsheet.png"
                        logo="/work/logos/tableau-salesforce.png"
                        flag="Coming Soon"
                    />
                    <Feature
                        title="The Highlights Page"
                        caption="The cornerstone of our UI"
                        thumbnail="/work/thumbnails/highlights.png"
                        logo="/work/logos/luminoso.png"
                        path="/work/highlights"
                    />
                    <Feature
                        title="Making Great Color Palettes"
                        caption="Which blue should I use?"
                        thumbnail="/work/thumbnails/color-palettes.png"
                        logo="/work/logos/luminoso.png"
                        path="/work/colors"
                    />
                    <Feature
                        title="Answers First"
                        caption="How to eliminate “Analysis Paralysis”"
                        thumbnail="/work/thumbnails/answers-first.png"
                        logo="/work/logos/luminoso.png"
                        path="/work/answers-first"
                    />
                    <Feature
                        title="Comparing Time Periods"
                        caption="What even happened last week?"
                        thumbnail="/work/thumbnails/comparison.png"
                        logo="/work/logos/luminoso.png"
                        path="/work/comparisons"
                    />
                </div>
                <div
                    className="home-features__intro"
                    style={{ marginTop: '4rem' }}
                >
                    <h2 className="home-features__title">Words from Friends</h2>
                </div>
                <div className="home-features__endorsement-list">
                    <Endorsement
                        palette={palettes.yellow}
                        text={
                            '...The best way I can describe working with John is "effortless"... John is collaborative and flexible, while remaining a decisive advocate for his perspective. His sense of humor, positivity, and humbleness uplifts any team he is working with...'
                        }
                        byline={'Michelle Rowe'}
                        bytitle={'Director of Product Managment'}
                        byimage={'/endorsements/michelle.jpg'}
                    />
                    <Endorsement
                        palette={palettes.red}
                        text={'The quick brown fox jumped over the lazy dog'}
                        byline={'@whatwouldjohndo'}
                    />
                    <Endorsement
                        palette={palettes.blue}
                        text={'The quick brown fox jumped over the lazy dog'}
                        byline={'@whatwouldjohndo'}
                    />
                </div>
            </div>
            <div id="contact" className="home-contact">
                <h2 className="home-contact__title">Let's Talk</h2>
                <p className="home-contact__intro-text">
                    Reach out if you’d like to talk about working together, or
                    just talk about design, or like cooking or whatever.
                </p>
                <div className="email-block">
                    <input
                        className="email-block__input"
                        value={emailAddress}
                        onClick={(e) => {
                            e.target.select()
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
            <footer>
                <svg
                    width="100%"
                    height="auto"
                    viewBox="0 0 1729 380"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ display: 'block' }}
                    alt="Large JTD logo in the page footer"
                >
                    <g clip-path="url(#clip0_201_786)">
                        <path
                            d="M642.198 115.729C640.79 107.764 646.124 100.169 654.112 98.7651L1038.3 31.2249C1046.29 29.8206 1053.91 35.1385 1055.32 43.1029L1086.64 220.202C1088.05 228.166 1082.71 235.761 1074.72 237.166L993.141 251.508C989.147 252.21 986.48 256.007 987.184 259.99L1019.78 444.299C1021.19 452.263 1015.86 459.858 1007.87 461.263L830.236 492.49C822.247 493.894 814.63 488.576 813.221 480.612L780.625 296.302C779.921 292.32 776.112 289.661 772.118 290.363L690.534 304.706C682.546 306.11 674.928 300.792 673.519 292.828L642.198 115.729Z"
                            fill={footerColors[0]}
                        />
                        <path
                            d="M413.077 97.6396C412.652 89.5634 418.875 82.6733 426.975 82.25L607.1 72.8384C615.2 72.4152 622.111 78.6191 622.536 86.6952L632.744 280.903C638.807 396.237 549.944 494.634 434.263 500.678C323.514 506.465 228.335 425.508 215.102 317.391C214.119 309.363 220.394 302.449 228.494 302.025L415.952 292.231C420.002 292.019 423.114 288.574 422.901 284.536L413.077 97.6396Z"
                            fill={footerColors[1]}
                        />
                        <path
                            d="M1148.55 52.1367L1340.64 85.9068C1454.72 105.962 1530.89 214.422 1510.78 328.16C1490.66 441.898 1381.88 517.843 1267.8 497.788L1075.7 464.018C1067.71 462.614 1062.38 455.019 1063.79 447.054L1131.53 64.0147C1132.94 56.0503 1140.56 50.7324 1148.55 52.1367Z"
                            fill={footerColors[2]}
                        />
                    </g>
                    <defs>
                        <clipPath id="clip0_201_786">
                            <rect width="1729" height="380" fill="white" />
                        </clipPath>
                    </defs>
                </svg>
            </footer>
        </>
    )
}
