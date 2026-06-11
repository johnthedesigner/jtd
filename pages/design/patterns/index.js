import Head from 'next/head'
import DesignLayout from '@/components/DesignLayout'
import CaseStudyCard from '@/components/CaseStudyCard'
import caseStudies from '@/utils/caseStudies'
import {
    ProseSection, ProseSectionKicker, ProseSectionHeading,
    ProseSectionSubheading, ProseSectionBody,
} from '@/components/case-study/ProseSection'
import { CaseStudyImage } from '@/components/case-study/CaseStudyImage'
import { TLDRBlock, TLDRItemWhite } from '@/components/case-study/TLDRBlock'
import { FigmaEmbed } from '@/components/case-study/FigmaEmbed'
import { PingPong, PingPongHeading } from '@/components/case-study/PingPong'
import { MetadataGrid, MetadataItem } from '@/components/case-study/MetadataGrid'
import { CaseStudyHero } from '@/components/case-study/CaseStudyHero'
import { PullQuote } from '@/components/case-study/PullQuote'
import { NextCaseStudy } from '@/components/case-study/NextCaseStudy'

const specimenHeader = (name, description) => (
    <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface-subtle)',
    }}>
        <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>{name}</p>
        {description && <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', color: 'var(--color-on-surface-muted)', marginTop: '2px', marginBottom: 0 }}>{description}</p>}
    </div>
)

const Specimen = ({ name, description, children, noPad = false }) => (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
        {specimenHeader(name, description)}
        <div style={{ padding: noPad ? 0 : '48px', background: 'var(--color-surface)' }}>
            {children}
        </div>
    </div>
)

