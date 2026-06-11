# Design System Bootstrap — Phase 4 Kickoff
## johnthedesigner.com redesign · Bootstrap campaign Step 9

---

## Context

Phases 1–3 of a design system bootstrap campaign were completed in Claude web chat. This Claude Code session picks up at **Step 9 — scaffold-core-components**. You are working on a **new branch of the existing johnthedesigner.com repo**. The existing site is intact on main. The goal is to build the redesigned site on this branch, replacing the existing implementation progressively.

**Read `LIVING_BRIEF.md` and `DESIGN.md` now before doing anything else.** Every design decision is recorded there. Do not make assumptions about colors, fonts, spacing, or component behavior — the answers are in those files.

---

## Step 0 — Audit the existing repo before touching anything

Before installing anything or writing any code, scan the repo and answer these questions. Summarize your findings before proceeding.

1. **Project structure:** Is there a `src/` directory, or does `app/` sit at the root? This affects all import paths.
2. **Existing globals.css:** What's in it? Any existing CSS custom properties, font imports, or Tailwind base styles that need to be preserved or removed?
3. **Existing layout.tsx:** How are fonts currently loaded? Is Schmaltzy already wired via `next/font/local`? What's the current `<html>` className setup?
4. **Existing Tailwind config:** What's already extended? Any color, spacing, or font-family overrides that conflict with or duplicate the new token system?
5. **Existing components:** What components exist? List them. These are candidates for replacement — we'll migrate them to the new system rather than leaving two parallel component sets.
6. **Existing page structure:** What pages exist (`app/` or `src/app/`)? List the routes. This informs the migration order.
7. **Package.json:** What's the current dependency set? Is shadcn/ui already initialized? Is Style Dictionary already installed?
8. **The Schmaltzy font:** Is `public/fonts/Schmaltzy-VF.ttf` present in the repo?

Based on this audit, recommend a migration strategy: which files to modify, which to replace, which existing components map to new ones, and a suggested page migration order. **Pause and present this recommendation before proceeding.** Do not begin Step 9 until the migration strategy is confirmed.

---

## What has been built (files in this handoff)

**Token source files** — `tokens/src/`:
- `color.json` — 28 semantic color roles, light mode, DTCG format
- `color.dark.json` — 21 dark mode overrides, `@media (prefers-color-scheme: dark)`
- `typography.json` — 9 type roles across 3 fonts
- `shape.json` — radius, shadow, border tokens
- `spacing.json` — 14 stops on 4px base + layout aliases

**Style Dictionary config** — `style-dictionary.config.mjs`
Compiles all token JSON to CSS custom properties. Run with `npm run tokens`.
Add to package.json scripts: `"tokens": "node style-dictionary.config.mjs"`

**Compiled output** (after running `npm run tokens`):
```
styles/tokens/colors.css        ← :root { } light mode (26 props)
styles/tokens/colors.dark.css   ← @media (prefers-color-scheme: dark) { :root { } } (21 props)
styles/tokens/base.css          ← type, radius, shadow, border, spacing (85 props)
```

---

## Setup sequence (do this after the audit, before Step 9)

1. **Install Style Dictionary:**
   ```bash
   npm install style-dictionary@4
   ```

2. **Add tokens script to package.json:**
   ```json
   "scripts": {
     "tokens": "node style-dictionary.config.mjs"
   }
   ```

3. **Compile tokens:**
   ```bash
   npm run tokens
   ```
   Verify `styles/tokens/` now contains `colors.css`, `colors.dark.css`, and `base.css`.

4. **Import token CSS in globals.css.**
   Adjust path based on whether the project uses `src/`:
   ```css
   /* Without src/: in app/globals.css */
   @import '../styles/tokens/colors.css';
   @import '../styles/tokens/colors.dark.css';
   @import '../styles/tokens/base.css';

   /* With src/: in src/app/globals.css */
   @import '../../styles/tokens/colors.css';
   @import '../../styles/tokens/colors.dark.css';
   @import '../../styles/tokens/base.css';
   ```
   Check the actual file path — verify it before writing.

5. **Wire fonts in layout.tsx** via `next/font`. If Schmaltzy is already loaded, check how it's declared and align with the token name `Schmaltzy`:
   ```ts
   import localFont from 'next/font/local'
   import { Fraunces, Nunito_Sans } from 'next/font/google'

   const schmaltzy = localFont({
     src: '../public/fonts/Schmaltzy-VF.ttf',
     variable: '--font-schmaltzy',
   })
   const fraunces = Fraunces({
     subsets: ['latin'],
     axes: ['opsz'],
     variable: '--font-fraunces',
   })
   const nunitoSans = Nunito_Sans({
     subsets: ['latin'],
     axes: ['opsz'],
     variable: '--font-nunito-sans',
   })
   ```
   Apply all three variables to the `<html>` element.

6. **Extend tailwind.config.ts** with all token mappings:
   ```ts
   theme: {
     extend: {
       colors: {
         primary:            'var(--color-primary)',
         'primary-text':     'var(--color-primary-text)',
         'primary-hover':    'var(--color-primary-hover)',
         'primary-subtle':   'var(--color-primary-subtle)',
         surface:            'var(--color-surface)',
         'surface-raised':   'var(--color-surface-raised)',
         'surface-subtle':   'var(--color-surface-subtle)',
         'on-surface':       'var(--color-on-surface)',
         'on-surface-body':  'var(--color-on-surface-body)',
         'on-surface-muted': 'var(--color-on-surface-muted)',
         border:             'var(--color-border)',
         'border-mid':       'var(--color-border-mid)',
         'border-focus':     'var(--color-border-focus)',
         error:              'var(--color-error)',
         'on-error':         'var(--color-on-error)',
         success:            'var(--color-success)',
         'on-success':       'var(--color-on-success)',
         warning:            'var(--color-warning)',
         'on-warning':       'var(--color-on-warning)',
       },
       borderRadius: {
         none: 'var(--radius-none)',
         xs:   'var(--radius-xs)',
         sm:   'var(--radius-sm)',
         md:   'var(--radius-md)',
         lg:   'var(--radius-lg)',
         xl:   'var(--radius-xl)',
         '2xl':'var(--radius-2xl)',
         full: 'var(--radius-full)',
       },
       spacing: {
         1:  'var(--space-1)',   2:  'var(--space-2)',
         3:  'var(--space-3)',   4:  'var(--space-4)',
         5:  'var(--space-5)',   6:  'var(--space-6)',
         7:  'var(--space-7)',   8:  'var(--space-8)',
         10: 'var(--space-10)', 12: 'var(--space-12)',
         14: 'var(--space-14)', 16: 'var(--space-16)',
         20: 'var(--space-20)', 24: 'var(--space-24)',
       },
       fontFamily: {
         display: 'var(--font-schmaltzy)',
         heading: 'var(--font-fraunces)',
         sans:    'var(--font-nunito-sans)',
       },
       maxWidth: {
         prose: 'var(--layout-content-max-width)',
         page:  'var(--layout-page-max-width)',
       },
     }
   }
   ```

