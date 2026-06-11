/**
 * style-dictionary.config.mjs
 * johnthedesigner.com design system — token compilation
 *
 * Source:  tokens/src/*.json  (DTCG format)
 * Output:  styles/tokens/     (CSS custom properties)
 *
 * Run:     node style-dictionary.config.mjs
 * npm:     npm run tokens
 *
 * Output files:
 *   styles/tokens/base.css       — all non-color tokens (type, radius, shadow, border, space, layout)
 *   styles/tokens/colors.css     — light mode color tokens (:root)
 *   styles/tokens/colors.dark.css — dark mode overrides (@media prefers-color-scheme: dark)
 *
 * In production Next.js app, import in app/globals.css:
 *   @import '../styles/tokens/base.css';
 *   @import '../styles/tokens/colors.css';
 *   @import '../styles/tokens/colors.dark.css';
 *
 * Note: If the Next.js app uses a src/ directory, adjust import paths to:
 *   @import '../../styles/tokens/base.css';  (from src/app/globals.css)
 */

import StyleDictionary from 'style-dictionary';
import { promises as fs } from 'fs';
import path from 'path';

// ─── Ensure output directory exists ────────────────────────────────────────
await fs.mkdir('styles/tokens', { recursive: true });

// ─── CSS variable naming convention ────────────────────────────────────────
// Tokens compile to: --[category]-[path]
// Examples:
//   color.primary          → --color-primary
//   color.on-surface-body  → --color-on-surface-body
//   type.display.font-size → --type-display-font-size
//   radius.sm              → --radius-sm
//   shadow.sm.offsetY      → skipped (shadow values output as composite strings)
//   space.4                → --space-4
//   layout.page-gutter     → --layout-page-gutter

// ─── Custom transform: flatten DTCG shadow composites to CSS box-shadow ────
StyleDictionary.registerTransform({
  name: 'shadow/css-shorthand',
  type: 'value',
  filter: (token) => token.$type === 'shadow',
  transform: (token) => {
    const v = token.$value;
    if (typeof v === 'object' && v.offsetX !== undefined) {
      return `${v.offsetX} ${v.offsetY} ${v.blur} ${v.spread} ${v.color}`;
    }
    return token.$value;
  },
});

// ─── Custom transform: handle font-family arrays ────────────────────────────
StyleDictionary.registerTransform({
  name: 'fontFamily/css-stack',
  type: 'value',
  filter: (token) => token.$type === 'fontFamily',
  transform: (token) => {
    const v = token.$value;
    if (Array.isArray(v)) return v.join(', ');
    return v;
  },
});

// ─── Custom transform: strip $description and $metadata from output ─────────
// (SD v4 handles this natively — included for explicitness)

// ─── Transform group: CSS with DTCG support + custom transforms ─────────────
StyleDictionary.registerTransformGroup({
  name: 'css/dtcg',
  transforms: [
    'attribute/cti',
    'name/kebab',
    'time/seconds',
    'html/icon',
    'size/rem',
    'color/css',
    'shadow/css-shorthand',
    'fontFamily/css-stack',
  ],
});

// ─── Helper: filter tokens by source file ───────────────────────────────────
// SD v4 merges all sources; we use filePath filtering to separate
// light-mode and dark-mode color outputs.
const isFromFile = (filename) => (token) =>
  token.filePath?.includes(filename);

const isNotColorToken = (token) =>
  !token.filePath?.includes('color');

const isLightColorToken = (token) =>
  token.filePath?.includes('color.json') &&
  !token.filePath?.includes('color.dark');

const isDarkColorToken = (token) =>
  token.filePath?.includes('color.dark');

// ─── Register custom dark-mode format ───────────────────────────────────────
StyleDictionary.registerFormat({
  name: 'css/variables-dark',
  format: ({ dictionary, options }) => {
    const tokens = dictionary.allTokens
      .filter(isDarkColorToken)
      .map((token) => {
        const name = `--${token.name}`;
        const value = token.$value ?? token.value;
        return `  ${name}: ${value};`;
      })
      .join('\n');

    return [
      `/**`,
      ` * Dark mode color overrides`,
      ` * johnthedesigner.com design system`,
      ` * Trigger: @media (prefers-color-scheme: dark)`,
      ` * Architecture: tonal shift — not inversion`,
      ` */`,
      `@media (prefers-color-scheme: dark) {`,
      `  :root {`,
      // Indent inner block
      tokens.split('\n').map(l => `  ${l}`).join('\n'),
      `  }`,
      `}`,
      ``,
    ].join('\n');
  },
});

