import { MAX_INSTANCES } from './constants.js'

/**
 * Instance data for the logo field.
 *
 * Logos are placed in a shallow camera space: each one gets a depth, and that
 * depth drives its apparent size, its circle of confusion, and how far its
 * colour drifts toward the pale end of the ramp. Positions stay as fractions
 * of the hero, so a resize reflows the field without regenerating it.
 */

export const FIELD_DEFAULTS = {
    // Camera. `worldSize` is the logo's width at z = 1.
    worldSizeMin: 950,
    worldSizeMax: 1950,
    zNear: 0.9,
    zFar: 3.0,
    // Focus sits near the front, so the logos painted last stay crisp and
    // their silhouettes still read through the stack.
    zFocus: 1.45,
    // Depths are spread evenly, so the focal plane sits mid-field with
    // roughly as many logos in front of it as behind.
    zBias: 1,

    // Depth of field, in screen pixels of blur. Near defocus reads stronger
    // than far, as it does through a real lens.
    nearBlurPx: 46,
    farBlurPx: 22,
    maxBlurPx: 44,
    // Defocus below this reads as sharp, which is what gives the field a real
    // plane of focus instead of softening everything at once.
    focusDeadZonePx: 3,
    // Nominal hero aspect used to shape the placement grid.
    gridAspect: 2,
    // Placement runs past the left, right and top edges by these fractions, so
    // logos from outside the frame reach in. Without it the outer cells get no
    // neighbours from beyond the edge and coverage thins along the border.
    overscanX: 0.28,
    overscanTop: 0.25,
    // Placement past the bottom edge. The hero leaves this at zero and lets
    // the fringe taper tear the field off; a panel that has to fill its whole
    // box sets `raggedEdge: false` and overscans the bottom too.
    overscanBottom: 0.25,
    raggedEdge: true,

    rotationDeg: 60,
    settleRotationDeg: 20,
    staggerMs: 2000,
    fadeMs: 90,
    // Each logo slides down into place over this long, from this far above it.
    // Longer than the fade so the movement reads; the shader eases it out.
    settleMs: 340,
    settleDropPx: 26,
    // Share of the stagger spent on the ordered part of the reveal rather
    // than on scatter.
    sweepShare: 0.75,
    // `sweep` fills top to bottom, `depth` fills back to front, `both` runs
    // the two together so the field arrives as a wave that also recedes.
    revealOrder: 'sweep',
    // For `both`: 0 is all sweep, 1 is all depth.
    revealMix: 0.5,

    alphaMin: 0.94,
    alphaMax: 1,
    // Where the solid field ends and the ragged fringe begins, as a fraction
    // of hero height, and where the fringe thins out to nothing.
    fringeStart: 0.84,
    fringeEnd: 1.03,
    // Logos in the fringe are pushed toward the back of the field, so the
    // bottom edge is drawn by small marks. Large ones there leave deep lobes
    // and the field reads as torn rather than as an edge.
    fringeDepthPush: 0.8,
    // Caps how light the scattered logos get, leaving headroom above them on
    // the ramp for a `feature` logo to sit lighter than all of them.
    shadeCeiling: 1,
    // One extra logo drawn last, over the field, in its own place:
    // `{ x, y, width, rotation, alpha, blur, shade }`, with x and y as
    // fractions of the box and width in pixels. The footer's wordmark uses it.
    feature: null,
    // How far depth pushes colour toward the light end of the ramp.
    depthShade: 0.25,
    shadeJitter: 0.85,
}

const FLOATS_PER_INSTANCE = 8

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

/**
 * Jittered grid rather than uniform scatter.
 *
 * Uniform placement leaves holes until logos overlap several deep, and by then
 * every silhouette has been painted over. Stratifying gets the same coverage
 * from far fewer layers, which is what keeps individual marks readable.
 *
 * The grid runs past the left, right and top edges so the border fills like
 * the middle. Cells below `fringeStart` survive with a falling probability, so
 * the field tears off at the bottom rather than ending on a line.
 */
function gridCells(random, target, opts) {
    const xFrom = -opts.overscanX
    const xTo = 1 + opts.overscanX
    const yFrom = -opts.overscanTop
    const yTo = opts.raggedEdge ? opts.fringeEnd : 1 + opts.overscanBottom

    // `target` is the count for the visible box, so hold the cell size fixed
    // and add cells for the overscan rather than spreading the same ones thinner.
    const visibleArea = 1 * (opts.raggedEdge ? opts.fringeEnd : 1)
    const area = (xTo - xFrom) * (yTo - yFrom)

    // Oversample, because the taper drops cells from the bottom band.
    const flat = opts.fringeStart + (opts.fringeEnd - opts.fringeStart) / 2
    const keepRate = opts.raggedEdge ? flat / opts.fringeEnd : 1
    const wanted = Math.ceil((target / keepRate) * (area / visibleArea))

    const cols = Math.max(1, Math.round(Math.sqrt(wanted * opts.gridAspect * (area / visibleArea))))
    const rows = Math.max(1, Math.ceil(wanted / cols))

    const cells = []
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const y = yFrom + ((row + random()) / rows) * (yTo - yFrom)
            if (opts.raggedEdge && y > opts.fringeStart) {
                const keep = 1 - (y - opts.fringeStart) / (opts.fringeEnd - opts.fringeStart)
                if (random() >= keep) continue
            }
            cells.push({ x: xFrom + ((col + random()) / cols) * (xTo - xFrom), y })
        }
    }

    // Depth must not correlate with grid position, or the field bands.
    for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1))
        const tmp = cells[i]
        cells[i] = cells[j]
        cells[j] = tmp
    }
    return cells
}

