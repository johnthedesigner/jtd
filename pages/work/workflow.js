import Link from 'next/link'
import Head from 'next/head'

const title =
    'Work: Improving the Analysis Workflow | John the Designer – Boston-Area Product Designer John Livornese'
const description =
    'An example of some of my recent work in a product design role'

const Workflow = () => {
    return (
        <main className="work-item-page">
            <>
                <Head>
                    <title>{title}</title>
                    <meta property="og:title" content={title} key="title" />
                    <meta name="description" content={description} />
                </Head>
                <div id="main">
                    <div className="intro">
                        <div className="intro-copy">
                            <h1 className="intro-copy__superhead">
                                Improving the Analysis Workflow
                            </h1>
                            <h2 className="intro-copy__headline">
                                Supporting our newly added features with a more
                                guided user experience
                            </h2>
                        </div>
                    </div>
                    <div className="work__copy">
                        <h3>What was the problem?</h3>
                        <p>
                            Our flagship application once allowed users to
                            analyze their projects with a single, powerful
                            analysis feature. But after one nine-month stretch
                            of work in 2018 we found ourselves with 5 separate
                            tools for analyzing a project. Our original designs
                            for these tools share consistent layout, style and
                            interactions, but over time we found that this
                            framework worked better for some tools than for
                            others. In subtle ways, the tools began to grow
                            apart.
                        </p>
                        <h3>How did we approach this design?</h3>
                        <p>
                            Each tool within our application has it&apos;s own
                            unique inputs and outputs. Different tools can be
                            used to answer different questions. But the features
                            share a lot in common too. Within each tool a user
                            can apply filters to narrow down a period of time,
                            <Link href="/work/comparisons">
                                compare periods of time
                            </Link>
                            , analyze feedback for a certain demographic or they
                            can choose a set of concepts to study. These are the
                            common elements that make up our new framework
                        </p>
                        <p>
                            Thoughtful placement of elements can help the user
                            intuit the relationship between elements on the
                            screen as well. Each of the elements of our
                            framework can be thought of in a hierarchy. Without
                            choosing a range of time, you can&apos;t compare to
                            a previous period and without choosing a larger set
                            of important terms, you can&apos;t start narrowing
                            and curating our visualizations. So in designing our
                            updated framework, we made sure to place elements
                            relative to each other based on these hierarchies
                        </p>
                    </div>
                    <div className="work__art-container">
                        <div className="figma-iframe--large">
                            <iframe
                                title="Establishing consistency"
                                style={{ border: 'none' }}
                                width="100%"
                                src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FWbulkhmmepuCu0C3LTMTU1%2FImproved-workflow%3Fnode-id%3D1%253A2853"
                            ></iframe>
                            <h4 className="work__art-caption">
                                Some elements and features are consistent from
                                tool to tool. These are the elements of our
                                analysis tool framework
                            </h4>
                        </div>
                    </div>
                    <div className="work__art-container">
                        <div className="figma-iframe--large">
                            <iframe
                                title="Examples of real tools in this framework"
                                style={{ border: 'none' }}
                                width="100%"
                                src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FWbulkhmmepuCu0C3LTMTU1%2FImproved-workflow%3Fnode-id%3D1%253A443"
                                allowFullScreen
                            ></iframe>
                            <h4 className="work__art-caption">
                                Examples of designing with this framework, using
                                the Drivers tool
                            </h4>
                        </div>
                    </div>
                    <div className="work__copy">
                        <h3>How did we approach this design?</h3>
                        <p>
                            This project is still in progress. One of our
                            biggest challenges with updates like this that touch
                            so many parts of the UI is finding the right order
                            of execution. We are developing a broad cross
                            section of these updates, starting with a single
                            tool. In this way we will be able to get user
                            feedback earlier, and have a clear path to
                            impementing these updates in each of our other tools
                            once we have worked out the kinks
                        </p>
                    </div>
                </div>
            </>
        </main>
    )
}

export default Workflow
