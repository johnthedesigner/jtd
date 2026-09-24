import * as THREE from 'three'
import template from '../../public/nba-courts/template.json'
import { buildWoodMask } from './wood-detect'

/**
 * A per-court grain mask: where the floor is bare wood, and how strongly its
 * surface should disturb the reflection.
 *
 * Doing this as a prepass rather than per-fragment buys two things a shader
 * cannot do cheaply: it can look at the whole image to work out what this
 * particular floor's wood looks like, and it can run morphological passes to
 * pull the mask back from paint boundaries so transitions do not ring.
 *
 * The detection itself lives in wood-detect.js, which documents why it is
 * adaptive rather than a fixed set of colour bounds.
 */

// Half the atlas rather than a quarter. The mask's own resolution sets how
// accurately its boundary can follow a painted edge; at a quarter it could sit
// three inches off, which shows as a mismatched band around every key.
const SCALE = 0.5
const WIDTH = Math.round(template.canvas.width * SCALE)
const HEIGHT = Math.round(template.canvas.height * SCALE)

let fallbackTexture = null

/** A white 1x1, so the sampler is never null before a court has loaded. */
export function grainMaskFallback() {
    if (!fallbackTexture) {
        fallbackTexture = new THREE.DataTexture(
            new Uint8Array([255, 255, 255, 255]),
            1,
            1,
            THREE.RGBAFormat
        )
        fallbackTexture.needsUpdate = true
    }
    return fallbackTexture
}

export function buildGrainMask(image) {
    try {
        const canvas = document.createElement('canvas')
        canvas.width = WIDTH
        canvas.height = HEIGHT
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(image, 0, 0, WIDTH, HEIGHT)
        const { data } = ctx.getImageData(0, 0, WIDTH, HEIGHT)

        // Search inside the boundary lines only. The apron is frequently a
        // large slab of saturated team colour, and on several courts it won the
        // vote outright, producing a mask that was exactly inverted.
        const { mask, cluster } = buildWoodMask(data, WIDTH, HEIGHT, {
            region: {
                x0: template.court.uv.u0,
                x1: template.court.uv.u1,
                y0: template.court.uv.v0,
                y1: template.court.uv.v1,
            },
        })

        // Rows are written bottom-up on purpose. The atlas is an image texture,
        // which three uploads with flipY on; a DataTexture defaults flipY to
        // false and three ignores the flag entirely, so the two would disagree
        // vertically. Flipping the data is the only way to line them up —
        // setting texture.flipY here silently does nothing.
        const pixels = new Uint8Array(WIDTH * HEIGHT * 4)
        let sum = 0
        for (let y = 0; y < HEIGHT; y++) {
            const src = (HEIGHT - 1 - y) * WIDTH
            const dst = y * WIDTH
            for (let x = 0; x < WIDTH; x++) {
                const v = Math.round(Math.min(1, Math.max(0, mask[src + x])) * 255)
                const o = (dst + x) * 4
                pixels[o] = v
                pixels[o + 1] = v
                pixels[o + 2] = v
                pixels[o + 3] = 255
                sum += v
            }
        }

        const texture = new THREE.DataTexture(pixels, WIDTH, HEIGHT, THREE.RGBAFormat)
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        texture.needsUpdate = true
        // Surfaced in the debug readout: if this is near zero the mask is empty
        // and no amount of grain strength will show anything.
        texture.userData.meanWood = sum / (WIDTH * HEIGHT * 255)
        texture.userData.cluster = cluster
        return texture
    } catch {
        return grainMaskFallback()
    }
}
