# LIVING_BRIEF.md

*Per-project state document. Read at session start; append to at session end.*

---

## 1. Project Identity

**Product:** johnthedesigner.com redesign — personal portfolio site for John Livornese, Boston-area senior/principal product designer and design systems practitioner.

**Audience:** Primary: hiring decision-makers (Design Directors, VPs of Design, CPOs) evaluating John for senior/principal roles. Secondary: design peers and collaborators, Figma/design systems community (via Paletteer and Sistema). Tertiary: potential contract/freelance partners.

**Density:** Content-sparse — big type, open layouts, focused moments. Case study pages are denser than marketing/home pages, but the system should serve sparse-first and accommodate structured content without feeling crowded.

**Theme:** Both — light as primary. Dark mode is a secondary concern; light mode drives all visual direction decisions.

**Stance:** Expressive-leaning, restrained in execution. The site has established personality (hand-drawn letterform illustrations, dry wit in copy, the name "John the Designer" itself) that must be honored — but the visual system should feel polished and confident, not decorative. Think: a designer's portfolio, not a brand campaign. Personality lives in the details and the writing, not in visual noise.

**Technology:** Next.js + Tailwind CSS. Solo maintainer. Component count: small (<20). Style Dictionary v5 for token compilation.

---

## 2. Key Decisions

**Color:** Primary — `#1683FF` (vivid blue). Neutral/surface — `#2D3C4D` (dark slate blue-gray). Full shade ramps to be generated for both hues. Design uses shades nearest the input colors as primary workhorses; lighter/darker shades used sparingly and intentionally. Monochromatic, high-impact palette — no secondary hue family introduced unless strictly needed for semantic states (error, success, warning), and even those should harmonize with the primary blue.

**Typography:** [to be determined — Step 2]

**Spacing:** Content-sparse tier — generous stops. Base unit: 4px. [semantic aliases to be determined — Step 7]

**Shape:** [to be determined — Step 2]

**Motion:** [to be determined — post-Step 2, light touch expected given sparse aesthetic]

**Tokens:** Style Dictionary v5 — DTCG JSON source files compiled to CSS custom properties. Tailwind theme extended to reference compiled CSS custom properties.

---

## 3. Current State

**Token files:** none yet
**Components implemented:** none yet
**Components stubbed:** none yet
**Known gaps:** Token architecture not yet established. Typeface not yet chosen. Shape personality not yet defined.

---

## 4. Open Questions

- [ ] Dark mode trigger mechanism — `prefers-color-scheme` media query only, or also a manual toggle in the UI?
- [ ] Component count estimate — likely: Button, Link, Nav, Card, Badge, Tag, CaseStudyCard, Testimonial, ContactCTA, Divider, CodeBlock (for Sistema-adjacent content?), possibly a minimal Form (contact). ~12–15 components.
- [ ] Does the redesign introduce any new page types beyond Home, Work index, Case Study, About? (e.g. a Blog, a dedicated Sistema/tools page?)
- [ ] Should the illustrated letterforms (the "J", "t", "d" motif) be treated as a design token / asset, or handled outside the system?

---

## 5. Decision Log

*2025-05-22 — Context established — Personal portfolio redesign for John Livornese; content-sparse, expressive-leaning, Next.js + Tailwind, light-primary with dark mode, WCAG AAA target, monochromatic blue + slate palette anchored to #1683FF and #2D3C4D.*

---
*Updated after Step 2 approval and Step 3 completion*

## 2. Key Decisions (updated)

