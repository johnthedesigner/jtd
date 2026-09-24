import { POSES } from '../camera-poses'
import { markerForPlay } from './live-markers'

/**
 * Maps an incoming play to a camera/content reaction, tiered by how notable
 * the event is — settled in conversation, grounded in one real game's type
 * counts (see `components/nba-court/JOURNAL.md`):
 *
 * - spotlight: made shots, steals. Camera moves in close; marker prominent.
 * - nudge: missed shots, rebounds. A smaller pose deviation, shorter hold —
 *   these are the most frequent events in any game (rebounds alone were 93
 *   of ~440 plays in the one real game checked), so restraint matters most
 *   here, or the camera never stops moving.
 * - typography: timeouts, period boundaries, end of game. Halftime isn't a
 *   separate *tier* — it's just the end of period 2 — but it does get its
 *   own display text (see `statusTextFor`) rather than "END OF THE 2ND
 *   QUARTER," since that's not what anyone actually calls it.
 * - null: everything else (free throws, fouls, substitutions, jump balls) —
 *   HUD/feed only, no camera or content change.
 *
 * A tier here is necessary but not sufficient: `sceneForPlay` drops any
 * non-typography scene whose play produces no floor marker, so a turnover
 * with no steal in it stays a feed-only event however it's tiered. That
 * check lives there rather than in this table because it depends on the
 * play, not just its type.
 *
 * A plain lookup, not layered logic, on purpose — this is the thing most
 * likely to get retuned once seen in motion.
 */
const TIER_BY_TYPE = {
    shot: null, // resolved per-play below: made -> spotlight, missed -> nudge
    // Only the ~2/3 of turnovers that are steals get a marker, and so a
    // camera move; the rest drop out in `sceneForPlay`.
    turnover: 'spotlight',
    rebound: 'nudge',
    timeout: 'typography',
    period: 'typography',
    // Placed on the free-throw line, which is exactly where they happen —
    // see `live-markers.js`. Nudge, not spotlight: they come in pairs and
    // the camera shouldn't lunge twice at the same spot.
    freeThrow: 'nudge',
    // ESPN locates fouls for real (31 of 34 independent coordinates in the
    // game checked), so they can be marked where they happened.
    foul: 'nudge',
    substitution: null,
    jumpball: null,
    other: null,
}

export function tierForPlay(play) {
    if (play.type === 'shot') return play.made ? 'spotlight' : 'nudge'
    return TIER_BY_TYPE[play.type] ?? null
}

/** Higher-priority scenes can't be interrupted by a lower-priority one that
 *  happens to arrive while they're still holding — see `useLiveSceneDirector`. */
export const TIER_PRIORITY = {
    nudge: 1,
    spotlight: 2,
    typography: 3,
}

/**
 * ESPN's own play descriptions are already clean, human-readable strings
 * ("76ers Full timeout", "End of the 3rd Quarter" — confirmed against a
 * real game's actual text, not assumed), so this reuses them directly
 * rather than building a separate mapping table — the one exception is
 * period 2's boundary, which nobody calls "the end of the 2nd quarter."
 */
function statusTextFor(play) {
    if (play.type === 'period' && play.period === 2) return 'HALFTIME'
    return (play.description || '').replace(/\s+/g, ' ').trim().toUpperCase()
}

/**
 * A scene reaction is expressed as a small *deviation from the live view's
 * own idle pose*, not as a pose of its own — which is the whole reason the
 * first version read as a jump cut rather than a camera move. The
 * transition was always eased (~1.1s, see `POSE_MOVE_SECONDS`) and the fov
 * was always lerped; what made it cut was the size of the deltas: a 60°
 * azimuth swing, a target thrown from centre court to a basket, and a
 * framing that switched solve *mode* entirely (`fitRadius`, a sphere
 * solve, against the idle pose's rectangular `fit`), so the two ends of
 * the interpolation weren't even measured the same way.
 *
 * Everything below is therefore a fraction of the idle pose, in the same
 * units, with the same solve mode and fov — the camera leans toward the
 * action rather than relocating to it.
 */
