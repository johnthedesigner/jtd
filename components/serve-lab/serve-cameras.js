import * as THREE from 'three'
import { MARK_SET_BACK } from './serve-mark'
import { COURT, RUNOFF_BASELINE, RUNOFF_SIDE } from './serve-court'

/**
 * Six fixed viewpoints on the serve, ported from the prototype.
 *
 * All of them are expressed relative to the player rather than to the
 * court, because the player is what you are looking at and the court is
 * only approximately placed anyway. Each returns a position and a target in
 * world space.
 */
export const CAMERA_PRESETS = ['side', 'behind', 'shoulder', 'front', 'above', 'court', 'contactSide']

export const CAMERA_LABELS = {
    side: 'Side',
    behind: 'Behind',
    shoulder: 'Shoulder',
    front: 'Front',
    above: 'Above',
    court: 'Court',
}

/** Roughly chest height on the server, which is what every shot frames around. */
const EYE = 1.25

export function cameraPose(name, frame) {
    const { origin, forward, right, ground, contactPoint, courtPoint } = frame
    const V = THREE.Vector3
    const at = () => new V(0, ground + EYE, 0)
    const floor = () => new V(0, ground, 0)
    const from = () => origin.clone()

    switch (name) {
        case 'behind':
            return {
                position: from().addScaledVector(forward, -5).addScaledVector(right, 0.4).add(new V(0, 1.7, 0)),
                target: at().addScaledVector(forward, 0.6),
            }
        case 'shoulder':
            return {
                position: from().addScaledVector(forward, -1.9).addScaledVector(right, 1).add(new V(0, 2.1, 0)),
                target: at().addScaledVector(forward, 1.2).add(new V(0, 0.6, 0)),
            }
        case 'front':
            return {
                position: from().addScaledVector(forward, 5.2).addScaledVector(right, -0.6).add(new V(0, 1.5, 0)),
                target: at(),
            }
        case 'above': {
            /*
              Centred on the painted mark, not on the player.

              This is the opening frame and the closing one, and in both the
              mark is the subject. Aiming at the player instead put it off
              to one side, because the player stands half a metre right of
              the centre line and the mark is centred on it.

              The camera sits on the net side looking back, which is the
              direction the mark is painted to be read from.
            */
            const markCentre = courtPoint(0, -MARK_SET_BACK, 0)
            return {
                position: markCentre.clone().addScaledVector(forward, 4.4).add(new V(0, 8.6, 0)),
                target: markCentre,
            }
        }
        case 'court':
            return {
                position: from().addScaledVector(forward, -6.5).addScaledVector(right, 1.4).add(new V(0, 5.2, 0)),
                target: floor().addScaledVector(forward, 5).addScaledVector(right, -0.8),
            }
        case 'contactSide': {
            /*
              Close, level with the strings and square to the swing plane,
              aimed at the measured contact point itself. The claim in that
              chapter is a few degrees of racket face over a few
              milliseconds, which needs the face big in frame; aiming above
              the player's feet instead put it in the corner.
            */
            const cp = contactPoint ?? at()
            return {
                position: cp
                    .clone()
                    .addScaledVector(right, 2.4)
                    .addScaledVector(forward, 0.35)
                    .add(new V(0, 0.15, 0)),
                target: cp.clone(),
            }
        }
        case 'side':
        default:
            return {
                position: from().addScaledVector(right, 6.4).addScaledVector(forward, 0.6).add(new V(0, 1.5, 0)),
                target: at().addScaledVector(forward, 0.4).add(new V(0, 0.1, 0)),
            }
    }
}

/**
 * How far to pull the camera back, given the room actually available.
 *
 * Two separate pressures, and the stronger one wins.
 *
 * **Aspect.** A portrait phone is not a cropped desktop: the same camera
 * leaves the player's head and the ball out of frame entirely.
 *
 * **Vertical room.** The overlays can take a third of the window, and what
 * is left is shorter than the figure. Shifting the frame cannot help with
 * that — a subject taller than the gap is taller than the gap wherever you
 * put it. Backing off along the view direction is the only thing that
 * makes it fit, and scaling by `height / band` keeps the figure the same
 * fraction of the visible strip that it would have been of the whole
 * window.
 *
 * Capped, because past a point the camera ends up outside the arena
 * looking across unlit floor, which is worse than a tight crop.
 */
const MAX_PULLBACK = 2.2

export function cameraPullback(aspect, height, bandHeight) {
    const byAspect = aspect < 1.1 ? Math.min(MAX_PULLBACK, 1.25 / aspect) : 1
    const byBand =
        bandHeight > 0 ? Math.min(MAX_PULLBACK, Math.max(1, height / bandHeight)) : 1
    return Math.max(byAspect, byBand)
}

/**
 * How far to shift the frame upward, in pixels, so the player sits in the
 * open space between the overlays rather than in the middle of the window.
 *
 * **Computed from fixed reserved heights, never measured off the live
 * overlays.** The prototype measured them, and the camera then jumped every
 * time a caption wrapped to a different number of lines. Reserved space is
 * a property of the layout, not of the current step's copy.
 */
export function framingOffset(width, reserved) {
    const narrow = width < 720
    const top = reserved?.top ?? (narrow ? 64 : 84)
    const bottom = reserved?.bottom ?? (narrow ? 196 : 190)
    return Math.max(0, Math.round((bottom - top) / 2))
}


/** Clearance kept between the camera and the inside face of the walls. */
const WALL_MARGIN = 1.2

/**
 * Pull a camera back inside the arena.
 *
 * The pull-back that makes a figure fit a narrow screen also walks the
 * camera outwards, and the side view at full pull-back sat 14 m from the
 * centre line against a wall that starts at 11 m. The result was a view
 * with its bottom half filled by the back of the wall and the stands
 * behind it — which reads as the scene having gone black rather than as
 * the camera being outside the room.
 *
 * Rather than cap the pull-back everywhere, this slides the camera back
 * along its own view direction until it is inside. The framing loosens
 * slightly instead of the shot breaking.
 */
export function containInArena(position, target, frame) {
    const { centreMark, right, forward } = frame
    const offset = position.clone().sub(centreMark)
    const sideways = offset.dot(right)
    const along = offset.dot(forward)

    const maxSide = COURT.HALF_WIDTH + RUNOFF_SIDE - WALL_MARGIN
    const minAlong = -RUNOFF_BASELINE + WALL_MARGIN
    const maxAlong = COURT.LENGTH + RUNOFF_BASELINE - WALL_MARGIN

    const targetOffset = target.clone().sub(centreMark)
    const ts = targetOffset.dot(right)
    const ta = targetOffset.dot(forward)

    // How far along target -> position we can go before crossing a wall.
    let limit = 1
    const cap = (value, at, bound) => {
        if (value === at) return
        const t = (bound - at) / (value - at)
        if (t > 0 && t < limit) limit = t
    }
    if (Math.abs(sideways) > maxSide) cap(sideways, ts, Math.sign(sideways) * maxSide)
    if (along < minAlong) cap(along, ta, minAlong)
    if (along > maxAlong) cap(along, ta, maxAlong)

    if (limit < 1) position.sub(target).multiplyScalar(limit).add(target)
    return position
}
