import { Canvas } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import CourtScene from './CourtScene'
import PostFX from './PostFX'
import { courtImageUrl, TEAM_NAMES, TEAMS, ERAS } from './constants'
import { POSES } from './camera-poses'
import { VIEWS } from './views'
import { generateShots } from './shot-data'
import { sampleCourtColors } from './court-colors'
import { buildGrainMask } from './court-grain'
import { debugState } from './debug-state'
import DebugPanel from './DebugPanel'
import CourtMenu from './CourtMenu'
import usePlayFeed from './live/usePlayFeed'
import useLiveSceneDirector from './live/useLiveSceneDirector'
import LiveHUD from './live/LiveHUD'
import PlaybackSpeed from './live/PlaybackSpeed'
import GamesStrip from './live/GamesStrip'
import ProductTour, { TourButton, useTourAutoStart } from './ProductTour'
import { OVERLAY_BG } from './overlay-surface'
import useDeviceTilt from './use-device-tilt'
import SmallScreenNotice from './SmallScreenNotice'
import ViewportReadout from './ViewportReadout'

/**
 * Textures are cached across switches, so flipping between two teams after the
 * first visit costs nothing. The court fills most of the frame at a grazing
 * angle, which is exactly the case trilinear filtering handles badly, so every
 * texture gets mipmaps and max anisotropy.
 *
 * **Bounded, because it used not to be.** There are 60 courts (30 clubs, two
 * eras), each 2016x992: 7.6MB decoded, 10.2MB once mipmapped, so browsing the
 * whole league through the court picker parked 0.6GB in GPU memory and never
 * gave any of it back. Each one also carries a grain mask built on the CPU,
 * which is JS heap on top of that. The picker now shows all thirty marks at
 * once, so clicking through them is an obvious thing to do rather than a
 * stress test.
 *
 * Eviction never touches the most recent few entries, which is what makes it
 * safe without any bookkeeping between here and the renderer: the court on
 * screen and the one being cross-faded out of are by construction the two
 * most recently loaded, and `useTeamColors` only ever adds two more. A limit
 * well above that can't reach anything still in use.
 */
const MAX_CACHED_COURTS = 8
const cache = new Map()

/** Frees both the texture and the mask built alongside it. */
function disposeCourt(texture) {
    texture.userData?.grainMask?.dispose?.()
    texture.dispose()
}

/**
 * Drops least-recently-used entries past the cap.
 *
 * A `Map` iterates in insertion order, and `touch` below re-inserts on every
 * hit, so the iteration order *is* the recency order — oldest first.
 */
function evictCourts() {
    while (cache.size > MAX_CACHED_COURTS) {
        const [url, promise] = cache.entries().next().value
        cache.delete(url)
        // The entry may still be in flight, or may have failed. Either way
        // the cache is done with it; dispose whatever actually arrives.
        Promise.resolve(promise).then(disposeCourt, () => {})
    }
}

function loadCourt(team, era) {
    const url = courtImageUrl(team, era)
    if (cache.has(url)) {
        // Re-insert so this becomes the newest entry.
        const existing = cache.get(url)
        cache.delete(url)
        cache.set(url, existing)
        return existing
    }

    const promise = new Promise((resolve, reject) => {
        new THREE.TextureLoader().load(
            url,
            (texture) => {
                // The stanchion padding is painted to match the floor, so the
                // team colour is read off the apron as the image lands.
                texture.userData.colors = sampleCourtColors(texture.image, team)
                texture.userData.grainMask = buildGrainMask(texture.image)
                // Decoded by hand in the shader, so keep the upload raw.
                texture.colorSpace = THREE.NoColorSpace
                texture.anisotropy = 16
                texture.minFilter = THREE.LinearMipmapLinearFilter
                texture.magFilter = THREE.LinearFilter
                texture.generateMipmaps = true
                texture.needsUpdate = true
                resolve(texture)
            },
            undefined,
            reject
        )
    })

    cache.set(url, promise)
    // A failed load shouldn't occupy a slot forever, or be retried never.
    promise.catch(() => {
        if (cache.get(url) === promise) cache.delete(url)
    })
    evictCourts()
    return promise
}

