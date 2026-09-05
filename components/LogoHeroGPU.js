import { useEffect, useRef, useState } from 'react'
import { heroCanvasBleed, heroFieldOptions, heroTearAt } from './logo-hero-gpu/hero-field'
import { startLogoField } from './logo-hero-gpu/runtime'
import { FALLBACK_IMAGES, MOBILE_MAX_WIDTH, PRIMARY } from './logo-hero-gpu/constants'

/**
 * The logo hero on the GPU.
 *
 * One instanced draw covers the whole field, and the loop stops as soon as the
 * animation lands, so a settled hero costs nothing. The field itself lives in
 * `components/logo-hero-gpu/`, which is why the same scene can be rendered
 * headless and checked against real pixels.
 *
 * Falls back to a pre-rendered image of the settled hero wherever WebGPU is
 * unavailable, where the device is lost, and wherever the visitor has asked
 * for reduced motion — there the image is also the cheaper answer, since it
 * skips the device and the shader bundle entirely. Those images come out of
 * the same scene, via `npm run fallbacks`.
 */

/** Splits `92vh` into `[92, 'vh']` so derived lengths keep the same unit. */
function splitLength(value) {
    const match = String(value).match(/^([\d.]+)(.*)$/)
    return match ? [parseFloat(match[1]), match[2] || 'px'] : [80, 'vh']
}

