/**
 * Browser lifecycle for a logo field drawn on a canvas.
 *
 * Owns the device, the scene, and canvas sizing, and exposes the field as a
 * timeline you can scrub: `settle()` for a static frame, `play()` to run the
 * reveal forward or backward. The hero plays it once; the mobile menu plays it
 * in on open and back out on close.
 *
 * The scene itself lives in `scene.js` and knows nothing about the DOM, which
 * is what lets the same field be rendered headless and checked against pixels.
 */

import { createLogoField } from './field.js'

/**
 * Resolves when the field that currently owns a canvas has let go of it.
 *
 * React remounts an effect immediately in development, so a second start can
 * reach `surface()` while the first is still tearing down. Two surfaces on one
 * canvas leave the loser's context unconfigured, and the next frame throws
 * `getCurrentTexture ... context is not configured`. Serialising per canvas
 * also covers a fast open/close of the menu.
 */
const canvasReleased = new WeakMap()

/**
 * Starts a field on `canvas`, sized to `container`.
 *
 * `plan(width, height)` is called with the canvas size in *device* pixels and
 * returns `{ count, fieldOptions, sceneOptions }`. It has to be device pixels:
 * logo sizes are carried through the shader in the same units as the canvas
 * resolution, so planning in CSS pixels would render every logo at 1/dpr of
 * its intended size and thin the field out on any retina screen.
 *
 * `bleed` makes the canvas taller than its container, so a ragged bottom edge
 * is drawn whole instead of being cut off. It has to be known up front because
 * the canvas is measured before the scene exists.
 *
 * `heightRatio` shrinks the box the field is laid out in, relative to the
 * container. The tear sits at the bottom of that box, so a ratio below 1 pulls
 * it up into the container instead of leaving it hanging underneath.
 *
 * Resolves once the first frame can be drawn; throws if WebGPU is unavailable
 * or setup fails.
 */
export async function startLogoField({
    canvas,
    container,
    bleed = 0,
    heightRatio = 1,
    plan,
    seed,
    onError,
}) {
    const inFlight = canvasReleased.get(canvas)
    if (inFlight) await inFlight

    let release = () => {}
    canvasReleased.set(canvas, new Promise((resolve) => { release = resolve }))

    let vgpu
    let gpu
    try {
        const loaded = await Promise.all([import('vgpu'), import('./scene.js')])
        vgpu = loaded[0]
        var createLogoHeroScene = loaded[1].createLogoHeroScene
        gpu = await vgpu.init()
    } catch (error) {
        canvasReleased.delete(canvas)
        release()
        throw error
    }

    let disposed = false
    let loop
    let unsubscribe

    try {
        // Size the canvas explicitly rather than letting the surface track
        // layout. Auto-resize only samples at a frame boundary, and a settled
        // field produces no frames. Doing it here also lets the device's own
        // texture limit cap the resolution, which a 2x canvas on a very wide
        // display can otherwise exceed.
        const maxDimension = gpu.device.limits.maxTextureDimension2D
        const measure = () => {
            const cssWidth = Math.max(1, container.clientWidth)
            const boxHeight = Math.max(1, container.clientHeight)
            const cssHeight = boxHeight * (1 + bleed)
            const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1))
            const scale = Math.min(dpr, maxDimension / cssWidth, maxDimension / cssHeight)
            return {
                width: Math.max(1, Math.floor(cssWidth * scale)),
                height: Math.max(1, Math.floor(cssHeight * scale)),
                boxHeight: boxHeight * heightRatio * scale,
                scale,
            }
        }

        let sizing = measure()

        // Plan in device pixels, which is what the shader works in.
        const { count, fieldOptions, sceneOptions } = plan(sizing.width, sizing.boxHeight)
        const field = createLogoField({ count, seed, ...fieldOptions })
        const scene = createLogoHeroScene({
            vgpu,
            gpu,
            field,
            options: { ...fieldOptions, ...sceneOptions },
        })
        const surface = vgpu.surface(gpu, canvas, {
            size: [sizing.width, sizing.height],
            alphaMode: 'premultiplied',
        })

        // Draw and pipeline errors arrive here rather than throwing, so without
        // this a validation failure would just leave an empty canvas.
        if (onError) unsubscribe = gpu.onError((error) => onError(error?.message ?? String(error)))

        const stop = () => {
            loop?.stop()
            loop = undefined
        }

        const controller = {
            durationSec: scene.durationSec,
            drawn: scene.drawn,
            bleed: scene.bleed,
            dpr: sizing.scale,
            maxDimension,

            /** Draws a single frame at `seconds` and submits it. */
            renderAt(seconds) {
                if (disposed) return
                stop()
                scene.render(seconds, surface, sizing.boxHeight)
            },

            /**
             * Runs the field from `from` to `to` seconds over `seconds` of wall
             * clock. Reversing the ends plays the reveal backwards.
             */
            play({ from, to, seconds, onDone }) {
                if (disposed) return
                stop()
                const startedAt = performance.now()
                let frames = 0
                loop = vgpu.frameLoop(gpu, (frame) => {
                    const elapsed = (performance.now() - startedAt) / 1000
                    const progress = seconds > 0 ? Math.min(1, elapsed / seconds) : 1
                    frames++
                    scene.encode(frame, from + (to - from) * progress, surface, sizing.boxHeight)
                    if (progress >= 1) {
                        stop()
                        onDone?.(frames)
                    }
                })
            },

            get running() {
                return Boolean(loop)
            },

            /** Re-reads the container and returns true if the canvas changed size. */
            resize() {
                if (disposed) return false
                const next = measure()
                const changed = next.width !== sizing.width || next.height !== sizing.height
                sizing = next
                if (changed) surface.resize([next.width, next.height])
                return changed
            },

            dispose() {
                if (disposed) return
                disposed = true
                stop()
                unsubscribe?.()
                scene.dispose()
                surface.dispose()
                gpu.dispose()
                canvasReleased.delete(canvas)
                release()
            },
        }

        return controller
    } catch (error) {
        unsubscribe?.()
        loop?.stop()
        gpu.dispose()
        canvasReleased.delete(canvas)
        release()
        throw error
    }
}