**Color:** Monochromatic blue + slate. Blue-500 (#1683FF) primary fills/accents. Blue-600 (#0a6fe0) interactive text (AA 4.81:1). Pure white (#ffffff) surface. Slate-900 (#0e1720) headings + dark sections. Slate-600 (#2D3C4D) body text. Semantic fills: error #FAA1A1, success #A1DFB7, warning #F8E49A — slate-900 text only (9.2–14:1 AA). Dark mode body text: slate-100 (#d5dde6, 13.18:1).

**Typography:** Three-font system. Schmaltzy (self-hosted VF, /fonts/Schmaltzy-VF.ttf, next/font/local) — display/hero only. Fraunces (next/font/google) — section headings, deck italic. Nunito Sans (next/font/google) — body, labels, UI chrome.

**Spacing:** Content-sparse tier. 4px base unit. Page gutter 24px, section gap 80px, component gap 16px.

**Shape:** rounded-sm 6px (buttons/inputs), rounded-lg 10px (cards), rounded-xl 14px (solid sections), rounded-2xl 18px (modals), rounded-full 9999px (badges).

**Motion:** [to be determined]

**Tokens:** Style Dictionary v5 — DTCG JSON source compiled to CSS custom properties. Tailwind theme extended to reference compiled CSS custom properties.

## 5. Decision Log (continued)

*2026-05-22 — Visual language established (Step 2) — Level 2 color commitment, blue-500 primary fills + blue-600 text, three-font system (Schmaltzy/Fraunces/Nunito Sans), 6px button radius, open/flowing layout with sparse surface use, bright semantic fills with dark text.*

*2026-05-22 — DESIGN.md generated (Step 3) — Full spec written per Sistema DESIGN.md format. All sections populated from approved style-preview v5. Color ramps, typography scale, spacing, shape, component specs, and Do's/Don'ts complete. No provisional [TBD] values remain.*

*2026-05-22 — Color scheme generated (Step 4) — Named palette model (Model 3). Two source files: color.json (light, 28 semantic roles) + color.dark.json (dark, 19 overrides). prefers-color-scheme dark mode trigger. All text pairs verified AA. Known non-pass: blue-500 fills with white text (3.67:1) — documented by design decision.*

*2026-05-22 — Type scale generated (Step 5) — 9 roles: display (Schmaltzy 64px/800/lh1.0), heading-lg (Fraunces 34px/600/lh1.15), heading-sm (Fraunces 22px/400/lh1.25), deck (Fraunces italic 20px/300/lh1.4), body-lg (Nunito Sans 17px/400/lh1.7), body-sm (14px/400/lh1.65), label (11px/700/uppercase/ls0.12em), caption (12px/400/lh1.5), code (Geist Mono 13px/400/lh1.6). All line-heights per-role unitless multipliers. Tracking direction correct throughout. All roles grid-friendly on 4px base.*

*2026-05-22 — Shape tokens generated (Step 6) — 8 radius stops (none/xs/sm/md/lg/xl/2xl/full). Hierarchy: 6px interactive → 10px containers → 14px panels → 18px overlays, consistent 4px steps. Full-radius reserved for badges/pills only. 3 shadow levels (none/sm/lg) + focus-ring. Shadow color derives from slate-900 hue. Border widths: 1px/1.5px/2px.*

*2026-05-22 — Spacing tokens generated (Step 7) — Content-sparse tier, 4px base unit, 14 stops (4px–96px). Semantic aliases: page-gutter 24px (space-6), section-gap 80px (space-20), component-gap 16px (space-4). Layout constraints: content-max-width 720px (68–81 chars/line at 17px — optimal measure ✓), page-max-width 880px. All values on 4px grid.*

*2026-05-22 — Style Dictionary configured and compiled (Step 8) — SD v4.4.0, ESM, DTCG source. 3 output files: base.css (85 props), colors.css (26 props), colors.dark.css (21 props) = 132 total CSS custom properties. npm run tokens script added. prefers-color-scheme dark mode trigger confirmed. token-check.html generated. Zero compilation warnings.*

*2026-05-22 — Core components scaffolded (Step 9) — Pages Router (not App Router). Token CSS imported in styles/globals.css; shadcn HSL variables removed. tailwind.config.js fully replaced with token system mappings. Fonts wired via next/font (Schmaltzy/local, Fraunces/Google, Nunito Sans/Google) in pages/_app.js; font variables applied to wrapper div. 10 component files built: Button (primary/ghost/white), Input (resting/focus/error), Label, Badge (solid/outline), Tag, Card (+subcomponents), Callout (+kicker/body), Nav (+logo/links/link), Dialog (full Radix set), index.ts barrel. TypeScript: 0 errors. component-preview.html generated.*

*2026-05-22 — Page examples generated (Step 10) — Two static HTML demos: page-example-1.html (Home — hero/work grid/about strip/CTA panel/footer) and page-example-2.html (Case study — Paletteer, open layout with display headline, flowing prose, inline callouts, semantic blocks, metadata grid, next-case-study card). Key composition decisions: hero centered with Schmaltzy display at clamp(52–88px); case study body max-width 720px, no card containers; callout used twice in case study as emphasis pattern; semantic success/warning blocks demonstrated. Both pages responsive to 768px.*

*2026-05-22 — Documentation site generated (Step 11) — docs/index.html: single-page, no build step. Sticky sidebar with IntersectionObserver scroll-spy. Six sections: Visual Direction (style summary + page example links), Colors (all 26 semantic roles as swatch grids grouped by category), Typography (8 role specimens at full scale with font/size/weight metadata), Shape & Shadow (radius demo boxes + shadow/border examples), Spacing (14 stops as proportional bars), Component Gallery (9 component cards each with live specimen and When to use guidance). Bootstrap campaign complete: 11 steps, all phases of token architecture → component scaffold → page composition → documentation delivered.*

## 3. Current State (updated)

**Token files:** tokens/src/color.json, color.dark.json, typography.json, shape.json, spacing.json
**Compiled CSS:** styles/tokens/base.css, colors.css, colors.dark.css (132 custom properties)
**Components implemented:** Button, Input, Label, Badge, Tag, Card, Callout, Nav, Dialog (10 files, components/ui/)
**Pages demonstrated:** page-example-1.html (Home), page-example-2.html (Case Study)
**Documentation:** docs/index.html (token reference + component gallery)
**Known gaps:** Visual language to be pushed in more graphic/dramatic direction during real design process (token value adjustments in Style Dictionary, not structural changes).

## 4. Open Questions (updated)

- [x] Dark mode trigger — prefers-color-scheme only (resolved Step 8)
- [x] Import path — no src/ directory; Pages Router; globals.css in styles/ (resolved Step 9)
- [ ] Does the redesign introduce new page types beyond Home, Work, Case Study, About?
- [ ] Should illustrated letterforms be treated as a design token/asset?
