import * as THREE from 'three'

/**
 * Reading the capture at an arbitrary moment.
 *
 * Every track in the file is a flat `[x0,y0,z0, x1,y1,z1, ...]` run at
 * 180 Hz, so "where was the elbow at frame 196.4" is a lerp between two
 * triples. Playback runs at a fraction of real speed and the stepper lands
 * on `contact` at 266.5, so fractional frames are the normal case, not an
 * edge one.
 *
 * Everything writes into vectors the caller owns. This runs for roughly
 * forty joints and landmarks every frame, and allocating a `Vector3` per
 * read is how a scene like this ends up collecting garbage mid-serve.
 */
export function createSampler(data, frame) {
    const { toWorld } = frame
    const [ox, oy] = data.start

    /*
      Undoing the origin shift, for directions rather than positions.

      `toWorld` subtracts the player's starting position, which is right for
      a point and wrong for a unit vector — a direction has no origin.
      Adding it back leaves pure rotation and scale.
    */
    const DIRECTION_FIX = new THREE.Vector3(ox / 1000, 0, -oy / 1000)

    /** Position on a flat xyz track, in world space. */
    const at = (track, t, out) => {
        const n = track.length / 3
        const i = Math.min(n - 2, Math.max(0, Math.floor(t)))
        const f = Math.min(1, Math.max(0, t - i))
        const k = i * 3
        const q = k + 3
        return toWorld(
            out,
            track[k] + (track[q] - track[k]) * f,
            track[k + 1] + (track[q + 1] - track[k + 1]) * f,
            track[k + 2] + (track[q + 2] - track[k + 2]) * f
        )
    }

    /** A single-value series: racket speed, elbow angle, face angle. */
    const atValue = (series, t) => {
        const i = Math.min(series.length - 2, Math.max(0, Math.floor(t)))
        const f = Math.min(1, Math.max(0, t - i))
        return series[i] + (series[i + 1] - series[i]) * f
    }

    /**
     * Which way the forearm is twisted, as a unit vector.
     *
     * Taken from the two wrist styloid markers, so pronation is measured
     * rather than invented — it is the difference between a serve that
     * reads as a serve and one that reads as an arm waving.
     */
    const twistAt = (side, t, out) =>
        at(data.twist[side], t, out).add(DIRECTION_FIX).normalize()

    return { at, atValue, twistAt }
}

/** Head half-length and half-width of the racket face, in metres. */
export const RACKET = { HALF_LENGTH: 0.185, HALF_WIDTH: 0.135 }

/**
 * The racket's own axes at a moment, from its three markers.
 *
 * The throat marker is the handle end of the head; the other two sit on the
 * rim at its widest point. That is enough for a full frame: long axis from
 * throat to the midpoint of the rim pair, width axis across them, face
 * normal from the cross product.
 */
export function createRacketSampler(data, sampler) {
    const base = new THREE.Vector3()
    const rim1 = new THREE.Vector3()
    const rim2 = new THREE.Vector3()
    const mid = new THREE.Vector3()
    const out = {
        base,
        along: new THREE.Vector3(),
        across: new THREE.Vector3(),
        normal: new THREE.Vector3(),
        centre: new THREE.Vector3(),
        tip: new THREE.Vector3(),
    }

    return (t) => {
        sampler.at(data.racket[0], t, base)
        sampler.at(data.racket[1], t, rim1)
        sampler.at(data.racket[2], t, rim2)
        mid.addVectors(rim1, rim2).multiplyScalar(0.5)
        out.along.subVectors(mid, base).normalize()
        out.across.subVectors(rim2, rim1)
        out.across.addScaledVector(out.along, -out.across.dot(out.along)).normalize()
        out.normal.crossVectors(out.across, out.along)
        out.centre.copy(base).addScaledVector(out.along, RACKET.HALF_LENGTH)
        out.tip.copy(base).addScaledVector(out.along, 2 * RACKET.HALF_LENGTH)
        return out
    }
}
