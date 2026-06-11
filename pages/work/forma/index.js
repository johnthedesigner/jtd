import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import {
    ProseSection, ProseSectionHeading, ProseSectionSubheading, ProseSectionBody,
} from '@/components/case-study/ProseSection'
import { CaseStudyImage } from '@/components/case-study/CaseStudyImage'
import { CaseStudyHero } from '@/components/case-study/CaseStudyHero'
import { TLDRBlock, TLDRItemWhite } from '@/components/case-study/TLDRBlock'
import { PingPong, PingPongHeading } from '@/components/case-study/PingPong'
import { NextCaseStudy } from '@/components/case-study/NextCaseStudy'
import caseStudies from '@/utils/caseStudies'
import pages from '@/utils/pages.json'
import PasswordProtect from '@/components/PasswordProtect'
import UnauthenticatedContent from '@/components/UnauthenticatedCaseStudy'

const caseStudy = caseStudies.find(cs => cs.href === '/work/forma')
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

const AuthenticatedContent = () => (
    <>
        <CaseStudyHero
            company="ReflexAI"
            title="Forma"
            subtitle="A Design System at the Speed of Startup"
            imageSrc="/work/forma/header.svg"
            imageWidth={2396}
            imageHeight={1656}
            imageAlt="Design system components and documentation showing the evolution of ReflexAI's Forma design system"
        />

        <main style={{ display: 'flex', flexDirection: 'column' }}>

            {/* TLDR + Getting Past the MVP */}
            <Narrow>
                <TLDRBlock summary="When I joined ReflexAI as their founding product designer, the company had built an innovative AI training product that was ready to scale. Like many early-stage startups moving fast to validate their market, they needed more systematic design to accelerate past the initial MVP stage. Over my first year, I founded a Figma component library, demonstrated value through improved consistency and usability, and was instrumental in bringing together designers and engineers into a dedicated design systems practice. The result wasn't just a collection of components—it was a culture of systematic, beautiful, accessible UI that became a competitive advantage as we rapidly evolved the product and grew the team.">
                    <TLDRItemWhite label="My Role">
                        As the founding product designer, I created the initial Figma component library that became
                        Forma's foundation. I conducted outreach to the engineering team to build support for the
                        investment needed to create a mature design system. I led the design of components and tokens,
                        collaborated with design and engineering colleagues to establish documentation and migration
                        strategies, and helped build a cross-functional design systems practice that continues to
                        evolve the system today.
                    </TLDRItemWhite>
                    <TLDRItemWhite label="Outcome">
                        Designed, developed, documented, and deployed over two dozen components in the first six
                        months. Major improvements to consistency across the UI, transforming the product's visual
                        quality and usability. Built a culture of systematic design that enabled the team to scale
                        from 1 to 3 designers with smooth onboarding. Design system rated as a major win for the
                        entire team among all work completed that year.
                    </TLDRItemWhite>
                </TLDRBlock>

                <ProseSection>
                    <ProseSectionHeading>Getting Past the MVP</ProseSectionHeading>
                    <ProseSectionBody>
                        <p>
                            When I joined ReflexAI in April 2024, the product was exactly where a promising
                            early-stage startup should be: built rapidly to validate the market opportunity, with
                            strong core functionality and early customer traction. The UI worked, but it used a
                            generic off-the-shelf component library that wasn&apos;t designed for our specific
                            use cases.
                        </p>
                        <p>
                            This isn&apos;t a unique situation—it&apos;s the inevitable challenge of moving from
                            MVP to mature product. Early startups prioritize speed and validation over polish,
                            and that&apos;s the right choice. But once you&apos;ve found product-market fit, you
                            need to level up. The question becomes: how do you accelerate from there without
                            accumulating design debt?
                        </p>
                        <p>
                            The challenge was compounded by the nature of our product. Prepare is used to train
                            crisis counselors, healthcare coordinators, and customer service agents handling
                            high-stakes, emotionally sensitive conversations. The UI needed to feel sophisticated,
                            trustworthy, and thoughtfully designed—not generic or haphazard.
                        </p>
                        <p>
                            We also had ambitious plans: adding voice simulations, building self-serve creation
                            tools, enabling AI-generated content. To execute on that roadmap while maintaining
                            quality and consistency, we needed systematic design. But we couldn&apos;t stop
                            shipping features to build infrastructure. Everything needed to work in parallel.
                        </p>
                    </ProseSectionBody>
                </ProseSection>
            </Narrow>

            <FullWidthImage
                src="/work/forma/before-after.svg"
                width={1500}
                height={560}
                alt="A simplified example of a spreadsheet model built in Google Sheets, like those we were hoping to replace."
                caption="Examples of the UI before and after launching the Forma design system."
            />

            {/* Systems Thinking + start of Leading Through Contribution */}
            <Narrow>
                <ProseSection>
                    <ProseSectionHeading>Systems Thinking as Competitive Advantage</ProseSectionHeading>
                    <ProseSectionBody>
                        <p>
                            I&apos;ve worked in both large public companies with mature design systems and small
                            startups building from scratch. I knew that the right approach to design systems
                            could be a competitive advantage. It could enable us to move faster, maintain higher
                            quality, and scale the team more effectively than competitors who were accumulating
                            design debt.
                        </p>
                        <p>
                            The opportunity wasn&apos;t just to build a component library. It was to establish a
                            practice and culture around systematic design that would pay dividends across
                            everything we built. Done right, a design system would:
                        </p>
                        <ul>
                            <li><strong>Accelerate feature development</strong> by providing reliable, reusable patterns</li>
                            <li><strong>Improve consistency</strong> across increasingly complex product features</li>
                            <li><strong>Enable team scaling</strong> by making it easier to onboard new designers</li>
                            <li><strong>Strengthen cross-functional collaboration</strong> by creating shared language and tools between design and engineering</li>
                            <li><strong>Elevate product quality</strong> in a way that would be immediately visible to customers</li>
                        </ul>
                        <p>
                            But it required more than just designing components. It required demonstrating value,
                            earning buy-in, and building collaborative processes that could sustain the system
                            over time.
                        </p>
                    </ProseSectionBody>
                </ProseSection>

                <ProseSection>
                    <ProseSectionHeading>Leading Through Contribution</ProseSectionHeading>
                    <ProseSectionBody>
                        <p>
                            I took a &ldquo;show, don&apos;t tell&rdquo; approach to building support for a
                            design system. Rather than starting with presentations about why we needed one, I
                            started by doing the work and letting the results speak for themselves.
                        </p>
                        <ProseSectionSubheading>Starting with High-Leverage Components</ProseSectionSubheading>
                        <p>
                            I began by identifying the most frequently used, most visible components in our
                            UI—buttons, form inputs, badges, icons, tooltips—and designing improved versions in
                            Figma. The new components are an aesthetic update, but they also addressed real issues
                            with usability. They were easier to design with, they improved accessibility, and
                            through them I established visual patterns that felt more sophisticated and appropriate
                            for our use cases.
                        </p>
                    </ProseSectionBody>
                </ProseSection>
            </Narrow>

            <FullWidthImage
                src="/work/forma/buttons.svg"
                width={1500}
                height={560}
                alt="A set of button components from the Forma design system."
                caption="A set of button components from the Forma design system."
            />

            <Narrow>
                <ProseSection>
                    <ProseSectionBody>
                        <p>
                            As I designed new features, I built components that would serve those features while
                            also fitting into a larger system. Each component was documented with clear usage
                            guidelines, visual specifications, and interaction behaviors. Other designers on the
                            team began adopting these components eagerly because they made their work easier and
                            the results better.
                        </p>
                    </ProseSectionBody>
                </ProseSection>
            </Narrow>

            <FullWidthImage
                src="/work/forma/tables.svg"
                width={1500}
                height={560}
                alt="Examples of tables from the UI before and after launching the Forma design system."
                caption="Examples of tables from the UI before and after launching the Forma design system."
            />

            <Narrow>
                <ProseSection>
                    <ProseSectionBody>
                        <ProseSectionSubheading>Establishing Design Tokens</ProseSectionSubheading>
                        <p>
                            A critical early decision was to build the system on a foundation of design
                            tokens—systematic variables for color, spacing, and typography that could be shared
                            between Figma and our UI codebase. This wasn&apos;t just about consistency; it was
                            about creating true design-development parity where changes to core values could
                            propagate across both environments.
                        </p>
                        <p>
                            I developed comprehensive color palettes using my{' '}
                            <Link href="/work/colors" style={{ color: 'var(--color-primary-text)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Paletteer Figma plugin</Link>,
                            which generates accessible, flexible color systems from seed colors. These palettes,
                            along with spacing scales and typography systems, became the atomic foundation that
                            all components were built upon.
                        </p>
                        <p>
                            The benefits were immediate: designers and engineers spoke the same language about
                            color and spacing, updates to tokens automatically reflected across all components,
                            and maintaining consistency became dramatically easier as the product grew in
                            complexity.
                        </p>
                    </ProseSectionBody>
                </ProseSection>
            </Narrow>

            <FullWidthImage
                src="/work/forma/colors.svg"
                width={1500}
                height={560}
                alt="A set of color palettes from the Forma design system."
                caption="A set of color palettes from the Forma design system."
            />

            <Narrow>
                <ProseSection>
                    <ProseSectionBody>
                        <ProseSectionSubheading>Building Engineering Momentum</ProseSectionSubheading>
                        <p>
                            In parallel, I conducted outreach to the engineering team. Many engineers already
                            knew the pain of working with a disorganized UI and were eager for a mature set of UI
                            components with established guidelines. As engineers began implementing the new
                            components, the improvements showed up in the shipped product—better consistency,
                            clearer interaction patterns, more polished aesthetics.
                        </p>
                        <p>
                            As the system matured and the team grew, we collaboratively named it{' '}
                            <strong>Forma</strong> (Spanish for &ldquo;shape&rdquo;). The name reflected both
                            how it would give shape and structure to our UI, and served as a nod to the
                            significant contingent of Spanish-speaking Latin American members of our engineering
                            team.
                        </p>
                        <p>
                            The value became obvious at first glance. We weren&apos;t just talking about the
                            benefits of a design system; we were demonstrating them. This organic momentum made
                            it much easier to advocate for dedicated resources and roadmap time.
                        </p>
                    </ProseSectionBody>
                </ProseSection>

                <ProseSection>
                    <ProseSectionHeading>Establishing the Practice</ProseSectionHeading>
                    <ProseSectionBody>
                        <p>
                            About a year in, with demonstrated value from the Figma library and growing adoption
                            by designers and engineers, I was able to help take the next critical step:
                            transforming a component library into a true design system practice.
                        </p>
                        <ProseSectionSubheading>Building the Cross-Functional Team</ProseSectionSubheading>
                        <p>
                            I was instrumental in pushing for the next critical step: transforming our informal
                            collaboration into a structured design systems practice. I helped assemble a dedicated
                            cross-functional team bringing together designers, a senior frontend engineer who
                            would lead our documentation efforts, and a product manager focused on platform and
                            scaling projects. Together, we established regular collaboration rhythms for planning,
                            building, and launching design system updates.
                        </p>
                        <p>
                            This cross-functional structure was critical. It ensured the design system
                            wasn&apos;t owned by design or engineering—it was owned by the team, with shared
                            investment in its success.
                        </p>
                        <ProseSectionSubheading>The Documentation Site</ProseSectionSubheading>
                        <p>
                            From early in the process, I advocated for a well-documented UI design system
                            maintained by engineers. My colleague, a senior frontend engineer who was leading the
                            design system effort on the engineering side, stepped up to build a comprehensive
                            documentation site in our development environment.
                        </p>
                        <p>
                            The documentation site is a living, interactive reference that shows all completed
                            and in-progress components, properties and styling options with real-time demos,
                            usage guidelines and accessibility considerations, and code snippets and
                            implementation examples. The documentation site transformed how we worked—design-to-
                            engineering handoff took less time, new team members got up to speed quickly, and
                            engineers could implement designs with confidence.
                        </p>
                        <ProseSectionSubheading>Smart Migration Strategies</ProseSectionSubheading>
                        <p>
                            We also built intelligent migration strategies into the codebase itself. Old,
                            outdated components were marked as deprecated, creating gentle pressure to migrate to
                            Forma components organically as we touched different parts of the UI during feature
                            work. This approach allowed us to improve the system continuously without requiring
                            disruptive, all-at-once migrations that would halt feature development.
                        </p>
                    </ProseSectionBody>
                </ProseSection>
            </Narrow>

            <FullWidthSection>
                <PingPong
                    src="/work/forma/nav-versions.svg"
                    width={1500}
                    height={1000}
                    alt="Side-by-side comparison of navigation design versions showing visual evolution through the Forma design system"
                    reverse
                >
                    <PingPongHeading>The Impact: Culture, Velocity, and Quality</PingPongHeading>
                    <p>
                        The impact on product quality was immediate and visible. Major improvements in
                        consistency across the UI transformed Prepare&apos;s visual quality and usability.
                        The product went from looking like an early-stage MVP to a sophisticated, polished
                        platform appropriate for the serious, high-stakes work our customers were doing.
                    </p>
                    <p>
                        More importantly, Forma enabled the rapid feature evolution described in{' '}
                        <Link href="/work/prepare" style={{ color: 'var(--color-primary-text)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>my other ReflexAI case study</Link>.
                        Voice simulations, ReflexAI Studio, and AI-generated content were all built on
                        top of Forma&apos;s foundation. Without the design system, maintaining quality and
                        consistency while shipping those features at startup velocity would have been nearly
                        impossible.
                    </p>
                </PingPong>
            </FullWidthSection>

            <Narrow padBottom>
                <ProseSection>
                    <ProseSectionHeading>Results</ProseSectionHeading>
                    <ProseSectionBody>
                        <p>Within my first year our design system saw some major milestones:</p>
                        <ul>
                            <li>Designed, developed, documented, and deployed over two dozen components</li>
                            <li>Created a comprehensive system of design tokens (color, spacing, typography) shared between Figma and code</li>
                            <li>Team grew from 1 to 3 designers with smooth onboarding enabled by systematic documentation</li>
                            <li>Design system rated as a major win for the entire team among all work completed that year</li>
                        </ul>
                        <p>
                            Perhaps the most important outcome wasn&apos;t the components themselves—it was the
                            culture we built around systematic design. New designers joining the team could be
                            productive quickly because consistent patterns and documentation existed. Engineers
                            knew where to find components, how to use them, and when to ask for design input.
                            Cross-functional collaboration deepened as we built shared language and processes.
                        </p>
                        <p>
                            Forma became more than a tool; it became a practice and a mindset that continues to
                            evolve as the company grows.
                        </p>
                    </ProseSectionBody>
                </ProseSection>

                <NextCaseStudy current="/work/forma" />
            </Narrow>

        </main>
    </>
)

const Forma = () => {
    const pageTitle = caseStudy
        ? `${caseStudy.title} | John the Designer – Boston-Area Product Designer John Livornese`
        : 'Forma | John the Designer – Boston-Area Product Designer John Livornese'
    const pageDescription = caseStudy?.description ?? 'Building a design system from scratch while shipping features at startup velocity—creating systematic design that became a competitive advantage.'

    return (
        <>
            <Head>
                <title>{pageTitle}</title>
                <meta property="og:title" content={pageTitle} key="title" />
                <meta name="description" content={pageDescription} />
                <meta name="og:image" content={pages.forma?.image ?? '/social-img.png'} />
            </Head>
            {isPrivate
                ? <PasswordProtect isPrivate AuthenticatedContent={AuthenticatedContent} UnauthenticatedContent={UnauthenticatedContent} />
                : <AuthenticatedContent />
            }
        </>
    )
}

export default Forma
