import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import {
    ProseSection, ProseSectionHeading, ProseSectionSubheading, ProseSectionBody,
} from '@/components/case-study/ProseSection'
import { CaseStudyHero } from '@/components/case-study/CaseStudyHero'
import { TLDRBlock, TLDRItemWhite } from '@/components/case-study/TLDRBlock'
import { NextCaseStudy } from '@/components/case-study/NextCaseStudy'
import caseStudies from '@/utils/caseStudies'
import pages from '@/utils/pages.json'
import PasswordProtect from '@/components/PasswordProtect'
import UnauthenticatedContent from '@/components/UnauthenticatedCaseStudy'

const caseStudy = caseStudies.find(cs => cs.href === '/work/prepare')
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

const InlineImage = ({ src, width, height, alt, caption }) => (
    <figure style={{ margin: '8px 0 0' }}>
        <div style={{
            borderRadius: '10px',
            overflow: 'hidden',
            background: 'white',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-8)',
        }}>
            <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '4px' }}
            />
        </div>
        {caption && (
            <figcaption style={{
                fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                fontSize: '12px',
                fontWeight: 400,
                lineHeight: 1.5,
                color: 'var(--color-on-surface-muted)',
                marginTop: '10px',
                paddingLeft: '4px',
            }}>
                {caption}
            </figcaption>
        )}
    </figure>
)

const FullWidthImage = ({ src, width, height, alt, caption }) => (
    <figure style={{ margin: 0 }}>
        <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            style={{ width: '100%', height: 'auto', display: 'block' }}
        />
        {caption && (
            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '10px 24px 0' }}>
                <figcaption style={{
                    fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                    fontSize: '12px',
                    fontWeight: 400,
                    lineHeight: 1.5,
                    color: 'var(--color-on-surface-muted)',
                }}>
                    {caption}
                </figcaption>
            </div>
        )}
    </figure>
)

const CalloutBlock = ({ subtitle, title, children }) => (
    <div style={{
        background: 'rgba(22, 131, 255, 0.07)',
        border: '1px solid rgba(22, 131, 255, 0.2)',
        borderRadius: '14px',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    }}>
        {subtitle && (
            <p style={{
                fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-primary)',
                margin: 0,
            }}>
                {subtitle}
            </p>
        )}
        {title && (
            <h2 style={{
                fontFamily: 'var(--font-fraunces), Georgia, serif',
                fontSize: 'clamp(24px, 3vw, 32px)',
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                color: 'var(--color-on-surface)',
                margin: 0,
            }}>
                {title}
            </h2>
        )}
        {children}
    </div>
)

const Blockquote = ({ children }) => (
    <blockquote style={{
        margin: '8px 0',
        padding: '16px 20px',
        background: 'rgba(22, 131, 255, 0.05)',
        borderLeft: '4px solid var(--color-primary)',
        borderRadius: '0 8px 8px 0',
        fontStyle: 'italic',
        fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
        fontSize: '16px',
        lineHeight: 1.65,
        color: 'var(--color-on-surface-body)',
    }}>
        {children}
    </blockquote>
)

