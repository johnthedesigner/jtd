import Link from 'next/link'
import Head from 'next/head'

import Layout from '../../components/Layout'
import WorkHeader from '../../components/WorkHeader'
import { palettes } from '../../utils/colorUtils'

const title =
    'Work: Filtering Documents | John the Designer – Boston-Area Product Designer John Livornese'
const description =
    'An example of some of my recent work in a product design role'

const Filtering = () => {
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
                        superHead="Filtering Documents"
                        headline="Faceted search FTW"
                        palette={palettes.red}
                    />
                    <div className="work__copy">
                        <h3>What was the problem?</h3>
                        <p>
                            Our customers upload tens of thousands or more
                            documents to understand the unstructured customer
                            feedback they contain. And just about every document
                            customers upload comes along with a variety of
                            metadata, like &quot;purchase date&quot;,
                            &quot;store number&quot;, &quot;department&quot; and
                            more. Customers expectations for metadata in our
                            product were simple. They wanted to filter their
                            documents by that metadata.
                        </p>
                        <h3>How did we approach this design?</h3>
                        <p>
                            Our users are product managers, marketing managers,
                            business analysts and HR leaders. The vast majority
                            of our users has never written a line of SQL, so
                            from the very beginning it was clear the right
                            solution was going to be easy-to-use for our many
                            nontechnical users. I considered a variety of levels
                            of comlexity from our document filters but
                            eventually settled on the faceted search model. This
                            model allowed our design for filtering in the UI to
                            focus on what users most wanted from filters; To
                            drill down into more precise subsets of documents a
                            look for differences
                        </p>
                    </div>
                    <div className="work__art-container">
                        <div className="figma-iframe--large">
                            <iframe
                                title="Wireframes of date selection"
                                style={{ border: 'none' }}
                                width="100%"
                                src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2F5yK8chn0pyGQ8FT3fRVsF2%2FFilter-documents%3Fnode-id%3D1%253A238"
                                allowFullScreen
                            ></iframe>
                            <h4 className="work__art-caption">
                                Wireframes demonstrating the selection of date
                                ranges
                            </h4>
                        </div>
                    </div>
                    <div className="work__art-container">
                        <div className="figma-iframe--large">
                            <iframe
                                title="Categorical field selection in the filter pane"
                                style={{ border: 'none' }}
                                width="100%"
                                src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FibGDCVlvVimTUVagZe6uHj%2FFilter-by-Many-birds%3Fnode-id%3D1%253A464"
                                allowFullScreen
                            ></iframe>
                            <h4 className="work__art-caption">
                                Wireframes demonstrating the selection of
                                categorical data
                            </h4>
                        </div>
                    </div>
                    <div className="work__art-container">
                        <div className="figma-iframe--small">
                            <iframe
                                title="Compact filter pane with no selections"
                                style={{ border: 'none' }}
                                width="100%"
                                src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FvDzqArihy9UoD9BuROwkQe%2FNew-filter-pane%3Fnode-id%3D1%253A566"
                                allowFullScreen
                            ></iframe>
                            <h4 className="work__art-caption">
                                Advanced mockup of the document filter pane
                            </h4>
                        </div>
                        <div className="figma-iframe--small">
                            <iframe
                                title="Compact filter pane with selections"
                                style={{ border: 'none' }}
                                width="100%"
                                src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FvDzqArihy9UoD9BuROwkQe%2FNew-filter-pane%3Fnode-id%3D1%253A567"
                                allowFullScreen
                            ></iframe>
                            <h4 className="work__art-caption">
                                Advanced mockup of the document filter pane with
                                active selections
                            </h4>
                        </div>
                    </div>
                    <div className="work__copy">
                        <h3>What did we learn?</h3>
                        <p>
                            Extensive usability testing showed that all test
                            subjects knew intuitively how to use the new faceted
                            search, and we have received no negative feedback of
                            note about this approach in several years. This
                            feature was successful enough that we&apos;re now
                            building new features off of these filters, such as
                            <Link href="/work/comparisons">
                                <a>Compare Period-over-Period</a>
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            </Layout>
        </main>
    )
}

export default Filtering
