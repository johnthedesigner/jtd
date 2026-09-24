import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { makeSignFrameMaterial, makeSignPanelMaterial } from '../sign-material'
import { centeredTextGeometry, useTypeface } from '../typeface'

/**
 * 3D scoreboard/status typography standing behind the courtside seats.
 *
 * The score itself is always up, the way a real arena's is — it's the thing
 * you glance at, so hiding it between events made you wait for a timeout to
 * find out where the game stood. Only the *status* line ("HALFTIME",
 * "TIMEOUT") comes and goes, on the scene director's "typography" tier
 * (see `live-scenes.js`).
 * Genuinely extruded geometry (`TextGeometry`, real depth), not flat SDF
 * text — matching this project's own established principle that overlays
 * are scene objects, not DOM, and should sit in the environment and catch
 * the same lighting as everything else (unlike `LiveGameOverlay`'s floor
 * markers, which are deliberately unlit/HUD-like instead).
 *
 * The fonts are three static weights of Montserrat (400/700/900),
 * instantiated from the real variable font and converted to three.js's
 * typeface.json format with the exact algorithm three.js's own
 * `TTFLoader` uses (`opentype.js`, run once as a build step, not at
 * runtime) — see `public/fonts/`. `TextGeometry`'s typeface.json format has
 * no concept of variable font axes at all, so "the variable version" only
 * ever mattered as the *source* for these fixed instances, not something
 * carried through to the browser.
 *
 * Everything here is cut from the same cloudy glass (`glass-material.js`),
 * chamfered around both faces and lit from a source low inside the
 * letterforms. That module carries the reasons for the two choices that
 * look like oversights and aren't: no real `transmission`, and
 * `depthWrite: true` on a transparent material.
 */

const SCORE_FONT_URL = '/fonts/montserrat_black.typeface.json'
const STATUS_FONT_URL = '/fonts/montserrat_bold.typeface.json'

/**
 * The numerals stand on the bench/scorer's side, which this arena already
 * models explicitly as `-Z` and describes as "opposite the camera, where
 * real benches are" (`arena-layout.js`) — the default/idle camera sits at
 * `+Z`, so this puts the score across the floor from the viewer rather
 * than beyond the baselines, where it was.
 *
 * `SCORE_Z` clears both courtside chair rows: `SIDELINE.setback` is
 * `COURT_HALF[1] + 6` (31ft) with a second row a `ROW_PITCH` (3ft) behind
 * it, so 38ft out sits just past the back row.
 *
 * Home goes to `+X`, away to `-X`, matching the `end = 1` = home
 * convention used throughout (`Hoop`, `normalize.js`, `live-scenes.js`).
 *
 * Numeral height is the NBA three-point distance — 23.75ft, the arc at the
 * top of the key. An arena scoreboard is read from the far end of the
 * building, and at anything less than this the numbers sat behind the
 * seating as small bright specks.
 *
 * At that size a two-digit score is wider than the scorer's table, so
 * `SCORE_BENCH_X` is well outside the old bench-block position: the numbers
 * are pushed out toward the corners to leave the middle clear for the
 * status line, and each still sits on its own team's side.
 */
/**
 * The numerals ink to the NBA three-point distance — the arc at the top of
 * the key. An arena scoreboard is read from the far end of the building.
 *
 * `size` is not that height. `TextGeometry`'s `size` is a scale factor on
 * the font's own units, and measured across `0123456789` in this face it
 * inks to **1.058x** it. Setting `size = 23.75` therefore drew numerals
 * 25.13ft tall — over a foot past the intent, and enough to push the team
 * lettering off the top of the frame. So the size is solved from the
 * height, not used as one.
 */
const THREE_POINT_DISTANCE = 23.75
/** Measured, not derived — see `useInkHeight`. */
const NUMERAL_INK_RATIO = 1.0581
const SCORE_SIZE = THREE_POINT_DISTANCE / NUMERAL_INK_RATIO
/**
 * Deep. These are slabs standing in the room, not signage — at a shallow
 * extrusion the chamfer and the interior light have nothing to happen in,
 * and the glyphs read as cut paper from the raked camera.
 */
const SCORE_DEPTH = 8
const SCORE_Z = -38
const SCORE_BENCH_X = 34
/**
 * The numerals stand *on* the floor: bottom-baselined geometry at y=0, so
 * they're objects in the room rather than signage hung in the dark. The
 * measurement has to be the inked height, not `size` — see
 * `centeredTextGeometry`.
 */