/**
 * Builds the packed instance buffer, sorted far to near so nearer logos paint
 * over more distant ones. Eight floats per logo:
 * `[xFraction, yFraction, widthPx, rotation, delaySec, alpha, blurPx, shade]`.
 */
export function createLogoField({ count, seed = 1, maxCount = MAX_INSTANCES, ...options } = {}) {
    const opts = { ...FIELD_DEFAULTS, ...options }
    const random = mulberry32(seed)
    const stagger = opts.staggerMs / 1000
    const toRad = Math.PI / 180
    const zSpan = opts.zFar - opts.zNear

    const cells = gridCells(random, count, opts)
    // The shader's uniform array is fixed, so a dense field has to shed cells.
    // They were shuffled before depths were assigned, so truncating here takes
    // a uniform random subset; trimming after the depth sort would instead cut
    // the whole near plane and most of the coverage with it. A `feature` logo
    // is appended after the sort, so it needs a slot held back for it.
    const room = maxCount - (opts.feature ? 1 : 0)
    if (cells.length > room) cells.length = room

    const logos = []
    const fringeSpan = opts.fringeEnd - opts.fringeStart

    for (const cell of cells) {
        const y = cell.y
        const sweepY = Math.max(0, y)

        let z = opts.zNear + zSpan * random() ** opts.zBias
        const fringeT = opts.raggedEdge
            ? Math.max(0, Math.min(1, (y - opts.fringeStart) / fringeSpan))
            : 0
        if (fringeT > 0) z += (opts.zFar - z) * fringeT * opts.fringeDepthPush
        const depth = (z - opts.zNear) / zSpan

        // What decides a logo's turn. `sweep` runs top to bottom, squared so
        // the front of the sweep starts fast; logos above the top edge land
        // with the first row rather than late. `depth` runs back to front,
        // which matches the draw order, so each logo arrives in front of the
        // ones already there. One random draw either way, so switching the
        // order does not reshuffle the field itself.
        const sweepTerm = sweepY * sweepY
        const depthTerm = 1 - depth
        const ordered = opts.revealOrder === 'depth' ? depthTerm
            : opts.revealOrder === 'both'
                ? sweepTerm * (1 - opts.revealMix) + depthTerm * opts.revealMix
                : sweepTerm
        const orderedDelay = ordered * stagger * opts.sweepShare
            + random() * stagger * (1 - opts.sweepShare)

        // Perspective only scales the logo; positions stay uniform so that
        // coverage does not thin out toward the edges.
        const width = (opts.worldSizeMin + random() * (opts.worldSizeMax - opts.worldSizeMin)) / z

        // Thin-lens circle of confusion, zero at the focal plane. Positive in
        // front of it, negative behind, each side scaled on its own.
        // Negative in front of the focal plane, positive behind it.
        const defocus = (1 / opts.zFocus - 1 / z) * opts.zFocus
        const raw = defocus < 0 ? -defocus * opts.nearBlurPx : defocus * opts.farBlurPx
        const blur = Math.min(opts.maxBlurPx, Math.max(0, raw - opts.focusDeadZonePx))

        logos.push({
            z,
            x: cell.x,
            y,
            width,
            rotation: (random() - 0.5) * opts.rotationDeg * toRad,
            delay: orderedDelay,
            alpha: opts.alphaMin + random() * (opts.alphaMax - opts.alphaMin),
            blur,
            shade: Math.min(1, depth * opts.depthShade + random() * opts.shadeJitter) * opts.shadeCeiling,
        })
    }

    logos.sort((a, b) => b.z - a.z)

    // Appended after the depth sort so it draws last, over everything else.
    if (opts.feature) {
        const f = opts.feature
        logos.push({
            z: opts.zNear,
            x: f.x ?? 0.5,
            y: f.y ?? 0.5,
            width: f.width,
            rotation: f.rotation ?? 0,
            delay: f.delay ?? 0,
            alpha: f.alpha ?? 1,
            blur: f.blur ?? 0,
            shade: f.shade ?? 1,
        })
    }

    const data = new Float32Array(logos.length * FLOATS_PER_INSTANCE)
    logos.forEach((logo, i) => {
        const o = i * FLOATS_PER_INSTANCE
        data[o + 0] = logo.x
        data[o + 1] = logo.y
        data[o + 2] = logo.width
        data[o + 3] = logo.rotation
        data[o + 4] = logo.delay
        data[o + 5] = logo.alpha
        data[o + 6] = logo.blur
        data[o + 7] = logo.shade
    })

    return {
        data,
        count: logos.length,
        floatsPerInstance: FLOATS_PER_INSTANCE,
        durationSec: stagger + Math.max(opts.fadeMs, opts.settleMs) / 1000,
        options: opts,
    }
}
