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
import SettingsFlyout from './SettingsFlyout'
import usePlayFeed from './live/usePlayFeed'
import useLiveSceneDirector from './live/useLiveSceneDirector'
import LiveHUD from './live/LiveHUD'
import GameListOverlay from './live/GameListOverlay'
import UpcomingGamesStrip from './live/UpcomingGamesStrip'

/**
 * Textures are cached across switches, so flipping between two teams after the
 * first visit costs nothing. The court fills most of the frame at a grazing
 * angle, which is exactly the case trilinear filtering handles badly, so every
 * texture gets mipmaps and max anisotropy.
 */
const cache = new Map()

function loadCourt(team, era) {
    const url = courtImageUrl(team, era)
    if (cache.has(url)) return cache.get(url)

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
 * How deep the live view's in-focus band runs, in feet either side of the
 * focus distance. Sized from the geometry: the scoreboard stands at
 * z = -40 and the camera focuses on the court's middle about 35ft nearer,
 * so anything under that leaves the numerals blurred.
 */
const LIVE_FOCUS_RANGE = 46

/** Reads ?team=&era=&pose= so a particular shot can be linked to directly. */
function readQuery(fallbackTeam, fallbackEra) {
    if (typeof window === 'undefined') return [fallbackTeam, fallbackEra, 'court']
    const params = new URLSearchParams(window.location.search)
    const team = params.get('team')
    const era = params.get('era')
    const view = params.get('view')
    return [
        TEAMS.includes(team) ? team : fallbackTeam,
        ERAS.includes(era) ? era : fallbackEra,
        VIEWS[view] ? view : 'court',
    ]
}

export default function CourtViewer({
    initialTeam = 'bos',
    initialEra = 'current',
}) {
    const [initTeam, initEra, initView] = readQuery(initialTeam, initialEra)
    const [team, setTeam] = useState(initTeam)
    const [era, setEra] = useState(initEra)
    const [texture, setTexture] = useState(null)
    const [ready, setReady] = useState(false)
    const [viewId, setViewId] = useState(initView)
    const [profile, setProfile] = useState('modern')
    const [gameListOpen, setGameListOpen] = useState(false)
    // Which game `usePlayFeed` polls — null means "no game picked," which
    // falls back to the replay fixture (see `usePlayFeed.js`).
    const [selectedGameId, setSelectedGameId] = useState(null)
    const view = VIEWS[viewId]

    // Synthetic while the look is being settled; real aggregates drop into the
    // same shape without touching the renderer.
    const shots = useMemo(
        () => generateShots({ profile, count: 1400, seed: 7 }),
        [profile]
    )

    const prevTexture = useRef(null)
    const moveRef = useRef(1)
    const mixRef = useRef(1)
    const pointer = useRef({ x: 0, y: 0 })
    const reducedMotion = usePrefersReducedMotion()
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
        window.history.replaceState(null, '', `?${params}`)
    }, [team, era, viewId])

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
        selectView('court')
    }, [selectView])

    // Picking a game from the drawer does what the plan called for:
    // switches the court to that game's home team (reusing the existing
    // team-switch plumbing, not a separate mechanism), jumps to the live
    // view, and records which game — even though nothing reads that id
    // yet (see `selectedGameId` above).
    const selectGame = useCallback(
        (game) => {
            setTeam(game.home.tricode)
            setSelectedGameId(game.gameId)
            selectView('live')
            setGameListOpen(false)
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


    const onPointerMove = useCallback((event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        pointer.current.y = ((event.clientY - rect.top) / rect.height) * 2 - 1
    }, [])

    const onPointerLeave = useCallback(() => {
        pointer.current.x = 0
        pointer.current.y = 0
    }, [])

    const teamList = useMemo(
        () => TEAMS.map((abbr) => [abbr, TEAM_NAMES[abbr]]),
        []
    )

    return (
        <div
            className="relative h-full w-full overflow-hidden bg-[#0b0d12]"
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
        >
            <Canvas
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
                    liveLatestPlay={latestPlay}
                    liveTypography={liveTypography}
                    liveScore={liveScore}
                    liveHomeColor={liveHomeColors?.ribbonPrimary}
                    shotClockValue={latestPlay?.type === 'period' ? '0.0' : undefined}
                />
                <PostFX
                    tuning={tuning}
                    focusRange={viewId === 'live' ? LIVE_FOCUS_RANGE : null}
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

            {/*
              The bottom bar outside a game: picking what to watch is the
              primary action, so it takes the bar, and the court experiment's
              own knobs sit beside it behind the gear. Both disappear once a
              game is open — the live view puts its score block here instead,
              and the court/teams are then dictated by the game itself.
            */}
            {viewId !== 'live' && (
                <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-16 sm:px-6 sm:pb-6">
                    <div className="mx-auto flex max-w-5xl items-end gap-3">
                        <UpcomingGamesStrip
                            active={!gameListOpen}
                            onSelectGame={selectGame}
                            onOpenAll={() => setGameListOpen(true)}
                        />
                        <SettingsFlyout
                            team={team}
                            era={era}
                            onTeam={setTeam}
                            onEra={setEra}
                            teamList={teamList}
                            viewId={viewId}
                            onView={selectView}
                            profile={profile}
                            onProfile={setProfile}
                        />
                    </div>
                </div>
            )}

            {/*
              Leaving a game is a standalone control, not part of the score
              bug — offset below the site header, which floats over this
              canvas and would otherwise sit on top of it.
            */}
            {viewId === 'live' && (
                <button
                    type="button"
                    onClick={exitGame}
                    aria-label="Leave game"
                    title="Leave game"
                    className="absolute left-4 top-20 z-10 flex h-11 w-11 items-center justify-center rounded-sm bg-black/60 text-white/70 backdrop-blur transition-colors hover:bg-black/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:left-6"
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

            <LiveHUD
                active={viewId === 'live'}
                game={liveGame}
                plays={livePlays}
                latestPlay={latestPlay}
                homeColors={liveHomeColors}
                awayColors={liveAwayColors}
                winner={winner}
            />

            <GameListOverlay
                open={gameListOpen}
                onClose={() => setGameListOpen(false)}
                onSelectGame={selectGame}
            />
        </div>
    )
}
