import type { PaletteResult } from './palette'

export const STOPS = ['50','100','150','200','250','300','350','400','450','500','550','600','650','700','750','800','850','900','950'] as const

export type Format = 'css' | 'tailwind' | 'json'

export function toCss(name: string, palette: PaletteResult): string {
  const lines = STOPS.map(stop => `  --color-${name}-${stop}: ${palette.stops[stop].hex};`)
  return `:root {\n${lines.join('\n')}\n}`
}

export function toTailwind(name: string, palette: PaletteResult): string {
  const lines = STOPS.map(stop => `    '${stop}': '${palette.stops[stop].hex}',`)
  return `// tailwind.config.js — theme.extend.colors\n${name}: {\n${lines.join('\n')}\n},`
}

export function toDtcg(name: string, palette: PaletteResult): string {
  const inner = STOPS.reduce<Record<string, { $type: string; $value: string }>>((acc, stop) => {
    acc[stop] = { $type: 'color', $value: palette.stops[stop].hex }
    return acc
  }, {})
  return JSON.stringify({ color: { [name]: inner } }, null, 2)
}

export function copyText(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}
