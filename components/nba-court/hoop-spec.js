/**
 * Hoop assembly dimensions, in feet.
 *
 * These are rule-book numbers, not eyeballed proportions, which is the whole
 * reason this is worth modelling rather than faking: a torus really is a rim,
 * and every offset below is published.
 *
 *   Backboard   72in x 42in, lower edge 9ft above the floor
 *   Board face  4ft inside the baseline
 *   Rim         18in outside diameter, exactly 10ft up
 *   Rim centre  5.25ft from the baseline (4ft board + 6in gap + 9in radius)
 *   Inner square 24in x 18in, 2in stroke, bottom edge level with the rim
 *
 * The court atlas already has backboards and rims painted out (see the notes
 * field in template.json), so nothing here doubles up with the texture.
 */

const IN = 1 / 12

export const BACKBOARD = {
    /**
     * Rule-book exact: 72in by 42in, lower edge 9ft above the floor.
     *
     * That 9ft is not arbitrary — it is what makes the rest line up. The inner
     * square is 18in tall on a 42in board, so centring it vertically leaves
     * 12in above and below; with the board's lower edge at 9ft, the square's
     * base lands at exactly 10ft, level with the ring, which is what the rule
     * requires. Move the board and the target stops matching the rim.
     */
    width: 72 * IN,
    height: 42 * IN,
    thickness: 1.5 * IN,
    bottom: 9,
    /** Distance from the baseline to the front face. */
    inset: 4,
    /** 24in by 18in, 2in stroke, base level with the ring. */
    innerSquare: { width: 24 * IN, height: 18 * IN, stroke: 2 * IN },
    /** The perimeter stripe silk-screened on the glass. */
    border: 3 * IN,
    /**
     * The bumper: a shell on the board's edge faces, not on either flat face.
     *
     * It sits on the bottom edge, turns the two bottom corners and runs a way
     * up the side edges — a U seen from the front. Its depth is exactly the
     * board's thickness, so it reaches neither past the front face, where it
     * would be in the path of a ball coming off the rim, nor behind the glass,
     * where nothing needs protecting. Earlier versions ran up the *front* face
     * instead, which is why they kept reading as a coloured band inside the
     * board.
     */
    // The bumper's cross-section — how far it protrudes off the board's
    // edge, not to be confused with padRise (how far it runs along the edge).
    // Two inches, as measured against a real backboard pad.
    padDrop: 2 * IN,
    padSide: 2 * IN,
    padRise: 14 * IN,
}

export const RIM = {
    /**
     * Rule-book exact.
     *
     *   Inside diameter 18in, so a 9in inside radius.
     *   Ring stock is 5/8in, and `height` is the top of the ring at 10ft
     *   exactly — so the torus centre sits one tube-radius below it.
     *   The nearest inside edge of the ring is 6in from the board face, which
     *   puts the ring's centre 15in out: 6 + 9.
     */
    innerRadius: 9 * IN,
    tubeRadius: 0.3125 * IN,
    height: 10,
    gap: 6 * IN,
}

export const NET = {
    topRadius: 9 * IN,
    bottomRadius: 5.5 * IN,
    length: 18 * IN,
    /** Twelve cords, as on a real net. */
    strands: 12,
    rows: 6,
    cordRadius: 0.09 * IN,
}

export const SHOT_CLOCK = {
    width: 2.6,
    height: 1.25,
    /** Front to back. A real clock housing is a shallow panel, not a box. */
    depth: 0.19,
    /** How far the mast lifts the clock above the top of the glass. */
    mastHeight: 0.8,
    value: '24.0',
}

/**
 * The stanchion, as a side profile extruded across the floor.
 *
 * A real rig is a low wedge base, a vertical padded column well behind the
 * baseline, and a cantilevered arm reaching forward to the glass — one
 * continuous padded shell, not a stack of primitives. Modelling it as a 2D
 * outline and extruding it gets that silhouette exactly and keeps the padding
 * a single surface, which is what makes it read as upholstery.
 *
 * Coordinates below are local to the column's front face, with +X pointing
 * toward centre court and Y up. Hoop mirrors the whole group for the far end.
 */
export const STANCHION = {
    /**
     * How far the column's court-facing face sits behind the baseline. Set
     * clear of the apron logos; the arm lengthens to match automatically,
     * because armReach is measured to the glass, so the board does not move.
     */
    columnBehindBaseline: 8,

    /**
     * Padded lower body. Its court-facing face is vertical to the floor — no
     * splayed foot, which read as a plinth rather than upholstery — and is
     * finished with a separate panel so a seam shows around its edges.
     */
    padTop: 8,
    columnDepth: 2.3,
    bodyWidth: 3.6,
    baseBack: 8.6,
    panelThickness: 0.5,
    panelSeam: 0.07,
    padBevel: 0.22,

    /**
     * Metal upper: column and cantilever arm, about half the padded width, and
     * started below the top of the padding so it emerges from it rather than
     * sitting on it.
     */
    metalWidth: 1.8,
    metalDepth: 1.7,
    metalEmerge: 1.1,
    metalBevel: 0.28,

    /**
     * Cantilever arm heights. Deliberately below the rim: run level with it,
     * the arm's end face shows through the glass directly behind the ring and
     * reads as a slab floating there. A real arm meets the board low, behind
     * the bottom padding, which is where these put it.
     */
    armTop: 9.6,
    armBottom: 7.95,
}

/** X of the backboard's front face for the basket at `end` (+1 or -1). */
export function boardFaceX(end, courtHalfLength) {
    return end * (courtHalfLength - BACKBOARD.inset)
}

/** X of the rim centre: 6in gap plus the 9in inside radius, so 15in out. */
export function rimCentreX(end, courtHalfLength) {
    return end * (courtHalfLength - (BACKBOARD.inset + RIM.gap + RIM.innerRadius))
}