const AuthenticatedContent = () => (
    <>
        <CaseStudyHero
            company="ReflexAI"
            title="Building Prepare"
            subtitle="Establishing Design Practice at a Fast-Growing AI Startup"
            imageSrc="/work/prepare/header.svg"
            imageWidth={2396}
            imageHeight={1656}
            imageAlt="Design system components and interface mockups showing the evolution of ReflexAI's Prepare platform"
        />

        <main style={{ display: 'flex', flexDirection: 'column' }}>

            {/* Intro */}
            <Narrow>
                <TLDRBlock summary="I joined ReflexAI as their founding product designer when the company had ~20 employees and an innovative AI training product that was ready to scale. Over 18 months, I established the design practice from scratch, was instrumental in founding the Forma design system, and led the design of three transformative product features—voice simulations, user-created scenarios (Studio), and AI-generated simulations. Each feature built strategically on the previous one, enabled by systematic design thinking. The company scaled to 50+ employees, I grew the design team to three, and Prepare evolved from a promising MVP into a sophisticated, ethically-designed conversation training platform used for crisis intervention, healthcare, and customer service.">
                    <TLDRItemWhite label="My Role">
                        As the founding product designer (now leading a team of three), I established design
                        processes, was instrumental in founding and developing our design system, and served as
                        design lead for major strategic initiatives on our flagship product. I conducted research
                        studies, collaborated closely with product and engineering leadership to shape our roadmap,
                        and helped build a cross-functional culture that values thoughtful, systematic design.
                    </TLDRItemWhite>
                    <TLDRItemWhite label="Outcome">
                        Grew design team from 1 to 3 designers with established processes and practice. Helped
                        establish Forma design system with atomic and composed components, fully engineering-supported
                        and documented. Shipped voice modality, self-serve creation tools, and AI-generation
                        capabilities sequentially over 18 months. Sales and customer success teams report
                        dramatically easier product demonstrations and faster customer onboarding.
                    </TLDRItemWhite>
                </TLDRBlock>

                <ProseSection>
                    <ProseSectionHeading>The Challenge &amp; the Opportunity</ProseSectionHeading>
                    <ProseSectionBody>
                        <p>
                            I was brought to ReflexAI in April 2024 because of my experience establishing design
                            practices in fast-growing startups and building greenfield products within larger
                            organizations. The company was at an exciting inflection point with about 20 employees
                            and something genuinely innovative: an AI-powered &ldquo;conversation flight
                            simulator&rdquo; that could adapt, respond dynamically, and provide intelligent
                            feedback on communication skills.
                        </p>
                        <p>
                            Prepare was already serving crisis centers, healthcare organizations, and customer
                            service teams. It had proven the concept and found early traction. The product had
                            been built rapidly to test the market opportunity, and while the core functionality
                            was strong, there were natural rough edges. The information architecture could be
                            more intuitive, and the visual design needed the polish and nuance to stand out in a
                            competitive market. Most importantly, Prepare is used to train people for
                            high-stakes, emotionally sensitive conversations—the design needed to reflect that
                            gravity and sophistication.
                        </p>
                    </ProseSectionBody>
                </ProseSection>

                <ProseSection>
                    <ProseSectionHeading>Strategic Approach</ProseSectionHeading>
                    <ProseSectionBody>
                        <p>
                            Throughout my career—from small startups to large public companies building
                            greenfield products—I&apos;ve learned that moving fast without accumulating design
                            debt requires systems thinking. My approach centered on three principles:
                        </p>
                        <p>
                            <strong>1. Build in parallel, not in sequence</strong> — We would build the design
                            system alongside new features, using each feature as an opportunity to establish new
                            patterns. This required earning buy-in that investing in systems would accelerate
                            future work.
                        </p>
                        <p>
                            <strong>2. Scope for strategic impact, not perfection</strong> — In a competitive
                            market, we needed to ship meaningful improvements quickly through deliberate
                            tradeoffs about V1 scope.
                        </p>
                        <p>
                            <strong>3. Design for ethical responsibility</strong> — Every design decision needed
                            to balance realism with psychological safety, power with accessibility, and
                            automation with human oversight.
                        </p>
                    </ProseSectionBody>
                </ProseSection>

                <CalloutBlock subtitle="The Foundation:" title="Forma Design System">
                    <p style={{
                        fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                        fontSize: '16px',
                        lineHeight: 1.7,
                        color: 'var(--color-on-surface-body)',
                        margin: 0,
                    }}>
                        Before we could transform the product, we needed to transform how we built it. I was
                        instrumental in founding Forma, our design system, which became the critical foundation
                        enabling rapid, consistent feature development throughout this transformation.
                    </p>
                    <p style={{
                        fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                        fontSize: '16px',
                        lineHeight: 1.7,
                        color: 'var(--color-on-surface-body)',
                        margin: 0,
                    }}>
                        I started by creating a Figma component library and successfully advocated for dedicated
                        design system work on our roadmap. Working cross-functionally with engineering, we built
                        a fully documented, engineering-supported system with interactive demos and smart
                        migration strategies. Forma allowed us to ship the voice, Studio, and AI-generation
                        features with visual consistency and dramatically faster handoff, while making it
                        possible to scale the design team from one to three designers.
                    </p>
                    <div>
                        <Link
                            href="/work/forma"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                height: '40px',
                                padding: '0 20px',
                                background: 'var(--color-primary)',
                                color: 'white',
                                fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                                fontSize: '13px',
                                fontWeight: 700,
                                textDecoration: 'none',
                                borderRadius: '8px',
                            }}
                        >
                            See the Forma case study
                        </Link>
                    </div>
                </CalloutBlock>

                {/* Act I intro */}
                <ProseSection>
                    <ProseSectionSubheading>Building Prepare, Act I:</ProseSectionSubheading>
                    <ProseSectionHeading>Voice Simulations</ProseSectionHeading>
                    <ProseSectionBody>
                        <p>
                            When I joined, <em>Prepare</em> was text-only. Users could practice conversations
                            through chat-based simulations, but most real conversations our users needed to
                            prepare for were spoken. Phone calls with people in crisis, healthcare outreach,
                            customer service escalations—these require tone management, active listening, pacing,
                            and empathy that are difficult to practice through text alone.
                        </p>
                        <ProseSectionSubheading>The Design Challenge</ProseSectionSubheading>
                        <p>
                            Voice introduces complexity that doesn&apos;t exist in text: real-time pressure
                            where you can&apos;t pause and edit, emotional tone that needs to feel realistic
                            without traumatizing trainees, and feedback on communication skills that must be
                            constructive rather than demoralizing. We also needed to design for rapidly evolving
                            voice AI technology, balancing current capabilities with anticipated improvements.
                        </p>
                    </ProseSectionBody>
                </ProseSection>
            </Narrow>

            <FullWidthImage
                src="/work/prepare/voice-sim.svg"
                width={1500}
                height={560}
                alt="Voice simulation experience showing an active voice call"
                caption="Voice simulation experience showing an active voice call."
            />

            <Narrow>
                <ProseSection>
                    <ProseSectionBody>
                        <p>
                            We made deliberate scoping decisions for V1, focusing on the core training loop—start
                            simulation, have conversation, receive feedback—rather than trying to achieve feature
                            parity with all text capabilities immediately. This let us validate the concept and
                            gather real usage data before expanding.
                        </p>
                    </ProseSectionBody>
                </ProseSection>
            </Narrow>

            <FullWidthImage
                src="/work/prepare/more-details.png"
                width={1500}
                height={893}
                alt="Example UI details from the voice call experience and voice call transcript views"
                caption="Example UI details from the voice call experience and voice call transcript views."
            />

            <Narrow>
                <ProseSection>
                    <ProseSectionBody>
                        <ProseSectionSubheading>The Result</ProseSectionSubheading>
                        <p>
                            Voice simulations transformed how organizations used Prepare. Crisis centers could
                            now train counselors on phone-based interventions. Healthcare teams could practice
                            difficult patient conversations. Customer service teams could build confidence
                            handling escalated calls. Users reported that practicing in the actual medium they
                            used daily made training more effective and transferable to real situations.
                        </p>
                    </ProseSectionBody>
                </ProseSection>

                {/* Act II intro */}
                <ProseSection>
                    <ProseSectionSubheading>Building Prepare, Act II:</ProseSectionSubheading>
                    <ProseSectionHeading>Build-Your-Own Scenarios with Studio</ProseSectionHeading>
                    <ProseSectionBody>
                        <p>
                            With text and voice simulations working well, we kept hearing: &ldquo;Can you build
                            a simulation for our specific scenario?&rdquo; Healthcare organizations wanted
                            training specific to their patient populations. Crisis centers needed scenarios
                            reflecting their community&apos;s unique challenges. Our customer success team was
                            manually configuring custom scenarios, but it didn&apos;t scale.
                        </p>
                        <ProseSectionSubheading>The Design Challenge: Power vs. Accessibility</ProseSectionSubheading>
                        <p>
                            I needed to design tools that were powerful enough for sophisticated customization
                            yet accessible enough that a training manager with no technical background could
                            create a simulation. The wrong approach would expose every parameter upfront,
                            creating an intimidating and error-prone experience. But hiding too much would feel
                            limiting.
                        </p>
                    </ProseSectionBody>
                </ProseSection>
            </Narrow>

            <FullWidthImage
                src="/work/prepare/summary.svg"
                width={1500}
                height={560}
                alt="The summary page of a newly created simulation from our new simulation creation experience in Reflex Studio"
                caption="The summary page of a newly created simulation from our new simulation creation experience in Reflex Studio."
            />

            <Narrow>
                <ProseSection>
                    <ProseSectionBody>
                        <p>
                            I designed the Simulation creation experience around a core insight: users
                            don&apos;t start with a blank slate. They start with an idea of what conversation
                            they need to practice, who the simulated person should be, and what skills
                            they&apos;re trying to develop.
                        </p>
                        <p>
                            The interface acts like a series of writing prompts, guiding users through defining
                            the scenario, imagining the persona&apos;s background and behavior, setting learning
                            objectives and scoring criteria, then testing and refining. At each step, we provide
                            smart defaults based on common use cases while exposing deeper customization for
                            power users. The interface scales complexity based on user choices.
                        </p>
                    </ProseSectionBody>
                </ProseSection>
            </Narrow>

            <FullWidthImage
                src="/work/prepare/simulation-editor.svg"
                width={1500}
                height={560}
                alt="Example UI from Reflex Studio's simulation editor experience"
                caption="Example UI from Reflex Studio's simulation editor experience."
            />

            <Narrow>
                <ProseSection>
                    <ProseSectionBody>
                        <ProseSectionSubheading>The Result</ProseSectionSubheading>
                        <p>
                            Studio transformed ReflexAI&apos;s business model. Organizations that previously
                            needed hands-on support could now create customized training independently. This
                            reduced the strain of scaling on our customer success team, improved satisfaction
                            through faster time-to-value, and opened up use cases we hadn&apos;t anticipated.
                            Training managers became designers of their own learning experiences.
                        </p>
                    </ProseSectionBody>
                </ProseSection>

                {/* Act III intro */}
                <ProseSection>
                    <ProseSectionSubheading>Building Prepare, Act III:</ProseSectionSubheading>
                    <ProseSectionHeading>AI-Generated Simulations</ProseSectionHeading>
                    <ProseSectionBody>
                        <p>
                            Studio proved customers wanted custom content, but even with our streamlined flow,
                            building a quality simulation required thought, time, and iteration. The next
                            evolution: what if AI could do the heavy lifting, letting users focus on refinement
                            rather than generation and significantly reducing time-to-value?
                        </p>
                        <ProseSectionSubheading>The Design Solution</ProseSectionSubheading>
                        <p>
                            The AI-generation feature fundamentally shifts the Studio workflow. Users now start
                            with a simple description:
                        </p>
                        <Blockquote>
                            &ldquo;I need a simulation where a customer calls because their online order was
                            delayed and they&apos;re upset about missing an important event.&rdquo;
                        </Blockquote>
                        <p>
                            The AI instantly generates detailed scenarios including rich background context,
                            behavioral parameters, appropriate emotional complexity, and suggested scoring
                            dimensions. But generation is only the beginning. Users can immediately suggest
                            changes and details regenerate instantly, creating a collaborative refinement loop.
                            Users stay in control while AI removes the blank-page problem and accelerates
                            creation.
                        </p>
                    </ProseSectionBody>
                </ProseSection>
            </Narrow>

            <Narrow>
                <ProseSection>
                    <ProseSectionBody>
                        <InlineImage
                            src="/work/prepare/chat-input.svg"
                            width={1500}
                            height={560}
                            alt="AI-generation input interface where users describe scenarios in natural language for instant creation"
                            caption="AI-generation input interface where users describe scenarios in natural language for instant creation."
                        />
                        <p>
                            Because we&apos;d already built Studio&apos;s creation and editing tools,
                            AI-generation didn&apos;t require redesigning the entire experience. It&apos;s a new
                            entry point into the same configuration system. The AI generates to the same schema
                            users were manually configuring, so all of Studio&apos;s features—testing,
                            refinement, version control—work seamlessly with AI-generated scenarios.
                        </p>
                        <p>
                            With AI-generation for crisis intervention and healthcare training, we were
                            especially thoughtful about quality and appropriateness. We designed safeguards and
                            review mechanisms while maintaining a key principle: humans stay in the loop. AI
                            proposes, humans refine and approve. This balance provides the speed of automation
                            with the safety of human judgment.
                        </p>
                    </ProseSectionBody>
                </ProseSection>
            </Narrow>

            <FullWidthImage
                src="/work/prepare/scenario-details.svg"
                width={1500}
                height={560}
                alt="Generated scenario details panel showing AI-created background, behavioral parameters, and suggested refinements"
                caption="Generated scenario details panel showing AI-created background, behavioral parameters, and suggested refinements."
            />

            <Narrow padBottom>
                <ProseSection>
                    <ProseSectionBody>
                        <ProseSectionSubheading>The Result</ProseSectionSubheading>
                        <p>
                            AI-generation represents the culmination of our sequential feature strategy. Voice
                            established realistic training modalities. Studio gave users creation tools.
                            AI-generation made creation effortless while preserving control. Together,
                            they&apos;ve transformed Prepare from a product with pre-configured training to a
                            platform where organizations can create sophisticated, customized training in minutes.
                        </p>
                    </ProseSectionBody>
                </ProseSection>

                <ProseSection>
                    <ProseSectionHeading>Impact &amp; Reflection</ProseSectionHeading>
                    <ProseSectionBody>
                        <p>Over my first 18 months at ReflexAI:</p>
                        <ul>
                            <li>Helped grow design team from 1 to 3 designers with established processes</li>
                            <li>Helped establish Forma design system with atomic and composed components, fully documented</li>
                            <li>Led design for three major product transformations: Voice-based Simulations, Reflex Studio, and AI-assisted scenario generation</li>
                            <li>Company grew from fewer than 20 to more than 50 employees</li>
                            <li>Prepare evolved from promising MVP to sophisticated training platform serving crisis centers, healthcare, and enterprise customer service</li>
                        </ul>
                        <ProseSectionSubheading>What Made It Work</ProseSectionSubheading>
                        <p>
                            <strong>Systems thinking from day one</strong> — Advocating for and helping establish
                            Forma was essential to accelerating our work. Building the design system in parallel
                            with new features let us maintain consistency and speed as we evolved the product.
                        </p>
                        <p>
                            <strong>Strategic sequencing</strong> — The sequencing of Voice → Studio → AI-generation
                            allowed each feature to validate assumptions, prove capabilities, and build
                            infrastructure that the next feature leveraged.
                        </p>
                        <p>
                            <strong>Collaborative scoping</strong> — Working closely with product and engineering
                            leadership to sequence work, make tradeoffs, and focus on strategic impact meant we
                            could move fast without sacrificing quality.
                        </p>
                        <p>
                            Establishing a design practice at a fast-growing startup while simultaneously driving
                            major product evolution requires balancing speed with sustainability. I&apos;m proud
                            that Prepare is faster, more powerful, and more accessible than when I joined, the
                            design practice is established and growing, and most importantly, we&apos;re helping
                            organizations train people for some of the most important conversations they&apos;ll
                            ever have.
                        </p>
                    </ProseSectionBody>
                </ProseSection>

                <NextCaseStudy current="/work/prepare" />
            </Narrow>

        </main>
    </>
)

const Prepare = () => {
    const pageTitle = caseStudy
        ? `${caseStudy.title} | John the Designer – Boston-Area Product Designer John Livornese`
        : 'Building Prepare | John the Designer – Boston-Area Product Designer John Livornese'
    const pageDescription = caseStudy?.description ?? 'How I established a design practice at a fast-growing AI startup, founded the Forma design system, and led three transformative product features in 18 months.'

    return (
        <>
            <Head>
                <title>{pageTitle}</title>
                <meta property="og:title" content={pageTitle} key="title" />
                <meta name="description" content={pageDescription} />
                <meta name="og:image" content={pages.prepare?.image ?? '/social-img.png'} />
            </Head>
            {isPrivate
                ? <PasswordProtect isPrivate AuthenticatedContent={AuthenticatedContent} UnauthenticatedContent={UnauthenticatedContent} />
                : <AuthenticatedContent />
            }
        </>
    )
}

export default Prepare
