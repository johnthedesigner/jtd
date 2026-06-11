---
version: alpha
name: John the Designer
description: >
  Personal portfolio design system for johnthedesigner.com. Monochromatic
  blue + slate palette, three-font expressive type system, open layout
  with sparse use of surfaces. WCAG 2.2 AA.

colors:
  # Blue family — anchor: #1683FF
  blue-50:  "#e8f2ff"
  blue-100: "#cce3ff"
  blue-200: "#99c7ff"
  blue-300: "#5ca8ff"
  blue-400: "#2d8eff"
  blue-500: "#1683FF"
  blue-600: "#0a6fe0"
  blue-700: "#0858b5"
  blue-800: "#06428a"
  blue-900: "#042d5e"
  blue-950: "#021a3a"

  # Slate family — anchor: #2D3C4D
  slate-50:  "#edf1f5"
  slate-100: "#d5dde6"
  slate-200: "#adbccc"
  slate-300: "#7f97ad"
  slate-400: "#56748e"
  slate-500: "#3d5268"
  slate-600: "#2D3C4D"
  slate-700: "#22303f"
  slate-800: "#182330"
  slate-900: "#0e1720"
  slate-950: "#070c11"

  # Semantic roles — light mode
  primary:          "#1683FF"   # blue-500 — all solid fills, accents, UI color
  primary-text:     "#0a6fe0"   # blue-600 — interactive text (links, btn labels); AA 4.81:1 on white
  surface:          "#ffffff"   # pure white — default page surface
  surface-raised:   "#ffffff"   # white — cards (differentiated by shadow, not color)
  surface-overlay:  "#ffffff"   # white — modals, dropdowns
  on-surface:       "#0e1720"   # slate-900 — headings, display text; 18.07:1 on white
  on-surface-body:  "#2D3C4D"   # slate-600 — body prose; 11.26:1 on white
  on-surface-muted: "#3d5268"   # slate-500 — captions, metadata; 8.06:1 on white
  border:           "#d5dde6"   # slate-100 — default dividers
  border-mid:       "#adbccc"   # slate-200 — stronger borders where needed
  focus:            "#1683FF"   # blue-500 — focus ring; 3.67:1 non-text on white ✓

  # Semantic feedback — bright fills with slate-900 text
  error:            "#FAA1A1"   # slate-900 text: 9.19:1 AA ✓
  success:          "#A1DFB7"   # slate-900 text: 11.84:1 AA ✓
  warning:          "#F8E49A"   # slate-900 text: 14.25:1 AA ✓
  error-surface:    "#fff1f1"   # decorative tint only — no text on this
  success-surface:  "#ecfdf5"   # decorative tint only — no text on this
  warning-surface:  "#fffbeb"   # decorative tint only — no text on this

  # Dark mode overrides — applied via [data-theme="dark"]
  dark-surface:          "#0e1720"   # slate-900
  dark-surface-raised:   "#182330"   # slate-800
  dark-on-surface:       "#ffffff"   # white — headings
  dark-on-surface-body:  "#d5dde6"   # slate-100 — body prose; 13.18:1 on slate-900
  dark-on-surface-muted: "#7f97ad"   # slate-300
  dark-primary:          "#1683FF"   # blue-500 — fills unchanged
  dark-primary-text:     "#5ca8ff"   # blue-300 — links on dark; 7.31:1 AAA ✓
  dark-border:           "#22303f"   # slate-700
  dark-focus:            "#2d8eff"   # blue-400

typography:
  # Display — Schmaltzy (self-hosted variable font)
  # Role: hero headline only, one per page maximum
  display:
    fontFamily: Schmaltzy
    fontSize: 64px
    fontWeight: 800
    lineHeight: 1.0
    letterSpacing: -0.01em

  # Headings — Fraunces (Google Fonts, Old Style serif)
  heading-lg:
    fontFamily: Fraunces
    fontSize: 34px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.015em

  heading-sm:
    fontFamily: Fraunces
    fontSize: 22px
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: -0.01em

  # Deck / subhead — appears beneath display as editorial bridge
  deck:
    fontFamily: Fraunces
    fontSize: 20px
    fontWeight: 300
    lineHeight: 1.4
    letterSpacing: 0em

  # Body — Nunito Sans (Google Fonts, humanist sans-serif)
  body-lg:
    fontFamily: Nunito Sans
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 0em

  body-sm:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: 0em

  # UI chrome
  label:
    fontFamily: Nunito Sans
    fontSize: 11px
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: 0.12em

  caption:
    fontFamily: Nunito Sans
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0.01em

  code:
    fontFamily: Geist Mono, ui-monospace, monospace
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0em