const SCORE_Y = 3

/**
 * Team lettering rides above its own number. Sized so the whole assembly —
 * numerals, gap, lettering — still clears the top of the frame at the live
 * view's fixed camera, which at the previous 0.26 it did not.
 */
const LABEL_SIZE = SCORE_SIZE * 0.2
const LABEL_DEPTH = 2.5
/**
 * Where the lettering sits above its number is **measured, not estimated**.
 *
 * It was estimated once, at `SCORE_SIZE * 0.72` on the reasoning that digits
 * ink to about their cap height. That is wrong for `TextGeometry`, whose
 * `size` is not the em box in the way that assumes: measured across
 * `0123456789` in this face at this size, the inked height is **1.058 x
 * size**, not 0.72. The estimate put the numerals' top at 17.1ft when it is
 * really 25.13ft, so the lettering was being placed 8ft inside the numbers
 * and every attempt to "add a bit more gap" was still landing underneath
 * them.
 *
 * So `useInkHeight` measures the real geometry, and the gap below is stated
 * as a fraction of the lettering's own measured height — the typographic
 * way to say it, and stable if either size changes.
 *
 * `LABEL_GAP` is a *world* fraction chosen to produce a half-cap-height gap
 * **on screen**, which is the thing that actually reads. The two differ
 * because the lettering's front face sits nearer the camera than the
 * numerals' top rear edge, so it projects lower than its world position
 * suggests; solved against the live view's own fixed camera, a 0.614x world
 * gap gives 0.5x on screen (~28px at 800px tall).
 */
const NUMERAL_DIGITS = '0123456789'
const LABEL_GAP = 0.614
/**
 * Set back so the lettering's rear face is flush with the numerals' rear
 * face, rather than both being centred on the same Z — which keeps the two
 * rows on one plane and limits how far the perspective offset above has to
 * reach.
 */
const LABEL_Z = SCORE_Z - SCORE_DEPTH / 2 + LABEL_DEPTH / 2

/**
 * The chamfer is the bezel. It insets the lit face and fills the difference
 * with angled metal, so it is both the return around the light and the only
 * thing controlling how much frame you see — there is no separate bezel
 * parameter any more, and no distance field needed to find one.
 *
 * Sized against stroke weight rather than character height: too deep a cut
 * on a face this heavy eats the lit area from both sides at once.
 */
const SCORE_CHAMFER = 0.27
const LABEL_CHAMFER = 0.1
const STATUS_CHAMFER = 0.055

const STATUS_SIZE = 4.5
const STATUS_DEPTH = 1.4
/**
 * Resting on the court rather than hovering over it: bottom-baselined at
 * y=0, so the lettering stands on the floor it's announcing.
 */
const STATUS_Y = 0

/**
 * The numerals are lit by the room, not self-lit: no emissive at all, and a
 * falloff gentle enough that the court's spill actually carries the ~14ft
 * out to them. They sit outside the pool, so they sit in its edge light and
 * fall away with distance the way the stanchions do — which is the point,
 * they're objects standing on the floor rather than a lightbox.
 */
/**
 * The metal is lit by the room, on the courtside chairs' own falloff — it
 * stands out there with them, past the light pool, and should recede the
 * same way they do. The frame material carries that default; these only
 * exist where a run wants to differ.
 */
const STATUS_FRAME_FALLOFF = { floor: 0.5, spill: 0.4, decay: 0.03 }

/**
 * How hard each panel burns. The losing team's goes dark at the final
 * buzzer, which is the whole reason this is a per-side value.
 */
const SCORE_PANEL_INTENSITY = 0.7
const LABEL_PANEL_INTENSITY = 0.6
const STATUS_PANEL_INTENSITY = 0.76
const DARK_PANEL_INTENSITY = 0

/**
 * The metal return around each lit face is the chamfer — real geometry,
 * angled, a few inches wide at this size. See `sign-material.js` for why
 * an inset flat bezel was abandoned.
 */

/**
 * Where the lit faces stand and how hard each is burning, for the things
 * that have to be lit *by* the scoreboard — the deck in front of it and the
 * courtside chairs between it and the floor. A team whose light has gone
 * out at the final buzzer stops lighting the room too, which is most of
 * what makes that moment read.
 */