// ─── Style Dictionary instances ─────────────────────────────────────────────

/**
 * 1. BASE TOKENS
 * All non-color tokens: typography, radius, shadow, border, spacing, layout.
 * Output: styles/tokens/base.css
 */
const sdBase = new StyleDictionary({
  usesDtcg: true,
  source: [
    'tokens/src/typography.json',
    'tokens/src/shape.json',
    'tokens/src/spacing.json',
  ],
  platforms: {
    css: {
      transformGroup: 'css/dtcg',
      buildPath: 'styles/tokens/',
      prefix: '',
      files: [
        {
          destination: 'base.css',
          format: 'css/variables',
          filter: (token) => true,
          options: {
            selector: ':root',
            outputReferences: true,
            commentStyle: 'none',
            fileHeader: () => [
              'Base tokens — johnthedesigner.com design system',
              'Typography, radius, shadow, border, spacing, layout',
              'Generated by Style Dictionary v4 — do not edit directly',
              'Source: tokens/src/typography.json, shape.json, spacing.json',
            ],
          },
        },
      ],
    },
  },
});

/**
 * 2. LIGHT MODE COLORS
 * Semantic color roles for light mode.
 * Output: styles/tokens/colors.css
 */
const sdColors = new StyleDictionary({
  usesDtcg: true,
  source: [
    'tokens/src/color.json',
  ],
  platforms: {
    css: {
      transformGroup: 'css/dtcg',
      buildPath: 'styles/tokens/',
      files: [
        {
          destination: 'colors.css',
          format: 'css/variables',
          filter: (token) => !token.path?.includes('primitive'),
          options: {
            selector: ':root',
            outputReferences: false,
            fileHeader: () => [
              'Color tokens (light mode) — johnthedesigner.com design system',
              'Generated by Style Dictionary v4 — do not edit directly',
              'Source: tokens/src/color.json',
            ],
          },
        },
      ],
    },
  },
});

/**
 * 3. DARK MODE COLOR OVERRIDES
 * Only the tokens that change between light and dark mode.
 * Output: styles/tokens/colors.dark.css
 */
const sdDark = new StyleDictionary({
  usesDtcg: true,
  source: [
    'tokens/src/color.dark.json',
  ],
  platforms: {
    css: {
      transformGroup: 'css/dtcg',
      buildPath: 'styles/tokens/',
      files: [
        {
          destination: 'colors.dark.css',
          format: 'css/variables-dark',
          options: {
            outputReferences: false,
          },
        },
      ],
    },
  },
});

// ─── Build all platforms ─────────────────────────────────────────────────────
console.log('\n🎨 johnthedesigner.com — compiling design tokens\n');

try {
  await sdBase.init();
  await sdBase.buildAllPlatforms();
  console.log('  ✓ base.css');
} catch (e) {
  console.error('  ✗ base.css failed:', e.message);
  process.exit(1);
}

try {
  await sdColors.init();
  await sdColors.buildAllPlatforms();
  console.log('  ✓ colors.css');
} catch (e) {
  console.error('  ✗ colors.css failed:', e.message);
  process.exit(1);
}

try {
  await sdDark.init();
  await sdDark.buildAllPlatforms();
  console.log('  ✓ colors.dark.css');
} catch (e) {
  console.error('  ✗ colors.dark.css failed:', e.message);
  process.exit(1);
}

// ─── Token count summary ────────────────────────────────────────────────────
const outputFiles = ['styles/tokens/base.css', 'styles/tokens/colors.css', 'styles/tokens/colors.dark.css'];
let totalTokens = 0;
for (const f of outputFiles) {
  try {
    const content = await fs.readFile(f, 'utf8');
    const count = (content.match(/--[\w-]+:/g) || []).length;
    totalTokens += count;
    console.log(`  ${path.basename(f)}: ${count} custom properties`);
  } catch {}
}
console.log(`\n  Total: ${totalTokens} CSS custom properties compiled`);
console.log('  Output: styles/tokens/\n');