rounded:
  none: 0px
  xs:   4px
  sm:   6px    # buttons, inputs, tags, semantic blocks
  md:   8px    # general purpose
  lg:   10px   # cards, media embeds
  xl:   14px   # solid section panels, callouts
  2xl:  18px   # modals, dialogs, drawers
  full: 9999px # badges, pills, chips

spacing:
  base: 4px
  1:    4px
  2:    8px
  3:    12px
  4:    16px
  5:    20px
  6:    24px
  8:    32px
  10:   40px
  12:   48px
  16:   64px
  20:   80px
  24:   96px
  page-gutter:   24px   # horizontal padding on page containers
  section-gap:   80px   # vertical gap between major page sections
  component-gap: 16px   # gap between adjacent components

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "10px 22px"
    typography: "{typography.body-sm}"

  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.primary-text}"
    borderColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: "9px 20px"

  button-white:
    backgroundColor: "#ffffff"
    textColor: "{colors.primary-text}"
    rounded: "{rounded.sm}"
    padding: "10px 22px"

  badge-solid:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "3px 12px"

  badge-outline:
    backgroundColor: "#ffffff"
    textColor: "{colors.primary-text}"
    borderColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: "3px 12px"

  tag:
    backgroundColor: "{colors.slate-100}"
    textColor: "{colors.on-surface-body}"
    rounded: "{rounded.full}"
    padding: "3px 12px"

  input:
    backgroundColor: "#ffffff"
    textColor: "{colors.on-surface-body}"
    borderColor: "{colors.border-mid}"
    rounded: "{rounded.sm}"
    padding: "9px 14px"

  input-focused:
    borderColor: "{colors.primary}"
    boxShadow: "0 0 0 3px rgba(22,131,255,0.18)"

  card:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.lg}"
    padding: "28px 32px"
    boxShadow: "0 2px 8px rgba(14,23,32,0.08), 0 0 1px rgba(14,23,32,0.06)"

  callout:
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.xl}"
    padding: "22px 28px"

  section-dark:
    backgroundColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "44px 52px"

  modal:
    backgroundColor: "{colors.surface-overlay}"
    rounded: "{rounded.2xl}"
    boxShadow: "0 8px 32px rgba(14,23,32,0.14), 0 2px 8px rgba(14,23,32,0.07)"
---

# John the Designer — Design System

## Overview

Personal portfolio for John Livornese — senior/principal product designer and design systems practitioner. The system serves a content-sparse, expressive-leaning aesthetic rooted in Swiss/International typographic tradition, editorial layout principles, and deliberate negative space.

**Audiences:** Hiring decision-makers (design directors, VPs, CPOs) evaluating for senior/principal roles; design peers and the broader design systems community via Paletteer and Sistema; potential collaborators.

**Emotional register:** Confident without being flashy. Personality lives in the typography and writing — not in visual noise. The hand-drawn letterform illustrations on the homepage are the one expressive wildcard; the system supports them rather than competing.

