import React from 'react'

import Layout from '../../components/layout'
// import SEO from '../../components/seo'

const Highlights = () => (
    <Layout showHeader={true}>
        {/* <SEO title="The Highlights Page" /> */}
        <div id="main">
            <div className="intro">
                <div className="intro-copy">
                    <h1 className="intro-copy__superhead">
                        The Highlights Page
                    </h1>
                    <h2 className="intro-copy__headline">
                        The Highlights page is the new homepage for projects in
                        our flagship application. It&apos;s the cornerstone of
                        our new &quot;Answers first&quot; strategy.
                    </h2>
                </div>
            </div>
            <div className="work__copy">
                <h3>What was the problem?</h3>
                <p>
                    Customer feedback and interviews with users showed that
                    there were a number of important parts of our users&apos;
                    workflow that we simply didn&apos;t support in our flagship
                    application. To compound the issue, our users sometimes felt
                    paralyzed after creating a project. Despite training, they
                    just didn&apos;t know where to begin with their analysis
                    process. With a growing team setting more ambitious goals,
                    we needed a way to add a number of new features and at the
                    same time, provide even better guidance despite growing
                    complexity.
                </p>
                <h3>How did we approach this design?</h3>
                <p>
                    An AI-powered text analytics application is always at risk
                    of being too complicated and arcane for some users, and
                    certainly we had gotten that feedback before. Now we were
                    looking to add a number of new features to our UI, and
                    adding more options could only compound the problem without
                    some additional guidance for the user
                </p>
                <p>
                    The Highlights feature involved a number of newly designed
                    visualizations and complex interactions. This design process
                    involved interactive prototyping and usability testing from
                    an early stage because, without real data and real users we
                    could only guess if the design was successful.
                </p>
            </div>
            <div className="work__art-container">
                <div className="figma-iframe--large">
                    <iframe
                        title="Full page Highlights mockup"
                        style={{ border: 'none' }}
                        width="100%"
                        src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FVcKqDhujLs16b1wQrcgR7L%2FHighlights-full-page-mock%3Fnode-id%3D1%253A645"
                        allowFullScreen
                    ></iframe>
                    <h4 className="work__art-caption">
                        Full-page mockup of the highlights page
                    </h4>
                </div>
            </div>
            <div className="work__art-container">
                <div className="figma-iframe--small">
                    <iframe
                        title="Highlights card showing the most prevalent concepts"
                        style={{ border: 'none' }}
                        width="100%"
                        src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2Fx2TwRADK9HAjzXzXCFVuVA%2FHighlights-cards%3Fnode-id%3D2%253A310"
                        allowFullScreen
                    ></iframe>
                    <h4 className="work__art-caption">
                        A mockup of a Highlights card showing the most prevalent
                        concepts in a project
                    </h4>
                </div>
                <div className="figma-iframe--small">
                    <iframe
                        title="Highlights card showing concepts that have driven down a product's star ratings"
                        style={{ border: 'none' }}
                        width="100%"
                        src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2Fx2TwRADK9HAjzXzXCFVuVA%2FHighlights-cards%3Fnode-id%3D2%253A311"
                        allowFullScreen
                    ></iframe>
                    <h4 className="work__art-caption">
                        A mockup of a Highlights card showing concepts that are
                        driving down a product&apos;s star ratings
                    </h4>
                </div>
            </div>
            <div className="work__copy">
                <h3>What did we learn?</h3>
                <p>
                    Our users valued the high-level visualizations of their
                    project data and how quickly and easily they can get to this
                    output. But what we didn&apos;t anticipate was that the
                    plain-language captions on our highlights cards would be far
                    and away the greatest improvement for our users, explaining
                    the value of our features in and guiding users to the
                    correct tool to look deeper.
                </p>
            </div>
        </div>
    </Layout>
)

export default Highlights
