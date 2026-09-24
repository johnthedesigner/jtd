import { distanceFromRim } from './shot-data'

/**
 * Hex binning in court feet.
 *
 * Pointy-top hexes on the d3-hexbin lattice: candidate rows are found by
 * rounding, then the nearer of the two neighbouring centres wins. Binning in
 * feet rather than pixels means bin size stays honest when the camera moves,
 * which a screen-space binning would not.
 */
export function hexbin(xs, zs, made, count, size) {
    const dx = size * Math.sqrt(3)
    const dy = size * 1.5
    const bins = new Map()

    for (let i = 0; i < count; i++) {
        const x = xs[i]
        const z = zs[i]

        const py = z / dy
        let pj = Math.round(py)
        const pxOffset = pj & 1 ? 0.5 : 0
        const px = x / dx - pxOffset
        let pi = Math.round(px)

        // The rounded cell is not always the nearest; check the row above too.
        const py1 = py - pj
        if (Math.abs(py1) * 3 > 1) {
            const px1 = px - pi
            const pj2 = pj + (py1 < 0 ? -1 : 1)
            const pi2 = Math.round(px - (pj2 & 1 ? 0.5 : 0))
            const d1 = px1 * px1 + py1 * py1
            const cx = px - pi2 - (pj2 & 1 ? 0.5 : 0) + pxOffset
            const cy = py - pj2
            if (cx * cx + cy * cy < d1) {
                pi = pi2
                pj = pj2
            }
        }

        const key = `${pi},${pj}`
        let bin = bins.get(key)
        if (!bin) {
            bin = {
                x: (pi + (pj & 1 ? 0.5 : 0)) * dx,
                z: pj * dy,
                attempts: 0,
                makes: 0,
            }
            bins.set(key, bin)
        }
        bin.attempts += 1
        bin.makes += made[i]
    }

    return [...bins.values()]
}

/**
 * Turns raw bins into everything the renderer needs.
 *
 * Bins under `minAttempts` are dropped rather than drawn faint: a single
 * attempt at 100% is not a hot spot, and letting it through is the fastest way
 * to make a shot chart lie.
 */
export function prepareBins(bins, { minAttempts = 4, end = 1 } = {}) {
    const kept = bins.filter((b) => b.attempts >= minAttempts)
    let maxAttempts = 1

    for (const bin of kept) {
        const dist = distanceFromRim(bin.x, bin.z, end)
        bin.isThree = dist >= 23.75 || (Math.abs(bin.z) >= 22 && dist >= 22)
        bin.fg = bin.makes / bin.attempts
        bin.pps = bin.fg * (bin.isThree ? 3 : 2)
        if (bin.attempts > maxAttempts) maxAttempts = bin.attempts
    }

    return { bins: kept, maxAttempts }
}
