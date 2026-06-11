import Head from 'next/head'
import Image from 'next/image'
import {
  ProseSection, ProseSectionHeading, ProseSectionSubheading, ProseSectionBody,
} from '@/components/case-study/ProseSection'
import { CaseStudyHero } from '@/components/case-study/CaseStudyHero'
import { TLDRBlock, TLDRItemWhite } from '@/components/case-study/TLDRBlock'
import { NextCaseStudy } from '@/components/case-study/NextCaseStudy'
import PromptBlock from '@/components/PromptBlock'
import { CodeBlock } from '@/components/ui/codeblock'

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

const BOOTSTRAP_PROMPT = `You are running the Bootstrap a Design System campaign. This is a self-driving multi-phase process. You will complete each step sequentially, ask the user for input when you need it, and pause for confirmation before advancing.

If any prompt in this campaign references {{sistema_url}}/raw/..., fetch those URLs to load the reference material before proceeding with that step.

---

## Standing quality directive

Your primary success criterion throughout this campaign is production quality — decisions that are specific, intentional, and defensible. Functional correctness is the floor, not the ceiling.

Before marking any step complete, hold the output to this test: would a senior product designer recognize this as production-ready work, or does it read as a safe first draft? Specific patterns that signal low quality: generic medium-blue primary color with no justification, near-white surfaces with no intentional hue temperature, the same border-radius applied uniformly to every component, type scale roles differentiated only by size.

When a decision is underspecified, make the specific choice and explain your reasoning. Do not silently apply a safe default. If a decision requires information you don't have, ask the user before proceeding.

---

## Campaign map

Phase 1 — Foundation
  1. establish-context — Scan the project, fill gaps with targeted questions,
     produce LIVING_BRIEF.md

Phase 2 — Visual Language
  2. establish-visual-language — Translate positioning to a specific visual direction;
     generate style-preview.html for human review
  3. generate-design-md — Generate the full DESIGN.md scaffold from the approved
     visual direction

Phase 3 — Token System
  4. generate-color-scheme — Generate semantic color role tokens as DTCG JSON
  5. generate-type-scale — Generate a modular type scale as DTCG JSON
  6. generate-shape-tokens — Generate shape tokens as DTCG JSON
  7. generate-spacing-tokens — Generate spacing tokens as DTCG JSON
  8. generate-style-dictionary — Compile all token JSON into CSS custom properties;
     verify with token-check.html

Phase 4 — Component Build-out (runs after Phase 3 is approved)
  9. scaffold-core-components — Implement a core component set using the token system
  10. generate-page-examples — Generate 1–2 full-page HTML examples
  11. setup-documentation-site — Set up a lightweight documentation site

Begin Step 1 now.`