---

## Step 9 — scaffold-core-components

Component library: **shadcn/ui** (Radix UI primitives + Tailwind).

```bash
npx shadcn@latest init
```

Configure shadcn to use the CSS custom property color names from the token system.

**Component scope** — build these 8 components:

| Component | Variants | Key tokens |
|---|---|---|
| **Button** | primary, ghost, white | `bg-primary`, `text-white`, `rounded-sm`, `border-border-focus` |
| **Badge** | solid, outline | `bg-primary`, `rounded-full`, `text-xs` |
| **Tag** | single | `bg-surface-subtle`, `text-on-surface-body`, `rounded-full` |
| **Card** | single | `bg-surface-raised`, `rounded-lg`, `shadow-sm` |
| **Callout** | single | `bg-primary`, `rounded-xl`, `text-white` |
| **Nav** | single | No container — open layout |
| **Input** | resting, focused, error | `rounded-sm`, `border-border-focus`, focus-ring shadow |
| **Modal** | single | `bg-surface-overlay`, `rounded-2xl`, `shadow-lg` |

For every component:
- Consume tokens exclusively via Tailwind utility classes — no hardcoded hex values
- All interactive states present: hover, focus, active, disabled
- Focus visible: 2px `border-border-focus` + `shadow-focus-ring` (from token)
- Touch targets ≥ 44×44px on interactive elements
- Dark mode handled automatically via CSS custom property overrides — no Tailwind `dark:` variants needed unless a component has structural dark-mode differences

**After building all components**, generate a self-contained `component-preview.html` (all CSS inlined — no external links) showing every component in default, hover, and focus states. Pause for review before proceeding to Step 10.

---

## Key design principles (abbreviated — full detail in DESIGN.md)

- **Blue-500 `#1683FF`** — all solid fills, section backgrounds, badges, borders, accents. Not for text.
- **Blue-600 `#0a6fe0`** — interactive text only (links, button labels). AA 4.81:1 on white.
- **Layout is open by default** — no card containers on case study pages. Cards exist only on the Work index. Callouts use solid blue-500 fill blocks, not bordered boxes.
- **Semantic states** are bright pastels (error `#FAA1A1`, success `#A1DFB7`, warning `#F8E49A`) with `on-surface` dark text — not conventional red/green/yellow.
- **Schmaltzy** — display/hero only, one per page. Never for subheadings or UI labels.

---

## Migration strategy (to be confirmed after audit)

The migration strategy is unknown until the repo is audited. General principles:
- The existing site stays functional on main throughout
- This branch builds the new system incrementally — token system first, then components, then pages one at a time
- Start with the simplest page (About or Home) to validate the full stack before tackling case studies
- Existing components are replaced, not refactored — the new component set is built clean against the token system

**Recommend a specific migration order after completing the Step 0 audit.**

---

*Phases 1–3 completed in Claude web chat, May 2026. Continuing in Claude Code from Step 9.*

---

## ↓ PASTE THE FULL SISTEMA BOOTSTRAP PROMPT BELOW THIS LINE ↓

Steps 1–8 of the following campaign are complete. All decisions made during those steps are recorded in `LIVING_BRIEF.md` and `DESIGN.md`. Begin at **Step 9**.

<!-- Paste the full "Bootstrap a Design System" prompt from Sistema here, unchanged -->

You are running the **Bootstrap a Design System** campaign. This is a self-driving multi-phase process. You will complete each step sequentially, ask the user for input when you need it, and pause for confirmation before advancing. Do not begin a step until the previous one is complete.

**If any prompt in this campaign references `https://sistema.johnthedesigner.com/raw/...`, fetch those URLs to load the reference material before proceeding with that step.**

---

## Standing quality directive

Your primary success criterion throughout this campaign is production quality — decisions that are specific, intentional, and defensible. Functional correctness is the floor, not the ceiling.

Before marking any step complete, hold the output to this test: would a senior product designer recognize this as production-ready work, or does it read as a safe first draft? Specific patterns that signal low quality: generic medium-blue primary color with no justification, near-white surfaces with no intentional hue temperature, the same border-radius applied uniformly to every component, type scale roles differentiated only by size, spacing that follows no discernible system.

When a decision is underspecified, make the specific choice and explain your reasoning. Do not silently apply a safe default. If a decision requires information you don't have — a brand color, a product name, an aesthetic direction — ask the user before proceeding. Do not assume or invent.

---

## Campaign map

**Phase 1 — Foundation**
1. **establish-context** — Scan the project, fill gaps with targeted questions, produce LIVING_BRIEF.md (includes positioning)

**Phase 2 — Visual Language**
2. **establish-visual-language** — Translate positioning to specific visual direction; generate style-preview.html for human review
3. **generate-design-md** — Generate the full DESIGN.md scaffold from the approved visual direction