export default function DesignPatterns() {
    return (
        <>
            <Head><title>Design System — Patterns</title></Head>
            <DesignLayout>
                <div style={{ marginBottom: '16px' }}>
                    <h1 style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontSize: '34px', fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.015em', color: 'var(--color-on-surface)', margin: 0 }}>Patterns</h1>
                    <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '15px', color: 'var(--color-on-surface-body)', marginTop: '8px' }}>
                        Site-specific compositions. Lives in <code style={{ fontFamily: 'monospace', fontSize: '13px', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>components/</code> and <code style={{ fontFamily: 'monospace', fontSize: '13px', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>components/case-study/</code>
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '48px' }}>

                    {/* ── ProseSection ── */}
                    <Specimen
                        name="ProseSection"
                        description="Centered text column capped at 720px. Compose with Kicker, Heading, Subheading, and Body subcomponents."
                    >
                        <ProseSection>
                            <ProseSectionKicker>Research findings</ProseSectionKicker>
                            <ProseSectionHeading>What Did the Research Say?</ProseSectionHeading>
                            <ProseSectionBody>
                                <p>Spreadsheet software is great, but it's built for practically any use of tabular data. In interviews we repeatedly heard that the complexity of undertaking a planning exercise in Excel slows down and complicates the process, making the work less accessible and making it harder for teams to get results.</p>
                                <p>We found that there was a common schema to the sorts of spreadsheet models our prospective users were building — an obvious area of opportunity.</p>
                            </ProseSectionBody>
                            <ProseSectionSubheading>A note on subheadings</ProseSectionSubheading>
                            <ProseSectionBody>
                                <p>Use <code style={{ fontFamily: 'monospace', fontSize: '13px', background: 'var(--color-surface-subtle)', padding: '2px 4px', borderRadius: '3px' }}>ProseSectionSubheading</code> for numbered goals or secondary sections within a prose block. It renders in Fraunces at 22px regular weight.</p>
                            </ProseSectionBody>
                        </ProseSection>
                    </Specimen>

                    {/* ── CaseStudyImage ── */}
                    <Specimen
                        name="CaseStudyImage"
                        description="Image with optional caption. Rounded container with subtle background. fullWidth variant breaks out to page-gutter edges — use inside a full-width layout slot."
                    >
                        <CaseStudyImage
                            src="/work/scenario-planning/header.svg"
                            alt="Scenario planning modeling view mockup"
                            width={2396}
                            height={1656}
                            caption="Full-screen mockup of the modeling view, showing an example model looking at revenue & profit."
                        />
                    </Specimen>

                    {/* ── TLDRBlock ── */}
                    <Specimen
                        name="TLDRBlock"
                        description="Two-column intro block on primary blue. Left: TL;DR summary. Right: labeled metadata (role, outcome, etc.) via TLDRItemWhite."
                    >
                        <TLDRBlock summary="I was hired to join a new team at Tableau tasked with building a new product for scenario planning. I identified a common schema for scenario planning models, designed a visual model editor that could show the underlying structure and relationships, and paired that with automatically generated visualizations optimized for comparing outcomes.">
                            <TLDRItemWhite label="My Role">
                                Product Design Lead. I led design for this project, doing the bulk of the work with support from the Tableau UX team.
                            </TLDRItemWhite>
                            <TLDRItemWhite label="Outcome">
                                Early prototypes confirmed our hypotheses and secured approval to increase hiring. The product was announced at Tableau Conference 2022.
                            </TLDRItemWhite>
                        </TLDRBlock>
                    </Specimen>

                    {/* ── FigmaEmbed ── */}
                    <Specimen
                        name="FigmaEmbed"
                        description="Figma prototype iframe. Use embed.figma.com/proto URLs — viewport-controls=false is appended automatically. fullWidth variant matches page-gutter edges. Accepts title, src, aspectRatio, and caption."
                    >
                        <FigmaEmbed
                            title="Modeling view"
                            src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FOhqs8MRvCMTCRRKQtAcCl1%2FScenario-Planning-Mockups%3Fnode-id%3D173%253A14542%26t%3DvOhHQhpZTMtADtPm-1"
                            aspectRatio="16/9"
                            caption="Full-page mockup of the modeling view, showing an example model looking at revenue & profit."
                        />
                    </Specimen>

                    {/* ── PingPong ── */}
                    <Specimen
                        name="PingPong"
                        description="Side-by-side image + text. reverse prop swaps image to the right. Compose text content with PingPongHeading and plain paragraphs."
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>
                            <PingPong
                                src="/work/scenario-planning/flow-chart.svg"
                                alt="Flow chart of connected model nodes"
                                width={1500}
                                height={500}
                                caption="A connected flow map showing model structure and field relationships."
                            >
                                <PingPongHeading>See the Big Picture.</PingPongHeading>
                                <p>One of the main obstacles to more people building and collaborating with scenario planning models is that they are usually impossible to understand unless you built it yourself. What was missing was a visualization of the structure of the model.</p>
                            </PingPong>
                            <PingPong
                                src="/work/scenario-planning/components.svg"
                                alt="Visual language components for the flow map"
                                width={1500}
                                height={500}
                                reverse
                            >
                                <PingPongHeading>See the Forest <em>and the Trees</em>.</PingPongHeading>
                                <p>Our data is tabular, but greater than the sum of our sheets. A comprehensive visual language helps explain both the structure of the model and the data it produces.</p>
                            </PingPong>
                        </div>
                    </Specimen>

                    {/* ── MetadataGrid ── */}
                    <Specimen
                        name="MetadataGrid"
                        description="Structured grid of labeled facts. Auto-fits columns based on available width. Use for role, company, timeline, tools, outcome."
                    >
                        <MetadataGrid>
                            <MetadataItem label="Role">Product Design Lead</MetadataItem>
                            <MetadataItem label="Company">Salesforce / Tableau</MetadataItem>
                            <MetadataItem label="Timeline">2021 – 2022</MetadataItem>
                            <MetadataItem label="Outcome">Announced at Tableau Conference 2022 to significant positive feedback</MetadataItem>
                        </MetadataGrid>
                    </Specimen>

                    {/* ── CaseStudyHero ── */}
                    <Specimen
                        name="CaseStudyHero"
                        description="Full-width header for case study pages. Solid primary blue background. Company badge, Schmaltzy title, subtitle, and optional full-bleed image at the bottom."
                        noPad
                    >
                        <CaseStudyHero
                            company="Salesforce"
                            title="Planning Better Together"
                            subtitle="Scenario planning doesn't have to be lonely."
                            imageSrc="/work/scenario-planning/header.svg"
                            imageWidth={2396}
                            imageHeight={1656}
                            imageAlt="Full-screen mockup of the scenario planning modeling view"
                        />
                    </Specimen>

                    {/* ── PullQuote ── */}
                    <Specimen
                        name="PullQuote"
                        description="Typographic pull-out quote. Decorative mark and attribution always use primary blue. attribution is optional."
                    >
                        <PullQuote
                            quote="What was missing was a way to see the structure of the model — not just the numbers, but the relationships and assumptions underneath them."
                            attribution="User interview, enterprise finance analyst"
                        />
                    </Specimen>

                    {/* ── NextCaseStudy ── */}
                    <Specimen
                        name="NextCaseStudy"
                        description="Bottom-of-page navigation block. Pass the current case study href; it auto-resolves the next item in the list, wrapping around. Solid primary blue, sharp thumbnail, 8px radius."
                        noPad
                    >
                        <NextCaseStudy current="/work/scenario-planning" />
                    </Specimen>

                    {/* ── CaseStudyCard ── */}
                    <Specimen
                        name="CaseStudyCard"
                        description="Work index card. Authenticated state shows sharp thumbnail + full content. Private state shows blurred thumbnail + password prompt."
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {caseStudies.filter((s) => !s.private).map((item) => (
                                <CaseStudyCard key={item.href} item={item} />
                            ))}
                            {caseStudies.filter((s) => s.private).map((item) => (
                                <CaseStudyCard key={item.href} item={item} />
                            ))}
                        </div>
                    </Specimen>

                </div>
            </DesignLayout>
        </>
    )
}