const DESIGN_MD_EXCERPT = `version: "1.1"
name: Sistema
description: >
  Design system knowledge base and playbook tool for designers and developers
  building, auditing, or maintaining design systems. Bold, typographically driven,
  utilitarian with strong brand expression. Light primary; dark follows
  prefers-color-scheme by default.

stack:
  framework: Next.js 15 (App Router)
  styling: Tailwind CSS v4 + CSS custom properties
  tokens: Style Dictionary v5 — source in tokens/semantic/, output to src/styles/tokens/generated.css
  fonts: next/font/google (Inter, Fraunces, JetBrains Mono)
  language: TypeScript

# ─── Colors ──────────────────────────────────────────────────────────────────

colors:
  canvas: "#FFFFFF"          # page background — pure white, deliberate flat-surface aesthetic
  surface: "#FFFFFF"
  surface-raised: "#FFFFFF"  # cards, panels
  surface-sunken: "#F7F6F2"  # input backgrounds, code blocks
  on-surface: "#0E1116"
  on-surface-muted: "#5B6470"
  on-surface-subtle: "#8A929C"
  border: "#E4E7EB"
  border-strong: "#C9CFD6"
  border-focus: "#0070FF"

  primary: "#0070FF"         # UI components, large text (3:1 on white); use #005CE6 for small text
  on-primary: "#FFFFFF"
  primary-container: "#E8F1FF"
  on-primary-container: "#003A9E"

  secondary: "#FFCC33"       # accent only on light surfaces; non-text or large text
  on-secondary: "#1A1200"

  brand-red: "#E60026"       # logo and deliberate brand moments only — not for error states
  brand-yellow: "#FFCC33"

  error: "#B91C1C"
  on-error: "#FFFFFF"
  success: "#15803D"
  on-success: "#FFFFFF"
  warning: "#B45309"
  on-warning: "#FFFFFF"

  # Dark mode — applied via [data-theme="dark"] (set by prefers-color-scheme)
  dark-canvas: "#0D0D0D"
  dark-surface: "#111111"
  dark-surface-raised: "#1C1C1C"
  dark-surface-overlay: "#252525"
  dark-surface-sunken: "#0A0A0A"
  dark-on-surface: "#F3F4F6"
  dark-on-surface-muted: "#9CA3AF"
  dark-border: "#2D2D2D"
  dark-primary: "#4D9FFF"
  dark-secondary: "#FFCC33"
  dark-error: "#FCA5A5"
  dark-success: "#4ADE80"
  dark-warning: "#FCD34D"

# ─── Typography ──────────────────────────────────────────────────────────────

fonts:
  sans: "'Inter', system-ui, -apple-system, sans-serif"
  serif: "'Fraunces', Georgia, 'Times New Roman', serif"  # body text; variable weight + optical sizing
  mono: "'JetBrains Mono', 'Cascadia Code', 'Fira Mono', monospace"

typography:
  display:
    fontFamily: sans
    fontSize: 56px
    fontWeight: 800
    lineHeight: 1.0
    letterSpacing: -0.025em
  heading-xl:
    fontFamily: sans
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  heading-lg:
    fontFamily: sans
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.015em
  heading-md:
    fontFamily: sans
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.01em
  heading-sm:
    fontFamily: sans
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0em
  body-lg:
    fontFamily: serif
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: 0em
  body-md:
    fontFamily: serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: 0em
  label:
    fontFamily: sans
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: 0.02em
  code:
    fontFamily: mono
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 0em

# ─── Shape ───────────────────────────────────────────────────────────────────

radii:
  none: 0px
  sm: 6px      # tooltips, tags
  md: 10px     # buttons, inputs, form controls
  lg: 16px     # cards, panels
  xl: 22px     # prompt box, large featured surfaces
  full: 9999px # pills, chips, badges

shadows:
  sm: "0 1px 2px rgba(14,17,22,0.05)"
  md: "0 4px 14px rgba(14,17,22,0.06), 0 1px 2px rgba(14,17,22,0.04)"

# ─── Do's & Don'ts ───────────────────────────────────────────────────────────

dos:
  - Use Fraunces for all body copy; Inter for headings, labels, and UI text
  - Use primary (#0070FF) for interactive elements and large text; use #005CE6 for small text links
  - Use brand-red (#E60026) only for the logo and intentional brand moments; never for errors
  - Use error/success/warning semantic tokens for all feedback states

donts:
  - Don't use brand-red (#E60026) for error states — use --color-error (#B91C1C)
  - Don't use secondary yellow (#FFCC33) as body text on light backgrounds
  - Don't use Inter for body prose — Fraunces is the designated body typeface
  - Don't hardcode dark mode colors inline — use semantic token variables that resolve per theme`

