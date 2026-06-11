// Unpublished — redirect to work index until this case study is ready
export function getServerSideProps() {
    return { redirect: { destination: '/work', permanent: false } }
}
export default function AnswersFirst() { return null }

/* eslint-disable no-unreachable
import Head from 'next/head'
import {
    ProseSection, ProseSectionHeading, ProseSectionSubheading, ProseSectionBody,
} from '@/components/case-study/ProseSection'
import { CaseStudyHero } from '@/components/case-study/CaseStudyHero'
import { TLDRBlock, TLDRItemWhite } from '@/components/case-study/TLDRBlock'
import { PingPong, PingPongHeading } from '@/components/case-study/PingPong'
import { FigmaEmbed } from '@/components/case-study/FigmaEmbed'
import { NextCaseStudy } from '@/components/case-study/NextCaseStudy'
import caseStudies from '@/utils/caseStudies'
import pages from '@/utils/pages.json'
import PasswordProtect from '@/components/PasswordProtect'
import UnauthenticatedContent from '@/components/UnauthenticatedCaseStudy'

const caseStudy = caseStudies.find(cs => cs.href === '/work/answers-first')
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
            company="Luminoso"
            title="Answers First"
            subtitle="How to Eliminate &ldquo;Analysis Paralysis&rdquo;"
            imageSrc="/work/answers-first/collage.svg"
            imageWidth={2396}
            imageHeight={1656}
            imageAlt="A collage of many different components and views that were designed during this project"
        />

        <main style={{ display: 'flex', flexDirection: 'column' }}>

            <Narrow>
                <TLDRBlock summary="Our flagship ML text analytics product, Daylight, was seeing too much customer churn. The application was difficult to learn and fell short on features needed to solve our customers' use cases. I came up with a plan to reorient our strategy around core data types and use cases, and to rebuild the product to address them. Based on my design vision and roadmap, we built an entirely new set of analysis tools and launched a reimagined end-to-end workflow. The new product was easier to learn, allowed analysts to complete their analysis within Daylight, and even made the product easier to sell.">
                    <TLDRItemWhite label="My Role">
                        As a Head of Product Design at Luminoso, I proposed this update, set a new product roadmap
                        and acted as design lead. I led research studies, like stakeholder interviews and
                        usability studies.
                    </TLDRItemWhite>
                    <TLDRItemWhite label="Outcome">
                        Analytics showed steadily increasing usage in total and on an average user basis throughout
                        the incremental release of these updates and after. We measurably decreased customer reliance
                        on Excel to complete their analyses. The sales and client services team cited less reliance on
                        documentation and hands-on instruction.
                    </TLDRItemWhite>
                </TLDRBlock>

                <ProseSection>
                    <ProseSectionHeading>We Need &ldquo;Answers First&rdquo;</ProseSectionHeading>
                    <ProseSectionBody>
                        <ProseSectionSubheading>Some Backstory</ProseSectionSubheading>
                        <p>
                            I was the 1st product designer at Luminoso, a Boston-area text analytics company.
                            When I was hired, the flagship product was part of a still early effort to transition
                            from a services-based company to a SAAS company. The product was difficult to use but
                            the science behind it was really powerful.
                        </p>
                        <ProseSectionSubheading>Users Were Unhappy with the UX</ProseSectionSubheading>
                        <p>
                            The tools in the UI only covered the &ldquo;Discovery&rdquo; phase. Users could
                            discover what people were talking about in their text datasets, but beyond that most
                            of the work was actually done in Excel. Looking deeper involved annotating,
                            re-uploading data and re-exporting to excel, a process that was difficult to learn
                            &amp; remember. It required a lot of work for the sales team to demonstrate the
                            product, and even more work for client services to train users within our client
                            organizations.
                        </p>
                        <ProseSectionSubheading>The Idea</ProseSectionSubheading>
                        <p>
                            Users just wanted answers to their questions. We already had a set of tools for
                            answering questions. They mostly existed outside of the product&apos;s UI however.
                            They were spreadsheet exports, Python notebooks, custom scripts and more. We need our
                            users to be able to accomplish all phases of the analysis process without leaving our
                            application, and to help users understand why and how to use the product.
                        </p>
                    </ProseSectionBody>
                </ProseSection>
            </Narrow>

            <FullWidthSection>
                <PingPong
                    src="/work/answers-first/question-1.svg"
                    width={1500}
                    height={500}
                    alt="An image showing the question 'Why are my NPS Detractors not happy?', and the types of analysis tools we can use to answer that question"
                >
                    <PingPongHeading>Which Questions Should We Try to Answer?</PingPongHeading>
                    <p>
                        Step one was to get the organization on the same page about which data types and
                        business types we should optimize for. I used those agreements to find the right
                        customers to interview, and based on those interviews and an audit of our past
                        customers I was able to identify a short list of essential use cases we needed to
                        address.
                    </p>
                    <p>
                        Next, I audited all of the custom scripts, Python notebooks and other tools we used
                        to service our customers&apos; use cases. I determined which techniques were most
                        essential for the use cases we were optimizing for, and those would be the foundation
                        of our V1 release.
                    </p>
                </PingPong>

                <PingPong
                    src="/work/answers-first/old-flow.svg"
                    width={1500}
                    height={500}
                    alt="A flow chart illustrating the difficult workflow we started the project with"
                    reverse
                >
                    <PingPongHeading>What Did the Old Process Look Like?</PingPongHeading>
                    <p>
                        Analysis in our product centered around a visualization of the important concepts and
                        relationships we found in the uploaded text. To look deeper from there, users relied a
                        lot on our spreadsheet exports. The process was clunky to say the least. Often, users
                        would forget so much by the time their next quarterly report came around that they
                        would need more instruction.
                    </p>
                </PingPong>

                <PingPong
                    src="/work/answers-first/new-flow.svg"
                    width={1500}
                    height={500}
                    alt="A flow chart illustrating our desired workflow for analysis within our product"
                >
                    <PingPongHeading>What Does &ldquo;Answers First&rdquo; Look Like?</PingPongHeading>
                    <p>
                        Our competitive advantage in text analytics was in our immediate results. No need to
                        define topics, terms or taxonomies up front. Just upload your documents and get the
                        whole story.
                    </p>
                    <p>
                        To really fufill that promise we needed to focus on reducing &ldquo;time-to-insight&rdquo;.
                        To do that I proposed a new project overview page that would bring together data and
                        visualizations from each of our new analysis tools.
                    </p>
                    <p>
                        These new analysis tools would improve on workflows that previously used spreadsheet
                        exports and Excel, allowing analysts to curate, sharpen and understand their data
                        within the UI and produce presentation-ready output.
                    </p>
                </PingPong>
            </FullWidthSection>

            <Narrow>
                <ProseSection>
                    <ProseSectionHeading>We Had Some Big Goals</ProseSectionHeading>
                    <ProseSectionBody>
                        <ProseSectionSubheading>Make it Easier to Learn &amp; Demo</ProseSectionSubheading>
                        <p>
                            We were relying on direct instruction by our client services team too much, and it
                            just doesn&apos;t scale. Ideally you shouldn&apos;t need to go back to school to
                            be able to use an app.
                        </p>
                        <ProseSectionSubheading>Support a Complete Analysis Workflow</ProseSectionSubheading>
                        <p>
                            Every time our customers leave the UI to do more work in Excel, we lose control of
                            the experience and we risk that customer not coming back. To keep users coming back
                            to our app we need to offer a complete product that solves a complete use case.
                        </p>
                        <ProseSectionSubheading>Don&apos;t Make it Harder!</ProseSectionSubheading>
                        <p>
                            All of these features are being added to an application that already felt arcane and
                            difficult to use. If we wanted this project to be successful, we needed the product
                            to become simpler even as it became more powerful.
                        </p>
                    </ProseSectionBody>
                </ProseSection>
            </Narrow>

            <FigmaEmbed
                fullWidth
                src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FOhqs8MRvCMTCRRKQtAcCl1%2Fjohnthedesigner.com-%252F-Case-Study-Embeds%3Fnode-id%3D605%253A10491%26t%3DpM4ZzKnxhab9YwwZ-1"
                title="Four Ways to Analyze Unstructured Text"
                caption="Full-page mockup showing four analysis tools designed to answer different categories of questions about unstructured text."
                aspectRatio="16/9"
            />

            <FullWidthSection>
                <PingPong
                    src="/work/answers-first/filter.svg"
                    width={1500}
                    height={500}
                    alt="Mockups of the filter sidebar from our analysis tools"
                    reverse
                >
                    <PingPongHeading>Drill Down into the Right Conversations</PingPongHeading>
                    <p>
                        It was essential that we create a way to perform analysis on specific subsets of
                        documents within our projects. I designed and tested a number of different approaches,
                        and settled on a particularly successful design for filtering that was similar to
                        faceted search on an eCommerce website. It won out because it was familiar, easy to
                        use, and set reasonable limits on query complexity. From interviews and observation we
                        found it was perfectly suited for the way users wished to
                        &ldquo;drill-down&rdquo; into meaningful subsets.
                    </p>
                </PingPong>

                <PingPong
                    src="/work/answers-first/concept-details.svg"
                    width={1500}
                    height={500}
                    alt="Mockups of the concept details sidebar from our analysis tools"
                >
                    <PingPongHeading>What is This Topic Really About?</PingPongHeading>
                    <p>
                        It&apos;s easy to assume that when people use an ML text analytics tool that they are
                        trying to avoid reading documents, but that&apos;s not quite true. What they really
                        want to do is to read <em>the right</em> documents.
                    </p>
                    <p>
                        Each analysis tool we built could surface and measure different topics in a unique
                        way, but in the end you still need more context to understand what a topic{' '}
                        <em>really means</em>.
                    </p>
                    <p>
                        The concept details pane was designed to answer a complicated question (i.e. When
                        people talk about &ldquo;Software Update&rdquo;, what do they really mean?), to
                        provide clarity and context, and to surface the right example texts to illustrate
                        how people are using that topic.
                    </p>
                </PingPong>
            </FullWidthSection>

            <Narrow>
                <ProseSection>
                    <ProseSectionHeading>A New Homepage for Each Project</ProseSectionHeading>
                    <ProseSectionBody>
                        <p>
                            The project overview was really the cornerstone of this entire product. This is
                            where we take the first level of insights from each of our new analysis tools and
                            bring it together. The analyst gets a high-level view of the discussions happening
                            within their text, and even how it affects important metrics with their data.
                        </p>
                    </ProseSectionBody>
                </ProseSection>
            </Narrow>

            <FigmaEmbed
                fullWidth
                src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FOhqs8MRvCMTCRRKQtAcCl1%2Fjohnthedesigner.com-%252F-Case-Study-Embeds%3Fnode-id%3D625%253A26422%26t%3D5phMKLiODnvgFAhp-1"
                title="The Project Overview"
                caption="Full-page mockup of the project overview, bringing together insights from all four analysis tools into a single dashboard."
                aspectRatio="16/9"
            />

            <FullWidthSection>
                <PingPong
                    src="/work/answers-first/cards.svg"
                    width={1500}
                    height={500}
                    alt="A mockup of the final design for our overview visualization cards on top of other unused designs"
                    reverse
                >
                    <PingPongHeading>Overview Visualizations</PingPongHeading>
                    <p>
                        The design of these cards was an important and challenging problem. I started with a
                        lot of experimentation in visualization style, color and layout, but things really
                        came together after a few rounds of pair programming and user feedback.
                    </p>
                    <p>
                        Designing in code with engineering partners meant we could test with real users and
                        real data, get raw and accurate feedback about how meaningful this view was, and we
                        made quick progress with quick iterative cycles.
                    </p>
                </PingPong>

                <PingPong
                    src="/work/answers-first/card-captions.svg"
                    width={1500}
                    height={500}
                    alt="A few different visualization cards cropped to show the descriptive captions at the top of the cards"
                >
                    <PingPongHeading>Approachability as a Main Feature</PingPongHeading>
                    <p>
                        The biggest discovery during this design process was that the most important part of
                        our project overview by far was the prose &ldquo;Q&amp;A&rdquo; portion at the top
                        of each visualization card. This simple text-only description not only helped users to
                        understand the visualizations better, they also acted as a quick tour of our analysis
                        capabilities and how they should be interpreted.
                    </p>
                    <p>
                        The immediate interpretability of these cards and their captions was transformative
                        for our sales and client services teams. The product explained itself, what analysis
                        capabilities we had and how they could be used, within moments of uploading data.
                    </p>
                </PingPong>
            </FullWidthSection>

            <Narrow padBottom>
                <ProseSection>
                    <ProseSectionHeading>How Did it Go?</ProseSectionHeading>
                    <ProseSectionBody>
                        <p>
                            We set out to identify the right new analysis tools to build into our product to
                            answer our customers&apos; questions. We wanted to build it into a reorganized UI
                            that could help make the product easier to learn and use and reduce the
                            &ldquo;Time-to-Insight&rdquo;. We also wanted to replace the existing workflow,
                            where users used spreadsheet exports to do analysis work mainly within Excel.
                        </p>
                        <p>
                            Throughout the incremental release of our product updates we observed usage of our
                            application increasing, both in overall usage and as a per-user average. As each
                            new tool was released we also saw usage of our legacy exports decrease, while at the
                            same time the report-ready exports within our new tools increased, demonstrating
                            that our improved, end-to-end workflow quickly became the standard.
                        </p>
                        <p>
                            Of all of the positive feedback we received on the redesigned &amp; reorganized UI,
                            the biggest refrain came from our sales and client services team. The product now
                            demonstrated both its own value, and how the product could be used. We were spending
                            less time instructing users on how to use the software, and less time maintaining
                            the fleet of custom scripts and notebooks so many users required in the past.
                        </p>
                    </ProseSectionBody>
                </ProseSection>

                <NextCaseStudy current="/work/answers-first" />
            </Narrow>

        </main>
    </>
)

const AnswersFirst = () => {
    const pageTitle = caseStudy
        ? `${caseStudy.title} | John the Designer – Boston-Area Product Designer John Livornese`
        : 'Answers First | John the Designer – Boston-Area Product Designer John Livornese'
    const pageDescription = caseStudy?.description ?? 'How I eliminated analysis paralysis by rebuilding the core workflow at Luminoso.'

    return (
        <>
            <Head>
                <title>{pageTitle}</title>
                <meta property="og:title" content={pageTitle} key="title" />
                <meta name="description" content={pageDescription} />
                <meta name="og:image" content={pages.answersFirst?.image ?? '/social-img.png'} />
            </Head>
            {isPrivate
                ? <PasswordProtect isPrivate AuthenticatedContent={AuthenticatedContent} UnauthenticatedContent={UnauthenticatedContent} />
                : <AuthenticatedContent />
            }
        </>
    )
}
export default AnswersFirst
eslint-enable no-unreachable */
