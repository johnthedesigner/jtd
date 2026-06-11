import { oklch, formatHex, wcagContrast, toGamut } from 'culori'
import type { Oklch } from 'culori'

const mapToGamut = toGamut('rgb', 'oklch')

const STOP_VALUES = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950] as const

export interface PaletteStop {
  hex: string
  contrast_white: number
  contrast_black: number
}

export interface PaletteResult {
  seed: string
  stops: Record<string, PaletteStop>
}

// Logarithmic distribution: 1.01 × (19.0/1.01)^(i/18) for i=0..18
// Places midpoint (stop 500, i=9) at 4.38:1 — within the WCAG working range
function targetContrast(i: number): number {
  return 1.01 * Math.pow(19.0 / 1.01, i / 18)
}

// Binary-search the maximum in-gamut OKLCH chroma for a given L and hue.
function findMaxChroma(L: number, hue: number): number {
  let lo = 0
  let hi = 0.5
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2
    const color: Oklch = { mode: 'oklch', l: L, c: mid, h: hue }
    const mapped = mapToGamut(color)
    const mappedC = mapped ? (oklch(mapped)?.c ?? 0) : 0
    if (Math.abs(mappedC - mid) < 0.001) {
      lo = mid
    } else {
      hi = mid
    }
  }
  return lo
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function normalizeHex(hex: string): string {
  return hex.startsWith('#') ? hex : '#' + hex
}

export function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex)
}

interface Candidate {
  hex: string
  contrastWhite: number
  contrastBlack: number
}

function buildCandidates(seed: Oklch): Candidate[] {
  const candidates: Candidate[] = []
  const hue = seed.h ?? 0

  const maxChromaAtSeedL = findMaxChroma(seed.l, hue)
  const saturation = maxChromaAtSeedL > 0 ? Math.min(1, seed.c / maxChromaAtSeedL) : 0
  const taperAtSeedL = Math.sin(Math.PI * seed.l)

  for (let L = 0.02; L <= 0.985; L += 0.001) {
    const rawTaper = Math.min(1, Math.sin(Math.PI * L) / taperAtSeedL)
    const taper = (1 + rawTaper) / 2
    const C = findMaxChroma(L, hue) * saturation * taper
    const color: Oklch = { mode: 'oklch', l: L, c: C, h: hue }
    const inGamut = mapToGamut(color)
    if (!inGamut) continue
    const hex = formatHex(inGamut)
    if (!hex) continue

    candidates.push({
      hex,
      contrastWhite: wcagContrast(hex, '#ffffff'),
      contrastBlack: wcagContrast(hex, '#000000'),
    })
  }

  return candidates
}

export function generatePalette(seedHex: string): PaletteResult {
  const normalized = normalizeHex(seedHex)
  if (!isValidHex(normalized)) {
    throw new Error(`Invalid hex color: ${seedHex}`)
  }

  const seed = oklch(normalized)
  if (!seed) throw new Error(`Could not parse color: ${seedHex}`)

  const candidates = buildCandidates(seed)
  if (candidates.length === 0) {
    throw new Error(`No valid candidates generated for seed: ${seedHex}`)
  }

  const stops: Record<string, PaletteStop> = {}

  STOP_VALUES.forEach((stop, i) => {
    const target = targetContrast(i)
    let best = candidates[0]
    let bestDiff = Math.abs(candidates[0].contrastWhite - target)

    for (let j = 1; j < candidates.length; j++) {
      const diff = Math.abs(candidates[j].contrastWhite - target)
      if (diff < bestDiff) {
        best = candidates[j]
        bestDiff = diff
      }
    }

    stops[String(stop)] = {
      hex: best.hex,
      contrast_white: round2(best.contrastWhite),
      contrast_black: round2(best.contrastBlack),
    }
  })

  return { seed: normalized, stops }
}
