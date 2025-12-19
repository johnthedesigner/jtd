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
import WorkItem from '../components/WorkItem'
import caseStudies from '../utils/caseStudies'

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
                className={`home-features__item ${path ? '' : 'home-features__item--disabled'
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
                style={{ background: palette[1].value }}
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
                        fill={palette[1].value}
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
                            style={{ color: palette[6].value }}
                        >
                            {byline}
                        </p>
                        {bytitle && (
                            <p
                                className="home-features__endorsement-bytitle"
                                style={{ color: palette[6].value }}
                            >
                                {bytitle}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    const pageStyles = {
        backgroundImage: "url('/logobg.svg')",
        backgroundSize: "110% auto",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center 10rem",
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
            <div className="home-hero" style={pageStyles}>
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
            <div style={{ padding: '4rem 0 6rem', margin: '0 auto', width: '50rem', maxWidth: '90%' }}>
                <h3 style={{ fontFamily: 'var(--blackletter-font)', fontSize: '3rem', fontWeight: 700, lineHeight: '1.5', margin: '1rem 2rem', textAlign: 'center' }}>Case Studies</h3>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}>
                    <WorkItem
                        item={_.find(caseStudies, { homepage: true })} />
                    <div className="case-studies-link" onClick={() => router.push('/work')}>
                        <span className="case-studies-link__count">+3 more</span>
                        <svg className="case-studies-link__divider" width="100%" height="3" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <line x1="0" y1="1.5" x2="100%" y2="1.5" stroke="white" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        <span className="case-studies-link__label">Go to the Case Studies</span>
                    </div>
                </div>
            </div>
        </>
    )
}