**Phase 3 — Token System**
4. **generate-color-scheme** — Generate semantic color role tokens as DTCG JSON source files
5. **generate-type-scale** — Generate a modular type scale as DTCG JSON source files
6. **generate-shape-tokens** — Generate shape tokens as DTCG JSON source files: radius, elevation, border width
7. **generate-spacing-tokens** — Generate spacing tokens as DTCG JSON source files: scale, density, rhythm
8. **generate-style-dictionary** — Compile all token JSON into CSS custom properties; verify with token-check.html

**Phase 4 — Component Build-out** *(runs after Phase 3 is approved)*
9. **scaffold-core-components** — Implement a core component set using the token system
10. **generate-page-examples** — Generate 1–2 full-page HTML examples demonstrating the system in use
11. **setup-documentation-site** — Set up a lightweight documentation site

Begin Step 1 now.

---

## Step 1 — establish-context

You are establishing the full context for this design system project before any decisions are made. Your job is to build a complete picture by reading what exists first, then asking only for what is missing.

**Step 1a — Scan the project:**

Before asking anything, check for these files if they exist:
- `LIVING_BRIEF.md` — existing positioning decisions and system state
- `DESIGN.md` — existing token and visual language decisions
- Any `package.json` or framework config — technology constraints
- Any existing CSS or token files — what token naming and values are already in use

Summarize what you found. State explicitly: which of the intake questions below are already answered by reading the project.

**Step 1b — Ask only what is missing:**

Work through the following questions. Skip any already answered from the scan. For any vague answer, ask for a specific clarification before moving on.

1. **Product type and context:** What kind of product is this? Who are the primary users and what are they trying to accomplish?
2. **Information density:** Content-dense (tables, dashboards) or content-sparse (focused flows, marketing)? Or both?
3. **Brand stance:** Where on the expressive ↔ utilitarian spectrum? (Expressive = personality, visual distinctiveness. Utilitarian = clarity, cognitive load reduction.)
4. **Existing visual character:** Is there an existing brand guide, style tile, or reference design to honor? Or blank canvas?
5. **Color constraints:** Existing brand color (hex preferred)? Colors to avoid?
6. **Theme:** Light only, dark only, or both? If both — which is primary?
7. **Platform and scale:** Web, mobile, or cross-platform? One team or multiple? Component count: small (<20), medium (20–60), large (60+)?
8. **Accessibility:** WCAG 2.2 AA, or a stronger requirement?
9. **Technology:** What's the tech stack — framework, styling approach, any existing component libraries? (e.g. Next.js with Tailwind, Vite + plain CSS, Nuxt, SvelteKit — just say what you have; the specifics matter for how we wire things up later.)

**Step 1c — Write LIVING_BRIEF.md:**

Populate all sections. Leave Key Decisions entries as `[to be determined — {reason}]` for anything not yet resolvable.

```
# LIVING_BRIEF.md

*Per-project state document. Read at session start; append to at session end.*

---

## 1. Project Identity

**Product:** [name and one-sentence description]
**Audience:** [who uses it and what they are trying to do]
**Density:** [content-dense / content-sparse / balanced]
**Theme:** [light only / dark only / both — primary: light/dark]
**Stance:** [expressive ↔ utilitarian placement and brief rationale]
**Technology:** [framework, styling approach, component library]

---

## 2. Key Decisions

**Color:** [existing brand color or TBD]
**Typography:** [existing typeface decisions or TBD]
**Spacing:** [base unit, scale tier (dense/balanced/sparse), semantic alias decisions — or TBD]
**Shape:** [to be determined]
**Motion:** [to be determined]
**Tokens:** [Style Dictionary v5 — DTCG JSON source compiled to CSS custom properties, unless overridden by tech constraints]

---

## 3. Current State

**Token files:** none yet
**Components implemented:** none yet
**Components stubbed:** none yet
**Known gaps:** Token architecture not yet established.

---

## 4. Open Questions

- [ ] Dark mode trigger mechanism (if applicable)
- [ ] Component count estimate

---

## 5. Decision Log

*[today's date] — Context established — [one-line summary of key findings and stance decisions]*
```

### Before proceeding to Step 2

- [ ] `LIVING_BRIEF.md` exists with all sections populated
- [ ] Density, theme, and brand stance are resolved
- [ ] Technology constraints are recorded

**Pause here.** Summarize what was established in 2–3 sentences, then ask: *"Step 1 complete. Ready to proceed to Step 2 — establishing the visual language?"*

---

## Step 2 — establish-visual-language

You are translating the positioning brief into a specific visual direction before any token values are generated. The output is `style-preview.html` — a static, self-contained HTML file that demonstrates the proposed color, typography, shape, and surface treatment for human review. **No token generation begins until this artifact is approved.**

**Step 2a — Read the living brief and references:**

Read `LIVING_BRIEF.md`. Confirm: product identity, density, theme scope, brand stance, and any existing visual decisions.

Fetch and read the following from the Sistema knowledge base:
- Visual language translation framework: `https://sistema.johnthedesigner.com/raw/principles/visual-language/overview?play=bootstrap&sid=6a531f22-e799-4bd8-9073-d5a3193a8fb1`
- Visual quality signals: `https://sistema.johnthedesigner.com/raw/principles/quality/visual-quality-signals?play=bootstrap&sid=6a531f22-e799-4bd8-9073-d5a3193a8fb1`
- Style tile format specification: `https://sistema.johnthedesigner.com/raw/principles/visual-language/style-tile-format?play=bootstrap&sid=6a531f22-e799-4bd8-9073-d5a3193a8fb1`

**Step 2b — Produce the visual direction brief:**

Before generating any HTML, state the visual direction brief (5 items):

1. Which 2–3 aesthetic frameworks does this product draw from? (Reference the translation framework.)
2. What is the OKLCH color commitment level and why?
3. What is the typographic character: weight range, size range, typeface approach?
4. Where on the sharp ↔ rounded spectrum does this product sit?
5. What does this system explicitly NOT look like? (2–3 specific exclusions.)

