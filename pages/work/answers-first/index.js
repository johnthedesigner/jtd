import Link from 'next/link'
import Head from 'next/head'
import Image from 'next/image'

import Header from '../../../components/Header'
import pages from '../../../utils/pages.json'
import Footer from '../../../components/Footer'

const { title, description, image } = pages.answersFirst

const AnswersFirst = () => {
    return (
        <>
            <Head>
                <title>{title}</title>
                <meta property="og:title" content={title} key="title" />
                <meta name="description" content={description} />
                <meta name="og:image" content={image} />
            </Head>
            <div id="main">
                <Header blue />
                <div className="new-case-study__hero">
                    <div className="new-case-study__hero-content">
                        <h1 className="new-case-study__title">Answers First</h1>
                        <h2 className="new-case-study__subtitle">
                            How to Eliminate "Analysis Paralysis"
                        </h2>
                    </div>
                    <Image
                        src="/work/answers-first/collage.svg"
                        className="new-case-study__hero-image"
                        width="2396"
                        height="1656"
                        alt="A collage of many different components and views that were designed during this project"
                    />
                </div>
                <div className="new-case-study__body">
                    <div className="tldr">
                        <div className="tldr__main">
                            <h2 className="tldr__title">TL;DR</h2>
                            <p className="tldr__text">
                                Our flagship ML text analytics product,
                                Daylight, was seeing too much customer churn.
                                The application was difficult to learn and fell
                                short on features needed to solve our customers'
                                use cases. I came up with a plan to reorient our
                                strategy around core data types and use cases,
                                and to rebuild the product to address them.
                                Based on my design vision and roadmap, we built
                                an entirely new set of analysis tools and
                                launched a reimagined end-to-end workflow. The
                                new product was easier to learn, allowed
                                analysts to complete their analysis within
                                Daylight, and even made the product easier to
                                sell.
                            </p>
                        </div>
                        <div className="tldr__aside">
                            <h4 className="tldr__aside-title">My Role</h4>
                            <p className="tldr__aside-text">
                                As a Head of Product Design at Luminoso, I
                                proposed this update, set a new product roadmap
                                and acted as design lead. I led research
                                studies, like stakeholder interviews and
                                usability studies.
                            </p>
                            <h4 className="tldr__aside-title">Outcome</h4>
                            <p className="tldr__aside-text">
                                Analytics showed steadily increasing usage in
                                total and on an average user basis throughout
                                the incremental release of these updates and
                                after. We measurably decreased customer reliance
                                on Excel to complete their analyses. The sales
                                and client services team cited less reliance on
                                documentation and hands-on instruction.
                            </p>
                        </div>
                    </div>

                    {/* NOTE: 
                    This section should introduce the general area our product would address*/}
                    <div className="page-section page-section--centered">
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                We need{' '}
                                <span className="highlight-text--purple">
                                    “Answers First”
                                </span>
                                .
                            </h2>
                            <h4>
                                <span className="underline-text--purple">
                                    Some Backstory...
                                </span>
                            </h4>
                            <p>
                                I was the 1st product designer at Luminoso, a
                                Boston-area text analytics company. When I was
                                hired, the flagship product was part of a still
                                early effort to transition from a services-based
                                company to a SAAS company. The product was
                                difficult to use but the science behind it was
                                really powerful.
                            </p>
                            <h4>
                                <span className="underline-text--purple">
                                    Users were unhappy with the UX
                                </span>
                            </h4>
                            <p>
                                The tools in the UI only covered the “Discovery”
                                phase. Users could discover what people were
                                talking about in their text datasets, but beyond
                                that most of the work was actually done in
                                Excel. Looking deeper involved annotating,
                                re-uploading data and re-exporting to excel, a
                                process that was difficult to learn & remember.
                                It required a lot of work for the sales team to
                                demonstrate the product, and even more work for
                                client services to train users within our client
                                organizations.
                            </p>
                            <h4>
                                <span className="underline-text--purple">
                                    The Idea
                                </span>
                            </h4>
                            <p></p>
                            <p>
                                Users just wanted answers to their questions. We
                                already had a set of tools for answering
                                questions. They mostly existed outside of the
                                product's UI however. They were spreadsheet
                                exports, Python notebooks, custom scripts and
                                more. We need our users to be able to accomplish
                                all phases of the analysis process without
                                leaving our application, and to help users
                                understand why and how to use the product.
                            </p>
                        </div>
                    </div>

                    {/* NOTE:
                    Introduce answering questions with different analysis outputs */}
                    <div className="page-section page-section--ping-pong">
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                Which Questions Should We Try to Answer?
                            </h2>
                            <p>
                                Step one was to get the organization on the same
                                page about which data types and business types
                                we should optimize for. I used those agreements
                                to find the right customers to interview, and
                                based on those interviews and an audit of our
                                past customers I was able to identify a short
                                list of essential use cases we needed to
                                address.
                            </p>
                            <p>
                                Next, I audited all of the custom scripts,
                                Python notebooks and other tools we used to
                                service our customers' use cases. I determined
                                which techniques were most essential for the use
                                cases we were optimizing for, and those would be
                                the foundation of our V1 release.
                            </p>
                        </div>
                        <div className="page-section__image-container">
                            <Image
                                src="/work/answers-first/question-1.svg"
                                width="1500"
                                height="500"
                                alt="An image showing the question 'Why are my NPS Detractors not happy?', and the types of analysis tools we can use to answer that question"
                                className="page-section__overflow-image"
                            />
                        </div>
                    </div>

                    {/* NOTE:
                    Introduce answering questions with different analysis outputs */}
                    <div className="page-section page-section--ping-pong">
                        <div className="page-section__image-container">
                            <Image
                                src="/work/answers-first/old-flow.svg"
                                width="1500"
                                height="500"
                                alt="A flow chart illustrating the difficult workflow we started the project with"
                                className="page-section__overflow-image"
                            />
                        </div>
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                What Did the Old Process Look Like?
                            </h2>
                            <p>
                                Analysis in our product centered around a
                                visualization of the important concepts and
                                relationships we found in the uploaded text. To
                                look deeper from there, users relied a lot on
                                our spreadsheet exports. The process was clunky
                                to say the least. Often, users would forget so
                                much by the time their next quarterly report
                                came around that they would need more
                                instruction.
                            </p>
                        </div>
                    </div>

                    {/* NOTE:
                    Introduce answering questions with different analysis outputs */}
                    <div className="page-section page-section--ping-pong">
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                What Does{' '}
                                <span className="highlight-text--purple">
                                    “Answers First”
                                </span>{' '}
                                Look Like?
                            </h2>
                            <p>
                                Our competitive advantage in text analytics was
                                in our immediate results. No need to define
                                topics, terms or taxonomies up front. Just
                                upload your documents and get the whole story.
                            </p>
                            <p>
                                To really fufill that promise we needed to focus
                                on reducing “time-to-insight”. To do that I
                                proposed a new project overview page that would
                                bring together data and visualizations from each
                                of our new analysis tools.
                            </p>
                            <p>
                                These new analysis tools would improve on
                                workflows that previously used spreadsheet
                                exports and Excel, allowing analysts to curate,
                                sharpen and understand their data within the UI
                                and produce presentation-ready output.
                            </p>
                        </div>
                        <div className="page-section__image-container">
                            <Image
                                src="/work/answers-first/new-flow.svg"
                                width="1500"
                                height="500"
                                alt="A flow chart illustrating our desired workflow for analysis within our product"
                                className="page-section__overflow-image"
                            />
                        </div>
                    </div>

                    {/* NOTE: 
                    This section should introduce the general area our product would address*/}
                    <div className="page-section page-section--centered">
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                We Had Some{' '}
                                <span className="highlight-text--purple">
                                    Big Goals
                                </span>
                                .
                            </h2>
                            <h4>Make it Easier to Learn & Demo</h4>
                            <p>
                                We were relying on direct instruction by our
                                client services team too much, and it just
                                doesn't scale. Ideally you shouldn't need to go
                                back to school to be able to use an app.
                            </p>
                            <h4>Support a Complete Analysis Workflow</h4>
                            <p>
                                Every time our customers leave the UI to do more
                                work in Excel, we lose control of the experience
                                and we risk that customer not coming back. To
                                keep users coming back to our app we need to
                                offer a complete product that solves a complete
                                use case.
                            </p>
                            <h4>Don't Make it Harder!</h4>
                            <p>
                                All of these features are being added to an
                                application that already felt arcane and
                                difficult to use. If we wanted this project to
                                be successful, we needed the product to become
                                simpler even as it became more powerful.
                            </p>
                        </div>
                    </div>

                    {/* NOTE: 
                    This illustration should be the punctuation on our modeling view. 
                    It may need some hand-drawn annotation to help sum up the different 
                    threads that have been brought together in the mockup */}
                    <div className="work__art-container">
                        <h3 style={{ width: '100%', textAlign: 'center' }}>
                            Four Ways to Analyze Unstructured Text
                        </h3>
                        <div className="figma-iframe--large">
                            <iframe
                                style={{
                                    border: '1px solid rgba(0, 0, 0, 0.1)',
                                }}
                                width="100%"
                                height="90vh"
                                src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FOhqs8MRvCMTCRRKQtAcCl1%2Fjohnthedesigner.com-%252F-Case-Study-Embeds%3Fnode-id%3D605%253A10491%26t%3DpM4ZzKnxhab9YwwZ-1"
                                allowfullscreen
                            ></iframe>
                            <h4 className="work__art-caption">
                                Full-page mockup of the modeling view, showing
                                an example model looking at revenue & profit.
                            </h4>
                        </div>
                    </div>

                    {/* NOTE:
                    Faceted Search UI for filtering to document subsets */}
                    <div className="page-section page-section--ping-pong">
                        <div className="page-section__image-container">
                            <Image
                                src="/work/answers-first/filter.svg"
                                width="1500"
                                height="500"
                                alt="Mockups of the filter sidebar from our analysis tools"
                                className="page-section__overflow-image"
                            />
                        </div>
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                Drill Down into the Right Conversations
                            </h2>
                            <p>
                                It was essential that we create a way to perform
                                analysis on specific subsets of documents within
                                our projects. I designed and tested a number of
                                different approaches, and settled on a
                                particularly successful design for filtering
                                that was similar to faceted search on an
                                eCommerce website. It won out because it was
                                familiar, easy to use, and set reasonable limits
                                on query complexity. From interviews and
                                observation we found it was perfectly suited for
                                the way users wished to "drill-down" into
                                meaningful subsets.
                            </p>
                        </div>
                    </div>

                    {/* NOTE:
                    Faceted Search UI for filtering to document subsets */}
                    <div className="page-section page-section--ping-pong">
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                What is This Topic Really About?
                            </h2>
                            <p>
                                It's easy to assume that when people use an ML
                                text analytics tool that they are trying to
                                avoid reading documents, but that's not quite
                                true. What they really want to do is to read{' '}
                                <span className="underline-text--purple">
                                    the right
                                </span>{' '}
                                documents.
                            </p>
                            <p>
                                Each analysis tool we built could surface and
                                measure different topics in a unique way, but in
                                the end you still need more context to
                                understand what a topic{' '}
                                <span className="underline-text--purple">
                                    really means
                                </span>
                                .
                            </p>
                            <p>
                                The concept details pane was designed to answer
                                a complicated question (i.e. When people talk
                                about "Software Update", what do they really
                                mean?), to provide clarity and context, and to
                                surface the right example texts to illustrate
                                how people are using that topic.
                            </p>
                        </div>
                        <div className="page-section__image-container">
                            <Image
                                src="/work/answers-first/concept-details.svg"
                                width="1500"
                                height="500"
                                alt="Mockups of the concept details sidebar from our analysis tools"
                                className="page-section__overflow-image"
                            />
                        </div>
                    </div>

                    {/* NOTE:
                    This section is to establish how I went from areas
                    of opportunity to some rationale for what to build  */}
                    <div className="page-section page-section--centered">
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                A New Homepage for Each Project
                            </h2>
                            <p>
                                The project overview was really the cornerstone
                                of this entire product. This is where we take
                                the first level of insights from each of our new
                                analysis tools and bring it together. The
                                analyst gets a high-level view of the
                                discussions happening within their text, and
                                even how it affects important metrics with their
                                data.
                            </p>
                        </div>
                    </div>

                    {/* NOTE: 
                    This illustration should be the punctuation on our modeling view. 
                    It may need some hand-drawn annotation to help sum up the different 
                    threads that have been brought together in the mockup */}
                    <div className="work__art-container">
                        <h3 style={{ width: '100%', textAlign: 'center' }}>
                            The Project Overview
                        </h3>
                        <div className="figma-iframe--large">
                            <iframe
                                style={{
                                    border: '1px solid rgba(0, 0, 0, 0.1)',
                                }}
                                width="100%"
                                height="90vh"
                                src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FOhqs8MRvCMTCRRKQtAcCl1%2Fjohnthedesigner.com-%252F-Case-Study-Embeds%3Fnode-id%3D625%253A26422%26t%3D5phMKLiODnvgFAhp-1"
                                allowfullscreen
                            ></iframe>
                            <h4 className="work__art-caption">
                                Full-page mockup of the modeling view, showing
                                an example model looking at revenue & profit.
                            </h4>
                        </div>
                    </div>

                    {/* NOTE:
                    This section introduces the flow diagram structure of our model,
                    should clearly state advantages for collaboration & understandability */}
                    <div className="page-section page-section--ping-pong">
                        <div className="page-section__image-container">
                            <Image
                                src="/work/answers-first/cards.svg"
                                width="1500"
                                height="500"
                                alt="A mockup of the final design for our overview visualization cards on top of other unused designs"
                                className="page-section__overflow-image"
                            />
                        </div>
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                Overview{' '}
                                <span className="highlight-text--purple">
                                    Visualizations
                                </span>
                            </h2>
                            <p>
                                The design of these cards was an important and
                                challenging. I started with a lot of
                                experimentation in visualization style, color
                                and layout, but things really came together
                                after a few rounds of pair programming and user
                                feedback.
                            </p>
                            <p>
                                Designing in code with engineering partners
                                meant we could test with real users and real
                                data, get raw and accurate feedback about how
                                meaningful this view was, and we made quick
                                progress with quick iterative cycles.
                            </p>
                        </div>
                    </div>

                    {/* NOTE:
                    This section should explain the identification of a common 
                    schema for scenario planning and the designing of a visual 
                    language for displaying the components of our model */}
                    <div
                        className="page-section page-section--ping-pong"
                        style={{ marginBottom: '4rem' }}
                    >
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                Approachability as a Main Feature
                            </h2>
                            <p>
                                The biggest discovery during this design process
                                was that the most important part of our project
                                overview by far was the prose "Q&A" portion at
                                the top of each visualization card. This simple
                                text-only description not only helped users to
                                understand the visualizations better, they also
                                acted as a quick tour of our analysis
                                capabilities and how they should be interpreted.
                            </p>
                            <p>
                                The immediate interpretability of these cards
                                and their captions was transformative for our
                                sales and client services teams. The product
                                explained itself, what analysis capabilities we
                                had and how they could be used, within moments
                                of uploading data.
                            </p>
                        </div>
                        <div className="page-section__image-container">
                            <Image
                                src="/work/answers-first/card-captions.svg"
                                width="1500"
                                height="500"
                                alt="A few different visualization cards cropped to show the descriptive captions at the top of the cards"
                                className="page-section__overflow-image"
                            />
                        </div>
                    </div>

                    <div className="page-section page-section--centered">
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                How Did it Go?
                            </h2>
                            <p>
                                We set out to identify the right new analysis
                                tools to build into our product to answer our
                                customers' questions. We wanted to build it into
                                a reorganized UI that could help make the
                                product easier to learn and use and reduce the
                                "Time-to-Insight". We also wanted to replace the
                                existing workflow, where users used spreadsheet
                                exports to do analysis work mainly within Excel.
                            </p>
                            <p>
                                Throughout the incremental release of our
                                product updates we observed usage of our
                                application increasing, both in overall usage
                                and as a per-user average. As each new tool was
                                released we also saw usage of our legacy exports
                                decrease, while at the same time the
                                report-ready exports within our new tools
                                increased, demonstrating that our improved,
                                end-to-end workflow quickly became the standard.
                            </p>
                            <p>
                                Of all of the positive feedback we received on
                                the redesigned & reorganized UI, the biggest
                                refrain came from our sales and client services
                                team. The product now demonstrated both its own
                                value, and how the product could be used. We
                                were spending less time instructing users on how
                                to use the software, and less time maintaining
                                the fleet of custom scripts and notebooks so
                                many users required in the past.
                            </p>
                            <div
                                style={{
                                    textAlign: 'center',
                                    marginTop: '6rem',
                                }}
                            >
                                <Link className="button" href="/#work">
                                    See More Work
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        </>
    )
}

export default AnswersFirst
