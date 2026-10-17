import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import useRenderActive from '../webgl/use-render-active'
import usePrefersReducedMotion from '../webgl/use-reduced-motion'
import useVisualViewportInset from '../webgl/use-visual-viewport-inset'
import ViewportReadout from '../nba-court/ViewportReadout'
import useServeData from './useServeData'
import { courtFrame } from './serve-court'
import { buildServeArena, SCENE_BG, FOG_COLOR, FOG_DENSITY } from './ServeArena'
import ServeFigure from './ServeFigure'
import ServeDOF from './ServeDOF'
import ChapterCard from './ChapterCard'
import ServeModal from './ServeModal'
import { APPENDIX } from './appendix'
import useServeClock from './useServeClock'
import { buildChapters, INTRO, READOUTS } from './chapters'
import { MARK_SET_BACK } from './serve-mark'
import { cameraPose, cameraPullback, framingOffset, containInArena } from './serve-cameras'

/**
 * Serve Lab: one canvas, one strip of controls, never scrolls.
 *
 * The page is a sequence of chapters rather than a viewer with a timeline.
 * Each one stages a claim about the serve, and owns its own camera, frame
 * range, pace and annotations. Nothing here lets you fly the camera around
 * a scene — the whole point is that someone who has not been told what to
 * look for does not know where to look.
 */

const EXPOSURE = 0.78
const WORLD_UP = new THREE.Vector3(0, 1, 0)
/** How long the camera takes to move between chapters. */
const MOVE_SECONDS = 1.1

function Arena({ frame }) {
    const built = useMemo(() => buildServeArena(frame), [frame])
    useEffect(() => built.dispose, [built])
    return <primitive object={built.group} />
}

/**
 * How much vertical room the overlay takes.
 *
 * Measured, but only on resize — never when the content inside it changes.
 * Reserved space is a property of the layout; re-reading it when a caption
 * rewraps makes the camera jump on every chapter.
 */
function useReservedSpace(hostRef) {
    const [reserved, setReserved] = useState(null)
    useEffect(() => {
        const measure = () => {
            const host = hostRef.current
            if (!host) return
            const overlay = host.querySelector('[data-bottom-overlay]')
            const bottom = overlay ? overlay.getBoundingClientRect().height : 0
            const nav = document.querySelector('header')
            const hostTop = host.getBoundingClientRect().top
            const navBox = nav?.getBoundingClientRect()
            const top = navBox ? Math.max(0, navBox.bottom - hostTop) : 0
            setReserved((prev) =>
                prev && Math.abs(prev.top - top) < 2 && Math.abs(prev.bottom - bottom) < 2
                    ? prev
                    : { top, bottom }
            )
        }
        measure()
        const t1 = setTimeout(measure, 300)
        const t2 = setTimeout(measure, 1200)
        window.addEventListener('resize', measure)
        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
            window.removeEventListener('resize', measure)
        }
    }, [hostRef])
    return reserved
}

/**
 * The camera: eased to the chapter's opening angle, then carried across to
 * its closing one as the chapter plays.
 *
 * Driven off the clock ref rather than React state, so the move is smooth
 * instead of stepping at whatever rate the DOM re-reads the time.
 */
function Rig({ frame, shot, clock, reserved, reducedMotion }) {
    const { camera, size } = useThree()
    const target = useRef(new THREE.Vector3())
    const move = useRef(null)
    const band = Math.max(1, size.height - (reserved?.top ?? 0) - (reserved?.bottom ?? 0))

    const poses = useMemo(() => {
        const k = cameraPullback(size.width / size.height, size.height, band)
        const build = (name) => {
            const p = cameraPose(name, frame)
            p.position.sub(p.target).multiplyScalar(k).add(p.target)
            containInArena(p.position, p.target, frame)
            return p
        }
        return { from: build(shot.from), to: shot.to ? build(shot.to) : null }
    }, [shot.from, shot.to, frame, size.width, size.height, band])

    useEffect(() => {
        if (reducedMotion || !move.current) {
            camera.up.copy(WORLD_UP)
            camera.position.copy(poses.from.position)
            target.current.copy(poses.from.target)
            camera.lookAt(target.current)
            move.current = { done: true }
            return
        }
        move.current = {
            from: camera.position.clone(),
            fromTarget: target.current.clone(),
            start: performance.now(),
        }
    }, [poses, camera, reducedMotion])

    useEffect(() => {
        camera.setViewOffset(
            size.width, size.height, 0,
            framingOffset(size.width, reserved), size.width, size.height
        )
        camera.updateProjectionMatrix()
        return () => camera.clearViewOffset()
    }, [camera, size.width, size.height, reserved])

    const pos = useRef(new THREE.Vector3())
    const look = useRef(new THREE.Vector3())
    useFrame(() => {
        const c = clock.current
        // Where the chapter has got to, which is what carries the camera
        // from its opening angle to its closing one.
        const span = c.to - c.from
        const progress = span > 0 ? Math.min(1, Math.max(0, (c.t - c.from) / span)) : 0
        const eased = progress * progress * (3 - 2 * progress)

        if (poses.to) {
            pos.current.lerpVectors(poses.from.position, poses.to.position, eased)
            look.current.lerpVectors(poses.from.target, poses.to.target, eased)
        } else {
            pos.current.copy(poses.from.position)
            look.current.copy(poses.from.target)
        }

        const m = move.current
        if (m && !m.done) {
            const t = Math.min(1, (performance.now() - m.start) / (MOVE_SECONDS * 1000))
            const e = 1 - Math.pow(1 - t, 3)
            camera.position.lerpVectors(m.from, pos.current, e)
            target.current.lerpVectors(m.fromTarget, look.current, e)
            if (t >= 1) m.done = true
        } else {
            camera.position.copy(pos.current)
            target.current.copy(look.current)
        }
        camera.lookAt(target.current)
    })

    return null
}