/**
 * A team's accent colours, without ever rendering (or even keeping) that
 * team's texture — just piggybacks on the same cached `loadCourt` promise
 * every other court switch already uses, and reads `.userData.colors` off
 * it once resolved. Used for the live HUD's home/away accents, which need
 * to reflect the *game being watched*, not whichever court happens to be
 * currently on screen — those are independent today (there's no view-5
 * "pick a live game" UI yet to keep them in sync).
 */
function useTeamColors(tricode, era) {
    const [colors, setColors] = useState(null)
    useEffect(() => {
        if (!tricode) {
            setColors(null)
            return
        }
        let cancelled = false
        loadCourt(tricode, era).then((tex) => {
            if (!cancelled) setColors(tex.userData.colors)
        })
        return () => {
            cancelled = true
        }
    }, [tricode, era])
    return colors
}

/**
 * How much of the viewport the bottom overlay covers, as a fraction.
 *
 * Measured off whatever is actually down there — the game strip out on the
 * landing, the score bug inside a game — rather than carried as a constant
 * per view. The camera frames the scene into the band above it (see
 * `solveFraming`), so a number that drifts out of date here shows up as the
 * court sliding under the overlay, and these two things change shape for
 * real reasons: the strip's cards are shorter on a phone, and the score bug
 * grows when its play feed is open.
 */
function useFrameInsets(hostRef) {
    const [insets, setInsets] = useState({ top: 0.08, bottom: 0.24 })
    useEffect(() => {
        const host = hostRef.current
        if (!host || typeof ResizeObserver === 'undefined') return
        let frame = 0
        const measure = () => {
            const height = host.clientHeight
            if (!height) return
            const el = host.querySelector('[data-bottom-overlay]')
            // The strip's own top padding is a fade, not content; the
            // element's full height would reserve space that nothing
            // occupies. Its first child is the part that is actually drawn.
            const box = el?.firstElementChild ?? el
            const bottomPx = box ? box.getBoundingClientRect().height : 0
            // The site nav floats over this canvas and is not part of it,
            // so it is measured from the document rather than the host.
            const nav = document.querySelector('header')
            const navBox = nav?.getBoundingClientRect()
            const hostTop = host.getBoundingClientRect().top
            const topPx = navBox ? Math.max(0, navBox.bottom - hostTop) : 0
            const next = {
                top: Math.min(Math.max(topPx / height, 0), 0.3),
                bottom: Math.min(Math.max(bottomPx / height, 0.08), 0.6),
            }
            setInsets((prev) =>
                Math.abs(prev.top - next.top) < 0.005 &&
                Math.abs(prev.bottom - next.bottom) < 0.005
                    ? prev
                    : next
            )
        }
        // The overlay mounts and swaps with the view, so watch the subtree
        // rather than one element that may not exist yet.
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(measure)
        })
        observer.observe(host)
        const mutation = new MutationObserver(() => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(measure)
        })
        mutation.observe(host, { childList: true, subtree: true })
        measure()
        return () => {
            cancelAnimationFrame(frame)
            observer.disconnect()
            mutation.disconnect()
        }
    }, [hostRef])
    return insets
}

function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)')
        const update = () => setReduced(query.matches)
        update()
        query.addEventListener('change', update)
        return () => query.removeEventListener('change', update)
    }, [])
    return reduced
}

/**
 * True only while this tab is both the visible tab and the focused window.
 * Backs the render loop's on/off switch below — an R3F canvas nobody can
 * see still burns CPU and GPU (and, on a laptop, battery) running its
 * animation every frame, so the whole scene should go fully idle rather
 * than just quietly rendering into a backgrounded tab.
 *
 * Two separate browser signals, combined: visibilitychange alone catches
 * switching tabs or minimizing, but doesn't reliably fire when this window
 * loses OS focus to another app while still on screen, which is what the
 * focus/blur listeners are for.
 */