Run the AI slop first-order reflex check: are any of these preliminary choices category-obvious defaults? If so, justify them explicitly or adjust.

**Step 2c — Generate style-preview.html:**

Generate a `style-preview.html` file per the style tile format specification. All seven sections required:

1. Visual direction statement (the brief from Step 2b, rendered in the file)
2. Color palette (all proposed colors as swatches; hex and OKLCH values; contrast ratios)
3. Typography specimens (each role rendered with sample text; annotated with size/weight/line-height/tracking)
4. Shape and radius specimens (each radius token and shadow level)
5. Surface treatment (default/raised/overlay surfaces; composite card specimen)
6. Color in context (primary in interactive elements; semantic colors in state examples)
7. Reviewer notes (explicit checklist of decisions requiring human judgment)

Technical requirements: self-contained HTML, no external dependencies, all colors shown as hex and OKLCH.

Quality checks before writing the file:
- Commitment level is consistent across all surface and neutral token chroma values
- Primary color passes the first-order reflex test
- All proposed values checked against the absolute bans list
- On-* pairings flagged for any contrast that should be manually verified

Write the file to `style-preview.html` at the project root.

**Step 2d — Request review:**

Present the visual direction brief as a 5-bullet summary. Then say:

*"style-preview.html is ready for review. Open it in a browser and evaluate each section. Key decisions to focus on: [list 3–4 choices that required judgment]. When you are satisfied, tell me to proceed — or tell me what to change."*

**Do not proceed to Step 3 until the user approves the style tile.**

**Step 2e — Update the living brief after approval:**

Update Key Decisions with the approved visual direction. Append to the Decision Log:
```
[date] — Visual language established — [commitment level, primary color, typographic character, radius personality]
```

### Before proceeding to Step 3

- [ ] `style-preview.html` exists at the project root
- [ ] All seven sections are present per the format specification
- [ ] Visual direction brief is stated in the file
- [ ] User has explicitly approved the style tile
- [ ] LIVING_BRIEF.md updated with approved visual direction

**Pause here.** Ask: *"Step 2 complete. Visual language approved. Ready to proceed to Step 3 — generating DESIGN.md?"*

---

## Step 3 — generate-design-md

You are generating a `DESIGN.md` file — a concise specification document that describes the design system's visual language for use with AI coding tools.

**Step 3a — Read the living brief:**

Read `LIVING_BRIEF.md` from the project root. The approved visual direction from Step 2 is the primary source for visual values. Confirm the product identity, density, theme, and all visual direction decisions.

**Step 3b — Read the references:**

Fetch and read the following from the Sistema knowledge base:
- DESIGN.md format specification: `https://sistema.johnthedesigner.com/raw/standards/design-md/spec?play=bootstrap&sid=6a531f22-e799-4bd8-9073-d5a3193a8fb1`
- Token architecture synthesis: `https://sistema.johnthedesigner.com/raw/principles/tokens/architecture?play=bootstrap&sid=6a531f22-e799-4bd8-9073-d5a3193a8fb1`

The spec file defines the exact format, YAML schema, section order, and token types. The token architecture synthesis explains the tier model and naming principles.

**Step 3c — Generate the DESIGN.md:**

Generate a complete `DESIGN.md` file following the specification exactly. Every section defined in the spec must be present. Values should reflect the approved visual direction from `style-preview.html`. Where a value is genuinely undetermined, mark it `[TBD]` with a note.

Quality standard: every value in DESIGN.md should be defensible. If choosing a value that will be overridden by a later token-generation step, mark it provisional. If choosing a value that directly reflects the approved visual direction, reference it.

Write the file to `DESIGN.md` at the project root.

**Step 3d — Update the living brief:**

Append to the Decision Log:
```
[date] — DESIGN.md generated — [note key decisions made and any provisional values]
```

### Before proceeding to Step 4

- [ ] `DESIGN.md` exists at the project root
- [ ] All required sections from the spec are present
- [ ] No section is empty — provisional values are marked `[TBD: reason]`, not omitted
- [ ] Quality check: does DESIGN.md reflect the approved visual direction, or does it feel generic?

**Pause here.** Ask: *"Step 3 complete. DESIGN.md generated. Ready to proceed to Step 4 — generating the color palette?"*

---

## Step 4 — generate-color-scheme

You are generating a complete color scheme as DTCG-format JSON source files. These files are the authoritative source for every color value in the system — the CSS is compiled from them in Step 9, not authored separately.

**Step 4a — Confirm color input:**

Review the approved visual direction in LIVING_BRIEF.md. Confirm:
1. What is the primary brand color? (Should be recorded from Step 2.)
2. Theme scope: light only, dark only, or both?
3. What is the OKLCH commitment level? (Should be recorded from Step 2.)

If any of these are missing, ask before proceeding.

**Step 4b — Read the references:**

Fetch and read the following from the Sistema knowledge base:
- Color architecture synthesis: `https://sistema.johnthedesigner.com/raw/principles/color/architecture?play=bootstrap&sid=6a531f22-e799-4bd8-9073-d5a3193a8fb1`
- Token architecture synthesis: `https://sistema.johnthedesigner.com/raw/principles/tokens/architecture?play=bootstrap&sid=6a531f22-e799-4bd8-9073-d5a3193a8fb1`
- Visual quality signals: `https://sistema.johnthedesigner.com/raw/principles/quality/visual-quality-signals?play=bootstrap&sid=6a531f22-e799-4bd8-9073-d5a3193a8fb1`

The color architecture synthesis explains the four major architectural models, contrast requirements, and dark mode tonal shift logic. The visual quality signals document defines the OKLCH commitment levels (§4) and absolute color bans (§3.2).

**Step 4c — Generate the color token source files:**

Write the following semantic roles as DTCG JSON. Use the key structure `color.[role]`:

