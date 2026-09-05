import { useEffect, useRef, useState } from 'react'
import { startLogoField } from './logo-hero-gpu/runtime'
import { panelOptions } from './logo-hero-gpu/menu-panel'
import { MENU_FALLBACK_IMAGE } from './logo-hero-gpu/constants'

/**
 * The logo field as a menu panel.
 *
 * Same treatment as the hero, in near-white instead of blue and with no ragged
 * edge, so it fills its box. The field builds up from nothing, which is what
 * makes the panel arrive rather than simply appear.
 *
 * The panel sits at 80% so the page reads faintly through it, softened by a
 * blur layer that sits behind the canvas as its sibling. The blur cannot go on
 * an ancestor of the canvas: with the WebGPU canvas inside it, Chrome drops the
 * backdrop-filter entirely, and the radius stops having any effect at all.
 *
 * `phase` is a command: `in` runs the reveal forward, `out` runs it backward.
 * `onReady` fires once the panel can draw, which is the menu's cue to start
 * its own fade so the two move together. Where WebGPU is unavailable or the
 * visitor has asked for reduced motion, a pre-rendered image stands in and
 * both callbacks fire immediately.
 */

/** Enough of the page reads through to place the menu, not enough to distract. */
const PANEL_OPACITY = 0.9
const PANEL_BLUR = '0.5rem'

/** Runs the reveal forward or backward. Leaving is quicker than arriving. */
function runPhase(field, phase, onDone) {
    if (phase === 'in') {
        field.play({
            from: 0,
            to: field.durationSec,
            seconds: field.durationSec,
            onDone: () => onDone?.('in'),
        })
    } else if (phase === 'out') {
        field.play({
            from: field.durationSec,
            to: 0,
            seconds: field.durationSec * 0.7,
            onDone: () => onDone?.('out'),
        })
    }
}

export default function MenuBackdrop({ phase, onReady, onPhaseDone }) {
    const canvasRef = useRef(null)
    const containerRef = useRef(null)
    const fieldRef = useRef(null)
    // Set before the field exists, replayed once it does.
    const queuedRef = useRef(null)
    const readyRef = useRef(onReady)
    const doneRef = useRef(onPhaseDone)
    const [useImage, setUseImage] = useState(false)

    readyRef.current = onReady
    doneRef.current = onPhaseDone

    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!container) return

        let disposed = false

        const fallBack = () => {
            if (disposed) return
            setUseImage(true)
            readyRef.current?.()
        }

        if (
            typeof navigator === 'undefined' ||
            !navigator.gpu ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
            fallBack()
            return
        }
        if (!canvas) return

        const onResize = () => {
            const field = fieldRef.current
            if (!field || disposed) return
            // Only a settled panel needs a redraw; a running one is about to
            // draw anyway.
            if (field.resize() && !field.running) field.renderAt(field.durationSec)
        }
        const observer = new ResizeObserver(onResize)

        void (async () => {
            try {
                const field = await startLogoField({
                    canvas,
                    container,
                    seed: 20260904,
                    plan: (width, height) => {
                        const { count, field: fieldOptions, scene: sceneOptions } = panelOptions(width, height)
                        return { count, fieldOptions, sceneOptions }
                    },
                    onError: fallBack,
                })
                if (disposed) return field.dispose()

                fieldRef.current = field
                observer.observe(container)
                readyRef.current?.()

                const queued = queuedRef.current ?? 'in'
                queuedRef.current = null
                runPhase(field, queued, doneRef.current)
            } catch {
                fallBack()
            }
        })()

        return () => {
            disposed = true
            observer.disconnect()
            fieldRef.current?.dispose()
            fieldRef.current = null
        }
    }, [])

    useEffect(() => {
        if (useImage) {
            // Nothing to animate, so the menu's own fade carries the whole
            // transition and the next step can run straight away.
            if (phase === 'in' || phase === 'out') doneRef.current?.(phase)
            return
        }
        const field = fieldRef.current
        if (!field) {
            queuedRef.current = phase
            return
        }
        runPhase(field, phase, doneRef.current)
    }, [phase, useImage])

    const layer = {
        position: 'absolute',
        inset: 0,
        display: 'block',
        width: '100%',
        height: '100%',
        opacity: PANEL_OPACITY,
    }

    return (
        <div ref={containerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {/* Sibling, not ancestor: it softens the page, the field paints
                over it, and the logos stay sharp. */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backdropFilter: `blur(${PANEL_BLUR})`,
                    WebkitBackdropFilter: `blur(${PANEL_BLUR})`,
                }}
            />
            {useImage ? (
                <img
                    src={MENU_FALLBACK_IMAGE}
                    alt=""
                    aria-hidden="true"
                    // Stretched on purpose: the field has no fixed subject, and
                    // the panel has to be covered edge to edge.
                    style={{ ...layer, objectFit: 'fill' }}
                />
            ) : (
                <canvas ref={canvasRef} aria-hidden="true" style={layer} />
            )}
        </div>
    )
}