export default function LogoHeroGPU({
    height = '92vh',
    ragged = true,
    // Where the ragged edge finishes, as a fraction of the hero. Leave it off
    // and the tear hangs below the hero. Setting it pulls the edge up to a
    // fixed place regardless of viewport, which a fixed box fraction cannot do:
    // tear depth scales with the box's aspect.
    //
    // Pass a function `(container) => fraction` to place it against something
    // inside the hero instead. A fraction of the hero is not always the right
    // anchor: a header whose image grows and shrinks with the viewport needs
    // the edge measured against the image, not the box.
    tearEndsAt = null,
    // Fraction of hero height to sit above centre. The content block is close
    // to the hero's own height, so centring leaves the tagline near the ragged
    // edge; lifting it moves the slack to where it is needed.
    contentLift = 0.045,
    animate = true,
    seed,
    onStatus,
    fieldOptions,
    sceneOptions,
    fallbackImages = FALLBACK_IMAGES,
    children,
}) {
    const canvasRef = useRef(null)
    const containerRef = useRef(null)
    const statusRef = useRef(onStatus)
    const [useImage, setUseImage] = useState(false)
    // Measured from the hero's own box once it is laid out; a short strip needs
    // proportionally more room below it for the tear than a tall banner does.
    const [bleed, setBleed] = useState(0)

    statusRef.current = onStatus

    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        let disposed = false
        let field
        let pending = 0

        const report = (state, detail) => statusRef.current?.(state, detail)
        const fallBack = (state, detail) => {
            if (disposed) return
            setUseImage(true)
            report(state, detail)
        }

        if (typeof navigator === 'undefined' || !navigator.gpu) {
            fallBack('unsupported', 'navigator.gpu is unavailable')
            return
        }
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            fallBack('reduced-motion', 'using the pre-rendered image')
            return
        }

        const boxWidth = Math.max(1, container.clientWidth)
        const boxHeight = Math.max(1, container.clientHeight)
        const endsAt = typeof tearEndsAt === 'function' ? tearEndsAt(container) : tearEndsAt
        const tearAt = endsAt === null || endsAt === undefined
            ? 1
            : heroTearAt(boxWidth, boxHeight, endsAt)
        const boxBleed = ragged ? heroCanvasBleed(boxWidth, boxHeight, tearAt) : 0
        setBleed(boxBleed)

        // A settled hero has no frames left to notice a resize, and moving to a
        // display with a different pixel ratio never changes the element's CSS
        // size, so the observer alone would miss it.
        const onResize = () => {
            if (!field || disposed) return
            field.resize()
            if (field.running || pending) return
            pending = requestAnimationFrame(() => {
                pending = 0
                if (!disposed && field) field.renderAt(field.durationSec)
            })
        }
        const observer = new ResizeObserver(onResize)
        window.addEventListener('resize', onResize)

        void (async () => {
            try {
                const started = performance.now()
                field = await startLogoField({
                    canvas,
                    container,
                    bleed: boxBleed,
                    heightRatio: tearAt,
                    seed: seed ?? Math.floor(Math.random() * 1e9),
                    // Logo size follows the hero's own box, so a 20vh strip and
                    // a full-height banner get the same treatment at their own
                    // scale. Device pixels, not CSS: see `startLogoField`.
                    plan: (width, height) => {
                        const sized = heroFieldOptions(width, height, { raggedEdge: ragged })
                        // A function gets the box in device pixels, so a caller
                        // can place something against it — the footer sizes its
                        // wordmark that way.
                        const extra = typeof fieldOptions === 'function'
                            ? fieldOptions(width, height)
                            : fieldOptions
                        return {
                            count: sized.count,
                            fieldOptions: { ...sized.field, ...extra },
                            sceneOptions: { bleed: boxBleed, ...sceneOptions },
                        }
                    },
                    onError: (message) => fallBack('gpu-error', message),
                })
                if (disposed) return field.dispose()

                observer.observe(container)
                report('ready', {
                    setupMs: performance.now() - started,
                    count: field.drawn,
                    dpr: field.dpr,
                    maxDimension: field.maxDimension,
                })

                if (!animate) {
                    field.renderAt(field.durationSec)
                    report('settled', { frames: 1, animated: false })
                    return
                }
                field.play({
                    from: 0,
                    to: field.durationSec,
                    seconds: field.durationSec,
                    onDone: (frames) => report('settled', { frames, animated: true }),
                })
            } catch (error) {
                fallBack('error', error?.message ?? String(error))
            }
        })()

        return () => {
            disposed = true
            observer.disconnect()
            window.removeEventListener('resize', onResize)
            if (pending) cancelAnimationFrame(pending)
            field?.dispose()
        }
    }, [height, animate, ragged, tearEndsAt, seed, fieldOptions, sceneOptions])

    const [amount, unit] = splitLength(height)
    // Percentage padding resolves against width, so derive it from the height.
    const liftPadding = `${2 * contentLift * amount}${unit}`
    const layerStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        // Taller than the hero so a ragged bottom edge is drawn whole rather
        // than cut off at the container.
        height: `${(1 + bleed) * 100}%`,
        pointerEvents: 'none',
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                isolation: 'isolate',
                width: '100%',
                minHeight: height,
                overflowX: 'clip',
                // The canvas is transparent and hangs past the bottom, so the
                // hero must not clip vertically and must sit under what follows.
                zIndex: 0,
                // Transparent while the canvas is live. In the fallback path a
                // solid backdrop covers only the part of the hero the image is
                // opaque over anyway, so the ragged edge still reads, but white
                // text stays legible even if the image itself fails to load.
                background: useImage
                    ? (ragged
                        ? `linear-gradient(to bottom, ${PRIMARY} 0 92%, transparent 92%)`
                        : PRIMARY)
                    : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingBottom: liftPadding,
                boxSizing: 'border-box',
            }}
        >
            {useImage ? (
                <picture>
                    <source media={`(max-width: ${MOBILE_MAX_WIDTH}px)`} srcSet={fallbackImages.tall} />
                    <img
                        src={fallbackImages.wide}
                        alt=""
                        aria-hidden="true"
                        // Stretched to the hero box on purpose: the field has no
                        // fixed subject, and stretching keeps the ragged edge on
                        // the hero's bottom line at any aspect ratio.
                        style={{ ...layerStyle, objectFit: 'fill' }}
                    />
                </picture>
            ) : (
                <canvas ref={canvasRef} aria-hidden="true" style={{ ...layerStyle, display: 'block' }} />
            )}
            {children && (
                <div style={{ position: 'relative', zIndex: 10, width: '100%' }}>{children}</div>
            )}
        </div>
    )
}