**Required roles:**
- `color.primary` and `color.on-primary`
- `color.primary-container` and `color.on-primary-container`
- `color.secondary` and `color.on-secondary`
- `color.secondary-container` and `color.on-secondary-container`
- `color.surface` — default background
- `color.surface-raised` — elevated surface (cards, sheets)
- `color.surface-overlay` — modal/dialog surface
- `color.on-surface` — primary text on surface
- `color.on-surface-muted` — secondary/muted text
- `color.border` — default border
- `color.border-focus` — focus ring (must meet 3:1 against surface)
- `color.error` and `color.on-error`
- `color.success` and `color.on-success`
- `color.warning` and `color.on-warning`

DTCG format:
```json
{
  "color": {
    "primary": { "$type": "color", "$value": "#..." },
    "on-primary": { "$type": "color", "$value": "#..." }
  }
}
```

For each `on-*` role, note the contrast ratio against its paired surface as a `$description` field.

For dark mode (if required): generate a separate `color.dark.json` with only the overridden values. Use tonal shift logic — do not invert light mode values. Every `on-*` role must meet WCAG 4.5:1 against its paired surface.

Quality checks before finalizing:
- **First-order reflex check:** Primary color — is it medium-blue without justification?
- **Commitment level check:** Surface and neutral chroma values consistent with the approved commitment level?
- **Absolute bans check:** No opacity-derived containers; primary and secondary have distinct hues; no pure black/white surfaces; neutral ramp has hue temperature.

Write to `tokens/src/color.json` (and `tokens/src/color.dark.json` if applicable).

**Step 4d — Update the living brief:**

Update the Color entry in Key Decisions. Append to the Decision Log:
```
[date] — Color scheme generated — [architecture model, theme scope, commitment level, primary color]
```

### Before proceeding to Step 5

- [ ] `tokens/src/color.json` exists with all required roles
- [ ] Every `on-*` role has a contrast ratio in its `$description`
- [ ] `tokens/src/color.dark.json` exists if theme is "both"
- [ ] All quality checks passed
- [ ] Quality check: are surface colors genuinely specific, or generic near-white?

**Pause here.** Ask: *"Step 4 complete. Color scheme generated with [N] roles. Ready to proceed to Step 5 — generating the type scale?"*

---

## Step 5 — generate-type-scale

You are generating a typography token set as DTCG JSON source files.

**Step 5a — Confirm typography input:**

Review the approved visual direction in LIVING_BRIEF.md. Confirm:
1. Is there a preferred typeface or pairing already decided?
2. What is the typographic character from the visual direction? (Should be recorded from Step 2.)

If not recorded, ask before proceeding.

**Step 5b — Read the references:**

Fetch and read the following from the Sistema knowledge base:
- Typography architecture synthesis: `https://sistema.johnthedesigner.com/raw/principles/typography/architecture?play=bootstrap&sid=6a531f22-e799-4bd8-9073-d5a3193a8fb1`
- Visual quality signals: `https://sistema.johnthedesigner.com/raw/principles/quality/visual-quality-signals?play=bootstrap&sid=6a531f22-e799-4bd8-9073-d5a3193a8fb1`

**Step 5c — Generate the type scale token source file:**

For each type role, output a token group in DTCG format:
```json
{
  "type": {
    "body-lg": {
      "$description": "Default body text — prose, descriptions, form labels",
      "size":           { "$type": "dimension",  "$value": "16px" },
      "weight":         { "$type": "fontWeight", "$value": 400 },
      "line-height":    { "$type": "number",     "$value": 1.6 },
      "letter-spacing": { "$type": "dimension",  "$value": "0em" }
    }
  }
}
```

Define roles appropriate for this product's density and stance. At minimum: display (if applicable), heading-lg, heading-sm, body-lg, body-sm, label, caption, code.

Non-negotiable legibility constraints:
- Body roles: line height ≥ 1.5
- Heading roles: line height 1.1–1.3
- Display roles: line height 1.0–1.1
- Letter spacing: negative on large sizes, positive on small sizes (label/caption) when legibility requires it

Quality check: weight, size, and tracking must vary meaningfully across roles — not size alone. Every role exists for a specific reason; name it in the `$description`.

Write to `tokens/src/typography.json`.

**Step 5d — Update the living brief:**

Update the Typography entry in Key Decisions. Append to the Decision Log:
```
[date] — Type scale generated — [scale approach, typeface decisions, number of roles]
```

### Before proceeding to Step 6

- [ ] `tokens/src/typography.json` exists with all roles
- [ ] Each role has all four token properties and a `$description`
- [ ] Legibility constraints are met for all roles
- [ ] Quality check: hierarchy is clear and each role has a distinct visual identity

**Pause here.** Ask: *"Step 5 complete. Type scale generated with [N] roles. Ready to proceed to Step 6 — generating shape tokens?"*

---

## Step 6 — generate-shape-tokens

You are generating shape tokens — border-radius, elevation (shadow), and border width — as DTCG JSON source files.

**Step 6a — Confirm shape direction:**

Review the approved visual direction in LIVING_BRIEF.md. Confirm:
1. Where does this product sit on the sharp ↔ rounded spectrum? (Should be recorded from Step 2.)

If not recorded, ask before proceeding.

**Step 6b — Read the references:**

Fetch and read the following from the Sistema knowledge base:
- Shape architecture synthesis: `https://sistema.johnthedesigner.com/raw/principles/shape/architecture?play=bootstrap&sid=6a531f22-e799-4bd8-9073-d5a3193a8fb1`
- Visual quality signals: `https://sistema.johnthedesigner.com/raw/principles/quality/visual-quality-signals?play=bootstrap&sid=6a531f22-e799-4bd8-9073-d5a3193a8fb1`

**Step 6c — Generate the shape token source file:**