const BASE_POSE_ID = 'wide'
/** Degrees off-axis at full intensity, mirrored by `end`. */
const MAX_AZIMUTH_SHIFT = 16
/** Degrees the camera drops toward the floor at full intensity. */
const MAX_ELEVATION_DROP = 4
/** How far the aim point travels from centre court toward the action. */
const MAX_TARGET_LEAN = 0.35
/** How much the framed region tightens — a lean-in, not a new framing. */
const MAX_ZOOM_IN = 0.18

/**
 * **The camera does not move for play any more.** It stays in the
 * half-court view for the whole game.
 *
 * Reacting to each event was tried at a range of intensities — a full
 * spotlight swing, and then a much subtler lean of ~16 degrees with a
 * fraction of a zoom — and neither worked. The problem turned out not to be
 * the size of the move or the easing: events arrive every few seconds, so
 * the camera was permanently in motion, and a floor that never sits still
 * is harder to read than one that does, however gently it drifts. Holding
 * one clear, stable view of the whole court and letting the *marks* carry
 * the event is what actually reads.
 *
 * `computedPoseForPlay` is kept rather than deleted: the infrastructure it
 * needs is all still live (the rig interpolates in pose terms and survives
 * being retargeted mid-move — see `CameraRig`), so turning reactions back
 * on for a specific case later is flipping this flag, not rebuilding them.
 */
const CAMERA_FOLLOWS_PLAY = false

/**
 * A pose leaning toward one play's marker — a fraction of the idle pose, in
 * the same units and the same solve mode, so both ends of the camera's
 * interpolation are measured the same way.
 *
 * Each generated pose gets a distinct `id`: `CameraRig`'s `distFor` caches
 * solved framing distance by `pose.id`, and reusing one id across different
 * targets would silently return a stale distance.
 *
 * Unused while `CAMERA_FOLLOWS_PLAY` is false.
 */
export function computedPoseForPlay(play, { intensity = 1, marker } = {}) {
    const mark = marker ?? markerForPlay(play)
    if (!mark) return null
    const base = POSES[BASE_POSE_ID]
    const [actionX, actionZ] = [mark.x, mark.z]

    const lean = MAX_TARGET_LEAN * intensity
    const targetX = base.target[0] + (actionX - base.target[0]) * lean
    const targetZ = base.target[2] + (actionZ - base.target[2]) * lean
    const zoom = 1 - MAX_ZOOM_IN * intensity

    return {
        id: `live-scene-${play.actionNumber}`,
        elevation: base.elevation - MAX_ELEVATION_DROP * intensity,
        // Keyed off the mark's own side of the floor, not the team's basket.
        azimuth: -Math.sign(actionX) * MAX_AZIMUTH_SHIFT * intensity,
        target: [targetX, base.target[1], targetZ],
        fit: [base.fit[0] * zoom, base.fit[1] * zoom],
        minFitX: (base.minFitX ?? base.fit[0]) * zoom,
        fov: base.fov,
    }
}

/** Hold duration per tier, in seconds — first-pass, tune visually. */
export const HOLD_SECONDS = {
    spotlight: 4,
    nudge: 2.5,
    typography: 6,
}

/**
 * The full scene descriptor for a play, or null if this play doesn't
 * warrant a camera/content reaction (see `tierForPlay`).
 */
export function sceneForPlay(play) {
    const tier = tierForPlay(play)
    if (!tier) return null

    if (tier === 'typography') {
        return {
            tier,
            pose: null, // reuses the live view's own idle pose — see useLiveSceneDirector
            holdSeconds: HOLD_SECONDS.typography,
            content: {
                typography: {
                    status: statusTextFor(play),
                    homeScore: play.scoreHome,
                    awayScore: play.scoreAway,
                },
            },
        }
    }

    // Still gated on there being a mark: a scene with no camera move and
    // nothing on the floor is nothing at all.
    const marker = markerForPlay(play)
    if (!marker) return null

    return {
        tier,
        // Null pose means "stay where you are" — `CourtViewer` falls through
        // to the live view's own idle pose. See CAMERA_FOLLOWS_PLAY above.
        pose: CAMERA_FOLLOWS_PLAY ? computedPoseForPlay(play, { marker }) : null,
        holdSeconds: HOLD_SECONDS[tier],
        content: { marker },
    }
}
