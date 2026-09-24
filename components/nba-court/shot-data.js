import { COURT_LENGTH } from './constants'
import { RIM } from './hoop-spec'
import { BACKBOARD } from './hoop-spec'

/**
 * Shot coordinates, converted once.
 *
 * NBA stats ships LOC_X / LOC_Y in tenths of a foot with the origin at the
 * basket: X runs across the floor, Y runs up the floor away from the baseline.
 * This scene uses feet with the origin at centre court, X along the 94ft
 * length and Z across the 50ft width — so the two axes swap, and the basket's
 * own offset has to come back in. Everything downstream consumes the converted
 * form, and nothing else in the app should know the NBA convention exists.
 */

/** Distance from centre court to a rim, along the length. */
export const RIM_X = COURT_LENGTH / 2 - (BACKBOARD.inset + RIM.gap + RIM.innerRadius)

/**
 * One shot in NBA stats coordinates to world feet.
 *
 * `end` is +1 or -1, picking which basket the shot was taken at. Shot charts
 * normally fold every attempt onto one half, which is what `end` is for.
 */
export function shotToWorld(locX, locY, end = 1) {
    const across = locX / 10
    const upFloor = locY / 10
    return [end * (RIM_X - upFloor), end * across]
}

/** World feet back to NBA stats coordinates, for round-tripping. */
export function worldToShot(x, z, end = 1) {
    return [end * z * 10, (RIM_X - end * x) * 10]
}

/** Distance from the basket, in feet, for a shot already in world space. */
export function distanceFromRim(x, z, end = 1) {
    const dx = x - end * RIM_X
    return Math.sqrt(dx * dx + z * z)
}

/**
 * A live play-by-play coordinate (ESPN's `coordinate` field) to world feet.
 *
 * Structurally the same conversion as `shotToWorld`, but a different source
 * convention: ESPN's `x`/`y` are already whole feet (not NBA stats' tenths),
 * and `x` is centred on the rim at 25 rather than being pre-centred at 0 the
 * way NBA stats' LOC_X already is. Verified against a real completed game —
 * reconstructing each play's own stated shot distance from `(x, y)` with the
 * rim at `(25, 0)` matched to within 0.65ft on average across 127 shots (see
 * `components/nba-court/JOURNAL.md`). Left/right (x) sign orientation was
 * NOT independently verified by that check, since distance is symmetric
 * under mirroring — worth confirming against a known shot before trusting
 * which corner is which.
 */
export function playLocationToWorld(x, y, end = 1) {
    const across = x - 25
    const upFloor = y
    return [end * (RIM_X - upFloor), end * across]
}

/* ------------------------------------------------------------------ */

/** Deterministic PRNG, so a given seed always yields the same chart. */
function mulberry32(seed) {
    let a = seed >>> 0
    return function random() {
        a |= 0
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function gaussian(rng) {
    let u = 0
    let v = 0
    while (u === 0) u = rng()
    while (v === 0) v = rng()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/**
 * Shot-zone profiles, as fractions of a player's attempts.
 *
 * These stand in for real aggregates while the look is being settled. The
 * shape is what matters: a modern chart is a hard cluster at the rim, two
 * corner stacks, an arc above the break, and a hollowed-out midrange. Feeding
 * the renderer a uniform scatter would make every design decision look fine
 * and none of them would survive real data.
 */
export const PROFILES = {
    modern: {
        label: 'Modern wing',
        zones: { rim: 0.34, paint: 0.12, midrange: 0.1, corner3: 0.16, arc3: 0.28 },
    },
    midrangeEra: {
        label: 'Midrange era',
        zones: { rim: 0.28, paint: 0.16, midrange: 0.42, corner3: 0.05, arc3: 0.09 },
    },
    big: {
        label: 'Interior big',
        zones: { rim: 0.62, paint: 0.22, midrange: 0.12, corner3: 0.01, arc3: 0.03 },
    },
}

/** Rough league make rates by zone, used to colour the bins. */
const ZONE_FG = { rim: 0.63, paint: 0.43, midrange: 0.41, corner3: 0.39, arc3: 0.355 }

const ARC_RADIUS = 23.75
const CORNER_X = 22
/** The arc meets the sideline 14ft from the baseline. */
const CORNER_BREAK = 14

function sampleZone(zone, rng) {
    switch (zone) {
        case 'rim': {
            const r = Math.abs(gaussian(rng)) * 2.1
            const a = rng() * Math.PI * 2
            return [Math.cos(a) * r, Math.sin(a) * r]
        }
        case 'paint': {
            const up = 4 + rng() * 8
            const across = (rng() - 0.5) * 15
            return [across, up]
        }
        case 'midrange': {
            const r = 11 + rng() * 10
            const a = (rng() - 0.5) * Math.PI * 0.95
            return [Math.sin(a) * r, Math.cos(a) * r]
        }
        case 'corner3': {
            const side = rng() < 0.5 ? -1 : 1
            const across = side * (CORNER_X + rng() * 1.1)
            const up = rng() * CORNER_BREAK
            return [across, up]
        }
        case 'arc3':
        default: {
            const r = ARC_RADIUS + rng() * 2.6
            // Only the span above the break; the corners are their own zone.
            const maxAngle = Math.acos(CORNER_BREAK / r)
            const a = (rng() - 0.5) * 2 * maxAngle
            return [Math.sin(a) * r, Math.cos(a) * r]
        }
    }
}

/**
 * A synthetic season of attempts, in world feet.
 *
 * Returns flat arrays rather than objects: this feeds instanced geometry and a
 * few hundred thousand small objects would dominate the frame budget.
 */
export function generateShots({
    profile = 'modern',
    count = 1200,
    seed = 7,
    end = 1,
} = {}) {
    const rng = mulberry32(seed)
    const zones = PROFILES[profile]?.zones ?? PROFILES.modern.zones
    const names = Object.keys(zones)
    const weights = names.map((n) => zones[n])
    const total = weights.reduce((a, b) => a + b, 0)

    const xs = new Float32Array(count)
    const zs = new Float32Array(count)
    const made = new Uint8Array(count)

    for (let i = 0; i < count; i++) {
        let pick = rng() * total
        let zone = names[names.length - 1]
        for (let z = 0; z < names.length; z++) {
            pick -= weights[z]
            if (pick <= 0) {
                zone = names[z]
                break
            }
        }

        const [across, up] = sampleZone(zone, rng)
        const [wx, wz] = shotToWorld(across * 10, up * 10, end)
        xs[i] = wx
        zs[i] = wz
        // A little spread around the zone rate, so bins are not all identical.
        made[i] = rng() < ZONE_FG[zone] + (rng() - 0.5) * 0.12 ? 1 : 0
    }

    return { xs, zs, made, count }
}

/** League-average points per shot, for the diverging colour scale. */
export const LEAGUE_PPS = 1.06