export function scoreboardLights(score, homeEnd = 1) {
    if (!score) return []
    const z = SCORE_Z + SCORE_DEPTH / 2
    // Middle of the lit faces, so the lamps ride with the characters
    // instead of holding a height of their own that drifts out of step the
    // moment the numerals move.
    const y = SCORE_Y + THREE_POINT_DISTANCE / 2
    return [
        {
            x: homeEnd * SCORE_BENCH_X,
            y,
            z,
            intensity: score.loser === 'home' ? 0 : SCORE_PANEL_INTENSITY,
        },
        {
            x: -homeEnd * SCORE_BENCH_X,
            y,
            z,
            intensity: score.loser === 'away' ? 0 : SCORE_PANEL_INTENSITY,
        },
    ]
}

/**
 * Asymmetric on purpose. The callout can afford to arrive over a beat, but
 * it should leave decisively — a slow dissolve on a word sitting across the
 * middle of the floor hangs around looking like it's still saying
 * something after the moment has passed.
 */
const FADE_IN_SECONDS = 0.35
const FADE_OUT_SECONDS = 0.1

/**
 * The inked height of a run, measured off the real geometry rather than
 * inferred from `size` — see the note on `LABEL_GAP` for what inferring it
 * cost. Built once per font/size and thrown away; only the number is kept.
 */
function useInkHeight(font, text, size, depth, chamfer) {
    return useMemo(() => {
        if (!font) return null
        const geo = centeredTextGeometry(TextGeometry, font, text, size, depth, {
            baseline: 'bottom',
            chamfer,
        })
        const height = geo.userData.inkHeight
        geo.dispose()
        return height
    }, [font, text, size, depth, chamfer])
}

/**
 * One run of scoreboard lettering: a gunmetal body with a lit face.
 *
 * Two materials on one mesh, indexed by the extrusion's own groups — the
 * front and back lids take the panel, the sides and chamfer take the metal.
 * See `sign-material.js`.
 */
function SignText({
    font,
    text,
    size,
    depth,
    position,
    panelColor,
    panelIntensity,
    fadeRef,
    baseline = 'middle',
    chamfer = 0,
    frameFalloff,
    cacheKey,
}) {
    const geometry = useMemo(
        () =>
            font
                ? centeredTextGeometry(TextGeometry, font, text, size, depth, {
                      baseline,
                      chamfer,
                  })
                : null,
        [font, text, size, depth, baseline, chamfer]
    )

    const frameMaterial = useMemo(
        () => makeSignFrameMaterial({ falloff: frameFalloff, cacheKey }),
        [frameFalloff, cacheKey]
    )
    const panelMaterial = useMemo(
        () => makeSignPanelMaterial({ color: panelColor, intensity: panelIntensity }),
        [panelColor, panelIntensity]
    )

    // Material index 0 is the lids, 1 is the sides and bevel.
    const materials = useMemo(
        () => [panelMaterial, frameMaterial],
        [panelMaterial, frameMaterial]
    )

    useEffect(
        () => () => {
            frameMaterial.dispose()
            panelMaterial.dispose()
        },
        [frameMaterial, panelMaterial]
    )
    useEffect(() => () => geometry?.dispose(), [geometry])

    // Only the status line fades; the score is always up.
    useFrame(() => {
        if (!fadeRef) return
        const k = fadeRef.current
        for (const m of materials) {
            m.opacity = k
            m.transparent = k < 0.999
        }
    })

    if (!geometry) return null

    return <mesh geometry={geometry} material={materials} position={position} />
}