Output shape tokens in DTCG format:
```json
{
  "radius": {
    "none": { "$type": "dimension", "$value": "0px" },
    "sm":   { "$type": "dimension", "$value": "..." },
    "md":   { "$type": "dimension", "$value": "..." },
    "lg":   { "$type": "dimension", "$value": "..." },
    "xl":   { "$type": "dimension", "$value": "..." },
    "full": { "$type": "dimension", "$value": "9999px" }
  },
  "shadow": {
    "sm": { "$type": "shadow", "$value": { "offsetX": "0px", "offsetY": "1px", "blur": "3px", "spread": "0px", "color": "..." } },
    "md": { "$type": "shadow", "$value": { "offsetX": "0px", "offsetY": "4px", "blur": "12px", "spread": "0px", "color": "..." } }
  }
}
```

Include a component mapping table as `$description` on each radius stop, noting which component types use it:

| Component type | Radius token |
|---|---|
| Buttons | |
| Inputs / form fields | |
| Cards | |
| Modals / dialogs | |
| Chips / badges | |
| Tooltips | |

Quality check: radius must not be uniform across all components — there must be a hierarchy. The values must match the approved shape personality from Step 2. Check against the side-stripe ban.

Write to `tokens/src/shape.json`.

**Step 6d — Update the living brief:**

Update the Shape entry in Key Decisions. Append to the Decision Log:
```
[date] — Shape tokens generated — [radius personality, scale range, shadow approach]
```

### Before proceeding to Step 7

- [ ] `tokens/src/shape.json` exists
- [ ] All radius stops defined with component mapping noted
- [ ] Elevation tokens defined
- [ ] Quality check: radius values match the approved shape personality

**Pause here.** Ask: *"Step 6 complete. Shape tokens generated. Ready to proceed to Step 7 — generating spacing tokens?"*

---

## Step 7 — generate-spacing-tokens

You are generating a spacing token set as DTCG JSON source files. Spacing decisions constrain every component's padding and every layout's rhythm — they must be defined before any component code is written, so that padding and gap values are documented decisions rather than ad hoc Tailwind utilities that drift over time.

**Step 7a — Confirm density input:**

Review LIVING_BRIEF.md. Confirm the product's density target: content-dense, balanced, or content-sparse. (Recorded from Step 1.)

**Step 7b — Generate the spacing token source file:**

Select the scale tier that matches the density target. All scales use a 4px base unit:

- **Content-dense:** tighter stops — 2, 4, 6, 8, 12, 16, 20, 24, 32, 48px
- **Balanced:** standard stops — 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px
- **Content-sparse:** generous stops — 4, 8, 16, 24, 32, 48, 64, 80, 96, 128px

If the product has mixed density (e.g., dense tables within a balanced layout), note this and adjust — tighter stops for component-internal spacing, larger stops for layout-level gaps.

Name tokens by their pixel value, not an abstract ordinal — `space-4` means 4px everywhere it appears. Also define semantic aliases for the three most critical layout decisions:

```json
{
  "space": {
    "1":  { "$type": "dimension", "$value": "4px" },
    "2":  { "$type": "dimension", "$value": "8px" },
    "3":  { "$type": "dimension", "$value": "12px" },
    "4":  { "$type": "dimension", "$value": "16px" },
    "5":  { "$type": "dimension", "$value": "20px" },
    "6":  { "$type": "dimension", "$value": "24px" },
    "8":  { "$type": "dimension", "$value": "32px" },
    "10": { "$type": "dimension", "$value": "40px" },
    "12": { "$type": "dimension", "$value": "48px" },
    "16": { "$type": "dimension", "$value": "64px" }
  },
  "layout": {
    "page-gutter":   { "$type": "dimension", "$value": "{space.6}", "$description": "Horizontal padding on page-level containers" },
    "section-gap":   { "$type": "dimension", "$value": "{space.12}", "$description": "Vertical gap between major page sections" },
    "component-gap": { "$type": "dimension", "$value": "{space.4}", "$description": "Gap between adjacent components in a list or row" }
  }
}
```

State the rationale: which tier, any stop adjustments, and why the three semantic aliases map to those values.

Write to `tokens/src/spacing.json`.

**Step 7c — Update the living brief:**

Update the Spacing entry in Key Decisions. Append to the Decision Log:
```
[date] — Spacing tokens generated — [base unit, scale tier, semantic alias decisions]
```

### Before proceeding to Step 8

- [ ] `tokens/src/spacing.json` exists
- [ ] Scale tier matches the product's density target
- [ ] Semantic layout aliases defined with rationale
- [ ] LIVING_BRIEF.md Spacing entry updated

**Pause here.** Ask: *"Step 7 complete. Spacing tokens generated. Ready to proceed to Step 8 — compiling the token system with Style Dictionary?"*

---

## Step 8 — generate-style-dictionary

You are setting up Style Dictionary v5 to compile all token source files from Steps 4–7 into CSS custom properties. The JSON source files written in Steps 4–7 are the single authoritative definition of every token value. The compiled CSS is a build artifact — never edited directly.

**Step 8a — Determine output paths:**

Review the technology and project structure recorded in LIVING_BRIEF.md. Determine the correct CSS output path for the framework in use:
- Next.js with `src/` directory: `src/styles/tokens/`
- Next.js without `src/` directory: `styles/tokens/`
- Vite / other: derive from the project structure

If the project structure is ambiguous from what was scanned in Step 1, ask one brief question to confirm. Otherwise, proceed without asking.

**Step 8b — Generate the Style Dictionary configuration:**

Produce `style-dictionary.config.mjs`, ready to run with `node style-dictionary.config.mjs`:

1. Source: all files in `tokens/src/` — `color.json`, `color.dark.json` (if it exists), `typography.json`, `shape.json`, `spacing.json`
2. Output: CSS custom properties compiled to the path from Step 8a, using the naming convention `--[category]-[token-name]` (e.g. `--color-primary`, `--type-body-lg-size`, `--radius-md`, `--space-4`)
3. Dark mode: if `color.dark.json` exists, output its values under a `[data-theme="dark"]` selector with a `@media (prefers-color-scheme: dark)` fallback
4. Add an npm script to `package.json`: `"tokens": "node style-dictionary.config.mjs"`

