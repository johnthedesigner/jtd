import Link from 'next/link'

import Layout from '../../components/Layout'

const AnswersFirst = () => {
    return (
        <Layout>
            <div id="main">
                <div className="intro">
                    <div className="intro-copy">
                        <h1 className="intro-copy__superhead">
                            "Answers First"
                        </h1>
                        <h2 className="intro-copy__headline">
                            Our app needed major additions, but how could we
                            keep or even improve our usability as we added new
                            features?
                        </h2>
                    </div>
                </div>
                <div className="work__copy">
                    <h3>What was the problem?</h3>
                    <p>
                        More than anything, what our users want is not an
                        additional metric, or new type of graph. What they want
                        are real answers to business questions. Now, in order to
                        answer those questions, we had work to do. We needed a
                        broader array of analysis tools in the application, and
                        we needed new ways to draw connections between our
                        analysis outputs and our users' business goals.
                    </p>
                    <h3>How did we approach this design?</h3>
                    <p>
                        The solution I proposed is called "Answers First". We
                        would lean into our technology's strength, producing
                        meaningful results within minutes from thousands or
                        tens-of-thousands or even hundres of thousands of
                        documents. We would build a new project view called{' '}
                        <Link href="/work/highlights">
                            <a>Highlights</a>
                        </Link>{' '}
                        that would present high-level insights (This is where
                        you get "Answers First"), then we would guide users to
                        our more in-depth tools to build off of these
                        foundational discoveries.
                    </p>
                </div>
                <div className="work__art-container">
                    <div className="figma-iframe--large">
                        <iframe
                            title="Board meeting slides explaining 'Answers First'"
                            style={{ border: 'none' }}
                            width="100%"
                            src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2Fv5jmrmjss7Yi399fk4GJew%2FAnswers-first-slides"
                            allowFullScreen
                        ></iframe>
                        <h4 className="work__art-caption">
                            Slides from an early board presentation explaining
                            the "Answers First" approach
                        </h4>
                    </div>
                </div>
                <div className="work__art-container">
                    <div className="figma-iframe--small">
                        <iframe
                            title="Board meeting slides, highlights page"
                            style={{ border: 'none' }}
                            width="100%"
                            src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2F1RIMxkNrRAs3rCiejN0XkN%2FAnswers-first-view-examples%3Fnode-id%3D2%253A31"
                            allowFullScreen
                        ></iframe>
                        <h4 className="work__art-caption">
                            A slide from an early board presentation showing a
                            Highlights page concept
                        </h4>
                    </div>
                    <div className="figma-iframe--small">
                        <iframe
                            title="mockup from a board meeting"
                            style={{ border: 'none' }}
                            width="100%"
                            src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2F1RIMxkNrRAs3rCiejN0XkN%2FAnswers-first-view-examples%3Fnode-id%3D2%253A6"
                            allowFullScreen
                        ></iframe>
                        <h4 className="work__art-caption">
                            A slide from an early board presentation showing an
                            in-depth analysis view
                        </h4>
                    </div>
                </div>
                <div className="work__art-container">
                    <div className="figma-iframe--large">
                        <iframe
                            title="Highlights feature at initial release time"
                            style={{ border: 'none' }}
                            width="100%"
                            src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FVcKqDhujLs16b1wQrcgR7L%2FHighlights-full-page-mock%3Fnode-id%3D1%253A645"
                            allowFullScreen
                        ></iframe>
                        <h4 className="work__art-caption">
                            The Highlights feature as it looked when we released
                            it to our users
                        </h4>
                    </div>
                </div>
                <div className="work__copy">
                    <h3>What did we learn?</h3>
                    <p>
                        The main elements of the Answers First project (New
                        analysis features and a{' '}
                        <Link href="/work/highlights">
                            <a>Highlights</a>
                        </Link>{' '}
                        page focused on business goals) have so far proved
                        helpful to new users and has reduced our reliance on
                        custom scripts and additional training sessions. Over
                        time, we hope to introduce further customization,
                        over-time views and sharing and export options.
                    </p>
                </div>
            </div>
        </Layout>
    )
}

export default AnswersFirst
