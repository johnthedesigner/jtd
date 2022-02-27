import Head from 'next/head'
import Link from 'next/link'

import Layout from '../components/Layout'

const title =
    'About John the Designer – Boston-Area Product Designer John Livornese'
const description =
    'Where have I worked? What kind of work do I do? Answers to these questions and more are just a click away!'

const About = () => {
    const TwitterIcon = () => {
        return (
            <svg
                className="social-icon"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <g clipPath="url(#clip0_138_6716)">
                    <path
                        d="M24 4.55699C23.117 4.94899 22.168 5.21299 21.172 5.33199C22.189 4.72299 22.97 3.75799 23.337 2.60799C22.386 3.17199 21.332 3.58199 20.21 3.80299C19.313 2.84599 18.032 2.24799 16.616 2.24799C13.437 2.24799 11.101 5.21399 11.819 8.29299C7.728 8.08799 4.1 6.12799 1.671 3.14899C0.381 5.36199 1.002 8.25699 3.194 9.72299C2.388 9.69699 1.628 9.47599 0.965 9.10699C0.911 11.388 2.546 13.522 4.914 13.997C4.221 14.185 3.462 14.229 2.69 14.081C3.316 16.037 5.134 17.46 7.29 17.5C5.22 19.123 2.612 19.848 0 19.54C2.179 20.937 4.768 21.752 7.548 21.752C16.69 21.752 21.855 14.031 21.543 7.10599C22.505 6.41099 23.34 5.54399 24 4.55699V4.55699Z"
                        fill="currentColor"
                    />
                </g>
                <defs>
                    <clipPath id="clip0_138_6716">
                        <rect width="24" height="24" fill="white" />
                    </clipPath>
                </defs>
            </svg>
        )
    }

    const LinkedinIcon = () => {
        return (
            <svg
                className="social-icon"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M19 0H5C2.239 0 0 2.239 0 5V19C0 21.761 2.239 24 5 24H19C21.762 24 24 21.761 24 19V5C24 2.239 21.762 0 19 0ZM8 19H5V8H8V19ZM6.5 6.732C5.534 6.732 4.75 5.942 4.75 4.968C4.75 3.994 5.534 3.204 6.5 3.204C7.466 3.204 8.25 3.994 8.25 4.968C8.25 5.942 7.467 6.732 6.5 6.732ZM20 19H17V13.396C17 10.028 13 10.283 13 13.396V19H10V8H13V9.765C14.396 7.179 20 6.988 20 12.241V19Z"
                    fill="currentColor"
                />
            </svg>
        )
    }

    return (
        <main className="about-page">
            <Layout>
                <Head>
                    <title>{title}</title>
                    <meta property="og:title" content={title} key="title" />
                    <meta name="description" content={description} />
                </Head>
                <div className="text-container">
                    <p className="intro-copy__headline">
                        Hi, I’m John Livornese. I work for
                        <a
                            href="http://tableau.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Tableau"
                        >
                            {' '}
                            Tableau
                        </a>
                        /
                        <a
                            href="http://salesforce.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Salesforce"
                        >
                            Salesforce{' '}
                        </a>
                        as Lead User Experience Designer in predictive
                        analytics. I&apos;m formerly the head of product design
                        for
                        <a
                            href="http://luminoso.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Luminoso"
                        >
                            {' '}
                            Luminoso
                        </a>
                        , in Boston, Massachusetts. I also built
                        <a
                            href="https://www.figma.com/community/plugin/849144368519969202/Paletteer"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Paletteer Figma plugin"
                        >
                            {' '}
                            Paletteer
                        </a>
                        , the Figma plugin for generating useful color palettes
                        for digital design.
                        <br />
                        <br />
                        Since you&apos;re here, why not check out some of my
                        <Link href="/work">
                            <a> work</a>
                        </Link>
                        , or you could
                        <a href="mailto:john@johnthedesigner.com">
                            {' '}
                            get in touch
                        </a>
                        . We could talk design or whatever, no pressure.
                        <br />
                        <br />
                        <a
                            href="https://twitter.com/whatwouldjohndo"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <TwitterIcon />
                        </a>
                        <a
                            href="https://www.linkedin.com/in/johnlivornese/"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <LinkedinIcon />
                        </a>
                    </p>
                </div>
            </Layout>
        </main>
    )
}

export default About
