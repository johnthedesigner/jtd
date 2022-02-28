import Head from 'next/head'

import Layout from '../../components/Layout'
import WorkHeader from '../../components/WorkHeader'
import { palettes } from '../../utils/colorUtils'

const title =
    'Work: Comparisons | John the Designer – Boston-Area Product Designer John Livornese'
const description =
    'An example of some of my recent work in a product design role'

const Comparisons = () => {
    return (
        <main className="work-item-page">
            <Layout>
                <Head>
                    <title>{title}</title>
                    <meta property="og:title" content={title} key="title" />
                    <meta name="description" content={description} />
                </Head>
                <div id="main">
                    <WorkHeader
                        superHead="Comparing Time Periods"
                        headline="Learn from history or be doomed to repeat it."
                        palette={palettes.green}
                    />
                    <div className="work__copy">
                        <h3>What was the problem?</h3>
                        <p>
                            In our flagship product, users can apply filters to
                            look at narrow ranges of time, such as the past
                            week, to understand what&apos;s going on lately.
                            User interviews and feedback led us to add the
                            ability to compare to a previous time range directly
                            in Drivers UI.
                        </p>
                        <h3>How did we approach this design?</h3>
                        <p>
                            There were a lot of variables to consider with this
                            feature, and to cover all of our bases required
                            sharing the design early and incorporating a number
                            of rounds of feedback. This feature was largely
                            shaped on the whiteboard, in meetings with
                            stakeholders from product management and engineering
                            and with regular users of the product.
                        </p>
                        <p>
                            A project&apos;s data could have more than one date
                            field and a user would have to narrow their view
                            down to a particular date range in order to do a
                            comparison. In order to build this feature in a way
                            that users could discover, learn and use themselves,
                            we need to introduce new elements that would send
                            clear signals to the user about what date ranges
                            they were seeing.
                        </p>
                    </div>
                    <div className="work__art-container">
                        <div className="figma-iframe--small">
                            <iframe
                                title="A scatterplot showing concepts driving a score"
                                style={{ border: 'none' }}
                                width="100%"
                                src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FLjBh1XJwgn5GRMZHODotEn%2FCompare-to-previous-period%3Fnode-id%3D11%253A944"
                                allowFullScreen
                            ></iframe>
                            <h4 className="work__art-caption">
                                A scatterplot visualization from the Drivers
                                tool, showing the current date range with out a
                                comparison view
                            </h4>
                        </div>
                        <div className="figma-iframe--small">
                            <iframe
                                title="A scatterplot showing differences from period-to-period"
                                style={{ border: 'none' }}
                                width="100%"
                                src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FLjBh1XJwgn5GRMZHODotEn%2FCompare-to-previous-period%3Fnode-id%3D11%253A0"
                                allowFullScreen
                            ></iframe>
                            <h4 className="work__art-caption">
                                A scatterplot visualization from the Drivers
                                tool, showing the current date range being
                                compared to the previous period
                            </h4>
                        </div>
                    </div>
                    <div className="work__art-container">
                        <div className="figma-iframe--large">
                            <iframe
                                title="High fidelity mockups of the drivers too"
                                style={{ border: 'none' }}
                                width="100%"
                                src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FLjBh1XJwgn5GRMZHODotEn%2FCompare-to-previous-period%3Fnode-id%3D11%253A1436"
                                allowFullScreen
                            ></iframe>
                            <h4 className="work__art-caption">
                                Full-page mockup of the Drivers tool, showing
                                views without a comparison, with a comparison,
                                and while curating the concepts to be visualized
                                in the scatterplot
                            </h4>
                        </div>
                    </div>
                    <div className="work__copy">
                        <h3>How did we approach this design?</h3>
                        <p>
                            This addition to the Drivers feature is brand new
                            and we&apos;re only just getting initial feedback.
                            We will look to learn a lot from releasing this
                            initial version to our users. For example: What
                            sorts of time periods do our users wish to compare?
                            Are the basic comparison options we&apos;ve given
                            them enough for their purposes? How often do people
                            want to compare the same terms from one period to
                            the next, versus comparing which different terms
                            were more uniquely important from period to period?
                        </p>
                    </div>
                </div>
            </Layout>
        </main>
    )
}

export default Comparisons
