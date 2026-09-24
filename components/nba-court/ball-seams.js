/**
 * Basketball seam geometry, and the equirectangular maps baked from it.
 *
 * Built to the spec in `basketball-seam-geometry.md`. The seam network is
 * three closed loops on the sphere: two exact great circles, plus a wavy
 * loop near the ZX plane that bows alternately toward +Y and -Y. They meet
 * at six points with four seams at each, which gives twelve edges and eight
 * curved-triangular panels — the octahedral graph, and the reason a real
 * ball's panels are fish-shaped when flattened.
 *
 * **No DOM.** Everything here is arrays and numbers, so the same code runs
 * in the browser and in headless Node — which is what lets the spec's
 * verification checks (region count, panel areas, on-sphere) run against
 * the real construction rather than a reimplementation of it. The same
 * reasoning as `logo-hero-gpu/logo-glyph.js`, which is also verified that
 * way.
 */

/** NBA size 7. Circumference 29.5in gives this radius. */
export const BALL_RADIUS_MM = 119.3
/** Groove width across, not half. */
export const SEAM_WIDTH_MM = 6

/**
 * Bow amplitude of the wavy loop, in radians, and its phase.
 *
 * `phase = 0` is the canonical look: the wavy loop passes exactly through
 * +X, +Z, -X, -Z, so the ball shows the familiar circle-plus-long-S-curve
 * from the side. The spec's alternative, `phase = pi/2`, makes all eight
 * panels equal in area but reads as a tilted near-circle rather than an
 * S-curve, so it is not what a basketball looks like. Appearance wins here.
 *
 * At `phase = 0` the panels are genuinely unequal — four at about 1.19
 * steradians and four at about 1.76 — which the verification expects rather
 * than treats as a fault.
 */
export const SEAM_AMPLITUDE = 0.34
export const SEAM_PHASE = 0

/** Angular half-width of a groove, from the ball's own dimensions. */
export function seamHalfWidth(radiusMM = BALL_RADIUS_MM, widthMM = SEAM_WIDTH_MM) {
    return widthMM / 2 / radiusMM
}

/**
 * A point on the wavy loop.
 *
 * The displacement is `sin(A sin(2t + phase))` rather than `A sin(...)` so
 * the point lands on the unit sphere once normalized, with the deviation
 * from the ZX plane equal to `A sin(2t + phase)` exactly.
 */
export function wavySeamPoint(t, amplitude = SEAM_AMPLITUDE, phase = SEAM_PHASE, out = [0, 0, 0]) {
    const y = Math.sin(amplitude * Math.sin(2 * t + phase))
    const x = Math.cos(t)
    const z = Math.sin(t)
    const inv = 1 / Math.hypot(x, y, z)
    out[0] = x * inv
    out[1] = y * inv
    out[2] = z * inv
    return out
}

/** The wavy loop, sampled densely and flattened into one array. */
export function wavySeamSamples(count = 2048, amplitude = SEAM_AMPLITUDE, phase = SEAM_PHASE) {
    const pts = new Float64Array(count * 3)
    const tmp = [0, 0, 0]
    for (let i = 0; i < count; i++) {
        wavySeamPoint((i / count) * Math.PI * 2, amplitude, phase, tmp)
        pts[i * 3] = tmp[0]
        pts[i * 3 + 1] = tmp[1]
        pts[i * 3 + 2] = tmp[2]
    }
    return pts
}

/**
 * Texture UV to a direction on the sphere, matching `THREE.SphereGeometry`'s
 * own mapping exactly — otherwise the bake lands rotated or mirrored on the
 * mesh, which looks like a seam-maths error and is not one.
 */
export function uvToDirection(u, v, out = [0, 0, 0]) {
    const theta = (1 - v) * Math.PI
    const phi = u * Math.PI * 2
    const sinTheta = Math.sin(theta)
    out[0] = -Math.cos(phi) * sinTheta
    out[1] = Math.cos(theta)
    out[2] = Math.sin(phi) * sinTheta
    return out
}

/**
 * Angular distance from a direction to the nearest seam.
 *
 * The two great circles are analytic: for a circle with unit normal `n`,
 * the angular distance is `asin(|dot(p, n)|)`. C1 lies in the XY plane so
 * its normal is +Z; C2 lies in YZ so its normal is +X.
 *
 * The wavy loop is sampled. The nearest sample is found by a local search
 * rather than a scan of all of them: the loop is a graph over the azimuth
 * in the XZ plane, so `atan2(z, x)` lands within a small window of the
 * nearest point. Verified against brute force over the whole loop — see
 * `scratchpad/ball-verify.mjs`, which reports the worst disagreement.
 */