**Step 8c — Run compilation:**

Run `npm run tokens`. If it fails, diagnose and fix before proceeding — do not skip past a failed compilation.

**Step 8d — Generate token-check.html:**

Immediately after successful compilation, generate `token-check.html` at the project root. This is a self-verification file — its purpose is to confirm that compiled token values match intent before any component code is written.

The file must load the compiled CSS and render:
- Every color token as a labeled swatch showing the token name and its computed hex
- Every type role as a live text specimen rendered in that role's size, weight, and spacing
- Every radius stop as a box with a visible border at that corner radius
- Every spacing stop as a horizontal bar of that exact width, labeled

Open `token-check.html` and verify that all values are what you specified. Catch mismatches here, not in component code.

**Step 8e — Update the living brief:**

Update the Tokens entry in Key Decisions. Append to the Decision Log:
```
[date] — Style Dictionary configured and compiled — [token count, output paths, any issues resolved]
```

### Before proceeding to Phase 4

- [ ] `style-dictionary.config.mjs` exists and runs without error
- [ ] CSS token files compiled to the correct output path
- [ ] `token-check.html` generated and reviewed — all values match intent
- [ ] All JSON source files from Steps 4–7 included in the config
- [ ] LIVING_BRIEF.md Tokens entry updated

**Pause here.** Summarize Phase 3 outputs — token source files, compiled CSS paths, token count. Then ask: *"Phase 3 complete — token system compiled and verified. Ready to proceed to Phase 4 — building core components?"*

---

## Step 9 — scaffold-core-components

You are implementing the core component set for this design system, consuming the token system established in Phase 3.

**Step 10a — Confirm component library preference:**

Ask the user:
1. Do you want to use shadcn/ui as the component base? (Recommended for Tailwind-based projects — Radix UI primitives with Tailwind, highly customizable, widely adopted.)
2. Alternative options: Base UI (Radix-compatible, unstyled), Radix UI directly, or no component library (build from scratch).

If the user's stack doesn't use Tailwind, adapt the approach to the actual styling layer in use — don't force Tailwind-specific integration on a non-Tailwind project.

**Step 10b — Read the living brief and references:**

Read `LIVING_BRIEF.md`. Confirm the technology stack, token naming convention, and shape scale.

Fetch and read the following from the Sistema knowledge base:
- Token architecture synthesis: `https://sistema.johnthedesigner.com/raw/principles/tokens/architecture?play=bootstrap&sid=6a531f22-e799-4bd8-9073-d5a3193a8fb1`
- Accessibility floor: `https://sistema.johnthedesigner.com/raw/principles/accessibility/floor?play=bootstrap&sid=6a531f22-e799-4bd8-9073-d5a3193a8fb1`

**Step 10c — Wire the token system into the framework:**

Before installing any components, establish the token integration layer. Without it, component code that references token-named utilities (e.g. `bg-primary`, `text-on-surface`) won't resolve.

**For Tailwind-based projects:**

Generate `tailwind.config.ts` extending the theme with every token from Phase 3. Every compiled CSS custom property must have a corresponding Tailwind utility class:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx}', './app/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary:              'var(--color-primary)',
        'on-primary':         'var(--color-on-primary)',
        'primary-container':  'var(--color-primary-container)',
        secondary:            'var(--color-secondary)',
        'on-secondary':       'var(--color-on-secondary)',
        surface:              'var(--color-surface)',
        'surface-raised':     'var(--color-surface-raised)',
        'surface-overlay':    'var(--color-surface-overlay)',
        'on-surface':         'var(--color-on-surface)',
        'on-surface-muted':   'var(--color-on-surface-muted)',
        border:               'var(--color-border)',
        'border-focus':       'var(--color-border-focus)',
        error:                'var(--color-error)',
        'on-error':           'var(--color-on-error)',
        success:              'var(--color-success)',
        warning:              'var(--color-warning)',
        // add any additional roles from the color token file
      },
      borderRadius: {
        none: 'var(--radius-none)',
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      spacing: {
        // Add all spacing stops from tokens/src/spacing.json
        1:  'var(--space-1)',
        2:  'var(--space-2)',
        3:  'var(--space-3)',
        4:  'var(--space-4)',
        5:  'var(--space-5)',
        6:  'var(--space-6)',
        8:  'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
        16: 'var(--space-16)',
      },
    }
  }
}
export default config
```

Import the compiled token CSS in the project's global stylesheet. Verify the import path against the actual project directory structure — the path differs based on whether a `src/` directory is present. Check before writing:

```css
/* Next.js with src/ directory — in src/app/globals.css */
@import '../../styles/tokens/colors.css';

/* Next.js without src/ — in app/globals.css */
@import '../styles/tokens/colors.css';
```

If using **Next.js**, load fonts via `next/font` — not a CDN `@import` in the global stylesheet. `next/font` self-hosts the font, eliminates render-blocking requests, and prevents layout shift. If the stack uses a different framework, use its idiomatic font loading approach.

**For non-Tailwind projects:** establish the token integration layer appropriate to the CSS approach in use — CSS modules, vanilla CSS with custom properties, or the framework's theming API.

**Step 10d — Install and configure the component library:**

For shadcn/ui:
1. Initialize: `npx shadcn@latest init`
2. Configure the theme to use the token values from Phase 3
3. Generate the core component set (at minimum): Button, Input, Select, Checkbox, Badge, Card, Dialog, Popover, Separator, Tooltip

For each component, verify:
- Token consumption: color and shape tokens referenced via CSS custom properties
- Hover/focus/active/disabled states all present
- Focus indicator meets 3:1 contrast per the accessibility floor
- Touch target ≥ 44×44px for interactive elements

**Step 10e — Define the component file structure:**

Before writing any component code, establish the file organization. Organize by functional group — not a catch-all file:

```
components/ui/
  button.tsx      — Button, IconButton
  input.tsx       — Input, Textarea
  select.tsx      — Select, Combobox
  form.tsx        — Checkbox, Radio, Switch, FormField
  feedback.tsx    — Badge, Toast, Alert
  overlay.tsx     — Dialog, Popover, Tooltip, Drawer
  surface.tsx     — Card, Separator, Divider
  index.ts        — barrel export: re-exports every public component