function useRenderActive() {
    // Visibility and focus are tracked separately and combined, rather than
    // both folded into one synchronous document.hasFocus() poll. That poll
    // turns out to be unreliable in at least one real environment (headless
    // Chrome under CDP automation reports it false from the very first
    // frame, with no blur ever having fired) — and since frameloop='never'
    // below skips every render including the first one, trusting a flaky
    // "false" at mount time means the canvas never paints anything at all,
    // ever. Focus/blur events are edge-triggered and don't have that
    // problem: both start true, and only flip on an event that actually
    // fired, so a page that never receives a real blur stays active.
    const [visible, setVisible] = useState(true)
    const [focused, setFocused] = useState(true)
    useEffect(() => {
        const onVisibility = () => setVisible(document.visibilityState === 'visible')
        const onFocus = () => setFocused(true)
        const onBlur = () => setFocused(false)
        onVisibility()
        document.addEventListener('visibilitychange', onVisibility)
        window.addEventListener('focus', onFocus)
        window.addEventListener('blur', onBlur)
        return () => {
            document.removeEventListener('visibilitychange', onVisibility)
            window.removeEventListener('focus', onFocus)
            window.removeEventListener('blur', onBlur)
        }
    }, [])
    return visible && focused
}

/**
 * "Knicks win", but "Heat wins" — NBA nicknames split between plurals and
 * mass nouns, and the verb has to follow. Keyed off the last word of the
 * club name, which is the nickname in every case including the two-word
 * ones ("Trail Blazers").
 */
function winVerb(teamName) {
    const nickname = String(teamName).trim().split(/\s+/).pop() ?? ''
    return /s$/i.test(nickname) ? 'win' : 'wins'
}

/**
 * How deep the in-focus band runs, in feet either side of the focus
 * distance. Sized from the geometry: the scoreboard stands at z = -40 and
 * the camera focuses on the court's middle about 35ft nearer, so anything
 * under that leaves the numerals blurred.
 *
 * Used by the landing too, which has the same problem for the same reason —
 * its lockup stands exactly where the scoreboard does. The landing had been
 * left on the default 2ft band, which is right for a single subject and
 * wrong for a view whose whole back wall is content. `PostFX` scales this
 * with camera distance, so one value holds at every viewport.
 */
const FOCUS_RANGE = 46

/**
 * Reads ?team=&era=&view=&game= so a particular shot can be linked to
 * directly — including a specific game, which is the only way to reach one
 * without clicking through the strip, and what makes a given moment in a
 * given game reproducible.
 */
function readQuery(fallbackTeam, fallbackEra) {
    if (typeof window === 'undefined') return [fallbackTeam, fallbackEra, 'court', null]
    const params = new URLSearchParams(window.location.search)
    const team = params.get('team')
    const era = params.get('era')
    const view = params.get('view')
    const game = params.get('game')
    return [
        TEAMS.includes(team) ? team : fallbackTeam,
        ERAS.includes(era) ? era : fallbackEra,
        VIEWS[view] ? view : 'court',
        /^\d{6,}$/.test(game ?? '') ? game : null,
    ]
}

/** The floor the landing view sits on, and returns to. */
export const LANDING_TEAM = 'bos'
export const LANDING_ERA = 'current'

