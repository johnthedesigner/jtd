import Link from 'next/link'

import Layout from '../components/Layout'

const About = () => {
    return (
        <Layout>
            <div className="text-container">
                <p className="intro-copy__headline">
                    Hi, I’m John Livornese. I work for
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
                    as Lead User Experience Designer in predictive analytics.
                    I'm formerly the head of product design for
                    <a
                        href="http://luminoso.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Luminoso"
                    >
                        Luminoso
                    </a>
                    , in Boston, Massachusetts. I also built
                    <a
                        href="https://www.figma.com/community/plugin/849144368519969202/Paletteer"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Paletteer Figma plugin"
                    >
                        Paletteer
                    </a>
                    , the Figma plugin for generating useful color palettes for
                    digital design.
                    <br />
                    <br />
                    Since you're here, why not check out some of my
                    <Link href="/work">
                        <a>work</a>
                    </Link>
                    , or you could
                    <a href="mailto:john@johnthedesigner.com">get in touch</a>.
                    We could talk design or whatever, no pressure.
                </p>
            </div>
        </Layout>
    )
}

export default About
