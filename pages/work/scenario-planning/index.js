import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '../../../components/Footer'

import Header from '../../../components/Header'
import pages from '../../../utils/pages.json'

const { title, description, image } = pages.scenarioPlanning

const ScenarioPlanning = () => {
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
                        <h1 className="new-case-study__title">
                            Planning Better Together
                        </h1>
                        <h2 className="new-case-study__subtitle">
                            Scenario planning doesn’t have to be lonely.
                        </h2>
                    </div>
                    <Image
                        src="/work/scenario-planning/header.svg"
                        className="new-case-study__hero-image"
                        width="2396"
                        height="1656"
                        alt="Full-screen mockup of the modeling mode of the scenario planning tool I designed while at Tableau"
                    />
                </div>
                <div className="new-case-study__body">
                    <div className="tldr">
                        <div className="tldr__main">
                            <h2 className="tldr__title">TL;DR</h2>
                            <p className="tldr__text">
                                I was hired to join a new team at Tableau tasked
                                with building a new product for scenario
                                planning. I identified a common schema for
                                scenario planning models, designed a visual
                                model editor that could show the underlying
                                structure and relationships of the model and
                                paired that with automatically generated
                                visualizations optimized for comparing outcomes
                                and making informed decisions.
                            </p>
                        </div>
                        <div className="tldr__aside">
                            <h4 className="tldr__aside-title">My Role</h4>
                            <p className="tldr__aside-text">
                                As a Product Design Lead, I led design for this
                                project, and did the bulk of the design work
                                with support and collaboration from the Tableau
                                UX team.
                            </p>
                            <h4 className="tldr__aside-title">Outcome</h4>
                            <p className="tldr__aside-text">
                                By designing, building and testing early
                                prototypes we confirmed our hypotheses around
                                model structure and the market's need for more
                                collaborative features and secured approval to
                                increase hiring and announce this product at our
                                annual convention.
                            </p>
                        </div>
                    </div>

                    {/* NOTE: 
                    This section should introduce the general area our product would address*/}
                    <div className="page-section page-section--centered">
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                What Should We{' '}
                                <span className="highlight-text--purple">
                                    Build
                                </span>
                                ?
                            </h2>
                            <p>
                                Today, scenario planning like this mainly
                                happens in Excel. A model could be built from
                                some historical data, some projections
                                calculated from that historical data, and some
                                parameters representing the elements of the
                                decision which are under your control.
                            </p>
                            <p>
                                In practice this looks like, given last year's{' '}
                                <span className="underline-text--purple">
                                    marketing spend and sales
                                </span>
                                , if we{' '}
                                <span className="underline-text--purple">
                                    change our marketing spend
                                </span>{' '}
                                how will that affect{' '}
                                <span className="underline-text--purple">
                                    sales revenue
                                </span>
                                ? In a real-world situation a model could be
                                much much more complex, having many more
                                columns, rows, and parameters. It could even
                                have an array of sheets, each more complex than
                                this example.
                            </p>
                        </div>
                        <Image
                            src="/work/scenario-planning/wide-table.png"
                            className="wide-table"
                            width="2578"
                            height="632"
                            alt="A simplified example of a spreadsheet model built in Google Sheets, like those we were hoping to replace."
                        />
                        <h4 className="work__art-caption">
                            A simplified example of a spreadsheet model built in
                            Google Sheets, like those we were hoping to replace.
                        </h4>
                    </div>

                    {/* NOTE:
                    This section should establish what the problems are with the
                    current experience that we could improve in order to outcompete? */}
                    <div className="page-section page-section--centered">
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                What Did{' '}
                                <span className="highlight-text--purple">
                                    the Research
                                </span>{' '}
                                Say?
                            </h2>
                            <p>
                                Look, spreadsheet software is great, but it's
                                built for practically any use of tabular data.
                                In interviews we repeatedly heard that the
                                complexity of undertaking a planning exercise in
                                Excel slows down and complicates the process,
                                making the work{' '}
                                <span className="underline-text--purple">
                                    less accessible
                                </span>
                                , and making it{' '}
                                <span className="underline-text--purple">
                                    harder for teams to get results
                                </span>
                                . We heard that often the work is isolated to a
                                single team, or even{' '}
                                <span className="underline-text--purple">
                                    a single employee
                                </span>
                                . Without limits or guidelines, the models are{' '}
                                <span className="underline-text--purple">
                                    unintelligible
                                </span>{' '}
                                to potential collaborators, formulas within them
                                are{' '}
                                <span className="underline-text--purple">
                                    fragile
                                </span>{' '}
                                and{' '}
                                <span className="underline-text--purple">
                                    difficult to trace
                                </span>
                                . Additions and revisions were bottlenecked and
                                collaboration was impossible.
                            </p>
                            <p>
                                We found that there was a{' '}
                                <span className="underline-text--purple">
                                    common schema
                                </span>{' '}
                                to the sorts of spreadsheet models our
                                prospective users were building, some parts of
                                which could be built, however clumsily in Excel.
                                Some other frequent structures of these models
                                simply didn't exist at all in Excel. This was an
                                obvious area of opportunity to improve usability
                                for scenario planning.
                            </p>
                        </div>
                    </div>

                    {/* NOTE:
                    This section is to establish how I went from areas
                    of opportunity to some rationale for what to build  */}
                    <div className="page-section page-section--centered">
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                Project{' '}
                                <span className="highlight-text--purple">
                                    Goals
                                </span>
                            </h2>
                            <h4>
                                <span className="underline-text--purple">
                                    1. Solve the Whole Problem
                                </span>
                            </h4>
                            <p>
                                To build a product that opens up scenario
                                planning to an entirely new group of users, we
                                need to make it easier to build and instrument
                                models, and we need to make it easier to
                                visually compare scenarios and make informed
                                decisions. These two areas of our users' journey
                                are equally essential to the success of the
                                project.
                            </p>
                            <h4>
                                <span className="underline-text--purple">
                                    2. Actually Improve the User's Experience
                                </span>
                            </h4>
                            <p>
                                Excel is a powerful product, we would never
                                succeed by trying to build a better Excel. We
                                need to take advantage of our more focused use
                                case to produce an easier, more guided UX with a
                                meaninfully shorter learning curve.
                            </p>
                            <h4>
                                <span className="underline-text--purple">
                                    3. Don't Mess Up the Important Parts
                                </span>
                            </h4>
                            <p>
                                It's all well and good to make things "Simpler"
                                but we needed to understand what was most
                                important to our users work, because if we were
                                missing those "table stakes" features, we will
                                fail.
                            </p>
                        </div>
                    </div>

                    {/* NOTE:
                    This section is to establish how I went from areas
                    of opportunity to some rationale for what to build  */}
                    <div className="page-section page-section--centered">
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                Designing the{' '}
                                <span className="highlight-text--purple">
                                    Modeling View
                                </span>
                            </h2>
                            <p>
                                There's no scenario planning without a model.
                                How do we balance the need for flexibility and
                                customization with the need to make models easy
                                to author, understand and interact with?
                            </p>
                            <p>
                                Authors require a robust set of calculations,
                                aggregations, and data manipulations, but no
                                matter how complex the model, collaboration
                                isn't possible unless a collaborator can drop in
                                and understand what they are seeing.
                            </p>
                        </div>
                    </div>

                    {/* NOTE:
                    This section introduces the flow diagram structure of our model,
                    should clearly state advantages for collaboration & understandability */}
                    <div className="page-section page-section--ping-pong">
                        <div className="page-section__image-container">
                            <Image
                                src="/work/scenario-planning/flow-chart.svg"
                                width="1500"
                                height="500"
                                alt="An example of nodes in a connected flow map"
                                className="page-section__overflow-image"
                            />
                        </div>
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                See the{' '}
                                <span className="highlight-text--purple">
                                    Big Picture
                                </span>
                                .
                            </h2>
                            <p>
                                One of the main obstacles to more people
                                building and collaborating with scenario
                                planning models is that they are usually almost
                                impossible to understand unless you built it
                                yourself. What was missing was a visualization
                                of the structure of the model, where are
                                parameters being used, which fields are our
                                metrics calculated from?
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
                                See the Forest{' '}
                                <span className="highlight-text--purple">
                                    <em>and the Trees</em>
                                </span>
                                .
                            </h2>
                            <p>
                                Our data is tabular, but greater than the sum of
                                our sheets. A comprehensive visual language
                                helps explain both the structure of the model,
                                and the data the model produces.
                            </p>
                        </div>
                        <div className="page-section__image-container">
                            <Image
                                src="/work/scenario-planning/components.svg"
                                width="1500"
                                height="500"
                                alt="Examples of the components within our flow map, designed to visually match columns within our tabluar data."
                                className="page-section__overflow-image"
                            />
                        </div>
                    </div>
                    <div className="page-section" style={{ marginTop: 0 }}>
                        <Image
                            src="/work/scenario-planning/model-table.svg"
                            className="wide-table"
                            width="2578"
                            height="632"
                            alt="An example table designed to visually match components of the model flow map"
                        />
                        <h4 className="work__art-caption">
                            The tables of simulated data and the flow map use a
                            single visual language and selecting a field in the
                            flow highlights the same field in our table (and
                            vice versa).
                        </h4>
                    </div>

                    {/* NOTE:
                    Next we need to set the stage for sharing a Figma embed of 
                    the full mockup, or possibly a side-by side mockup showing 
                    different states, or single mockup with hand drawn annotations. 

                    We should be landing this with a punch line that touches on 
                    our focus on collaboration and model comprehensibility */}
                    <div className="page-section page-section--centered">
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                Bringing it All Together
                            </h2>
                            <p>
                                This is a dense UI by design. It's of critical
                                importance that we provide helpful context for
                                each component of the model we visualize, as
                                well as any datapoint within the view that we
                                allow our authors to interact with.
                            </p>
                            <p>
                                Our modeling UI brings together the overall
                                structure of the model, the tabular data it
                                produces, as well as the scenarios and their
                                output. The primary goal of this layout is to
                                reduce time-to-visualization and to encourage
                                exploration and experimentation by our Authors.
                            </p>
                        </div>
                    </div>

                    {/* NOTE: 
                    This illustration should be the punctuation on our modeling view. 
                    It may need some hand-drawn annotation to help sum up the different 
                    threads that have been brought together in the mockup */}
                    <div className="work__art-container">
                        <h3 style={{ width: '100%', textAlign: 'center' }}>
                            The Compare Scenarios View
                        </h3>
                        <div className="figma-iframe--large">
                            <iframe
                                style={{
                                    border: '1px solid rgba(0, 0, 0, 0.1)',
                                }}
                                width="100%"
                                height="90vh"
                                src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FOhqs8MRvCMTCRRKQtAcCl1%2FScenario-Planning-Mockups%3Fnode-id%3D173%253A14542%26t%3DvOhHQhpZTMtADtPm-1"
                                allowFullScreen
                            ></iframe>
                            <h4 className="work__art-caption">
                                Full-page mockup of the modeling view, showing
                                an example model looking at revenue & profit.
                            </h4>
                        </div>
                    </div>

                    {/* NOTE:
                    This section is where the Scenario comparison view kicks off. I 
                    need to establish which opportunities this addresses and what 
                    bets I am making with this approach. */}
                    <div className="page-section page-section--centered">
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                Scenarios are for{' '}
                                <span className="highlight-text--purple">
                                    Making Decisions
                                </span>
                                .
                            </h2>
                            <p>
                                Once our Author has modeled out the decision
                                they need to make, it's time to game out the
                                options available. In scenario planning this
                                usally means changing some parameters and seeing
                                what might happen.
                            </p>
                            <p>
                                There's huge opportunity during this phase to
                                invite new users into the process. The goal here
                                is to bring subject matter experts, executives
                                and other stakeholders into the process by
                                allowing automatic visual comparison of
                                scenarios and allowing instant experimentation
                                and comparison with new scenarios.
                            </p>
                        </div>
                    </div>

                    {/* NOTE:
                    A view centered around comparing scenarios by how they are 
                    configured and by the projected outcome */}
                    <div
                        className="page-section page-section--ping-pong"
                        style={{ marginBottom: '4rem' }}
                    >
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                Pick the Winner
                            </h2>
                            <p>
                                The main goal here is find the best way forward,
                                so central to this view is encouraging the user
                                to{' '}
                                <span className="underline-text--purple">
                                    filter, curate, sort and highlight
                                </span>{' '}
                                the options that are the most (or least)
                                promising.
                            </p>
                            <p>
                                Scenarios are easily compared based on the
                                metrics we created in the model view. Sort any
                                way you like, show only the most relevant
                                metrics or parameters and build a clear
                                narrative.
                            </p>
                        </div>
                        <div className="page-section__image-container">
                            <Image
                                src="/work/scenario-planning/compare-scenarios.svg"
                                width="1500"
                                height="500"
                                alt="A table designed to allow easy comparison of scenarios by parameter input and metric output"
                                className="page-section__overflow-image"
                            />
                        </div>
                    </div>

                    {/* NOTE:
                    Smart features that go beyond the difference, to 
                    explain the root cause */}
                    <div
                        className="page-section page-section--ping-pong"
                        style={{ marginBottom: '4rem' }}
                    >
                        <div className="page-section__image-container">
                            <Image
                                src="/work/scenario-planning/explain-the-difference.svg"
                                width="1500"
                                height="500"
                                alt="A sidebar from the compare scenarios view showing our ML explanations of the differences between scenarios"
                                className="page-section__overflow-image"
                            />
                        </div>
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                Wait... But{' '}
                                <span className="highlight-text--purple">
                                    Why
                                </span>
                                ?
                            </h2>
                            <p>
                                Sure, you can see you the differences between
                                scenarios, but you can also explain{' '}
                                <span className="underline-text--purple">
                                    why they are different
                                </span>
                                . Select any measure of any scenario and you are
                                instantly presented with an analysis of the
                                difference from your baseline, important drivers
                                of that difference and other automatically
                                surfaced context.
                            </p>
                        </div>
                    </div>

                    {/* NOTE:
                    Visualize the scale of differences between scenarios */}
                    <div
                        className="page-section page-section--ping-pong"
                        style={{ marginBottom: '4rem' }}
                    >
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                Don't Just Tell Me,{' '}
                                <span className="highlight-text--purple">
                                    Show Me
                                </span>
                                .
                            </h2>
                            <p>
                                We started off by identifying a schema for
                                scenario planning. We optimized the UI for
                                building parameterized models, and easily
                                generating scenarios. The payoff is{' '}
                                <span className="underline-text--purple">
                                    instant, procedurally generated
                                    visualizations
                                </span>{' '}
                                optimized for comparing across scenarios.
                            </p>
                            <p>
                                A quick model, with instant visualizations for
                                timely, informed decisions.
                            </p>
                        </div>
                        <div className="page-section__image-container">
                            <Image
                                src="/work/scenario-planning/comparison-charts.svg"
                                width="1500"
                                height="500"
                                alt="A mockup of the comparison charts that are automatically generated in this view"
                                className="page-section__overflow-image"
                            />
                        </div>
                    </div>

                    <div className="work__art-container">
                        <h3 style={{ width: '100%', textAlign: 'center' }}>
                            The Compare Scenarios View
                        </h3>
                        <div className="figma-iframe--large">
                            <iframe
                                style={{
                                    border: '1px solid rgba(0, 0, 0, 0.1)',
                                }}
                                width="100%"
                                src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FOhqs8MRvCMTCRRKQtAcCl1%2FScenario-Planning-Mockups%3Fnode-id%3D0%253A1%26t%3DvOhHQhpZTMtADtPm-1"
                                allowFullScreen
                            ></iframe>
                            <h4 className="work__art-caption">
                                Full-page mockup of the Compare Scenarios view,
                                where 'Authors' and 'Deciders' can
                                collaboratively experiment with and compare an
                                array of scenarios in real-time.
                            </h4>
                        </div>
                    </div>
                    <div className="page-section page-section--centered">
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                Where to from here?
                            </h2>
                            <p>
                                Tableau Scenario Planner is an entirely new
                                product for Tableau. While at Tableau, I led the
                                design (as the only designer most of that time)
                                for this product from the earliest stages.
                            </p>
                            <p>
                                We interviewed analysts, data scientists and
                                dashboard consumers to sharpen our idea of what
                                the essential features of a scenario planning
                                tool were. We also discovered some major pain
                                points with our subjects' existing solutions.
                            </p>
                            <p>
                                The upcoming release of Tableau Scenario Planner
                                was announced and drew significant positive
                                feedback at Tableau Conference 2022.
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

export default ScenarioPlanning