export default function ServeViewer() {
    const rootRef = useRef(null)
    const { data, error } = useServeData()
    const renderActive = useRenderActive()
    const reducedMotion = usePrefersReducedMotion()
    const frame = useMemo(() => (data ? courtFrame(data) : null), [data])
    const reserved = useReservedSpace(rootRef)
    const focusPoint = useRef(new THREE.Vector3())
    const viewportInset = useVisualViewportInset()

    const chapters = useMemo(() => (data ? buildChapters(data) : []), [data])
    /** `null` is the intro, before anything has played. */
    const [index, setIndex] = useState(null)
    /*
      Modal state lives up here, not in the strip, because the strip has a
      backdrop filter on it — and an element with one becomes the
      containing block for any `fixed` descendant, so a modal rendered
      inside it is clipped to the strip rather than covering the page.
    */
    const [modal, setModal] = useState(null)
    const { clock, t, playing, atEnd, playRange, replay, play, pause } = useServeClock(data)

    const chapter = index == null ? null : chapters[index]
    /** Where focus is pulled to, for a chapter that asks for it. */
    const focusTo = useMemo(() => {
        if (!frame) return null
        // The intro is the same overhead shot as the closing chapter, so it
        // wants the same subject. It was being left focused on a player
        // nobody is looking at yet.
        const wantsMark = index == null || chapter?.focusTo === 'mark'
        return wantsMark ? frame.courtPoint(0, -MARK_SET_BACK, 0) : null
    }, [frame, chapter, index])
    const shot = useMemo(() => {
        if (!chapter) return { from: INTRO.camera, to: null }
        return typeof chapter.camera === 'string'
            ? { from: chapter.camera, to: null }
            : chapter.camera
    }, [chapter])

    const goTo = useCallback(
        (i) => {
            const next = chapters[Math.max(0, Math.min(chapters.length - 1, i))]
            if (!next) return
            setIndex(chapters.indexOf(next))
            playRange(next.range[0], next.range[1], next.speed)
        },
        [chapters, playRange]
    )

    // The intro holds the opening frame until someone starts it.
    useEffect(() => {
        if (!data || index != null) return
        playRange(0, 0, 0.1, { autoplay: false })
    }, [data, index, playRange])

    useEffect(() => {
        const onKey = (e) => {
            if (e.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return
            if (e.key === 'ArrowRight') { e.preventDefault(); goTo((index ?? -1) + 1) }
            else if (e.key === 'ArrowLeft' && index != null) { e.preventDefault(); goTo(index - 1) }
            else if (e.key === ' ') {
                e.preventDefault()
                if (index == null) goTo(0)
                else playing ? pause() : atEnd ? replay() : play()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [index, goTo, playing, atEnd, play, pause, replay])

    const readoutValues = useMemo(() => {
        if (!data) return {}
        const out = {}
        for (const [key, spec] of Object.entries(READOUTS)) {
            const series = data[spec.series]
            if (!series) continue
            const i = Math.min(series.length - 2, Math.max(0, Math.floor(t)))
            out[key] = series[i] + (series[i + 1] - series[i]) * Math.min(1, Math.max(0, t - i))
        }
        return out
    }, [data, t])

    const chartProps = useMemo(() => {
        if (!data || !chapter?.chart) return null
        return {
            speed: data.speed,
            fps: data.fps,
            contactFrame: data.events.contact,
            frame: t,
            highlight: chapter.chart.mode === 'highlight'
                ? { from: chapter.chart.from, to: chapter.chart.to }
                : null,
        }
    }, [data, chapter, t])

    return (
        <div ref={rootRef} className="relative h-full w-full overflow-hidden" style={{ backgroundColor: SCENE_BG }}>
            <Canvas
                aria-hidden
                dpr={[1, 2]}
                shadows
                gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
                camera={{ fov: 38, near: 0.15, far: 260 }}
                frameloop={renderActive ? 'always' : 'never'}
                onCreated={({ gl }) => {
                    gl.toneMapping = THREE.ACESFilmicToneMapping
                    gl.toneMappingExposure = EXPOSURE
                    gl.shadowMap.type = THREE.PCFSoftShadowMap
                }}
            >
                <color attach="background" args={[SCENE_BG]} />
                <fogExp2 attach="fog" args={[FOG_COLOR, FOG_DENSITY]} />
                {frame && (
                    <>
                        <Arena frame={frame} />
                        <ServeFigure
                            data={data}
                            frame={frame}
                            clock={clock}
                            focusPoint={focusPoint}
                            focusTo={focusTo}
                            annotations={chapter?.annotations ?? []}
                        />
                        <Rig frame={frame} shot={shot} clock={clock} reserved={reserved} reducedMotion={reducedMotion} />
                        <ServeDOF focusPoint={focusPoint} />
                    </>
                )}
            </Canvas>

            {!data && !error && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <p className="m-0 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">
                        Lighting the court
                    </p>
                </div>
            )}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                    <p className="m-0 max-w-[320px] text-center font-sans text-sm text-white/60">
                        The serve data didn’t load ({error}).
                    </p>
                </div>
            )}

            {data && (
                <div
                    data-bottom-overlay
                    className="fixed inset-x-0 z-20"
                    /*
                      `fixed`, and lifted off the bottom of the layout
                      viewport by however much browser chrome is covering
                      it. Nothing between this and the window can get it
                      wrong, because nothing between this and the window is
                      involved — which is what every previous attempt got
                      wrong. See `use-visual-viewport-inset`.
                    */
                    style={{
                        bottom: `${viewportInset}px`,
                        paddingTop: '1.5rem',
                        paddingBottom:
                            'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
                        paddingLeft: 'max(1.5rem, env(safe-area-inset-left, 0px))',
                        paddingRight: 'max(1.5rem, env(safe-area-inset-right, 0px))',
                    }}
                >
                    <div className="mx-auto max-w-[980px]">
                        <ChapterCard
                            intro={index == null ? INTRO : null}
                            chapter={chapter}
                            index={index ?? 0}
                            total={chapters.length}
                            playing={playing}
                            atEnd={atEnd}
                            readoutValues={readoutValues}
                            chartProps={chartProps}
                            onStart={() => goTo(0)}
                            onPlay={play}
                            onPause={pause}
                            onReplay={replay}
                            onNext={() => goTo((index ?? -1) + 1)}
                            onBack={() => goTo((index ?? 0) - 1)}
                            onReadMore={() => setModal('chapter')}
                            onAppendix={() => setModal('appendix')}
                            onRestart={() => setIndex(null)}
                        />
                    </div>
                </div>
            )}

            <ServeModal open={modal === 'chapter'} onClose={() => setModal(null)} labelledBy="chapter-full-title">
                {chapter && (
                    <>
                        <div className="flex items-baseline gap-3">
                            <span className="font-mono text-[13px] tabular-nums text-white/35">
                                {String((index ?? 0) + 1).padStart(2, '0')}/{String(chapters.length).padStart(2, '0')}
                            </span>
                            <h2 id="chapter-full-title" className="m-0 font-sans text-[20px] font-bold text-white">
                                {chapter.title}
                            </h2>
                        </div>
                        <p className="my-4 font-sans text-[15px] leading-relaxed text-white/75">
                            {chapter.body}
                        </p>
                        <button
                            type="button" data-read-close onClick={() => setModal(null)}
                            className="mt-2 rounded-sm bg-white px-5 py-2 font-sans text-[11px] font-bold uppercase tracking-wider text-[#0b0c0e] transition-colors hover:bg-white/85"
                        >
                            Close
                        </button>
                    </>
                )}
            </ServeModal>

            <ServeModal open={modal === 'appendix'} onClose={() => setModal(null)} labelledBy="appendix-title">
                <h2 id="appendix-title" className="m-0 font-sans text-[20px] font-bold text-white">
                    {APPENDIX.title}
                </h2>
                {APPENDIX.sections.map((section) => (
                    <section key={section.heading} className="mt-5">
                        <h3 className="m-0 font-sans text-[11px] font-bold uppercase tracking-wider text-white/45">
                            {section.heading}
                        </h3>
                        <p className="my-1.5 font-sans text-[14px] leading-relaxed text-white/75">
                            {section.body}
                        </p>
                    </section>
                ))}
                <ul className="mt-6 list-none space-y-1.5 p-0">
                    {APPENDIX.links.map((link) => (
                        <li key={link.href} className="m-0">
                            <a
                                href={link.href}
                                target="_blank"
                                rel="noreferrer"
                                className="font-sans text-[13px] leading-snug text-[#7fc6e6] underline decoration-white/20 underline-offset-2 hover:decoration-current"
                            >
                                {link.label}
                            </a>
                        </li>
                    ))}
                </ul>
                <p className="mb-0 mt-5 font-sans text-[11.5px] leading-relaxed text-white/40">
                    {APPENDIX.credit}
                </p>
                <button
                    type="button" data-appendix-close onClick={() => setModal(null)}
                    className="mt-6 rounded-sm bg-white px-5 py-2 font-sans text-[11px] font-bold uppercase tracking-wider text-[#0b0c0e] transition-colors hover:bg-white/85"
                >
                    Close
                </button>
            </ServeModal>

            {/* `?vp` only. See the component. */}
            <ViewportReadout />
        </div>
    )
}