export default function ScoreboardText({
    score,
    typography,
    homeEnd = 1,
    ribbonColor = '#ffffff',
}) {
    const scoreFont = useTypeface(SCORE_FONT_URL)
    const statusFont = useTypeface(STATUS_FONT_URL)

    // Measured across every digit rather than off the score currently
    // showing, so the lettering doesn't shift up and down as the score
    // changes from "9" to "10" to "100".
    const numeralInk = useInkHeight(scoreFont, NUMERAL_DIGITS, SCORE_SIZE, SCORE_DEPTH, SCORE_CHAMFER)
    const labelInk = useInkHeight(statusFont, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', LABEL_SIZE, LABEL_DEPTH, LABEL_CHAMFER)
    // Relative to the numerals' own ink, then lifted with them — the gap
    // below is a gap between the two rows, not a height above the deck.
    const labelY =
        numeralInk != null && labelInk != null
            ? SCORE_Y + numeralInk + labelInk * LABEL_GAP
            : 0

    // A light fade in/out around the scene director's own hold/revert
    // timing, rather than an abrupt pop — the director already owns *when*
    // the status line should be showing (via `typography` going
    // truthy/null), this just softens the transition.
    const fadeRef = useRef(0)
    useFrame((_, delta) => {
        const target = typography ? 1 : 0
        const span = typography ? FADE_IN_SECONDS : FADE_OUT_SECONDS
        fadeRef.current += (target - fadeRef.current) * Math.min(1, delta / span)
    })

    const [shownStatus, setShownStatus] = useState(null)
    const status = typography?.status
    useEffect(() => {
        if (status) {
            setShownStatus(status)
            return
        }
        // Unmounts once the fade has actually finished — the exponential
        // approach above never reaches zero exactly, so this is timed off
        // the fade's own span rather than waiting for a value.
        const id = setTimeout(() => setShownStatus(null), FADE_OUT_SECONDS * 1000 * 3)
        return () => clearTimeout(id)
    }, [status])

    // Kept mounted through the fade-out: unmounting the moment the
    // director drops `typography` would cut the text rather than fade it,
    // which is the pop the fade exists to avoid.
    if (!scoreFont || !statusFont || numeralInk == null || labelInk == null) return null

    const awayEnd = -homeEnd

    // When the game is over the losing side's interior light goes out — the
    // scoreboard itself says who won, without a word of explanation.
    const panelIntensity = (dark, base) => (dark ? DARK_PANEL_INTENSITY : base)

    return (
        <>
            {score && (
                <>
                    <SignText
                        font={scoreFont}
                        text={String(score.home ?? 0)}
                        size={SCORE_SIZE}
                        depth={SCORE_DEPTH}
                        position={[homeEnd * SCORE_BENCH_X, SCORE_Y, SCORE_Z]}
                        baseline="bottom"
                        chamfer={SCORE_CHAMFER}
                        panelIntensity={panelIntensity(score.loser === 'home', SCORE_PANEL_INTENSITY)}
                        cacheKey="score"
                    />
                    <SignText
                        font={scoreFont}
                        text={String(score.away ?? 0)}
                        size={SCORE_SIZE}
                        depth={SCORE_DEPTH}
                        position={[awayEnd * SCORE_BENCH_X, SCORE_Y, SCORE_Z]}
                        baseline="bottom"
                        chamfer={SCORE_CHAMFER}
                        panelIntensity={panelIntensity(score.loser === 'away', SCORE_PANEL_INTENSITY)}
                        cacheKey="score"
                    />
                    {/*
                      Tricodes, not full club names: at this scale "OKLAHOMA
                      CITY THUNDER" would be wider than the arena, and the
                      three-letter form is what an actual scoreboard shows.
                    */}
                    <SignText
                        font={statusFont}
                        text={(score.homeTricode ?? '').toUpperCase()}
                        size={LABEL_SIZE}
                        depth={LABEL_DEPTH}
                        position={[homeEnd * SCORE_BENCH_X, labelY, LABEL_Z]}
                        baseline="bottom"
                        chamfer={LABEL_CHAMFER}
                        panelColor={ribbonColor}
                        panelIntensity={panelIntensity(score.loser === 'home', LABEL_PANEL_INTENSITY)}
                        cacheKey="label"
                    />
                    <SignText
                        font={statusFont}
                        text={(score.awayTricode ?? '').toUpperCase()}
                        size={LABEL_SIZE}
                        depth={LABEL_DEPTH}
                        position={[awayEnd * SCORE_BENCH_X, labelY, LABEL_Z]}
                        baseline="bottom"
                        chamfer={LABEL_CHAMFER}
                        panelIntensity={panelIntensity(score.loser === 'away', LABEL_PANEL_INTENSITY)}
                        cacheKey="label"
                    />
                </>
            )}

            {shownStatus && (
                <SignText
                    font={statusFont}
                    text={shownStatus}
                    size={STATUS_SIZE}
                    depth={STATUS_DEPTH}
                    position={[0, STATUS_Y, 0]}
                    baseline="bottom"
                    chamfer={STATUS_CHAMFER}
                    // Inherits the same warm white the scoreboard panels
                    // use, so every lit surface in the scene shares one
                    // tone. Deliberately not the team's ribbon colour: this
                    // lettering lies on a court already painted in that
                    // colour, and a colour-on-colour callout was the first
                    // thing to get lost against it.
                    panelIntensity={STATUS_PANEL_INTENSITY}
                    frameFalloff={STATUS_FRAME_FALLOFF}
                    fadeRef={fadeRef}
                    cacheKey="status"
                />
            )}
        </>
    )
}