**Accessibility:** WCAG 2.2 AA. Blue-600 (#0a6fe0) is the minimum for interactive text (4.81:1 on white). All body and heading text comfortably exceeds AA. Semantic fill colors use slate-900 text only.

**Technology:** Next.js + Tailwind CSS. Fonts: Schmaltzy via `next/font/local` from `/fonts/Schmaltzy-VF.ttf`; Fraunces and Nunito Sans via `next/font/google`.

---

## Colors

The palette is monochromatic — two hue families only, no secondary chromatic family.

**Blue family** anchored to `#1683FF` (blue-500). This is the primary visual color of the system — it appears on solid fills, section backgrounds, badges, interactive borders, focus rings, and icon accents. It is vivid and specific: oklch approximately 58% chroma 0.22 at hue 256. The range runs from near-white blue-50 to near-black blue-950.

Blue-500 cannot be used for body text or links on white surfaces — it achieves only 3.67:1, failing AA for text. **Blue-600 (#0a6fe0)** at 4.81:1 is the interactive text color: links, button labels, and any blue text that must be readable.

**Slate family** anchored to `#2D3C4D` (slate-600). This is the body text color. The family carries a cool blue hue temperature throughout — slate-50 is not neutral gray, it has intentional blue-slate character. Slate-900 is the heading and dark surface color.

**Semantic colors** are bright pastel fills with slate-900 text. They are softer and more playful than conventional alert colors, appropriate to the portfolio context. They are never used as text on white — only as colored fill backgrounds.

**Dark mode** uses a tonal shift model, not inversion. Slate-900 is the surface; slate-800 for cards; white for headings; slate-100 (#d5dde6) for body text; blue-300 for links (7.31:1, exceeds AA).

**Usage rules:**
- Blue-500 on solid fills: use freely for buttons, callouts, solid sections, badges, and borders
- Blue-600 for all interactive text: links, button labels, any inline blue
- Never put small body text on a blue-500 fill — 3.67:1 fails AA. Large bold display text (Schmaltzy headings) is acceptable at scale
- Semantic surface tints (error-surface, success-surface, warning-surface) are decorative backgrounds only — never behind any text

---

## Typography

Three fonts. Each has a distinct role and does not cross into another's territory.

**Schmaltzy** — heavy blackletter display font, self-hosted variable font (`/fonts/Schmaltzy-VF.ttf`). Used only for the primary hero headline on each page. The personality anchor of the entire type system — its wide, rounded blackletter forms are what make this site visually distinctive. Used once per page at most. Loaded via `next/font/local`.

**Fraunces** — soft Old Style serif for all headings below the display level. Shares the Cooper/Windsor/Souvenir design lineage with Schmaltzy — both are warm, rounded, early-20th-century in spirit. They are typographic siblings that complement rather than compete. Heading LG (34px, weight 600) for major section titles; Heading SM (22px, weight 400) for subsections and card titles; Deck/italic variant (20px, weight 300, italic) for case study deck copy beneath the display title. Loaded via `next/font/google`.

**Nunito Sans** — humanist sans-serif for all body text, captions, labels, and UI chrome. Its slightly rounded terminals echo the softness of the display fonts without competing. Body LG (17px) for primary prose; Body SM (14px) for secondary descriptions; Label (11px, weight 700, uppercase, tracked) for eyebrow labels and metadata; Caption (12px) for image captions and footnotes. Loaded via `next/font/google`.

**Hierarchy rules:**
- Size alone does not create hierarchy — weight and family also vary across roles
- Labels are always uppercase with 0.12em tracking; never set label-scale text in mixed case
- Schmaltzy headlines always slate-900; never blue
- Body text is always slate-600 (on-surface-body), not slate-900 — full ink-black body text is too heavy against white

---

## Layout

Content-sparse. Open and flowing. Typography and white space create all hierarchy — not cards or borders.

**Default page state:** Pure white background (#ffffff), no containing surfaces. Content is placed directly on the page. Dividers (1px slate-100) separate sections when needed; spacing does the work otherwise.

**Case study pages** are intentionally open. No cards around content sections. No background colors on alternating rows. The Schmaltzy headline, Fraunces deck, and Nunito Sans body flow down the page with only spacing and horizontal rules as structural elements.

**Cards** appear only on the Work index page — for case study thumbnails. They use a white background (same as surface), differentiated by `shadow-sm`. Cards are not used to organize content on any other page.

**Callouts and asides** use a solid blue-500 fill with a `rounded-xl` (14px) radius. Short, bold content only — never long body copy on the blue fill. The callout is the one place where a surface treatment appears inline in flowing content.

**Solid sections** — blue-500 or slate-900 fills — are used for CTA sections, TL;DR outcome blocks, and high-emphasis moments. They use `rounded-xl` (14px) and are full-width within the content column.

**Spacing scale:** 4px base unit, content-sparse tier. Page gutter: 24px. Section gap: 80px. Component gap: 16px.

**Max content width:** 720px for prose columns; 880px for the overall page wrapper.

---

## Elevation & Depth

Three elevation levels only. Depth is minimal — this is not a shadow-heavy system.

- **Flat (shadow-none):** 1px slate-100 border. Used for dividers, inline elements, and any surface where border differentiation is sufficient.
- **Raised (shadow-sm):** `0 2px 8px rgba(14,23,32,0.08), 0 0 1px rgba(14,23,32,0.06)`. Work cards. The shadow color derives from slate-900 hue — cool-tinted, not generic black.
- **Overlay (shadow-lg):** `0 8px 32px rgba(14,23,32,0.14), 0 2px 8px rgba(14,23,32,0.07)`. Modals, dropdowns, tooltips.

Solid fill sections (blue-500, slate-900) convey emphasis through color, not shadow — they use no box-shadow.

---

## Shapes

Rounded, but controlled. Each tier of component has its own radius — no uniform rounding.

| Token | Value | Components |
|---|---|---|
| `rounded-none` | 0px | Hard edges where structurally required |
| `rounded-xs` | 4px | Code blocks, small chips |
| `rounded-sm` | 6px | Buttons, inputs, tags, semantic blocks |
| `rounded-md` | 8px | General purpose |
| `rounded-lg` | 10px | Cards, media embeds |
| `rounded-xl` | 14px | Callouts, solid sections, panels |
| `rounded-2xl` | 18px | Modals, dialogs, drawers |
| `rounded-full` | 9999px | Badges, pills, chips |

The hierarchy principle: interactive inline elements (buttons, inputs) use a smaller radius than their containers (cards, panels), which in turn use a smaller radius than overlays (modals). No component should use the same radius as a component at a meaningfully different scale.

---

## Components

**Buttons** — Two variants: primary (blue-500 fill, white label text) and ghost (transparent, blue-500 border, blue-600 label). Both use `rounded-sm` (6px). Button labels are Nunito Sans 14px weight 700. A tertiary white-fill variant (`btn-white`) exists for use on blue-500 solid sections only.

**Badges** — Two variants: solid (blue-500 fill, white text, `rounded-full`) and outline (white fill, blue-600 text, blue-500 border, `rounded-full`). Used for category labels and metadata callouts on work cards.

**Tags** — Slate-100 fill, slate-600 text, `rounded-full`. Used for discipline/technology tags. Deliberately lower visual weight than badges.

**Inputs** — White fill, slate-200 border, `rounded-sm` (6px). Focus state: blue-500 2px border + `box-shadow: 0 0 0 3px rgba(22,131,255,0.18)`. Placeholder text slate-400.

**Cards** — White fill, `rounded-lg` (10px), `shadow-sm`. Used exclusively on the Work index. Internal structure: eyebrow label (blue-500, uppercase), Fraunces heading, Nunito Sans body, button + badge footer row.

**Callouts** — Blue-500 fill, `rounded-xl` (14px), white text. Kicker label (blue-100, uppercase, 10px). Main text Nunito Sans 15px regular. Short content only — one to three sentences maximum. The inline emphasis pattern for case study pages.

**Semantic blocks** — Error `#FAA1A1`, success `#A1DFB7`, warning `#F8E49A` fills. Slate-900 text (6.6–14:1 AA). `rounded-sm` (6px). Icon + text layout. Used for form feedback, password gate errors, contact form confirmation.

**Navigation** — No card or bordered container. Horizontal rule below nav on scroll. Logo uses Schmaltzy display; nav links use Nunito Sans label style.

---

## Do's and Don'ts

- **Do** use blue-500 freely for fills, accents, and solid sections — it is the primary color and should be prominent
- **Don't** use blue-500 for body text or links — use blue-600 at minimum; the 3.67:1 ratio fails AA for text
- **Do** keep case study pages open and uncontained — no cards wrapping content sections
- **Don't** use cards outside the Work index page (unless for a media embed or aside)
- **Do** use solid blue-500 fills for callouts and CTA sections — this replaces border-based emphasis
- **Don't** put long body copy on a blue-500 fill — the white text contrast fails AA for normal weight text
- **Do** use Schmaltzy only for the primary hero headline — one instance per page maximum
- **Don't** use Fraunces and Schmaltzy together at similar sizes — they should be at different scales
- **Do** use slate-900 text exclusively on semantic fill colors (error/success/warning)
- **Don't** use semantic surface tints (light pink, light green, light yellow) behind any text
- **Do** maintain the radius hierarchy — buttons (6px) smaller than cards (10px) smaller than modals (18px)
- **Don't** apply the same border-radius to every component
- **Do** load Schmaltzy via `next/font/local` — it is a self-hosted variable font
- **Don't** import Schmaltzy via a CDN or `@import` in a global stylesheet — use next/font to prevent FOUT
