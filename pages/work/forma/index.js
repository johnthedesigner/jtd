import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '../../../components/Footer'

import Header from '../../../components/Header'
import pages from '../../../utils/pages.json'
import caseStudies from '../../../utils/caseStudies'
import PasswordProtect from '../../../components/PasswordProtect'
import UnauthenticatedContent from '../../../components/UnauthenticatedCaseStudy'

const title = 'Forma: A Design System at the Speed of Startup | John the Designer'
const description = 'Building a design system from scratch while shipping features at startup velocity—creating systematic design that became a competitive advantage.'
const image = '/social-img.png'

const caseStudy = caseStudies.find((cs) => cs.href === '/work/forma')
const isPrivate = caseStudy ? caseStudy.private : false

const AuthenticatedContent = () => {
    return (
        <>
            <Head>
                <title>{`${caseStudy ? caseStudy.title : title} | John the Designer – Boston-Area Product Designer John Livornese`}</title>
                <meta property="og:title" content={`${caseStudy ? caseStudy.title : title} | John the Designer – Boston-Area Product Designer John Livornese`} key="title" />
                <meta name="description" content={caseStudy ? caseStudy.description : description} />
                <meta name="og:image" content={pages.forma.image} />
            </Head>
            <div id="main">
                <Header blue />
                <div className="new-case-study__hero">
                    <div className="new-case-study__hero-content">
                        <h1 className="new-case-study__title">
                            Forma
                        </h1>
                        <h2 className="new-case-study__subtitle">
                            A Design System at the Speed of Startup
                        </h2>
                    </div>
                    <Image
                        src="/work/forma/header.svg"
                        className="new-case-study__hero-image"
                        width="2396"
                        height="1656"
                        alt="Design system components and documentation showing the evolution of ReflexAI's Forma design system"
                    />
                </div>
                <div className="new-case-study__body">
                    <div className="tldr">
                        <div className="tldr__main">
                            <h2 className="tldr__title">TL;DR</h2>
                            <p className="tldr__text">
                                When I joined ReflexAI as their founding product designer, the company had built an innovative AI training product that was ready to scale. Like many early-stage startups moving fast to validate their market, they needed more systematic design to accelerate past the initial MVP stage. Over my first year, I founded a Figma component library, demonstrated value through improved consistency and usability, and was instrumental in bringing together designers and engineers into a dedicated design systems practice. The result wasn't just a collection of components—it was a culture of systematic, beautiful, accessible UI that became a competitive advantage as we rapidly evolved the product and grew the team.
                            </p>
                        </div>
                        <div className="tldr__aside">
                            <div>
                                <h4 className="tldr__aside-title">My Role</h4>
                                <p className="tldr__aside-text">
                                    As the founding product designer, I created the initial Figma component library that became Forma's foundation. I conducted outreach to the engineering team to build support for the investment needed to create a mature design system. I led the design of components and tokens, collaborated with design and engineering colleagues to establish documentation and migration strategies, and helped build a cross-functional design systems practice that continues to evolve the system today.
                                </p>
                            </div>
                            <div>
                                <h4 className="tldr__aside-title">Outcome</h4>
                                <p className="tldr__aside-text">
                                    Designed, developed, documented, and deployed over two dozen components in the first six months. Major improvements to consistency across the UI, transforming the product's visual quality and usability. Built a culture of systematic design that enabled the team to scale from 1 to 3 designers with smooth onboarding. Design system rated as a major win for the entire team among all work completed that year.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="page-section page-section--centered">
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                Getting Past the MVP
                            </h2>
                            <p>
                                When I joined ReflexAI in April 2024, the product was exactly where a promising early-stage startup should be: built rapidly to validate the market opportunity, with strong core functionality and early customer traction. The UI worked, but it used a generic off-the-shelf component library that wasn't designed for our specific use cases.
                            </p>
                            <p>
                                This isn't a unique situation—it's the inevitable challenge of moving from MVP to mature product. Early startups prioritize speed and validation over polish, and that's the right choice. But once you've found product-market fit, you need to level up. The question becomes: how do you accelerate from there without accumulating design debt?
                            </p>
                            <p>
                                The challenge was compounded by the nature of our product. Prepare is used to train crisis counselors, healthcare coordinators, and customer service agents handling high-stakes, emotionally sensitive conversations. The UI needed to feel sophisticated, trustworthy, and thoughtfully designed—not generic or haphazard.
                            </p>
                            <p>
                                We also had ambitious plans: adding voice simulations, building self-serve creation tools, enabling AI-generated content. To execute on that roadmap while maintaining quality and consistency, we needed systematic design. But we couldn't stop shipping features to build infrastructure. Everything needed to work in parallel.
                            </p>
                        </div>
                        <Image
                            src="/work/forma/before-after.svg"
                            className="wide-table"
                            width="1500"
                            height="560"
                            alt="A simplified example of a spreadsheet model built in Google Sheets, like those we were hoping to replace."
                        />
                        <h4 className="work__art-caption">
                            Examples of the UI before and after launching the Forma design system.
                        </h4>
                    </div>

                    <div className="page-section page-section--centered">
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                Systems Thinking as Competitive Advantage
                            </h2>
                            <p>
                                I've worked in both large public companies with mature design systems and small startups building from scratch. I knew that the right approach to design systems could be a competitive advantage. It could enable us to move faster, maintain higher quality, and scale the team more effectively than competitors who were accumulating design debt.
                            </p>
                            <p>
                                The opportunity wasn't just to build a component library. It was to establish a practice and culture around systematic design that would pay dividends across everything we built. Done right, a design system would:
                            </p>
                            <ul className='case-study--list'>
                                <li><strong>Accelerate feature development</strong> by providing reliable, reusable patterns</li>
                                <li><strong>Improve consistency</strong> across increasingly complex product features</li>
                                <li><strong>Enable team scaling</strong> by making it easier to onboard new designers</li>
                                <li><strong>Strengthen cross-functional collaboration</strong> by creating shared language and tools between design and engineering</li>
                                <li><strong>Elevate product quality</strong> in a way that would be immediately visible to customers</li>
                            </ul>
                            <p>
                                But it required more than just designing components. It required demonstrating value, earning buy-in, and building collaborative processes that could sustain the system over time.
                            </p>
                        </div>
                    </div>

                    <div className="page-section page-section--centered">
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                Leading Through Contribution
                            </h2>
                            <p>
                                I took a "show, don't tell" approach to building support for a design system. Rather than starting with presentations about why we needed one, I started by doing the work and letting the results speak for themselves.
                            </p>

                            <h4>
                                Starting with High-Leverage Components
                            </h4>
                            <p>
                                I began by identifying the most frequently used, most visible components in our UI—buttons, form inputs, badges, icons, tooltips—and designing improved versions in Figma. The new components are an aesthetic update, but they also addressed real issues with usability. They were easier to design with, they improved accessibility, and through them I established visual patterns that felt more sophisticated and appropriate for our use cases.
                            </p>
                            <Image
                                src="/work/forma/buttons.svg"
                                className="wide-table"
                                width="1500"
                                height="560"
                                alt="A set of button components from the Forma design system."
                            />
                            <h4 className="work__art-caption">
                                A set of button components from the Forma design system.
                            </h4>
                            <p>
                                As I designed new features, I built components that would serve those features while also fitting into a larger system. Each component was documented with clear usage guidelines, visual specifications, and interaction behaviors. Other designers on the team began adopting these components eagerly because they made their work easier and the results better.
                            </p>
                            <Image
                                src="/work/forma/tables.svg"
                                className="wide-table"
                                width="1500"
                                height="560"
                                alt="Examples of tables from the UI before and after launching the Forma design system."
                            />
                            <h4 className="work__art-caption">
                                Examples of tables from the UI before and after launching the Forma design system.
                            </h4>

                            <h4>
                                Establishing Design Tokens
                            </h4>
                            <p>
                                A critical early decision was to build the system on a foundation of design tokens—systematic variables for color, spacing, and typography that could be shared between Figma and our UI codebase. This wasn't just about consistency; it was about creating true design-development parity where changes to core values could propagate across both environments.
                            </p>
                            <p>
                                I developed comprehensive color palettes using my <Link href="/work/colors">Paletteer Figma plugin</Link>, which generates accessible, flexible color systems from seed colors. These palettes, along with spacing scales and typography systems, became the atomic foundation that all components were built upon.
                            </p>
                            <p>
                                The benefits were immediate: designers and engineers spoke the same language about color and spacing, updates to tokens automatically reflected across all components, and maintaining consistency became dramatically easier as the product grew in complexity.
                            </p>
                            <Image
                                src="/work/forma/colors.svg"
                                className="wide-table"
                                width="1500"
                                height="560"
                                alt="A set of color palettes from the Forma design system."
                            />
                            <h4 className="work__art-caption">
                                A set of color palettes from the Forma design system.
                            </h4>

                            <h4>
                                Building Engineering Momentum
                            </h4>
                            <p>
                                In parallel, I conducted outreach to the engineering team. Many engineers already knew the pain of working with a disorganized UI and were eager for a mature set of UI components with established guidelines. As engineers began implementing the new components, the improvements showed up in the shipped product—better consistency, clearer interaction patterns, more polished aesthetics.
                            </p>
                            <p>
                                As the system matured and the team grew, we collaboratively named it <strong>Forma</strong> (Spanish for "shape"). The name reflected both how it would give shape and structure to our UI, and served as a nod to the significant contingent of Spanish-speaking Latin American members of our engineering team.
                            </p>
                            <p>
                                The value became obvious at first glance. We weren't just talking about the benefits of a design system; we were demonstrating them. This organic momentum made it much easier to advocate for dedicated resources and roadmap time.
                            </p>

                            {/* <h4> // TEMPORARILY REMOVED
                            <span className="underline-text--purple">
                                Different Strategies for Different Components
                            </span>
                        </h4>
                        <p>
                            As the system matured, we developed sophisticated strategies for different types of updates:
                        </p>
                        <ul>
                            <li><strong>Small but high-leverage changes</strong> could be implemented quickly and migrated across the entire codebase at once</li>
                            <li><strong>Complex components supporting key features</strong> required more careful design and engineering collaboration</li>
                            <li><strong>Incremental migration strategies</strong> allowed us to deprecate old patterns gradually as we touched different areas of the codebase during feature work</li>
                        </ul>
                        <p>
                            All of these approaches required successful partnership between design and engineering—not just a design system, but a design system practice that enabled planning and coordination.
                        </p> */}
                        </div>
                    </div>

                    {/* <div className="page-section page-section--centered"> TEMPORARILY REMOVED
                    <div className="page-section__text-container">
                        <h2 className="page-section__title">
                            Building the Foundation:{' '}
                            <span className="highlight-text--purple">
                                Forma Takes Shape
                            </span>
                        </h2>

                        <h4>
                            <span className="underline-text--purple">
                                The Figma Library
                            </span>
                        </h4>
                        <p>
                            The foundation of Forma was the Figma component library I created during my first months at ReflexAI. Starting with atomic components—the building blocks that would appear throughout the product—I systematically designed and documented:
                        </p>
                        <ul>
                            <li>Core UI elements (buttons, badges, form controls, tooltips)</li>
                            <li>Layout patterns (grids, spacing systems, responsive behaviors)</li>
                            <li>Typography scales and text styles</li>
                            <li>Interaction states and behaviors</li>
                        </ul>
                        <p>
                            I also developed comprehensive design tokens for our visual system, leveraging my Paletteer Figma plugin to create accessible, flexible color palettes. These tokens—covering color, spacing, and typography—were structured to be shared between Figma and our UI codebase, ensuring true design-development parity.
                        </p>
                        <p>
                            The library wasn't just a collection of components; it was a design language that could scale with our ambitions.
                        </p>
                    </div>
                </div> */}

                    <div className="page-section page-section--centered">
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                Establishing the Practice
                            </h2>
                            <p>
                                About a year in, with demonstrated value from the Figma library and growing adoption by designers and engineers, I was able to help take the next critical step: transforming a component library into a true design system practice.
                            </p>

                            <h4>
                                Building the Cross-Functional Team
                            </h4>
                            <p>
                                About a year in, with demonstrated value from the component library and growing adoption, I was instrumental in pushing for the next critical step: transforming our informal collaboration into a structured design systems practice. I helped assemble a dedicated cross-functional team bringing together designers, a senior frontend engineer who would lead our documentation efforts, and a product manager focused on platform and scaling projects. Together, we established regular collaboration rhythms for planning, building, and launching design system updates.
                            </p>
                            <p>
                                This cross-functional structure was critical. It ensured the design system wasn't owned by design or engineering—it was owned by the team, with shared investment in its success.
                            </p>

                            <h4>
                                The Documentation Site
                            </h4>
                            <p>
                                From early in the process, I advocated for a well-documented UI design system maintained by engineers. My colleague, a senior frontend engineer who was leading the design system effort on the engineering side, stepped up to build a comprehensive documentation site in our development environment. This collaboration—design articulating the need, engineering building the solution—exemplified the partnership that made Forma successful.
                            </p>
                            <p>
                                The documentation site is a living, interactive reference that shows:
                            </p>
                            <ul className='case-study--list'>
                                <li>All completed and in-progress components</li>
                                <li>Properties and styling options with real-time demos</li>
                                <li>Usage guidelines and accessibility considerations</li>
                                <li>Code snippets and implementation examples</li>
                                <li>Interactive examples where engineers could change configurations and see results immediately</li>
                            </ul>
                            <p>
                                The documentation site transformed how we worked. Design-to-engineering handoff took less time because we had a shared understanding of the components and principles of our UI. New team members could get up to speed quickly. Engineers could implement designs with confidence.
                            </p>

                            <h4>
                                Smart Migration Strategies
                            </h4>
                            <p>
                                We also built intelligent migration strategies into the codebase itself. Old, outdated components were marked as deprecated, creating gentle pressure to migrate to Forma components organically as we touched different parts of the UI during feature work. This approach allowed us to improve the system continuously without requiring disruptive, all-at-once migrations that would halt feature development.
                            </p>
                        </div>
                    </div>

                    <div
                        className="page-section page-section--ping-pong"
                        style={{ marginBottom: '4rem' }}
                    >
                        <div className="page-section__text-container">
                            <h2 className="page-section__title">
                                The Impact: Culture, Velocity, and{' '}
                                <span className="highlight-text--purple">
                                    Quality
                                </span>
                            </h2>
                            <h4>
                                Transforming the Product
                            </h4>
                            <p>
                                The impact on product quality was immediate and visible. Major improvements in consistency across the UI transformed Prepare's visual quality and usability. The product went from looking like an early-stage MVP to a sophisticated, polished platform appropriate for the serious, high-stakes work our customers were doing.
                            </p>
                        </div>
                        <div className="page-section__image-container">
                            <Image
                                src="/work/forma/nav-versions.svg"
                                width="1500"
                                height="1000"
                                alt="A mockup of the comparison charts that are automatically generated in this view"
                                className="page-section__overflow-image"
                            />
                        </div>
                    </div>

                    <div className="page-section page-section--centered">
                        <div className="page-section__text-container">
                            <p>
                                More importantly, Forma enabled the rapid feature evolution described in <Link href="/work/prepare">my other ReflexAI case study</Link>. Voice simulations, ReflexAI Studio, and AI-generated content were all built on top of Forma's foundation. Without the design system, maintaining quality and consistency while shipping those features at startup velocity would have been nearly impossible.
                            </p>
                            <p>
                                Within my first year our design system saw some major milestones:
                            </p>
                            <ul className='case-study--list'>
                                <li>Designed, developed, documented, and deployed over two dozen components</li>
                                <li>Created a comprehensive system of design tokens (color, spacing, typography) shared between Figma and code</li>
                                <li>Team grew from 1 to 3 designers with smooth onboarding enabled by systematic documentation</li>
                                <li>Design system rated as a major win for the entire team among all work completed that year</li>
                            </ul>

                            <h4>
                                Building a Culture
                            </h4>
                            <p>
                                Perhaps the most important outcome wasn't the components themselves—it was the culture we built around systematic design. New designers joining the team could be productive quickly because consistent patterns and documentation existed. Engineers knew where to find components, how to use them, and when to ask for design input. Cross-functional collaboration deepened as we built shared language and processes.
                            </p>
                            <p>
                                Forma became more than a tool; it became a practice and a mindset that continues to evolve as the company grows.
                            </p>
                        </div>
                    </div>

                    {/* <div className="page-section page-section--centered"> // TEMPORARILY REMOVED
                    <div className="page-section__text-container">
                        <h2 className="page-section__title">
                            What I{' '}
                            <span className="highlight-text--purple">
                                Learned
                            </span>
                        </h2>
                        <p>
                            Building a design system at a fast-growing startup taught me several lessons about design leadership:
                        </p>
                        <p>
                            <strong>Lead through strategic contribution, not just advocacy.</strong> The fastest path to buy-in wasn't making the case for a design system in meetings—it was building components that made everyone's work better and letting the value speak for itself. Walking the walk builds more momentum than talking the talk.
                        </p>
                        <p>
                            <strong>Different problems need different strategies.</strong> Not every component update requires the same approach. Small, high-leverage changes can be migrated quickly. Complex updates need careful sequencing. Having multiple strategies in your toolkit—and knowing when to use each—is essential for maintaining velocity while improving quality.
                        </p>
                        <p>
                            <strong>Systems thinking requires systems practice.</strong> A Figma library alone isn't a design system. True systems thinking requires cross-functional collaboration, documentation, migration strategies, and organizational processes. The components are important, but the practice around them is what makes them sustainable.
                        </p>
                        <p>
                            <strong>Timing matters, but so does foundation.</strong> At a startup, you can't stop feature work to build infrastructure. But you also can't scale without systematic thinking. The key is building in parallel—using feature work as opportunities to establish patterns, demonstrating value continuously, and earning the investment needed to formalize the practice when the timing is right.
                        </p>
                        <p>
                            <strong>Humility accelerates adoption.</strong> Recognizing that design systems challenges aren't unique discoveries—they're common startup growing pains—made it easier to build collaborative solutions. This wasn't about proving I was right; it was about bringing the skillset needed to solve a shared problem. That collaborative framing made all the difference in building a true practice rather than just a component library.
                        </p>
                        <p>
                            Forma continues to evolve as ReflexAI grows. The foundation we built—both the components and the culture—positions the company to keep moving fast while maintaining the quality and sophistication that our customers and our product deserve.
                        </p>

                        <div
                            style={{
                                textAlign: 'center',
                                marginTop: '6rem',
                            }}
                        >
                            <Link className="case-studies-link" href="/work">
                                <span className="case-studies-link__count">+4 more case studies</span>
                                <svg className="case-studies-link__divider" width="100%" height="3" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <line x1="0" y1="1.5" x2="100%" y2="1.5" stroke="white" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                                <span className="case-studies-link__label">View 'em All</span>
                            </Link>
                        </div>
                    </div>
                </div> */}
                </div>
            </div>
        </>
    )
}

const Forma = () => {
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

export default Forma