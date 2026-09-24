import { RIM_X } from '../shot-data'
import { COURT_LENGTH } from '../constants'

/**
 * Where a play's symbol goes on the floor, and which symbol it is — the
 * single place that decision is made, shared by the floor marks
 * (`LiveGameOverlay`) and anything else that needs to know a play has a
 * visible location.
 *
 * Most positions are now ESPN's own. `normalize.js` carries the detail of
 * which play types have a real coordinate and which don't (re-verified
 * against a full real game); the short version is that shots, fouls and
 * turnovers do, free throws happen on the line by definition, and rebounds
 * carry a copy of the preceding shot's coordinate rather than a location of
 * their own.
 *
 * So exactly two placements here are inferred rather than measured, and
 * both are marked as such:
 *
 * - **Rebounds**, near the rim they came off. The basket is known exactly
 *   (`play.end`); only the scatter around it is invented, and it's derived
 *   from the play's own action number so a given rebound always lands in
 *   the same spot rather than jittering between renders.
 * - **Free throws**, on the free-throw line — 19ft from the baseline by
 *   rule, so barely an inference at all; only the small sideways spread is,
 *   and that exists so a 1-of-2 and a 2-of-2 don't stack exactly.
 */

export const MARKER_KINDS = {
    MAKE: 'make',
    MISS: 'miss',
    REBOUND: 'rebound',
    STEAL: 'steal',
    TURNOVER: 'turnover',
    FOUL: 'foul',
}

/** Feet from the rim a rebound symbol is scattered within. */
const REBOUND_SPREAD_X = 5
const REBOUND_SPREAD_Z = 7
/** Baseline to the free-throw line is 19ft by rule. */
const FREE_THROW_X = COURT_LENGTH / 2 - 19
/** Enough that a 1-of-2 and a 2-of-2 don't stack exactly. */
const FREE_THROW_SPREAD_Z = 1.6

/**
 * Deterministic per-play jitter in -1..1. Seeded from the action number so
 * the same play always produces the same position — re-rendering, or
 * replaying the same game twice, shouldn't move a mark that's already been
 * shown.
 */
function jitter(seed, salt) {
    const n = Math.sin((seed + 1) * 12.9898 + salt * 78.233) * 43758.5453
    return (n - Math.floor(n)) * 2 - 1
}

export function markerForPlay(play) {
    if (!play) return null
    const seed = play.actionNumber ?? 0

    if (play.type === 'shot' && play.court) {
        return {
            kind: play.made ? MARKER_KINDS.MAKE : MARKER_KINDS.MISS,
            x: play.court.x,
            z: play.court.y,
        }
    }

    // A steal and a plain turnover are the same event seen from either side,
    // and ESPN locates both; only the symbol differs, so the loser of the
    // ball gets a turnover mark and a takeaway gets the possession arrow.
    if (play.type === 'turnover' && play.court) {
        const stolen = /steal/i.test(play.description || '')
        return {
            kind: stolen ? MARKER_KINDS.STEAL : MARKER_KINDS.TURNOVER,
            x: play.court.x,
            z: play.court.y,
            // Which way the arrow points: away from the basket the team
            // losing the ball was attacking.
            direction: stolen ? -play.end : undefined,
        }
    }

    if (play.type === 'foul' && play.court) {
        return { kind: MARKER_KINDS.FOUL, x: play.court.x, z: play.court.y }
    }

    // Everything below is inferred and needs to know which basket, which
    // team-less plays (period boundaries, anything ESPN didn't attribute)
    // don't have.
    if (!play.end) return null

    if (play.type === 'freeThrow') {
        return {
            kind: play.made ? MARKER_KINDS.MAKE : MARKER_KINDS.MISS,
            x: play.end * FREE_THROW_X,
            z: jitter(seed, 5) * FREE_THROW_SPREAD_Z,
        }
    }

    if (play.type === 'rebound') {
        return {
            kind: MARKER_KINDS.REBOUND,
            x: play.end * (RIM_X - 3) + jitter(seed, 1) * REBOUND_SPREAD_X,
            z: jitter(seed, 2) * REBOUND_SPREAD_Z,
        }
    }

    return null
}
