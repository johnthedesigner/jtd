import _ from 'lodash'
import Head from 'next/head'
import SketchLogo from '../components/SketchLogo'

const title = 'John the Designer – Boston-Area Product Designer John Livornese'
const description =
    'This is my "personal website", but you know, not too personal. Check out my work, or get in touch and we can talk product design, engineering or Celtics basketball.'

export default function Home() {
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
        </>
    )
}
