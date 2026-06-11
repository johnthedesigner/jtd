import Head from 'next/head'
import {
    ProseSection, ProseSectionHeading, ProseSectionSubheading, ProseSectionBody,
} from '@/components/case-study/ProseSection'
import { CaseStudyImage } from '@/components/case-study/CaseStudyImage'
import { CaseStudyHero } from '@/components/case-study/CaseStudyHero'
import { TLDRBlock, TLDRItemWhite } from '@/components/case-study/TLDRBlock'
import { PingPong, PingPongHeading } from '@/components/case-study/PingPong'
import { FigmaEmbed } from '@/components/case-study/FigmaEmbed'
import { NextCaseStudy } from '@/components/case-study/NextCaseStudy'
import caseStudies from '@/utils/caseStudies'
import pages from '@/utils/pages.json'
import PasswordProtect from '@/components/PasswordProtect'
import UnauthenticatedContent from '@/components/UnauthenticatedCaseStudy'

const caseStudy = caseStudies.find(cs => cs.href === '/work/scenario-planning')
const isPrivate = caseStudy?.private ?? false

const GAP = '80px'

const Narrow = ({ children, padBottom = false }) => (
    <div style={{
        maxWidth: '720px',
        margin: '0 auto',
        width: '100%',
        padding: `${GAP} 24px ${padBottom ? GAP : '0'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: GAP,
    }}>
        {children}
    </div>
)

const FullWidthSection = ({ children }) => (
    <div style={{
        padding: `${GAP} 24px`,
        display: 'flex',
        flexDirection: 'column',
        gap: GAP,
    }}>
        {children}
    </div>
)

const AuthenticatedContent = () => (
    <>
        <CaseStudyHero
            company="Salesforce"
            title="Planning Better Together"
            subtitle="Scenario planning doesn't have to be lonely."
            imageSrc="/planning-mockup.png"
            imageWidth={2500}
            imageHeight={1500}
            imageAlt="Full-screen mockup of the modeling mode of the scenario planning tool I designed while at Tableau"
            imageMaxWidth={1100}
        />

        <main style={{ display: 'flex', flexDirection: 'column' }}>

            <Narrow>
                <TLDRBlock summary="I was hired to join a new team at Tableau tasked with building a new product for scenario planning. I identified a common schema for scenario planning models, designed a visual model editor that could show the underlying structure and relationships of the model and paired that with automatically generated visualizations optimized for comparing outcomes and making informed decisions.">
                    <TLDRItemWhite label="My Role">
                        As a Product Design Lead, I led design for this project, and did the bulk of the design work with support and collaboration from the Tableau UX team.
                    </TLDRItemWhite>
                    <TLDRItemWhite label="Outcome">
                        By designing, building and testing early prototypes we confirmed our hypotheses around model structure and the market's need for more collaborative features and secured approval to increase hiring and announce this product at our annual convention.
                    </TLDRItemWhite>
                </TLDRBlock>

                <ProseSection>
                    <ProseSectionHeading>What Should We Build?</ProseSectionHeading>
                    <ProseSectionBody>
                        <p>
                            Today, scenario planning like this mainly happens in Excel. A model could be built from
                            some historical data, some projections calculated from that historical data, and some
                            parameters representing the elements of the decision which are under your control.
                        </p>
                        <p>
                            In practice this looks like, given last year&apos;s{' '}
                            <em>marketing spend and sales</em>, if we{' '}
                            <em>change our marketing spend</em>{' '}
                            how will that affect{' '}
                            <em>sales revenue</em>?{' '}
                            In a real-world situation a model could be much much more complex, having many more
                            columns, rows, and parameters. It could even have an array of sheets, each more
                            complex than this example.
                        </p>
                    </ProseSectionBody>
                </ProseSection>
            </Narrow>

            <CaseStudyImage
                fullWidth
                src="/work/scenario-planning/wide-table.png"
                width={2578}
                height={632}
                alt="A simplified example of a spreadsheet model built in Google Sheets, like those we were hoping to replace."
                caption="A simplified example of a spreadsheet model built in Google Sheets, like those we were hoping to replace."
            />

            <Narrow>
                <ProseSection>
                    <ProseSectionHeading>What Did the Research Say?</ProseSectionHeading>
                    <ProseSectionBody>
                        <p>
                            Look, spreadsheet software is great, but it&apos;s built for practically any use of
                            tabular data. In interviews we repeatedly heard that the complexity of undertaking a
                            planning exercise in Excel slows down and complicates the process, making the work{' '}
                            <em>less accessible</em>, and making it{' '}
                            <em>harder for teams to get results</em>. We heard that often the work is isolated to
                            a single team, or even <em>a single employee</em>. Without limits or guidelines, the
                            models are <em>unintelligible</em> to potential collaborators, formulas within them
                            are <em>fragile</em> and <em>difficult to trace</em>. Additions and revisions were
                            bottlenecked and collaboration was impossible.
                        </p>
                        <p>
                            We found that there was a <em>common schema</em> to the sorts of spreadsheet models
                            our prospective users were building, some parts of which could be built, however
                            clumsily in Excel. Some other frequent structures of these models simply didn&apos;t
                            exist at all in Excel. This was an obvious area of opportunity to improve usability
                            for scenario planning.
                        </p>
                    </ProseSectionBody>
                </ProseSection>

                <ProseSection>
                    <ProseSectionHeading>Project Goals</ProseSectionHeading>
                    <ProseSectionBody>
                        <ProseSectionSubheading>1. Solve the Whole Problem</ProseSectionSubheading>
                        <p>
                            To build a product that opens up scenario planning to an entirely new group of users,
                            we need to make it easier to build and instrument models, and we need to make it
                            easier to visually compare scenarios and make informed decisions. These two areas of
                            our users&apos; journey are equally essential to the success of the project.
                        </p>
                        <ProseSectionSubheading>2. Actually Improve the User&apos;s Experience</ProseSectionSubheading>
                        <p>
                            Excel is a powerful product, we would never succeed by trying to build a better Excel.
                            We need to take advantage of our more focused use case to produce an easier, more
                            guided UX with a meaninfully shorter learning curve.
                        </p>
                        <ProseSectionSubheading>3. Don&apos;t Mess Up the Important Parts</ProseSectionSubheading>
                        <p>
                            It&apos;s all well and good to make things &ldquo;Simpler&rdquo; but we needed to
                            understand what was most important to our users work, because if we were missing those
                            &ldquo;table stakes&rdquo; features, we will fail.
                        </p>
                    </ProseSectionBody>
                </ProseSection>

                <ProseSection>
                    <ProseSectionHeading>Designing the Modeling View</ProseSectionHeading>
                    <ProseSectionBody>
                        <p>
                            There&apos;s no scenario planning without a model. How do we balance the need for
                            flexibility and customization with the need to make models easy to author, understand
                            and interact with?
                        </p>
                        <p>
                            Authors require a robust set of calculations, aggregations, and data manipulations,
                            but no matter how complex the model, collaboration isn&apos;t possible unless a
                            collaborator can drop in and understand what they are seeing.
                        </p>
                    </ProseSectionBody>
                </ProseSection>
            </Narrow>

            <FullWidthSection>
                <PingPong
                    src="/work/scenario-planning/flow-chart.svg"
                    width={1500}
                    height={500}
                    alt="An example of nodes in a connected flow map"
                >
                    <PingPongHeading>See the Big Picture.</PingPongHeading>
                    <p>
                        One of the main obstacles to more people building and collaborating with scenario
                        planning models is that they are usually almost impossible to understand unless you
                        built it yourself. What was missing was a visualization of the structure of the model,
                        where are parameters being used, which fields are our metrics calculated from?
                    </p>
                </PingPong>

                <PingPong
                    src="/work/scenario-planning/components.svg"
                    width={1500}
                    height={500}
                    alt="Examples of the components within our flow map, designed to visually match columns within our tabular data."
                    reverse
                >
                    <PingPongHeading>See the Forest <em>and the Trees</em>.</PingPongHeading>
                    <p>
                        Our data is tabular, but greater than the sum of our sheets. A comprehensive visual
                        language helps explain both the structure of the model, and the data the model produces.
                    </p>
                </PingPong>
            </FullWidthSection>

            <CaseStudyImage
                fullWidth
                src="/work/scenario-planning/model-table.svg"
                width={2578}
                height={632}
                alt="An example table designed to visually match components of the model flow map"
                caption="The tables of simulated data and the flow map use a single visual language and selecting a field in the flow highlights the same field in our table (and vice versa)."
            />

            <Narrow>
                <ProseSection>
                    <ProseSectionHeading>Bringing it All Together</ProseSectionHeading>
                    <ProseSectionBody>
                        <p>
                            This is a dense UI by design. It&apos;s of critical importance that we provide
                            helpful context for each component of the model we visualize, as well as any
                            datapoint within the view that we allow our authors to interact with.
                        </p>
                        <p>
                            Our modeling UI brings together the overall structure of the model, the tabular data
                            it produces, as well as the scenarios and their output. The primary goal of this
                            layout is to reduce time-to-visualization and to encourage exploration and
                            experimentation by our Authors.
                        </p>
                    </ProseSectionBody>
                </ProseSection>
            </Narrow>

            <FigmaEmbed
                fullWidth
                src="https://embed.figma.com/proto/Ohqs8MRvCMTCRRKQtAcCl1/johnthedesigner.com---Case-Study-Embeds?node-id=1-1823&viewport=165%2C536%2C0.94&scaling=contain&content-scaling=fixed&starting-point-node-id=1%3A1823&page-id=173%3A14542&embed-host=share"
                title="The Modeling View"
                caption="Full-page mockup of the modeling view, showing an example model looking at revenue & profit."
                aspectRatio="16/9"
            />

            <Narrow>
                <ProseSection>
                    <ProseSectionHeading>Scenarios are for Making Decisions.</ProseSectionHeading>
                    <ProseSectionBody>
                        <p>
                            Once our Author has modeled out the decision they need to make, it&apos;s time to
                            game out the options available. In scenario planning this usally means changing some
                            parameters and seeing what might happen.
                        </p>
                        <p>
                            There&apos;s huge opportunity during this phase to invite new users into the process.
                            The goal here is to bring subject matter experts, executives and other stakeholders
                            into the process by allowing automatic visual comparison of scenarios and allowing
                            instant experimentation and comparison with new scenarios.
                        </p>
                    </ProseSectionBody>
                </ProseSection>
            </Narrow>

            <FullWidthSection>
                <PingPong
                    src="/work/scenario-planning/compare-scenarios.svg"
                    width={1500}
                    height={500}
                    alt="A table designed to allow easy comparison of scenarios by parameter input and metric output"
                    reverse
                >
                    <PingPongHeading>Pick the Winner</PingPongHeading>
                    <p>
                        The main goal here is find the best way forward, so central to this view is encouraging
                        the user to <em>filter, curate, sort and highlight</em> the options that are the most
                        (or least) promising.
                    </p>
                    <p>
                        Scenarios are easily compared based on the metrics we created in the model view. Sort
                        any way you like, show only the most relevant metrics or parameters and build a clear
                        narrative.
                    </p>
                </PingPong>

                <PingPong
                    src="/work/scenario-planning/explain-the-difference.svg"
                    width={1500}
                    height={500}
                    alt="A sidebar from the compare scenarios view showing our ML explanations of the differences between scenarios"
                >
                    <PingPongHeading>Wait&hellip; But Why?</PingPongHeading>
                    <p>
                        Sure, you can see the differences between scenarios, but you can also explain{' '}
                        <em>why they are different</em>. Select any measure of any scenario and you are
                        instantly presented with an analysis of the difference from your baseline, important
                        drivers of that difference and other automatically surfaced context.
                    </p>
                </PingPong>

                <PingPong
                    src="/work/scenario-planning/comparison-charts.svg"
                    width={1500}
                    height={500}
                    alt="A mockup of the comparison charts that are automatically generated in this view"
                    reverse
                >
                    <PingPongHeading>Don&apos;t Just Tell Me, Show Me.</PingPongHeading>
                    <p>
                        We started off by identifying a schema for scenario planning. We optimized the UI for
                        building parameterized models, and easily generating scenarios. The payoff is{' '}
                        <em>instant, procedurally generated visualizations</em> optimized for comparing across
                        scenarios.
                    </p>
                    <p>
                        A quick model, with instant visualizations for timely, informed decisions.
                    </p>
                </PingPong>
            </FullWidthSection>

            <FigmaEmbed
                fullWidth
                src="https://embed.figma.com/proto/Ohqs8MRvCMTCRRKQtAcCl1/johnthedesigner.com---Case-Study-Embeds?node-id=1-1824&viewport=165%2C-709%2C0.94&scaling=contain&content-scaling=fixed&starting-point-node-id=1%3A1824&page-id=0%3A1&embed-host=share"
                title="The Compare Scenarios View"
                caption="Full-page mockup of the Compare Scenarios view, where 'Authors' and 'Deciders' can collaboratively experiment with and compare an array of scenarios in real-time."
                aspectRatio="16/9"
            />

            <Narrow padBottom>
                <ProseSection>
                    <ProseSectionHeading>Where to from here?</ProseSectionHeading>
                    <ProseSectionBody>
                        <p>
                            Tableau Scenario Planner is an entirely new product for Tableau. While at Tableau,
                            I led the design (as the only designer most of that time) for this product from the
                            earliest stages.
                        </p>
                        <p>
                            We interviewed analysts, data scientists and dashboard consumers to sharpen our idea
                            of what the essential features of a scenario planning tool were. We also discovered
                            some major pain points with our subjects&apos; existing solutions.
                        </p>
                        <p>
                            The upcoming release of Tableau Scenario Planner was announced and drew significant
                            positive feedback at Tableau Conference 2022.
                        </p>
                    </ProseSectionBody>
                </ProseSection>

                <NextCaseStudy current="/work/scenario-planning" />
            </Narrow>

        </main>
    </>
)

const ScenarioPlanning = () => {
    const pageTitle = caseStudy
        ? `${caseStudy.title} | John the Designer – Boston-Area Product Designer John Livornese`
        : pages.scenarioPlanning.title
    const pageDescription = caseStudy?.description ?? pages.scenarioPlanning.description

    return (
        <>
            <Head>
                <title>{pageTitle}</title>
                <meta property="og:title" content={pageTitle} key="title" />
                <meta name="description" content={pageDescription} />
                <meta name="og:image" content={pages.scenarioPlanning.image} />
            </Head>
            {isPrivate
                ? <PasswordProtect isPrivate AuthenticatedContent={AuthenticatedContent} UnauthenticatedContent={UnauthenticatedContent} />
                : <AuthenticatedContent />
            }
        </>
    )
}

export default ScenarioPlanning