export default function CourtViewer({
    initialTeam = LANDING_TEAM,
    initialEra = LANDING_ERA,
}) {
    const [initTeam, initEra, initView, initGame] = readQuery(initialTeam, initialEra)
    const [team, setTeam] = useState(initTeam)
    const [era, setEra] = useState(initEra)
    const [texture, setTexture] = useState(null)
    const [ready, setReady] = useState(false)
    const [viewId, setViewId] = useState(initView)
    const [profile, setProfile] = useState('modern')
    const [courtMenuOpen, setCourtMenuOpen] = useState(false)
    const [tourOpen, setTourOpen] = useState(false)
    // 1x is the pace replay already ran at, so the default changes nothing.
    const [playbackSpeed, setPlaybackSpeed] = useState(1)
    // Which game `usePlayFeed` polls — null means "no game picked," which
    // falls back to the replay fixture (see `usePlayFeed.js`).
    const [selectedGameId, setSelectedGameId] = useState(initGame)
    const view = VIEWS[viewId]

    // Synthetic while the look is being settled; real aggregates drop into the
    // same shape without touching the renderer.
    const shots = useMemo(
        () => generateShots({ profile, count: 1400, seed: 7 }),
        [profile]
    )

    const rootRef = useRef(null)
    const prevTexture = useRef(null)
    const moveRef = useRef(1)
    const mixRef = useRef(1)
    const pointer = useRef({ x: 0, y: 0 })
    const frameInsets = useFrameInsets(rootRef)
    const reducedMotion = usePrefersReducedMotion()
    // Writes into `pointer` itself, and reports whether it has taken over.
    const tiltActive = useDeviceTilt(pointer, { enabled: !reducedMotion })
    const renderActive = useRenderActive()
    const debugOn = useMemo(() => {
        if (typeof window === 'undefined') return false
        const on = new URLSearchParams(window.location.search).has('debug')
        debugState.active = on
        if (on) debugState.query = window.location.search || '(none)'
        return on
    }, [])

    // Live tuning from the URL: ?grain=1.4&rough=0.004&spec=12 and so on.
    const tuning = useMemo(() => {
        if (typeof window === 'undefined') return null
        const params = new URLSearchParams(window.location.search)
        const keys = [
            'grain', 'matte', 'glossvar', 'ripple', 'ripplescale',
            'rough', 'spec', 'key', 'corner',
            'rowz', 'fspacing', 'fradius', 'group', 'gap', 'sweep', 'aim', 'cone', 'fill', 'fillspacing', 'fillflatten', 'lheight', 'expand', 'paintgrain', 'paintscale',
            'paddrop', 'padside', 'padrise',
            'ribbonoffset', 'ribbonheight', 'ribbonband', 'ribbonblock', 'ribbon', 'ribbonspeed', 'ribbonswap',
            'dof', 'dofrange', 'doffalloff', 'dofblur', 'doffocus',
            'haze', 'hazeheight', 'hazethickness', 'hazeextent', 'hazeshaft', 'filmgrain',
            'zoom', 'led', 'postfx', 'replayfrom', 'reflect', 'reflectblur', 'reflectdebug', 'reflectblack', 'reflectminf', 'reflectripple', 'reflectocclude',
        ]
        const out = {}
        let any = false
        for (const k of keys) {
            const raw = params.get(k)
            if (raw == null) continue
            const n = Number(raw)
            if (Number.isFinite(n)) {
                out[k] = n
                any = true
            }
        }
        if (debugState.active) {
            debugState.tuning = any ? JSON.stringify(out) : 'none (using file defaults)'
        }
        return any ? out : null
    }, [])

    const debugSpec = useMemo(
        () =>
            typeof window !== 'undefined' &&
            new URLSearchParams(window.location.search).get('debug') === 'spec',
        []
    )

    // Polls the real selected game once one's been picked from the bottom
    // strip or the full game list; falls back to the replay fixture
    // otherwise (also the permanent behaviour on a day with no games, or
    // before a game's been picked at all) — `usePlayFeed` itself decides
    // which, so this never needs to branch.
    const { game: liveGame, plays: livePlays, latestPlay } = usePlayFeed(selectedGameId, {
        active: viewId === 'live',
        startAt: tuning?.replayfrom ?? 0,
        speed: playbackSpeed,
    })
    const activeScene = useLiveSceneDirector(latestPlay)

    // The in-scene scoreboard is always up, so it needs the running score
    // on every play rather than only on the ones that trigger typography.
    // Same source as `LiveHUD`'s: the play's own score, not `game`'s, which
    // is the final score for a completed game (see LiveHUD.js).
    // The game is over when the *replay* reaches the end, not when the
    // payload says `final` — a completed game is final from the first frame,
    // and celebrating before tip-off would give away the result of the thing
    // you just sat down to watch. The last play is the signal.
    const winner = useMemo(() => {
        if (!latestPlay || latestPlay.type !== 'period') return null
        if (!/end of game/i.test(latestPlay.description || '')) return null
        if (latestPlay.scoreHome === latestPlay.scoreAway) return null
        return latestPlay.scoreHome > latestPlay.scoreAway ? 'home' : 'away'
    }, [latestPlay])

    const liveScore = useMemo(
        () =>
            liveGame
                ? {
                      home: latestPlay ? latestPlay.scoreHome : 0,
                      away: latestPlay ? latestPlay.scoreAway : 0,
                      homeTricode: liveGame.home?.tricode,
                      awayTricode: liveGame.away?.tricode,
                      // Puts out the light inside the beaten team's numerals.
                      loser: winner ? (winner === 'home' ? 'away' : 'home') : null,
                  }
                : null,
        [liveGame, latestPlay, winner]
    )
    const liveHomeColors = useTeamColors(liveGame?.home?.tricode, era)
    const liveAwayColors = useTeamColors(liveGame?.away?.tricode, era)
    const winnerColors = winner === 'away' ? liveAwayColors : liveHomeColors

    // The end-of-game callout replaces ESPN's own flat "End of Game" with
    // the result. Done here rather than in `live-scenes.js` because that
    // module sees only the play, and a play carries scores but not the
    // names attached to them.
    const liveTypography = useMemo(() => {
        const typography = activeScene?.content?.typography
        if (!typography || !winner || !liveGame) return typography
        const tricode = winner === 'home' ? liveGame.home?.tricode : liveGame.away?.tricode
        const name = TEAM_NAMES[tricode] ?? tricode?.toUpperCase() ?? ''
        return { ...typography, status: `${name} ${winVerb(name)}!`.toUpperCase() }
    }, [activeScene, winner, liveGame])

    useEffect(() => {
        let cancelled = false
        loadCourt(team, era).then((next) => {
            if (cancelled || next === texture) return
            prevTexture.current = texture
            mixRef.current = texture ? 0 : 1
            setTexture(next)
            setReady(true)
        })
        return () => {
            cancelled = true
        }
        // `texture` is deliberately not a dep: it is the thing being replaced.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [team, era])

    // Warm the other era for the current team, so the toggle is instant.
    useEffect(() => {
        const other = era === 'current' ? 'vintage' : 'current'
        loadCourt(team, other).catch(() => {})
    }, [team, era])

    // Mirror the resolved selection into the debug readout.
    useEffect(() => {
        if (!debugState.active) return
        debugState.resolved = `team=${team} era=${era} view=${viewId}`
        debugState.texture = courtImageUrl(team, era)
    }, [team, era, viewId])

    // Keep the URL in step without adding history entries per click.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        params.set('team', team)
        params.set('era', era)
        params.set('view', viewId)
        if (selectedGameId) params.set('game', selectedGameId)
        else params.delete('game')
        window.history.replaceState(null, '', `?${params}`)
    }, [team, era, viewId, selectedGameId])

    // Choosing a view swaps the overlay; the pose transition itself is
    // handled uniformly below, for any reason the resolved pose changes —
    // a view switch, or the live scene director reacting to a play.
    const selectView = useCallback((nextId) => {
        setViewId((currentId) => (currentId === nextId ? currentId : nextId))
    }, [])

    // Leaving a game: the bottom control bar is hidden while one is open,
    // so this is the only way back to the rest of the experiment.
    const exitGame = useCallback(() => {
        setSelectedGameId(null)
        // Back to the landing floor, not whichever building the last game
        // was played in.
        setTeam(LANDING_TEAM)
        setEra(LANDING_ERA)
        selectView('court')
    }, [selectView])

    // Picking a game from the drawer does what the plan called for:
    // switches the court to that game's home team (reusing the existing
    // team-switch plumbing, not a separate mechanism), jumps to the live
    // view, and records which game — even though nothing reads that id
    // yet (see `selectedGameId` above).
    const selectGame = useCallback(
        (game) => {
            // A preseason opponent can be a club with no court of its own;
            // the home side always has one, but guard anyway rather than
            // blanking the floor.
            if (game.home?.tricode) setTeam(game.home.tricode)
            setSelectedGameId(game.gameId)
            selectView('live')
            setCourtMenuOpen(false)
        },
        [selectView]
    )

    // What the camera should actually be showing right now: a live scene's
    // own computed pose while one is active and this is the live view,
    // otherwise the current view's named pose. `activeScene.pose` is null
    // for a typography-tier scene (score/status text, no dedicated camera
    // move — see live-scenes.js), which falls through to the base pose too.
    //
    // Starting and easing the move is the rig's own business (see
    // `CameraRig`): it has to begin from the state it actually rendered,
    // which only it knows once a move can be interrupted part-way. This
    // just says where to point.
    const resolvedPose =
        viewId === 'live' && activeScene?.pose ? activeScene.pose : POSES[view.pose]


    // Both yield to the device's own sense of which way it is being held:
    // a phone emits pointer events for every tap, and a tap that jumped the
    // camera would fight the tilt that is already driving it.
    const onPointerMove = useCallback(
        (event) => {
            if (tiltActive.current) return
            const rect = event.currentTarget.getBoundingClientRect()
            pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
            pointer.current.y = ((event.clientY - rect.top) / rect.height) * 2 - 1
        },
        [tiltActive]
    )

    const onPointerLeave = useCallback(() => {
        if (tiltActive.current) return
        pointer.current.x = 0
        pointer.current.y = 0
    }, [tiltActive])

    const teamList = useMemo(
        () => TEAMS.map((abbr) => [abbr, TEAM_NAMES[abbr]]),
        []
    )

    const openTour = useCallback(() => setTourOpen(true), [])
    const closeTour = useCallback(() => setTourOpen(false), [])
    // Waits for the floor to be lit: a tour that points at a loading
    // screen is pointing at nothing. Held back on a phone as well, where
    // `SmallScreenNotice` has the first word and the two would otherwise
    // stack on top of each other on a first visit.
    const autoTourOk =
        ready &&
        viewId !== 'live' &&
        (typeof window === 'undefined' ||
            !window.matchMedia?.('(max-width: 639px)').matches)
    useTourAutoStart(autoTourOk, openTour)

    return (
        <div
            ref={rootRef}
            className="relative h-full w-full overflow-hidden bg-[#0b0d12]"
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
        >
            <Canvas
                /*
                  Hidden from assistive tech on purpose. Everything a screen
                  reader can use — the call, the score, the clock, the
                  controls — is in the DOM overlays above it; the canvas
                  itself would announce as an unlabelled graphic and offer
                  nothing to navigate.
                */
                aria-hidden="true"
                dpr={[1, 2]}
                gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
                camera={{ fov: 34, near: 1, far: 2000, position: [0, 60, 104] }}
                // 'never' fully stops R3F's internal rAF loop — no useFrame
                // callback in the whole tree runs, and nothing re-renders —
                // rather than just skipping a draw call while the animation
                // clocks underneath keep ticking.
                frameloop={renderActive ? 'always' : 'never'}
            >
                <CourtScene
                    texture={texture}
                    prevTexture={prevTexture.current}
                    mixRef={mixRef}
                    pointer={pointer}
                    reducedMotion={reducedMotion}
                    pose={resolvedPose}
                    moveRef={moveRef}
                    frameInsets={frameInsets}
                    courtColors={texture?.userData?.colors}
                    shots={shots}
                    showShots={view.overlay === 'shots'}
                    courtDim={view.courtDim}
                    debugSpec={debugSpec}
                    tuning={tuning}
                    led={tuning?.led ?? 0}
                    hexSize={2.6}
                    minAttempts={4}
                    showDFence={view.overlay === 'dfence'}
                    // A win celebrates on the live court too — confetti and
                    // the team-coloured ribbon, but *not* the celebration
                    // view's orbiting camera, which lives on that view's own
                    // pose and is deliberately not adopted here.
                    celebrate={view.overlay === 'celebration' || Boolean(winner)}
                    celebrateColor={winnerColors?.ribbonPrimary}
                    showLive={view.overlay === 'live'}
                    livePlays={livePlays}
                    liveGameId={selectedGameId}
                    liveTypography={liveTypography}
                    liveScore={liveScore}
                    liveHomeColor={liveHomeColors?.ribbonPrimary}
                    shotClockValue={latestPlay?.type === 'period' ? '0.0' : undefined}
                />
                <PostFX
                    tuning={tuning}
                    focusRange={FOCUS_RANGE}
                    // Entering or leaving a game, and changing the court,
                    // all take the house down and bring it back.
                    fadeKey={`${viewId}|${team}|${era}`}
                />
            </Canvas>

            <div
                className={`pointer-events-none absolute inset-0 flex items-center justify-center bg-[#0b0d12] transition-opacity duration-500 ${
                    ready ? 'opacity-0' : 'opacity-100'
                }`}
            >
                <span className="font-sans text-sm font-bold uppercase tracking-[0.2em] text-white/40">
                    Lighting the floor
                </span>
            </div>

            {debugOn && <DebugPanel />}

            {/* `?vp` only — see the component for why this exists. */}
            <ViewportReadout />

            {/*
              Outside a game the bottom of the screen is for choosing one.
              Both this and the court menu disappear once a game is open —
              the live view puts its score block here instead, and the court
              is then dictated by the game itself.
            */}
            <GamesStrip
                active={viewId !== 'live'}
                onSelectGame={selectGame}
                onStartTour={openTour}
            />

            {viewId !== 'live' && (
                <CourtMenu
                    team={team}
                    era={era}
                    onTeam={setTeam}
                    onEra={setEra}
                    teamList={teamList}
                    open={courtMenuOpen}
                    onOpen={() => setCourtMenuOpen(true)}
                    onClose={() => setCourtMenuOpen(false)}
                />
            )}

            {/*
              The left-hand controls, as a row rather than two absolutely
              positioned buttons: leaving a game and starting the tour are
              both here, and only one of them exists in both views, so
              stacking them by hand would mean two sets of coordinates that
              have to agree. Offset below the site header, which floats over
              this canvas and would otherwise sit on top of them.
            */}
            <div className="absolute left-4 top-20 z-20 flex items-center gap-2 sm:left-6">
                {viewId === 'live' && (
                    <button
                        type="button"
                        onClick={exitGame}
                        data-tour="exit-game"
                        aria-label="Leave game"
                        title="Leave game"
                        className="flex h-[40px] w-[40px] items-center justify-center rounded-sm text-white/70 ring-1 ring-white/10 backdrop-blur transition-colors hover:text-white hover:ring-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                        style={{ backgroundColor: OVERLAY_BG }}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                        >
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12,19 5,12 12,5" />
                        </svg>
                    </button>
                )}
            </div>

            <LiveHUD
                active={viewId === 'live'}
                game={liveGame}
                plays={livePlays}
                latestPlay={latestPlay}
                homeColors={liveHomeColors}
                awayColors={liveAwayColors}
                winner={winner}
                footerLeft={<TourButton onClick={openTour} bare />}
                footerRight={
                    /*
                      Only while replaying — a live game arrives at the
                      speed it is being played.
                    */
                    <PlaybackSpeed
                        active={liveGame?.status === 'final'}
                        speed={playbackSpeed}
                        onSpeed={setPlaybackSpeed}
                    />
                }
            />

            {/*
              Last in the tree, and on its own z-layer above the court
              menu's modal: whatever it is pointing at, it has to be the
              thing in front.
            */}
            {/*
              Above the tour, since it is the first thing to answer on a
              phone and the tour would otherwise run underneath it.
            */}
            <SmallScreenNotice />

            <ProductTour
                containerRef={rootRef}
                context={viewId === 'live' ? 'live' : 'landing'}
                open={tourOpen}
                hidden={courtMenuOpen}
                onClose={closeTour}
            />
        </div>
    )
}