export default function Sistema() {
  return (
    <>
      <Head>
        <title>Case Study: &quot;Sistema&quot; | John the Designer – Boston-Area Product Designer John Livornese</title>
        <meta property="og:title" content="Case Study: &quot;Sistema&quot; | John the Designer – Boston-Area Product Designer John Livornese" key="title" />
        <meta name="description" content="Building a knowledge base and playbook tool that gives AI agents access to curated documentation from real design systems — so every generation starts from better source material." />
        <meta name="og:image" content="/social-img.png" />
      </Head>

      <CaseStudyHero
        company="Personal Project"
        title="A playbook for AI-assisted design systems"
        subtitle="AI defaults to generic output when it works from training data alone. Sistema gives it better source material."
        imageSrc="/prompt-block-2.png"
        imageWidth={2228}
        imageHeight={856}
        imageAlt="Sistema prompt block interface"
        imageMaxWidth={960}
      />

      <Narrow>
        <TLDRBlock summary="When AI agents tackle design system work without grounded references, they pattern-match from training data — and the output looks like it. Sistema is a knowledge base and playbook tool that gives agents access to curated documentation from real design systems, so every generation starts from the same references a senior designer would consult. I built up a knowledge base and a playbook of useful prompts for design system work, then used it to design itself.">
          <TLDRItemWhite label="My Role">Sole designer and developer</TLDRItemWhite>
          <TLDRItemWhite label="Outcome">Public beta — 142+ pages, 25 plays, 2 campaigns, full Style Dictionary token pipeline</TLDRItemWhite>
        </TLDRBlock>
      </Narrow>

      <Narrow>
        <ProseSection>
          <ProseSectionHeading>The Generic Output Problem</ProseSectionHeading>
          <ProseSectionBody>
            <p>When you ask an AI agent to generate a color palette or type scale without any grounding, it produces something that passes every technical test and signals no design intent. Medium-blue primary. Near-white surface with no hue temperature. Border-radius consistent across every component. Type scale differentiated by size alone. The outputs are correct. They&apos;re just not designed.</p>
            <p>The problem isn&apos;t the AI. It&apos;s the brief. Without access to real reference material — how Carbon structures its two-tier token architecture, how Material 3 handles elevation, what WCAG 2.2 actually requires for UI components versus body text — the agent defaults to the statistical center of design system patterns it&apos;s seen. Safe, generic, forgettable.</p>
            <p>This pattern kept surfacing as I was experimenting with AI-assisted design systems work. Every time I started a new design system project with Claude, the first output looked roughly the same. I&apos;d spend most of my time correcting generic defaults rather than making intentional decisions. I was sure that design system foundations were ripe territory for automation — the agent just needed better guidance.</p>
          </ProseSectionBody>
        </ProseSection>

        <ProseSection>
          <ProseSectionHeading>Better Reference, Better Output</ProseSectionHeading>
          <ProseSectionBody>
            <p>The idea behind Sistema is simple: the reference material is the constraint. Give an agent a brief and ask it to generate color tokens, and it produces plausible output. Give it the same brief after it reads Carbon&apos;s two-tier token architecture and Material 3&apos;s elevation model, and it produces something specific — with decisions it can justify by reference to how real systems solve the same problem.</p>
            <p>Sistema is built around that idea. The knowledge base crawls real design systems and UI libraries — Material Design 3, Carbon, Atlassian, Primer, Ant Design, Radix — and makes them available at stable endpoints agents can fetch. Each play in the playbook embeds that material (i.e. links to the markdown) directly in the prompt, so the agent reads the references before generating.</p>
            <p>I didn't write the knowledge base content — it&apos;s a curated synthesis. That curation is the feature: knowing which parts of Carbon&apos;s color architecture are specific to IBM&apos;s brand and which patterns generalize, knowing where the W3C standards and the popular frameworks disagree and why, knowing what questions a designer should be answering at each phase of a token system build.</p>
          </ProseSectionBody>
        </ProseSection>

        <ProseSection>
          <ProseSectionHeading>Plays &amp; Campaigns</ProseSectionHeading>
          <ProseSectionBody>
            <p>A play is a structured prompt with fetch instructions baked in. The <em>generate-color-scheme</em> play reads Sistema&apos;s color architecture synthesis before producing token files — so the agent sees how Material, Carbon, and Atlassian each solve the same problem before proposing a solution for your project. The result is token output that reflects real design systems knowledge, not statistical averages.</p>
            <p>Campaigns compose plays into multi-step sequences with human review gates between phases. The Bootstrap a Design System campaign is the main one: 4 phases, 11 steps, from blank repo to deployed components. It pauses after each phase for approval before advancing — you stay in control of the decisions while the agent handles the generation work.</p>
          </ProseSectionBody>
          <PromptBlock
            type="campaign"
            slug="bootstrap-a-design-system"
            refCount={8}
            body={BOOTSTRAP_PROMPT}
          />
          <a
            href="https://sistema.johnthedesigner.com/campaigns/bootstrap"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--color-primary-text)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            View the full campaign on Sistema
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </ProseSection>

        <ProseSection>
          <ProseSectionHeading>Proof: Sistema Designed Itself</ProseSectionHeading>
          <ProseSectionBody>
            <p>The cleanest test of whether the tool works is to run it on itself. Late in the build, I ran the Bootstrap campaign on Sistema&apos;s own repository. The agent scanned the existing codebase, worked through the establish-context step, generated a visual direction brief, produced a complete DESIGN.md, then generated color, typography, shape, and spacing token files, configured the Style Dictionary v5 pipeline, and applied a design pass across 24 files.</p>
            <p>The DESIGN.md it produced became the spec. Sistema&apos;s current visual design — the electric blue primary, the three-tier dark mode surface stack, the typography scale — came from human design input meeting Sistema&apos;s own playbook and knowledge base. The first end-to-end proof that the campaign works is the product itself.</p>
          </ProseSectionBody>
          <CodeBlock title="Sistema DESIGN.md" language="markdown" maxHeight={420}>{DESIGN_MD_EXCERPT}</CodeBlock>
        </ProseSection>

        <ProseSection>
          <ProseSectionHeading>Where Things Stand</ProseSectionHeading>
          <ProseSectionBody>
            <p>Sistema is in public beta. Built in roughly seven days of intensive Claude Code sessions, it&apos;s a working demonstration of the core hypothesis: grounding AI design work in real reference material produces better output than prompting from a blank slate.</p>
            <p>What&apos;s been proven: the tooling works, the knowledge base is queryable, the Bootstrap campaign runs end-to-end, and the dogfooding produced a real design system. What hasn&apos;t been proven yet: whether it&apos;s useful to designers other than me, at what scale the reference material starts to degrade in quality, and which kinds of design system problems benefit most from structured plays versus open-ended prompting. Those are the open questions — and the interesting ones.</p>
          </ProseSectionBody>
        </ProseSection>
      </Narrow>

      <Narrow>
        <a
          href="https://sistema.johnthedesigner.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', display: 'block' }}
        >
          <div
            className="flex flex-row"
            style={{
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-raised)',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(14,23,32,0.06), 0 0 1px rgba(14,23,32,0.04)',
            }}
          >
            {/* Screenshot — bottom on mobile, left on desktop */}
            <div className="hidden md:block relative w-[45%] flex-shrink-0 border-r border-border overflow-hidden">
              <Image
                src="/sistema-screenshot.png"
                alt="Sistema interface"
                fill
                style={{ objectFit: 'cover', objectPosition: 'top left' }}
              />
            </div>

            {/* Content — top on mobile, right on desktop */}
            <div style={{
              flex: 1,
              padding: '40px 36px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
              textAlign: 'center',
            }}>
              <Image
                src="/sistema-logo.svg"
                alt="Sistema"
                width={583}
                height={192}
                style={{ width: '160px', height: 'auto' }}
              />
              <p style={{
                fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                fontSize: '15px',
                lineHeight: 1.6,
                color: 'var(--color-on-surface-body)',
                margin: 0,
              }}>
                Try the Bootstrap campaign on your own project, or browse the knowledge base and plays.
              </p>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                height: '44px',
                padding: '0 20px',
                background: '#FFCC33',
                color: '#1A1200',
                borderRadius: '8px',
                fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.01em',
              }}>
                Try Sistema on your project
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </div>
        </a>
      </Narrow>

      <Narrow padBottom>
        <NextCaseStudy current="/work/sistema" />
      </Narrow>
    </>
  )
}
