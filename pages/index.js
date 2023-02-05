import _ from 'lodash'
import Head from 'next/head'
import copy from 'copy-to-clipboard'
import { useEffect, useState } from 'react'

import SketchLogo from '../components/SketchLogo'
import { palettes } from '../utils/colorUtils'

const title = 'John the Designer – Boston-Area Product Designer John Livornese'
const description =
    'This is my "personal website", but you know, not too personal. Check out my work, or get in touch and we can talk product design, engineering or Celtics basketball.'

export default function Home() {
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

    return (
        <>
            <Head>
                <title>{title}</title>
                <meta property="og:title" content={title} key="title" />
                <meta name="description" content={description} />
            </Head>
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
            <div className="home-features">
                <div className="home-features__intro">
                    <h2 className="home-features__title">My Collection</h2>
                    <p className="home-features__intro-text">
                        I turn complicated design problems into simple and
                        beautiful websites & apps.
                    </p>
                </div>
                <div className="home-features__row">
                    <div className="home-features__item"></div>
                    <div className="home-features__item"></div>
                </div>
                <div className="home-features__row">
                    <div className="home-features__item"></div>
                </div>
                <div className="home-features__row">
                    <div className="home-features__item"></div>
                    <div className="home-features__item"></div>
                </div>
                <div className="home-features__row">
                    <div className="home-features__item"></div>
                </div>
                <div className="home-features__row">
                    <div className="home-features__item"></div>
                    <div className="home-features__item"></div>
                </div>
            </div>
            <div className="home-contact">
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
