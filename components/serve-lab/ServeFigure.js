import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createSampler, createRacketSampler, RACKET } from './serve-frame'
import { buildMannequin } from './Mannequin'
import { buildRacket } from './Racket'
import { buildBall } from './Ball'
import { buildAnnotations } from './ServeAnnotations'

/** How far toward the mark the focus travels. See the note below. */
const FOCUS_PULL = 0.5

/**
 * Everything that moves: figure, racket, ball, and whatever the current
 * chapter has asked to be drawn on top of them.
 *
 * One `useFrame` advances the clock and poses all of it, in that order, so
 * nothing is ever drawn a frame behind the thing it is annotating.
 */
export default function ServeFigure({ data, frame, clock, focusPoint, focusTo = null, annotations = [] }) {
    const showGhost = annotations.includes('ghost')
    const built = useMemo(() => {
        const sampler = createSampler(data, frame)
        const racketAt = createRacketSampler(data, sampler)
        const mannequin = buildMannequin(data, frame, sampler)

        /*
          The comparison serve is the same object, not a different one.

          It used to be a stick figure of cylinders, which made the
          chapter's claim — that two serves are almost impossible to tell
          apart — unfalsifiable: of course they look different, one of them
          is a diagram. It is the same mannequin now, in translucent blue,
          posed from the other serve's joints.

          Opacity 0.55 rather than the 0.28 the stick figure carried. At
          that level it was more a smudge than a second serve, and the
          whole point is to compare two positions.
        */
        const ghost = buildMannequin(data, frame, sampler, {
            joints: data.ghost.joints,
            landmarks: null,
            twist: null,
            material: new THREE.MeshStandardMaterial({
                color: new THREE.Color('#6fc3e0'),
                transparent: true,
                opacity: 0.55,
                depthWrite: false,
                roughness: 0.8,
            }),
        })
        ghost.group.visible = false

        const ghostRacketAt = createRacketSampler({ ...data, racket: data.ghost.racket }, sampler)
        /*
          And its racket. Without one the comparison is between a player
          holding a racket and a player holding nothing, in a chapter whose
          whole subject is where the racket was.
        */
        const ghostRacket = buildRacket(data, sampler, ghostRacketAt, {
            material: new THREE.MeshStandardMaterial({
                color: new THREE.Color('#6fc3e0'),
                transparent: true,
                opacity: 0.55,
                depthWrite: false,
                roughness: 0.8,
            }),
        })
        ghostRacket.group.visible = false

        return {
            sampler,
            racketAt,
            ghost,
            ghostRacket,
            mannequin,
            racket: buildRacket(data, sampler, racketAt),
            ball: buildBall(data, frame, sampler),
            annotations: buildAnnotations(data, frame, sampler, racketAt, mannequin.joints),
        }
    }, [data, frame])

    useEffect(
        () => () => {
            built.mannequin.dispose()
            built.ghost.dispose()
            built.ghostRacket.dispose()
            built.racket.dispose()
            built.ball.dispose()
            built.annotations.dispose()
        },
        [built]
    )

    /*
      `contactHeight` is not an annotation object of its own: the marker it
      wants already exists inside the ball, which owns the measured contact
      point. The chapter names it and this flips it on.
    */
    useEffect(() => {
        built.annotations.setActive(annotations)
        built.ball.showContactMarker(annotations.includes('contactHeight'))
    }, [built, annotations])

    useFrame((_, delta) => {
        const c = clock.current
        if (c.playing) {
            // Capped: a backgrounded tab hands back one enormous delta,
            // which would otherwise jump straight to the end of the chapter.
            c.t += Math.min(0.05, delta) * data.fps * c.speed
            if (c.t >= c.to) {
                c.t = c.to
                c.playing = false
            }
        }
        built.mannequin.pose(c.t)
        built.racket.pose(c.t, { showTrail: true })
        built.ball.pose(c.t)
        built.annotations.update(c.t)

        /*
          Lined up by contact, not by frame number. The two serves were
          captured separately and their clips begin at different points in
          the motion; the only moment they genuinely share is the instant
          the ball is struck.
        */
        if (showGhost) {
            const gt = c.t - data.events.contact + data.ghost.contact
            const frames = data.ghost.joints.head.length / 3
            const inRange = gt >= 0 && gt <= frames - 1
            built.ghost.group.visible = inRange
            built.ghostRacket.group.visible = inRange
            if (inRange) {
                built.ghost.pose(gt)
                built.ghostRacket.pose(gt)
            }
        } else if (built.ghost.group.visible) {
            built.ghost.group.visible = false
            built.ghostRacket.group.visible = false
        }
        if (focusPoint) {
            focusPoint.current.copy(built.mannequin.joints.neck)
            if (focusTo) {
                /*
                  Eased on the chapter's own progress, so the pull lands
                  exactly as the camera finishes rising.

                  A zero-length range means the intro, which is a still
                  frame of the same overhead angle — there is no progress to
                  ease along, and the mark should simply be the subject from
                  the first frame.
                */
                const span = c.to - c.from
                const k = span > 0 ? Math.min(1, Math.max(0, (c.t - c.from) / span)) : 1
                /*
                  Only part of the way to the mark.

                  Pulling focus all the way onto it put the mark, the court
                  under it and most of the lines inside the sharp zone at
                  once, which is a lot of the frame for a shot whose job is
                  to settle. Landing the focal plane between the player and
                  the mark leaves neither fully crisp and the rest of the
                  court well outside it.
                */
                focusPoint.current.lerp(focusTo, k * k * (3 - 2 * k) * FOCUS_PULL)
            }
        }
    })

    return (
        <>
            <primitive object={built.mannequin.group} />
            <primitive object={built.racket.group} />
            <primitive object={built.ball.group} />
            <primitive object={built.annotations.group} />
            <primitive object={built.ghost.group} />
            <primitive object={built.ghostRacket.group} />
        </>
    )
}
