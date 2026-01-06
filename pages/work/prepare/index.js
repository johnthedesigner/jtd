import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '../../../components/Footer'

import Header from '../../../components/Header'
import pages from '../../../utils/pages.json'
import caseStudies from '../../../utils/caseStudies'
import PasswordProtect from '../../../components/PasswordProtect'
import UnauthenticatedContent from '../../../components/UnauthenticatedCaseStudy'
import { palettes } from '../../../utils/colorUtils'

const title = 'Establishing a Design Practice at a Fast-Growing AI Startup | John the Designer'
const description = 'How I built ReflexAI\'s design practice from scratch, established the Forma design system, and led the design of three transformative product features in 18 months.'
const image = '/social-img.png'

const caseStudy = caseStudies.find((cs) => cs.href === '/work/gamma')
const isPrivate = caseStudy ? caseStudy.private : false

const AuthenticatedContent = () => {
    return (
        <div id="main">
            <Header blue />
            <div className="new-case-study__hero">
                <div className="new-case-study__hero-content">
                    <h1 className="new-case-study__title">
                        Building Prepare
                    </h1>
                    <h2 className="new-case-study__subtitle">
                        Establishing Design Practice at a Fast-Growing AI Startup
                    </h2>
                </div>
                <Image
                    src="/work/prepare/header.svg"
                    className="new-case-study__hero-image"
                    width="2396"
                    height="1656"
                    alt="Design system components and interface mockups showing the evolution of ReflexAI's Prepare platform"
                />
            </div>
            <div className="new-case-study__body">
                <div className="tldr">
                    <div className="tldr__main">
                        <h2 className="tldr__title">TL;DR</h2>
                        <p className="tldr__text">
                            I joined ReflexAI as their founding product designer when the company had ~20 employees and an innovative AI training product that was ready to scale. Over 18 months, I established the design practice from scratch, was instrumental in founding the Forma design system, and led the design of three transformative product features—voice simulations, user-created scenarios (Studio), and AI-generated simulations. Each feature built strategically on the previous one, enabled by systematic design thinking. The company scaled to 50+ employees, I grew the design team to three, and Prepare evolved from a promising MVP into a sophisticated, ethically-designed conversation training platform used for crisis intervention, healthcare, and customer service.
                        </p>
                    </div>
                    <div className="tldr__aside">
                        <div>
                            <h4 className="tldr__aside-title">My Role</h4>
                            <p className="tldr__aside-text">
                                As the founding product designer (now leading a team of three), I established design processes, was instrumental in founding and developing our design system, and served as design lead for major strategic initiatives on our flagship product. I conducted research studies, collaborated closely with product and engineering leadership to shape our roadmap, and helped build a cross-functional culture that values thoughtful, systematic design.
                            </p>
                        </div>
                        <div>
                            <h4 className="tldr__aside-title">Outcome</h4>
                            <p className="tldr__aside-text">
                                Grew design team from 1 to 3 designers with established processes and practice. Helped establish Forma design system with atomic and composed components, fully engineering-supported and documented. Shipped voice modality, self-serve creation tools, and AI-generation capabilities sequentially over 18 months. Sales and customer success teams report dramatically easier product demonstrations and faster customer onboarding.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="page-section page-section--centered">
                    <div className="page-section__text-container">
                        <h2 className="page-section__title">
                            The Challenge & the Opportunity
                        </h2>
                        <p>
                            I was brought to ReflexAI in April 2024 because of my experience establishing design practices in fast-growing startups and building greenfield products within larger organizations. The company was at an exciting inflection point with about 20 employees and something genuinely innovative: an AI-powered "conversation flight simulator" that could adapt, respond dynamically, and provide intelligent feedback on communication skills.
                        </p>
                        <p>
                            Prepare was already serving crisis centers, healthcare organizations, and customer service teams. It had proven the concept and found early traction. The product had been built rapidly to test the market opportunity, and while the core functionality was strong, there were natural rough edges. The information architecture could be more intuitive, and the visual design needed the polish and nuance to stand out in a competitive market. Most importantly, Prepare is used to train people for high-stakes, emotionally sensitive conversations—the design needed to reflect that gravity and sophistication.
                        </p>
                        {/* <p> // TEMPORARILY REMOVED
                            This was the kind of challenge I love: taking a promising product with real potential and helping it reach maturity. To become the definitive training platform in this space, we needed to solve three interconnected problems:
                        </p>
                        <ol>
                            <li><strong>Build design foundations</strong> that could support rapid product evolution</li>
                            <li><strong>Expand beyond text</strong> to support realistic voice-based training</li>
                            <li><strong>Democratize customization</strong> so organizations could create training for their specific needs</li>
                        </ol>
                        <p>
                            My role was to establish the design practice and systems thinking that would make this transformation possible—at startup velocity.
                        </p> */}
                    </div>
                </div>

                <div className="page-section page-section--centered">
                    <div className="page-section__text-container">
                        <h2 className="page-section__title">
                            Strategic Approach
                        </h2>
                        <p>
                            Throughout my career—from small startups to large public companies building greenfield products—I've learned that moving fast without accumulating design debt requires systems thinking. My approach centered on three principles:
                        </p>
                        <p>
                            <strong>1. Build in parallel, not in sequence</strong> - We would build the design system alongside new features, using each feature as an opportunity to establish new patterns. This required earning buy-in that investing in systems would accelerate future work.
                        </p>
                        <p>
                            <strong>2. Scope for strategic impact, not perfection</strong> - In a competitive market, we needed to ship meaningful improvements quickly through deliberate tradeoffs about V1 scope.
                        </p>
                        <p>
                            <strong>3. Design for ethical responsibility</strong> - Every design decision needed to balance realism with psychological safety, power with accessibility, and automation with human oversight.
                        </p>
                    </div>
                </div>

                <div className="page-section page-section--centered" style={{ backgroundColor: palettes['purple-heart'][2].value, padding: '4rem 2rem', margin: '4rem auto', borderRadius: '16px', mixBlendMode: 'multiply' }}>
                    <div className="page-section__text-container">
                        <h4 className="page-section__subtitle">The Foundation:</h4>
                        <h2 className="page-section__title">
                            Forma Design System
                        </h2>
                        <p>
                            Before we could transform the product, we needed to transform how we built it. I was instrumental in founding Forma, our design system, which became the critical foundation enabling rapid, consistent feature development throughout this transformation.
                        </p>
                        <p>
                            I started by creating a Figma component library and successfully advocated for dedicated design system work on our roadmap. Working cross-functionally with engineering, we built a fully documented, engineering-supported system with interactive demos and smart migration strategies. Forma allowed us to ship the voice, Studio, and AI-generation features with visual consistency and dramatically faster handoff, while making it possible to scale the design team from one to three designers.
                        </p>
                        <Link href="/work/forma" className="button" style={{ background: palettes['purple-heart'][5].value }}>See the Forma case study</Link>
                    </div>
                </div>

                <div className="page-section page-section--centered">
                    <div className="page-section__text-container">
                        <h4 className="page-section__subtitle">Building Prepare, Act I:</h4>
                        <h2 className="page-section__title">
                            Voice Simulations
                        </h2>
                        <p>
                            When I joined, <em>Prepare</em> was text-only. Users could practice conversations through chat-based simulations, but most real conversations our users needed to prepare for were spoken. Phone calls with people in crisis, healthcare outreach, customer service escalations—these require tone management, active listening, pacing, and empathy that are difficult to practice through text alone.
                        </p>

                        <h4>
                            The Design Challenge
                        </h4>
                        <p>
                            Voice introduces complexity that doesn't exist in text: real-time pressure where you can't pause and edit, emotional tone that needs to feel realistic without traumatizing trainees, and feedback on communication skills that must be constructive rather than demoralizing. We also needed to design for rapidly evolving voice AI technology, balancing current capabilities with anticipated improvements.
                        </p>
                        <Image
                            src="/work/prepare/voice-sim.svg"
                            className="wide-table"
                            width="1500"
                            height="560"
                            alt="Voice simulation experience showing an active voice call"
                        />
                        <h4 className="work__art-caption">
                            Voice simulation experience showing an active voice call.
                        </h4>
                        <p>
                            We made deliberate scoping decisions for V1, focusing on the core training loop—start simulation, have conversation, receive feedback—rather than trying to achieve feature parity with all text capabilities immediately. This let us validate the concept and gather real usage data before expanding.
                        </p>
                        <Image
                            src="/work/prepare/more-details.png"
                            className="wide-table"
                            width="1500"
                            height="893"
                            alt="Example UI details from the voice call experience and voice call transcript views"
                        />
                        <h4 className="work__art-caption">
                            Example UI details from the voice call experience and voice call transcript views.
                        </h4>

                        <h4>
                            The Result
                        </h4>
                        <p>
                            Voice simulations transformed how organizations used Prepare. Crisis centers could now train counselors on phone-based interventions. Healthcare teams could practice difficult patient conversations. Customer service teams could build confidence handling escalated calls. Users reported that practicing in the actual medium they used daily made training more effective and transferable to real situations.
                        </p>
                    </div>
                </div>

                <div className="page-section page-section--centered">
                    <div className="page-section__text-container">
                        <h4 className="page-section__subtitle">Building Prepare, Act II:</h4>
                        <h2 className="page-section__title">
                            Build-Your-Own Scenarios with Studio
                        </h2>
                        <p>
                            With text and voice simulations working well, we kept hearing: "Can you build a simulation for our specific scenario?" Healthcare organizations wanted training specific to their patient populations. Crisis centers needed scenarios reflecting their community's unique challenges. Our customer success team was manually configuring custom scenarios, but it didn't scale.
                        </p>

                        <h4>
                            The Design Challenge: Power vs. Accessibility
                        </h4>
                        <p>
                            I needed to design tools that were powerful enough for sophisticated customization yet accessible enough that a training manager with no technical background could create a simulation. The wrong approach would expose every parameter upfront, creating an intimidating and error-prone experience. But hiding too much would feel limiting.
                        </p>
                        <Image
                            src="/work/prepare/summary.svg"
                            className="wide-table"
                            width="1500"
                            height="560"
                            alt="The summary page of a newly created simulation from our new simulation creation experience in Reflex Studio"
                        />
                        <h4 className="work__art-caption">
                            The summary page of a newly created simulation from our new simulation creation experience in Reflex Studio.
                        </h4>
                        <p>
                            I designed the Simulation creation experience around a core insight: users don't start with a blank slate. They start with an idea of what conversation they need to practice, who the simulated person should be, and what skills they're trying to develop.
                        </p>
                        <p>
                            The interface acts like a series of writing prompts, guiding users through defining the scenario, imagining the persona's background and behavior, setting learning objectives and scoring criteria, then testing and refining. At each step, we provide smart defaults based on common use cases while exposing deeper customization for power users. The interface scales complexity based on user choices.
                        </p>
                        <Image
                            src="/work/prepare/simulation-editor.svg"
                            className="wide-table"
                            width="1500"
                            height="560"
                            alt="Example UI from Reflex Studio's simulation editor experience"
                        />
                        <h4 className="work__art-caption">
                            Example UI from Reflex Studio's simulation editor experience.
                        </h4>

                        <h4>
                            The Result
                        </h4>
                        <p>
                            Studio transformed ReflexAI's business model. Organizations that previously needed hands-on support could now create customized training independently. This reduced the strain of scaling on our customer success team, improved satisfaction through faster time-to-value, and opened up use cases we hadn't anticipated. Training managers became designers of their own learning experiences.
                        </p>
                    </div>
                </div>

                <div className="page-section page-section--centered">
                    <div className="page-section__text-container">
                        <h4 className="page-section__subtitle">Building Prepare, Act III:</h4>
                        <h2 className="page-section__title">
                            AI-Generated Simulations
                        </h2>
                        <p>
                            Studio proved customers wanted custom content, but even with our streamlined flow, building a quality simulation required thought, time, and iteration. The next evolution: what if AI could do the heavy lifting, letting users focus on refinement rather than generation and significantly reducing time-to-value?
                        </p>

                        <h4>
                            The Design Solution
                        </h4>
                        <p>
                            The AI-generation feature fundamentally shifts the Studio workflow. Users now start with a simple description:
                        </p>
                        <p style={{ fontStyle: 'italic', padding: '1rem', backgroundColor: palettes['purple-heart'][1].value, borderLeft: `4px solid ${palettes['purple-heart'][4].value}`, margin: '1rem 0' }}>
                            "I need a simulation where a customer calls because their online order was delayed and they're upset about missing an important event."
                        </p>
                        <p>
                            The AI instantly generates detailed scenarios including rich background context, behavioral parameters, appropriate emotional complexity, and suggested scoring dimensions. But generation is only the beginning. Users can immediately suggest changes and details regenerate instantly, creating a collaborative refinement loop. Users stay in control while AI removes the blank-page problem and accelerates creation.
                        </p>
                        <Image
                            src="/work/prepare/chat-input.svg"
                            className="wide-table"
                            width="1500"
                            height="560"
                            alt="AI-generation input interface where users describe scenarios in natural language for instant creation"
                        />
                        <h4 className="work__art-caption">
                            AI-generation input interface where users describe scenarios in natural language for instant creation.
                        </h4>
                        <p>
                            Because we'd already built Studio's creation and editing tools, AI-generation didn't require redesigning the entire experience. It's a new entry point into the same configuration system. The AI generates to the same schema users were manually configuring, so all of Studio's features—testing, refinement, version control—work seamlessly with AI-generated scenarios.
                        </p>
                        <p>
                            With AI-generation for crisis intervention and healthcare training, we were especially thoughtful about quality and appropriateness. We designed safeguards and review mechanisms while maintaining a key principle: humans stay in the loop. AI proposes, humans refine and approve. This balance provides the speed of automation with the safety of human judgment.
                        </p>
                        <Image
                            src="/work/prepare/scenario-details.svg"
                            className="wide-table"
                            width="1500"
                            height="560"
                            alt="Generated scenario details panel showing AI-created background, behavioral parameters, and suggested refinements"
                        />
                        <h4 className="work__art-caption">
                            Generated scenario details panel showing AI-created background, behavioral parameters, and suggested refinements.
                        </h4>

                        <h4>
                            The Result
                        </h4>
                        <p>
                            AI-generation represents the culmination of our sequential feature strategy. Voice established realistic training modalities. Studio gave users creation tools. AI-generation made creation effortless while preserving control. Together, they've transformed Prepare from a product with pre-configured training to a platform where organizations can create sophisticated, customized training in minutes.
                        </p>
                    </div>
                </div>

                <div className="page-section page-section--centered">
                    <div className="page-section__text-container">
                        <h2 className="page-section__title">
                            Impact & Reflection
                        </h2>

                        <p>
                            Over my first 18 months at ReflexAI:
                        </p>
                        <ul className='case-study--list'>
                            <li>Helped grow design team from 1 to 3 designers with established processes</li>
                            <li>Helped establish Forma design system with atomic and composed components, fully documented</li>
                            <li>Led design for three major product transformations: Voice-based Simulations, Reflex Studio, and AI-assisted scenario generation</li>
                            <li>Company grew from fewer than 20 to more than 50 employees</li>
                            <li>Prepare evolved from promising MVP to sophisticated training platform serving crisis centers, healthcare, and enterprise customer service</li>
                        </ul>

                        <h4>
                            What Made It Work
                        </h4>
                        <p>
                            <strong>Systems thinking from day one</strong> - Advocating for and helping establish Forma was essential to accelerating our work. Building the design system in parallel with new features let us maintain consistency and speed as we evolved the product.
                        </p>
                        <p>
                            <strong>Strategic sequencing</strong> - The sequencing of Voice → Studio → AI-generation allowed each feature to validate assumptions, prove capabilities, and build infrastructure that the next feature leveraged.
                        </p>
                        <p>
                            <strong>Collaborative scoping</strong> - Working closely with product and engineering leadership to sequence work, make tradeoffs, and focus on strategic impact meant we could move fast without sacrificing quality.
                        </p>
                        <p>
                            Establishing a design practice at a fast-growing startup while simultaneously driving major product evolution requires balancing speed with sustainability. I'm proud that Prepare is faster, more powerful, and more accessible than when I joined, the design practice is established and growing, and most importantly, we're helping organizations train people for some of the most important conversations they'll ever have.
                        </p>

                        <div
                            style={{
                                textAlign: 'center',
                                marginTop: '6rem',
                            }}
                        >
                            <Link className="case-studies-link" href="/work">
                                <span className="case-studies-link__count">+3 more case studies</span>
                                <svg className="case-studies-link__divider" width="100%" height="3" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <line x1="0" y1="1.5" x2="100%" y2="1.5" stroke="white" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                                <span className="case-studies-link__label">View 'em All</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}

const Gamma = () => {
    return (
        <>
            <Head>
                <title>{title}</title>
                <meta property="og:title" content={title} key="title" />
                <meta name="description" content={description} />
                <meta name="og:image" content={image} />
            </Head>
            {isPrivate ? <PasswordProtect isPrivate={true} AuthenticatedContent={AuthenticatedContent} UnauthenticatedContent={UnauthenticatedContent} /> : <AuthenticatedContent />}
        </>
    )
}

export default Gamma