export function seamDistance(p, samples, searchWindow = 0.45) {
    const circle1 = Math.asin(Math.min(1, Math.abs(p[2])))
    const circle2 = Math.asin(Math.min(1, Math.abs(p[0])))
    let best = Math.min(circle1, circle2)

    const count = samples.length / 3
    const t0 = Math.atan2(p[2], p[0])
    const half = Math.round((searchWindow / (Math.PI * 2)) * count)
    const center = Math.round((t0 / (Math.PI * 2)) * count)

    for (let k = -half; k <= half; k++) {
        let i = (center + k) % count
        if (i < 0) i += count
        const dot = p[0] * samples[i * 3] + p[1] * samples[i * 3 + 1] + p[2] * samples[i * 3 + 2]
        const d = Math.acos(Math.max(-1, Math.min(1, dot)))
        if (d < best) best = d
    }
    return best
}

/**
 * The seam distance field over an equirectangular grid, plus the direction
 * furthest from any seam.
 *
 * That furthest point is where a logo goes: the spec asks for a mark that
 * never touches a seam, which makes placement a computed result rather than
 * a judgement. Taking the global maximum finds the centre of one of the
 * four *larger* panels; the other three are its sign variants, since the
 * panel set is closed under flipping any two components.
 */
export function buildSeamField({
    width = 1024,
    height = 512,
    amplitude = SEAM_AMPLITUDE,
    phase = SEAM_PHASE,
    sampleCount = 2048,
} = {}) {
    const samples = wavySeamSamples(sampleCount, amplitude, phase)
    const field = new Float32Array(width * height)
    const dir = [0, 0, 0]

    let bestDistance = -1
    const anchor = [0, 0, 0]

    for (let y = 0; y < height; y++) {
        const v = (y + 0.5) / height
        for (let x = 0; x < width; x++) {
            const u = (x + 0.5) / width
            uvToDirection(u, v, dir)
            const d = seamDistance(dir, samples)
            field[y * width + x] = d
            if (d > bestDistance) {
                bestDistance = d
                anchor[0] = dir[0]
                anchor[1] = dir[1]
                anchor[2] = dir[2]
            }
        }
    }

    return { field, width, height, anchor, anchorClearance: bestDistance }
}

/**
 * An orthonormal frame at a direction, for projecting a flat mark onto the
 * sphere around it.
 */