```

Adjust the groupings to match the actual component set. The `index.ts` barrel must re-export every public component so consumers always import from `@/components/ui`, never from individual files.

**Step 10f — Customize to the visual direction:**

Apply the approved visual direction from `style-preview.html`:
- Update radius values to match the shape token scale
- Update color variable mappings to use the semantic color role tokens
- Update typography to reference the type scale tokens
- Verify the result visually against the approved composite card specimen from `style-preview.html`

**Step 10g — Review checkpoint:**

Generate a single `component-preview.html` file — a static HTML page showing all core components in their default states, hover states, and focus states. CSS-only if possible.

Pause and say: *"Component set is ready for review. Open component-preview.html to evaluate each component. Check: do they look like they belong to the same system? Do they match the approved visual direction? Tell me what to adjust, or approve to proceed."*

**Do not proceed to Step 10 until the user approves.**

**Step 9h — Update the living brief:**

Update the Components implemented list. Append to the Decision Log:
```
[date] — Core component set scaffolded — [library used, components generated, any notable customizations]
```

### Before proceeding to Step 11

- [ ] Token integration layer wired (tailwind.config.ts or equivalent)
- [ ] Import paths verified against actual project structure
- [ ] Font loading uses the framework's idiomatic approach (not CDN @import)
- [ ] Component library installed and configured
- [ ] Core components generated and token-integrated
- [ ] Component file structure organized with barrel export (`index.ts`)
- [ ] `component-preview.html` exists and reviewed
- [ ] User has approved the component set
- [ ] LIVING_BRIEF.md updated

**Pause here.** Ask: *"Step 9 complete. Core components approved. Ready to proceed to Step 10 — generating page examples?"*

---

## Step 10 — generate-page-examples

You are generating 1–2 full-page HTML examples that demonstrate the design system in use at the page level. These are not prototypes — they are static HTML/CSS demonstrations of the visual language applied to realistic page compositions.

**Step 10a — Confirm page types:**

Ask the user: what type of page should the examples demonstrate? Suggest based on the product type recorded in LIVING_BRIEF.md. For example:
- A dashboard with a sidebar navigation, data table, and stat cards
- A settings page with form controls, section headers, and a save action
- A marketing landing page with hero, feature grid, and CTA section
- A detail view with a header, content area, and sidebar

Generate 2 page types unless the user specifies otherwise.

**Step 10b — Generate the page examples:**

For each page:
- Self-contained HTML file
- All styles in a `<style>` block — no external dependencies
- Uses the CSS custom property tokens from Phase 3
- Uses the component patterns from Step 9
- Realistic content (not lorem ipsum) — write copy appropriate for the product type
- Full-width layout at desktop (1200px+), responsive to at least 768px

Quality standard: the pages should feel like they could exist in a production product. Typography hierarchy should be clear. Information density appropriate to the product type. Color usage consistent with the commitment level. No decorative elements added that aren't in the token system.

Write each page as a separate file: `page-example-1.html`, `page-example-2.html`.

**Step 10c — Review checkpoint:**

Pause and say: *"Page examples are ready for review. Open page-example-1.html and page-example-2.html. Evaluate: does each page feel like a coherent product? Does the visual language hold up at the page level — not just the component level? Tell me what to adjust, or approve to proceed."*

**Do not proceed to Step 11 until the user approves.**

**Step 10d — Update the living brief:**

Append to the Decision Log:
```
[date] — Page examples generated — [page types, any notable layout or composition decisions]
```

---

## Step 11 — setup-documentation-site

You are setting up a lightweight documentation site — a browsable component gallery and token reference that the team can maintain. This is not Storybook; it should be a simple, maintainable solution appropriate to the team's tech stack.

**Step 11a — Confirm approach:**

Ask the user:
1. What is the primary framework in use? (From LIVING_BRIEF.md — confirm.)
2. How will the docs site be hosted? (Same repo as the product, or a separate `/docs` directory?)
3. Preferred approach: (a) a simple Next.js or Vite static site; (b) a markdown-based site (like Nextra or VitePress); (c) a single-page HTML gallery (no build step required).

Recommend option (c) for most cases — a single `docs/index.html` that renders all components, tokens, and usage examples, requiring no framework or build step. It can grow incrementally.

**Step 11b — Generate the documentation site:**

For the recommended single-page approach:

Generate `docs/index.html` containing:

1. **Token reference** — all color tokens displayed as swatches, all type roles rendered, all radius tokens shown, all shadow tokens shown, all spacing stops shown. Values shown as CSS custom property names and their current values.

2. **Component gallery** — each core component from Step 9 shown in its variants and states. Organized by component name. Each component shown at normal zoom (not scaled).

3. **Usage notes** — for each component, a brief "When to use" description. Not an API reference — a design intent note.

4. **Page examples link** — links to the page example files from Step 10.

5. **Visual direction summary** — the visual direction brief from Step 2, condensed. Useful as a quick reference for the team.

Technical requirements: self-contained HTML. All tokens read from the same CSS custom property values used in the product. No framework dependency. Must be openable directly from the filesystem.

**Step 11c — Campaign complete:**

Summarize the full campaign output:
1. Files produced (list all files created across all steps)
2. Key decisions recorded in LIVING_BRIEF.md
3. The token source file structure and Style Dictionary configuration
4. The component set, its file organization, and its token integration approach
5. Recommended next step: run `session-start` before beginning any further component work

Append the final entry to the Decision Log:
```
[date] — Bootstrap campaign complete — [Phase 1–4 summary]
```


[Sistema context: https://sistema.johnthedesigner.com/api/context?play=bootstrap&sid=6a531f22-e799-4bd8-9073-d5a3193a8fb1]