export function tangentFrame(normal) {
    // Any axis not parallel to the normal will do to start.
    const seed = Math.abs(normal[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]
    const east = [
        seed[1] * normal[2] - seed[2] * normal[1],
        seed[2] * normal[0] - seed[0] * normal[2],
        seed[0] * normal[1] - seed[1] * normal[0],
    ]
    const invE = 1 / Math.hypot(east[0], east[1], east[2])
    east[0] *= invE
    east[1] *= invE
    east[2] *= invE
    const north = [
        normal[1] * east[2] - normal[2] * east[1],
        normal[2] * east[0] - normal[0] * east[2],
        normal[0] * east[1] - normal[1] * east[0],
    ]
    return { east, north }
}

/**
 * Samples a flat mask onto the sphere around `anchor`, azimuthal
 * equidistant.
 *
 * That projection keeps scale correct along every radius from the centre,
 * so the mark stays undistorted where it matters and only shears slightly
 * at its corners. A straight lat/long wrap smears it badly and the spec
 * says not to use one.
 *
 * Returns coverage per texel, and the worst seam clearance any covered
 * texel had — so the caller can fail loudly rather than emboss a mark
 * across a groove.
 */
export function projectMaskOntoSphere({
    mask,
    maskWidth,
    maskHeight,
    anchor,
    angularRadius,
    field,
    width,
    height,
}) {
    const { east, north } = tangentFrame(anchor)
    const coverage = new Uint8Array(width * height)
    const dir = [0, 0, 0]

    // The mark's longest half-dimension maps to `angularRadius`, so the
    // shorter axis simply covers less of the disc.
    const half = Math.max(maskWidth, maskHeight) / 2
    let worstClearance = Infinity

    for (let y = 0; y < height; y++) {
        const v = (y + 0.5) / height
        for (let x = 0; x < width; x++) {
            const u = (x + 0.5) / width
            uvToDirection(u, v, dir)

            const dot = dir[0] * anchor[0] + dir[1] * anchor[1] + dir[2] * anchor[2]
            const rho = Math.acos(Math.max(-1, Math.min(1, dot)))
            if (rho > angularRadius) continue

            const e = dir[0] * east[0] + dir[1] * east[1] + dir[2] * east[2]
            const n = dir[0] * north[0] + dir[1] * north[1] + dir[2] * north[2]
            const bearing = Math.atan2(n, e)

            // Scale so `angularRadius` of sphere maps to `half` of mask.
            const r = (rho / angularRadius) * half
            const mx = Math.round(maskWidth / 2 + r * Math.cos(bearing))
            const my = Math.round(maskHeight / 2 - r * Math.sin(bearing))
            if (mx < 0 || mx >= maskWidth || my < 0 || my >= maskHeight) continue

            const a = mask[my * maskWidth + mx]
            if (!a) continue
            coverage[y * width + x] = a
            const clearance = field[y * width + x]
            if (clearance < worstClearance) worstClearance = clearance
        }
    }

    return { coverage, worstClearance }
}

/** Deterministic value noise, for the leather's pebbling. */
function pebble(x, y, scale) {
    const s = Math.sin(x * scale * 12.9898 + y * scale * 78.233) * 43758.5453
    return s - Math.floor(s)
}

/**
 * Bakes the ball's colour, bump and roughness into equirectangular maps.
 *
 * One bake serves all three, which is the reason the spec prefers a mask
 * over tube geometry sitting on the sphere: separate seam tubes z-fight
 * against the surface and break the lighting where they join it.
 *
 * Height composes as the spec describes — seams cut *down* from the base
 * surface, the logo raised *from* it. The two never overlap by
 * construction, so there is no blending rule to get wrong.
 */
export function bakeBallTextures({
    width = 1024,
    height = 512,
    amplitude = SEAM_AMPLITUDE,
    phase = SEAM_PHASE,
    logoMask = null,
    logoAngularRadius = 0.42,
    logoClearance = 0.035,
    leather = '#d4752f',
    seam = '#140d09',
} = {}) {
    const { field, anchor, anchorClearance } = buildSeamField({ width, height, amplitude, phase })
    const half = seamHalfWidth()

    let logo = null
    if (logoMask) {
        logo = projectMaskOntoSphere({
            mask: logoMask.data,
            maskWidth: logoMask.width,
            maskHeight: logoMask.height,
            anchor,
            angularRadius: logoAngularRadius,
            field,
            width,
            height,
        })
    }

    const parse = (hex) => [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
    ]
    const base = parse(leather)
    const groove = parse(seam)

    const color = new Uint8Array(width * height * 4)
    const bump = new Uint8Array(width * height * 4)
    const rough = new Uint8Array(width * height * 4)

    // A texel's worth of feather, so the groove edge isn't stair-stepped.
    const feather = (Math.PI / height) * 1.5

    for (let i = 0; i < width * height; i++) {
        const d = field[i]
        // 1 deep in a groove, 0 out on the panel.
        const inSeam = 1 - Math.min(1, Math.max(0, (d - (half - feather)) / (2 * feather)))
        // Shoulders: a wider, softer falloff for the bump than the colour,
        // so the groove has sides rather than a cliff.
        const shoulder = 1 - Math.min(1, Math.max(0, (d - half) / (half * 2.2)))

        const grain = pebble(i % width, (i / width) | 0, 1) * 0.5 + pebble(i % width, (i / width) | 0, 3.7) * 0.5

        const lit = 1 - inSeam
        const tint = 0.88 + grain * 0.24
        color[i * 4] = Math.min(255, (base[0] * tint) * lit + groove[0] * inSeam)
        color[i * 4 + 1] = Math.min(255, (base[1] * tint) * lit + groove[1] * inSeam)
        color[i * 4 + 2] = Math.min(255, (base[2] * tint) * lit + groove[2] * inSeam)
        color[i * 4 + 3] = 255

        // Mid grey is the panel surface; grooves go down, the mark comes up.
        let h = 150 + (grain - 0.5) * 26
        h -= shoulder * 120
        // The spec puts the emboss at 0.5-1mm against 6mm grooves. In the
        // height map that is a much smaller step than the grooves take, but
        // it still has to survive being resolved at texture scale and lit
        // by a rig that is nowhere near grazing.
        if (logo) h += (logo.coverage[i] / 255) * 78
        const hb = Math.max(0, Math.min(255, h))
        bump[i * 4] = hb
        bump[i * 4 + 1] = hb
        bump[i * 4 + 2] = hb
        bump[i * 4 + 3] = 255

        // Grooves are smoother than the pebbled panels; so is the raised
        // mark, which on a real ball is moulded rather than grained.
        //
        // Not fully matte. Composition leather does carry a low sheen, and
        // without one there is no highlight for the relief to break up —
        // which is most of why the emboss read as nothing at first.
        let r = 186 - grain * 44
        r -= inSeam * 70
        if (logo) r -= (logo.coverage[i] / 255) * 50
        const rb = Math.max(0, Math.min(255, r))
        rough[i * 4] = rb
        rough[i * 4 + 1] = rb
        rough[i * 4 + 2] = rb
        rough[i * 4 + 3] = 255
    }

    return {
        color,
        bump,
        rough,
        width,
        height,
        anchor,
        anchorClearance,
        // Fails loudly rather than embossing a mark across a groove.
        logoFits: logo ? logo.worstClearance > half + logoClearance : true,
        logoWorstClearance: logo ? logo.worstClearance : null,
    }
}
