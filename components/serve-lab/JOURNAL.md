# Serve Lab — running log

Findings, decisions and open threads for the tennis serve explainer. Same
job as `components/nba-court/JOURNAL.md` does for Courtside: this is the
source of truth for status, not the plan file.

The handoff that started it (notes, prototype, pipeline, raw viewer JSON) is
in `REF/`. The data actually served lives in `public/experiments/serve-lab/`.

## Step 2 — page scaffold and the static arena

Built: `serve-court.js` (the lab→world transform and the reconstructed court
placement), `ServeArena.js` (court, net, walls, stands, overhead rig),
`serve-cameras.js` (six presets, pullback, framing offset), `ServeViewer.js`
(canvas shell), `useServeData.js`, and `pages/experiments/serve-lab.js`.

Not in the sitemap yet (`inSitemap: false` in `utils/pages.json`) and not in
`utils/experiments.js`: it is a scene with nothing in it. Both flip in step 6.

### Port fidelity: checked numerically, not by eye

The prototype is a reference implementation, so the court frame is checkable
rather than guessed at. Running its own derivation in its own page and the
port's side by side:

| | prototype | port |
|---|---|---|
| `ground` | 0.0359 | 0.0359 |
| `baselineAt` | 0.1924 | 0.1924 |

Rendered colour on an open patch of court, same camera, same pixels:
prototype `[145, 190, 220]`, port `[138, 184, 214]` — about 4% darker, which
is the expected direction. The prototype is three r147 with colour
management off, so its material colours are treated as linear; three 0.186
converts sRGB to linear on input. The port is the more correct of the two.

**An eyeball read said the port was far too bright and washed out. It was
wrong** — measuring the same patch in both put them within 4%. The figure
and the overlays in the prototype shot were doing the work my eye attributed
to the court.

### Three things that were not what they looked like

- **"Software rendering."** `--enable-unsafe-swiftshader` is a *fallback*
  flag, not a switch. `WEBGL_debug_renderer_info` reports ANGLE Metal on the
  Apple M4 Pro either way. These runs were always on the real GPU.
- **"30 fps, so the light rig is too heavy."** Frame time measured 33.3 ms
  median with a 33.4 ms p95 — far too tight to be a workload. Headless
  Chrome caps `requestAnimationFrame` at 30 fps regardless of GPU, so rAF
  timing cannot measure this scene at all. **No frame-time number from this
  harness means anything.**
- **"Portrait is broken: the canvas is only half height."** The GL viewport
  is `[0, 0, 780, 1688]` against a `[780, 1688]` drawing buffer and a
  390×844 root. Nothing is mis-sized. The lower half is *rendered* black:
  the narrow-screen pullback (2.2× at this aspect) puts the camera about
  14 m out, over the near-black arena floor, with the court a bright strip
  in the distance.

### Open threads

- **Portrait composition is poor, and the prototype's is too** — rendered at
  390×844 it has the same tiny figure high in a mostly black frame. Faithful,
  but not good. The prototype also stacks its controls *below* the scene on
  narrow screens rather than overlaying them, which is a layout question
  worth deciding rather than inheriting. Belongs with step 3/4, when the real
  overlays exist and `framingOffset`'s reserved heights stop being guesses.
- **Performance is still unmeasured.** Geometry is trivial — 128 meshes,
  almost all boxes. The cost is 12 lights compiled into every standard
  material plus one 2048² shadow map, which is fragment work that scales
  with pixels, exactly what hurts a phone at dpr 3. Needs a real device or a
  GPU timer query; the headless harness cannot answer it.
- `framingOffset`'s reserved heights are placeholders until there are
  overlays to reserve space for. They are deliberately constants, not
  measurements — see the note in `serve-cameras.js`.

## Step 3 — figure, racket and ball

Built: `serve-frame.js` (sampling and the racket's own axes), `Mannequin.js`,
`Racket.js`, `Ball.js`, `ServeFigure.js` (the one component that advances the
clock and poses everything), `useServeClock.js`, plus a transport in
`ServeViewer` for free scrubbing.

### Port fidelity, measured

The figure keys cleanly off hue — warm wood against a cold blue arena — so
its bounding box in a screenshot is a real measurement. Prototype and port at
frame 196, same camera, same viewport:

| | prototype | port |
|---|---|---|
| width | 254 px | 255 px |
| height | 544 px | 546 px |
| centroid x | 677 | 678 |

Within 0.4% on both dimensions. Key moments land where the data says:
contact at `+0.00 s`, frame 267 (266.5 rounded); `events.toss` at `−0.97 s`;
`readyF` at `+0.80 s`; playback runs to frame 433 and stops.

### Two bugs, found two different ways

**Double sRGB conversion.** The prototype calls `convertSRGBToLinear()` on
every colour, because three r147 has `ColorManagement` off and stores hex
values untouched. three 0.186 converts on assignment, so copying that call
converts *twice*: the figure came out a deep orange-brown against the
prototype's pale tan. Caught by measuring, not by looking — the warm-pixel
count was 2336 against the prototype's 9013, a quarter of it, which is not
something an eye reports as "a bit saturated". After removing the call:
9611 against 9013.

The arena was never affected, because it passes colour strings straight to
`MeshStandardMaterial` and gets one conversion. That is why step 2's court
measured within 4% while the figure was far out.

**Scratch-vector aliasing in the torso.** The first draft reused one scratch
vector for both the pelvis centre and the chest long axis, which silently
destroyed the first. Found while writing, not while testing, and it would
have shipped as a figure subtly bent at the waist with nothing in the maths
looking wrong. The torso now has named vectors and a comment saying why.

### A mismatch that was a missing feature

Before the ball existed, the port's bounding box was 37% narrower than the
prototype's and the obvious reading was "the pose is wrong". It was not: the
prototype's box included its contact marker and toss ball, both warm enough
to pass the hue key, and neither built yet. Adding them closed the gap to
0.4%. Worth remembering — when a comparison says the port is wrong, check
first whether the reference simply has more in it.

### Still open

- The figure sits about 79 px lower in frame than the prototype's. That is
  not fidelity: reserved space is now measured off the real bottom overlay
  (**on resize only**, never when its contents change — see
  `useReservedSpace`), and this transport is roughly 120 px against the
  prototype's 190 px, so it reserves less and centres lower. Re-tunes itself
  when the stepper replaces the transport in step 4.
- The sweep ribbon re-samples the racket 37 times per frame. Fine as it is,
  but it is the one per-frame cost here worth watching if the light rig ends
  up needing budget.
- No ghost serve yet (step 5), and no raw-marker view — `markers` is still
  the separate lazy file it was split into in step 2.

## Step 4 — the stepper

Built: `steps.js` (the ten moments as data, with provenance), `StepCard.js`,
and the wiring in `ServeViewer` for per-step cameras, readouts and keyboard
navigation.

### The three discrepancies, settled

**Two things called "the toss".** Resolved by reading the prototype's own
moment list rather than guessing: it uses `ball.release` (frame 52, −1.19 s)
and does not show `events.toss` (frame 92, −0.97 s) at all. The second is an
internal marker — the frame where the tossing hand peaks — that the pipeline
computes only so it can search forward for the racket drop. It is not a
moment anyone watches. Writing it up as "the toss" would have put the timing
four tenths of a second out. There is a comment at the top of `steps.js` so
nobody re-derives this.

**Knee angle.** The data and the readouts are included angles, so the copy
uses that and says so in the same sentence: "about 109°, where 180° would be
a straight leg". The handoff's "68° of bend" is the same measurement from the
other end; carrying both conventions on one page would be the actual error.

**Contact height.** 2.59 m for serve 57. The handoff's 2.61 m is the *median
across all 31 clean serves* in the published-research comparison, not this
serve, so the two never disagreed. Finding that out did expose a real bug
though: the first pass divided `data.ground` by 1000 directly, where the
court surface is `(data.ground - 25) / 1000` — the 25 mm is the shoe under
the lowest toe marker. Raw, it puts the court 25 mm high. `frame.ground`
already had this right; the step copy was not using it.

Release height is 1.62 m from the data; the notes say 1.65. The data wins.

### Which step you are on is derived, never stored

`stepIndex` is computed from the clock. Storing it alongside the clock gives
two sources of truth that drift the instant anyone drags the scrubber — the
card claiming one moment while the figure shows another. Deriving it means
scrubbing narrates itself and playing the serve walks the card through the
steps for free.

### Framing, which took three goes

The figure's feet were hidden behind the card. Two separate causes, and the
first fix found the second.

1. **The card's height varied 84 px across steps** (292 to 376). The camera
   frames into the gap above it, and that gap has to be a property of the
   layout, not of the current step's copy. Measuring on every step makes the
   camera lurch; measuring once makes the reservation wrong for eight steps
   out of ten. Pinning the card's height removes the choice. Spread is now
   1 px on desktop.
2. **The figure was taller than the gap** — 544 px of figure in a 485 px
   band. No amount of shifting fixes that, which is what `framingOffset` was
   being asked to do. `cameraPullback` now takes the band into account and
   backs off along the view direction, keeping the figure the same fraction
   of the visible strip it would have been of the whole window.

**A fixed-height text box truncates silently**, which is the hazard of fix 1.
Checked by comparing `scrollHeight` against `clientHeight` for all ten steps
at three viewports: clean at 1440 and 1024, but four steps were losing up to
31 px of copy at 390. The box is taller below `sm` now. This is the sort of
thing that never shows up in a screenshot of step one.

### Still open

- **Mobile.** The overlay takes 61% of an 844 px screen, leaving a 266 px
  band, and the readouts row still swings 46 px as it wraps. The prototype
  sidesteps this by stacking its controls *below* the scene on narrow
  screens instead of overlaying them. Worth deciding deliberately in step 5,
  alongside the small-screen notice.
- The clock used to open at `events.load`, which was right for a free viewer
  and meant the stepper arrived on step three of ten. Now starts at zero.
- Shoulder tilt is in the handoff's readout list but is not a series in the
  data; it would have to be computed from the shoulder joint centres. Left
  out rather than approximated.

## Round 5 — minimal overlay, court mark, real surfaces

Direction from John: shrink the playback overlay so more of the scene shows,
drop the Next dev badge, truncate long captions, paint a JTD / Serve Lab
lockup on the run-off behind the baseline, and make the court, racket and
figure look less perfect.

### The overlay

`StepCard` now carries the transport too and sits in one strip: **110 px,
down from 388 px**, which takes the band the camera frames into from 452 px
to 730 px at 1440x900.

Captions are `line-clamp-2` with the full sentence on the element's `title`,
so nothing is actually lost. The clamp needed a `min-h` beside it: it caps a
long caption at two lines but lets a short one sit on one, and the strip then
changed height between steps by exactly one line — enough to shift the whole
scene every time you stepped, because the camera frames against this strip.
Measured spread across all ten steps is now **0 px** at 1440x900, 1024x768
and 390x844.

The dev badge is off via `devIndicators: false` in `next.config.js`. It only
ever appeared in development, but these pages are judged on what the scene
looks like and a floating button in the corner is the one thing on screen
that is not part of it.

### The court mark

Drawn into a canvas and laid on the run-off, not modelled: paint is a flat
mark that takes the court's own light. The logo geometry is imported from the
same three paths `components/Header.js` draws, so the two cannot drift.

**The font is `BBH Bartle`, not "BHH Bartle"** — the letters are transposed,
and nothing by that name exists. Worth knowing: `next/font` cannot supply it
either. Its catalogue has 1,898 families and this is not one of them; it has
the unrelated `BBH Sans Bartle` instead, which would have been a quiet
substitution of a different typeface. It loads from a stylesheet link in the
page's `<Head>`.

A webfont used only inside a canvas needs `document.fonts.load()` by name
before it will arrive. `fonts.ready` alone is not enough, because a face that
nothing in the DOM has rendered is never requested, and the first draw lands
in the fallback at a different width.

The mark is half-turned (`rotation.set(-PI/2, 0, PI)`): the cameras that show
it look back toward the baseline, so without that it is upside down in every
one of them.

### Surfaces

`serve-textures.js` generates value-noise fbm on a canvas and derives normal,
roughness and albedo maps from it — court grit with slow fade blotches, wood
grain running the length of each limb, a brushed scuff on the racket frame.
Canvas rather than image files because this is noise, and shipping a
megabyte of PNG to deliver noise is worse than spending a few milliseconds
making it.

The court quads had no `uv` attribute at all, so none of it would have
applied. They now carry UVs **in court metres** rather than normalised, so
one tile is one real-world square on both the 11 m court and the 44 m
surround. Normalised UVs would have stretched the grain to twice the scale
on one of them, which is the exact tell a grain texture exists to avoid.

### Two process notes

- **An edit silently did nothing.** A `python` patch used `str.replace()`
  without asserting the old text was present, the text had changed on disk,
  and the "fix" was a no-op that I then went looking for a rendering
  explanation for. Every patch in this repo should assert before replacing.
- **`next build > /dev/null` hides a failed build**, and `next start` then
  serves the previous one. That is indistinguishable from a change having no
  effect. Build output stays visible.

`serve-cameras.js`'s `above` pose was edited outside this session — raised to
9.5 m, offset, and aimed back at the mark — and is left as found.

## Round 6 — lockup proportions, and what a court surface actually looks like

JTD up 25% again and the words down 25%, which is roughly a 3:2 swing in
their relative size and reads much more like a painted house mark.

**The "S" was being clipped.** `fillText` with `textAlign: 'center'` does not
wrap or warn: a string wider than the canvas simply loses its outer letters'
edges, and nothing else about the drawing looks wrong, so it reads as a
badly drawn glyph rather than as overflow. BBH Bartle is a wide display face
and "SERVE" overran at the size that looked right on paper. There is a
`fitFont` helper now that measures and steps the size down until it fits,
so the layout cannot depend on a particular font's metrics.

### Ball impacts

The wear on the lockup is now directional, which it should always have been:
a ball arriving on a serve is travelling down the court and skidding as it
bites, so each mark is an ellipse stretched along that axis with a few
degrees of scatter, not a dot. The canvas `v` axis runs down the court, so
that is the long one.

Clustered, not scattered. Impacts land where serves land, so a few busy
patches and a lot of untouched paint. An even sprinkle reads as noise laid
over the artwork rather than as something that happened to it.

### Court surface: three scales, and why two of them were wrong

This took two overcorrections to land.

1. **Carpet.** Grit and fade shared one 2 m tile with 48 noise cells and a
   normal strength to match, making the aggregate four centimetres across.
   That is not grit, it is pile.
2. **Glass.** Dropping the aggregate to a realistic few millimetres made the
   court perfectly smooth — correctly, as it turns out. At the distances
   these cameras work at, millimetre detail is sub-pixel and contributes
   nothing. Physically right, and it looked like a render.

What was missing in both is the scale in between. A real hard court is
broken up at **half a metre**, not at millimetres or at metres: squeegee
marks, overlaps where the paint was laid in passes, patches that have been
walked on more. It belongs on roughness, because what varies is how the
surface returns light, not its colour.

So: grit on the normal map at three tiles a metre, sheen on roughness at one
tile per two metres, fade on albedo at one per fourteen. Three maps, three
repeats, one set of UVs — which is why those UVs are in court metres rather
than normalised.

## Round 7 — palette, softer key, atmosphere, depth of field

### One hue family

Everything was between 211 and 215 degrees. That is blue, and far enough
from cyan that the dark shades read as grey rather than as a colour — the
surround in particular sat at 29% value, close enough to black on a dark
scene that its hue stopped registering. The palette is now one family at
196 degrees, with the two court shades at 0.73 and 0.46 value and the
walls, caps and board band following them down.

### Softer light on the figure

Most of this is ambient, not the key. Eleven overhead spots light the court
well and the player badly: every one of them is above and none is beside,
so the figure was lit from the top with its sides dropping into black. The
hemisphere fill went from 0.05 to 0.14, the key's penumbra from 0.65 to
0.92 with its shadow radius from 3 to 9, and there is one soft fill from
the open side at a fifth of the key that casts nothing. The wood is rougher
too (0.55 to 0.68), which broadens the highlight down each limb.

### Depth of field

`ServeDOF.js`: one pass, scene into a render target with a depth texture,
composited through a twelve-tap ring blur. **Focus is computed, not
searched for.** The usual approach raycasts through the centre of the
screen, which breaks the moment the subject is off-centre or something
crosses in front; here the server's world position is known every frame, so
the focal distance is just the distance to it and they cannot drift out of
focus however the camera moves. Focus tracks the neck joint rather than the
pelvis or the head, because it is the part of the figure that moves least
through a serve.

### The court lines turned into dashes, twice

Worth writing down, because the first explanation was wrong and the obvious
fix was worse than the problem.

The lines are a couple of pixels wide and nearly horizontal in most of
these views. The moment the scene started rendering through a target they
broke into regular dashes — which reads as a dashed line somebody drew, not
as an artefact, which is exactly why it was worth chasing.

1. **First guess: z-fighting.** Plausible — the painted lines sit 2 mm
   above the court and a depth texture changes precision. Raised the camera
   near plane from 0.05 to 0.15 (a 5200:1 near/far ratio is punishing) and
   the paint offsets from 2 mm to 6 mm. Both are real improvements and both
   are worth keeping. Neither fixed it.
2. **Actual cause: no MSAA.** The canvas gets multisampling for free; an
   offscreen target does not.
3. **`samples: 4` on the target made it far worse** — with a `DepthTexture`
   attached the depth never resolves, the blur reads garbage out of it, and
   the scene filled with black streaks radiating across the court. Backed
   out.
4. **Supersampling instead**, at 2x, box-filtered down in the composite.
   Mostly fixed, but a 2x2 box is the *exact* downsample and still drops a
   line thinner than a target texel out of alternate destination pixels. A
   tent reaching a full texel out, centre weighted double, covers the gap.

Cost: 4x the fragments, and only taken when `dpr < 1.5`. At dpr 2 the
canvas is dense enough that the aliasing is not worth paying for.

## Round 8 — racket, sweep, ball path, and dropping the translucency

### The figure stays solid past the recording

Removed on John's call. The measured/extrapolated distinction it carried is
not lost: the step is labelled `ESTIMATED` and its copy says so in words.
The copy did have to change — it promised a translucency that no longer
happens, which would have been worse than never having claimed it.

### The sweep is the head's outline now

It was a flat ribbon between the racket's tip and its throat, which drew a
glowing line up the middle of the strings and trailed *that* behind the
swing. Wrong shape: what a racket leaves in a long exposure is the edge of
its head, a tube the width of the face, not a stripe through the centre.
Each of the last 26 positions now contributes the rim ellipse and
consecutive rings are stitched into a surface.

Its alpha had to come down a long way (0.5 to 0.17) at the same time. The
new shape covers far more screen area than the ribbon did — a tube the
width of the head, seen side-on, with both faces drawn — and at the old
value it painted the player green wherever the swing crossed in front of
them.

### A white J on the strings

Each string is drawn as many short segments rather than one line, because a
string spans the whole face and a letter painted on it has to resolve
somewhere along its length. Each segment takes its colour from whether its
own midpoint falls inside the glyph, which gives a hard edge; colouring the
endpoints would gradient every string across the boundary.

The test is `isPointInPath` against the **real** logo outline, exported from
`serve-mark.js`, so the J on the strings is the J from the mark. Its bounding
box is found by sampling rather than read off the path data, since `Path2D`
has no bbox and hardcoded numbers rot silently when a logo is redrawn.

It rendered correctly first time and was still almost invisible: white
strings against full-strength neon ones are too close in value. The
unpainted strings are dimmed to 38% to give the white something to be white
against.

### Two verification notes

- **An ASCII dump beat a screenshot.** With the J not visibly landing, the
  quickest way to find out whether the mapping or the rendering was at fault
  was to run the same `isPointInPath` test over a grid and print the face as
  text. It showed the J perfectly, which ruled out the geometry in one step
  and pointed straight at contrast.
- **A colour-counting check said the ball path was shrinking as the ball
  flew.** It was not; the path is a one-pixel dashed line, blurred by the
  depth of field and smaller at distance, so the detector lost it. The
  screenshot showed the line running from the racket to the ball and no
  further, which is exactly right. Second time this session a pixel
  heuristic has been confidently wrong where the image was obvious.

## Round 9 — the mannequin, properly

John sent a photograph of a real wooden artist's model and said the figure
was reminiscent of one but did not look right.

**The insight is that a mannequin is turned, not sculpted.** Every piece of
the real object except the hands and feet comes off a lathe, which is why
none of them is a sphere and all of them are surfaces of revolution. The
torso is the clearest case: it is not an egg but a tapered wedge, broad
across the shoulders and narrowing to a waist, with a separate flared
pelvis below it. Modelling those two as ellipsoids was the single thing
most responsible for the figure reading as a toy.

So there are profiles now — `[height, radius]` control points run through a
Catmull-Rom and lathed — for the chest, pelvis, head and the hand/foot
paddles, plus a `bulge` parameter on the limbs so a shank carries its calf
high while an upper arm is fullest near the middle. Joint balls went
slightly *under* the limb ends that cup them; a sphere larger than the limb
reads as a bead threaded on a stick.

### Torso width took two goes

John's note was that the reference's own hips and shoulders look narrow, so
these should go wider. True, and the capture gives joint *centres*, which
sit inside the body. But the first pass added 10 cm to each half-width and
produced a pelvis wider and deeper than the figure's own chest, which no
mannequin has. On the reference the hips are clearly narrower than the
shoulders and the whole block is shallow. Settled at +5.5 cm on the hips
and 0.98x the shoulder span, with both depths cut to 8.8 cm.

The wood grain also had to come down hard (normal strength 9 to 3.5, albedo
contrast 86 to 38). It was tuned at playing distance and looked like coarse
speckle the moment anything was seen up close.

### Three behaviour changes

- **The ball obeys perspective.** It had been scaled up with camera distance
  to stay visible in the wide framings, which costs the one thing a flight
  needs to read: a ball that does not shrink as it goes away does not look
  like it is going away.
- **The contact marker is off by default.** Useful to be able to turn on,
  but it is a red line up the middle of the court through nine of the ten
  steps.
- **The camera no longer moves during playback.** It followed `step.camera`,
  and since the step is derived from the clock, playing the serve cut the
  camera on every boundary — ten cuts in twenty seconds, each reasonable
  alone and unwatchable in sequence. The view is state now: stepping sets
  it, playback never touches it.

### Pixel heuristics, a third time

Two of the four checks in this round "failed" and both were the detector.
Optic yellow is the ball *and* the sweep *and* the dashed path, so counting
it measured the path; and the "red" filter now catches a large neon-orange
racket. The code settles both questions outright — there is no scaling call
left on the ball, and `contact.visible` is false at construction with
nothing calling the setter.

The pattern across this session is consistent enough to state as a rule:
**a colour threshold is only trustworthy when the colour belongs to exactly
one thing in the scene, and this scene keeps acquiring new things.** Read
the image, or read the code.

## Round 10 — the lighting rig comes off the ceiling

### The hue question, measured

John asked whether the two court shades were really the same hue, because
the darker one looked green-shifted. Measured on screen: interior 196.1,
surround 195.2. **A 0.9 degree gap — they were the same.** What he was
seeing is simultaneous contrast: a less bright cyan beside a brighter one
reads green.

So the fix is a perceptual correction, not a colour correction. The
surround's source hue carries two extra degrees of blue, which measurement
showed amplifies to about three on screen, and that is enough to cancel the
illusion. The first attempt used five degrees and swung the rendered gap to
+7.1, which is visibly bluer; dialled back to a +3.7 bias. Setting the two
numbers equal is the thing that looks wrong.

### The rig

It was ten lamps 24 m straight up, which is roughly honest for an arena and
terrible for the subject. Light arriving from almost directly overhead puts
a figure's head, shoulders and the tops of its limbs in light and the rest
in shadow, with a hard terminator down every round surface, and nothing
beside it to fill in. The complaint about harsh shadows was really a
complaint about where the light was coming from.

Eight lamps now sit around the perimeter at 9.5 m and 14 m out, so the light
arrives at about 35 degrees instead of 80, and they aim at chest height on
the centre line rather than at the floor. Two of them sit behind the
baselines, which is what fills the front and back of a figure that side
lamps alone leave dark.

### Two effects that were on and invisible

- **Depth of field.** 2.2 m of sharp either side, a 14 m falloff and a 3 px
  ceiling means nothing reaches half blur until it is 9 m from the subject,
  and the far baseline is about the only thing in the scene that far away.
  Now 1.3 m, 5.5 m and 7 px, and the net is visibly soft.
- **Atmosphere.** Exponential fog toward the *background* colour is
  invisible on a dark scene: it fades things to black, which distance and
  falloff were doing anyway. Fog now has its own colour, lighter than the
  background, so depth reads as air in the room rather than as absence.

The scene's black point is tinted to the court's hue as well. Barely a
colour at 6% value, but every shadow and falloff on the page bottoms out
there, and a neutral one quietly greys the whole palette.

### The arm tints are gone

A real mannequin is one piece of wood throughout, and the warm/cool tint was
the last thing making this one look like a diagram of a mannequin rather
than one. Which arm is which is legible from the motion.

Removing it broke the page: the constant went but only one of the two
materials that referenced it, and `TINT is not defined` took the whole scene
down. It was caught because the focus measurement came back `0.00` on both
patches — a number that made no sense for any scene, blurred or sharp. The
measurement was useless for its own purpose and found the bug anyway.

## Round 11 — six lamps, square corners, and the numbers behind a narrative

### Lighting, third attempt, and the lever that mattered

Ten lamps overhead was wrong. Eight around the perimeter was wrong in a
subtler way: every station sat *down court* of the baseline, so the server,
who stands behind it, was lit from one side and read as backlit.

Six lamps now ring the whole court, so the subject is inside the ring and
takes light from every azimuth including from behind the baseline. One of
the six casts a shadow; six shadow maps would cost six times as much to
produce six overlapping penumbras that cancel into mush.

**Intensity turned out to be the wrong lever.** At every level tried the
figure settled at about 40% of the court's brightness — the court is 260
square metres of pale acrylic facing the lamps, the figure is a small
vertical object that shadows itself. Changing the *angle* fixed what
changing the level could not: dropping the lamps from 32 degrees of
elevation to 18 roughly doubles the ratio, because a standing figure now
faces them almost squarely while the court is raked. Figure brightness
across the three camera angles is 82 / 92 / 130 against a court mean of
149 to 184.

A measurement note: the first metric for this was "percentage of court
pixels above 243", and it swung from 37% to 92% on a 2% change in light.
A threshold is a cliff when most of the subject sits in a narrow band; mean
and p95 move smoothly and can be tuned against.

### Court line corners

Every line is a quad centred on its centreline, so two meeting at a corner
each stopped half a width short and left a notch cut out of the outside of
the corner. Lines now run half their own width past both ends. On a real
court the paint is laid in overlapping passes and the corner is square; the
overlap is hidden under the other line.

### The numbers for the narrative

Pulled before writing any of it, because most of what is said about serves
is received rather than measured. From serve 57:

| | |
|---|---|
| Racket head speed, start to −0.20 s | flat at about 3 m/s |
| Speed gained after the racket drop | 20.7 of 27.9 m/s — **74% in the last 0.17 s** |
| Elbow through the drop | 159° → **50°** at −0.20 s → 170° at contact |
| Deepest knee bend | 109° at −0.40 s, extended to 173° by contact |
| Hip-shoulder separation | near zero all through loading, then **32° in the final 0.05 s** |
| Face angle, one frame (5.6 ms) before contact | **12.7° open** |
| Face angle at contact | 5.5° open, passing through vertical **3.5 ms later** |
| Face rotation rate at contact | **1,296 °/s** |

Two of these change what the page should say. The racket drop is an *elbow
fold* — 159° to 50° and back to 170° — not a pulling back of the arm, which
is what John suspected. And hip-shoulder separation is not held through the
trophy position and then unwound: it is created late and violently, almost
all of it inside the last 50 milliseconds.

## Round 12 — the page becomes an argument

The ten-moments model is gone. It was a timeline, not an argument: it
walked the serve in order and said what was happening at each point, which
is a caption track. The page is now eight chapters, each making one claim,
staging the part of the serve that shows it, and carrying the measurement
that proves it.

**The through-line: a serve is a chain, not a pose.** Everything coached as
a position — the trophy, the drop, the extension — is a consequence of
timing, and the whole thing resolves into about five milliseconds.

1. The whole thing, once, with the speed trace building underneath
2. Where the speed actually comes from — flat for a second, 74% in 0.17 s
3. The drop is an elbow fold — 159° to 50° to 170°, head path never stops
4. The chain fires late — knees at −0.40 s, separation only in the last 50 ms
5. Contact is a five-millisecond window — the face at −1, 0 and +1 frames
6. Extension is what squares the face — one line from shoulder to tip
7. What that buys — 154 km/h, 18 cm over the net
8. How fine the margin is — serve 39 beside it, both in

### Two claims the data changed

The copy was written *after* pulling the numbers, and two things came out
against the usual telling. The racket drop is an **elbow fold**, not the arm
being pulled back: 159° to 50° and back out to 170°, with the head path
never stopping or doubling back. And hip-shoulder separation is **not** held
through the trophy and then unwound — it sits near zero all through the load
and is created almost entirely inside the final fifty milliseconds.

Writing the copy first and checking afterwards would have produced the
received version of both.

### Structure

- `chapters.js` — the narrative as data. Each chapter owns its camera (one
  angle, or a pair it is carried between as it plays), frame range, pace,
  annotations and readouts.
- `ServeAnnotations.js` — every annotation built once and hidden; a chapter
  names what it wants. Building on demand would allocate geometry during a
  camera move, which is the one moment a dropped frame shows.
- `SpeedChart.js` — the trace, as SVG. The shape is the argument.
- `ChapterCard.js` — intro panel, then Previous / Play / Replay / Next.
- `useServeClock` is scoped to a range now: a chapter starts at its first
  frame, runs to its last at its own pace, and stops. Stopping rather than
  looping is deliberate — a loop gives no moment to read the claim against
  what just happened.

**The camera picker is gone.** Which angle shows a claim best is a decision
the chapter makes. Handing it to someone who has not yet been told what to
look for was the old model's mistake, and it also fought the chapter that
had already chosen.

Verified by walking all eight in a browser: copy renders with live numbers,
annotations appear per chapter (the three face ghosts at −1/0/+1 frames are
the clearest case), Next disables at the end, Replay works, no console
errors.

## Round 13 — materials, units, and the reading modal

### Units

The page is imperial now: mph, feet and inches. **The conversions happen
only in `chapters.js`, at the last possible moment.** Everything upstream —
the capture, the frame, the samplers, the annotations — stays in the metres
it was measured in, so no module ever carries a number in a unit it was not
recorded in. The readouts take a `scale` factor for the same reason.

### Materials

- **Racket**: the hoop is quarters, alternating, instead of two panels and
  four ferrules, which at racket scale read as a scatter of small black and
  yellow details rather than as a paint scheme. Matte now, and the emissive
  is gone — a frame cannot be both matte and a light source. The dark is
  `#1b1d20` rather than black: pure black carries no shading, so against a
  dark court those sections vanished into the shadows and the racket read
  as a broken hoop.
- **Court**: roughness up to 0.95, and the sheen layer moved from one tile
  per two metres to one per nine. At two metres its four noise cells landed
  on a half-metre grid that tiled twice across the court, which is why it
  looked like big square tiles — that is how a basketball floor is laid and
  emphatically not how acrylic is poured. Ball marks are drawn into the
  albedo as clustered ellipses stretched down the court.
- **Paint**: lines dropped from `#eef2f5` to `#b9c4c9` and the house mark
  from white to `#c8cfd2`. At full white both read as a material laid into
  the court rather than paint on top of it.

### Atmosphere

Fog density up by half, haze cones up by half again, depth of field roughly
doubled, and film grain added in the composite. The grain is scaled down in
the highlights, because real sensors are noisiest in the shadows and uniform
grain over a bright court looks like dirt. It also happens to break up the
banding a dark scene with long gradients is prone to.

### The reading modal

The strip clamps its copy to keep its height constant, which the camera
frames against, and the full text lived on a `title` attribute. That is
reachable with a mouse and nowhere else: not on a phone, not from a
keyboard, not to a screen reader. There is a modal now, opened from the
copy itself, closing on Escape or on the backdrop.

### Smaller things

- Chapter five opens on the shoulder and closes beside the strings, aimed
  at the **measured contact point** rather than at a spot above the
  player's feet, which had put the three face ghosts in the corner of the
  frame. `courtFrame` exposes that point now, since it is a property of the
  capture's geometry rather than of any one camera.
- The ghost serve is brighter, tinted toward the court, and carries its own
  racket. Without one the comparison was between a player holding a racket
  and a player holding nothing, in a chapter about where the racket is.
- The torso is one long chest and one large ball to the pelvis. The
  previous version had a chest, an abdomen cylinder and a small ball —
  three joints where the object has one.
- The play button no longer relabels itself "Replay" at the end of a
  chapter, which put the word on screen twice next to the button that only
  ever means that.

A process note: two patches in this round asserted and stopped before
writing, which is the behaviour I want — but one of them had already
written a *different* file first, leaving the readouts in mph while the
copy was still metric. Multi-file patches should validate every target
before writing any of them.

## Round 14 — one palette, a flexible chart, and a title card

### Two hues, opposite each other

`palette.js`. The court is cyan and the racket is orange, 196 and 16
degrees, which is very nearly a complementary pair. Everything added to the
scene now draws from those two rather than introducing a third: what the
racket is doing is orange, what the body is doing is cyan, and where a pair
has to be told apart — the face a frame either side of contact — they take
one of each, the widest separation the palette has.

The ball is the one exception and is written down as such. A tennis ball is
optic yellow and recolouring it to fit a scheme would be the most noticeable
wrong note on the page. The control strip also stays out of it: two
saturated complements plus a tinted panel is one thing too many.

Court colours went punchier at the same time — saturation from 0.70 to 0.84
on both shades.

### The chart stretched its own type

It was an SVG with a `viewBox` and `width: 100%`, which is the usual way to
make one flexible and scales everything inside it, type included. The labels
were a different width at every breakpoint and visibly condensed on a narrow
card. It measures its container with a `ResizeObserver` now and emits
coordinates in real pixels, so the geometry flexes and the 9 px labels stay
9 px. Verified at two widths: `viewBox` tracks the measured width exactly and
the label size does not move.

### The ending

Chapters seven and eight swapped, so the page closes on the overhead angle
rather than on the ghost comparison. That angle now centres on the painted
mark instead of on the player — the player stands half a metre right of the
centre line, which is why the lockup had been sitting off to one side — and
focus is pulled from the server onto the mark as the camera rises, eased on
the chapter's own progress so it lands exactly as the camera settles. The
result is a title card that is a real photograph of the scene rather than a
graphic laid over it.

### Overlay

Transport moved to the top of the column, above the title. Copy is now the
same white as the headline rather than a dimmed grey: at 14 px it is the
content, and nothing else in the strip is competing for attention. The
inset from the screen edge doubled.

Disabled text buttons are `text-white/45` rather than `opacity-25`. A
quarter-opacity white on this panel measures about 2.4:1 against it, which
is below any reasonable floor; 45% is about 4.6:1 and still reads as off.

## Round 15 — overlay polish, iOS, and an orange that was not orange

### The same hex, two different colours

John said the in-scene elements had gone red while the racket still looked
orange. They were set from the racket's own hex.

Measured on screen: the racket frame renders at **hue 27.5**, the annotation
lines at **17.8**. Same source colour, ten degrees apart in the output. The
racket is a lit `MeshStandardMaterial`, so the tone curve sees it after the
lamps have had their way with it; the lines are `MeshBasicMaterial` and go
into ACES at full saturation with nothing to soften them, and the curve
rolls a saturated orange hard toward red.

So the palette has two oranges now, and the comment says why. The unlit one
is `#ffbe4d` — fourteen degrees up the spectrum and desaturated — which
lands at **28.7** against the racket's 27.5. Picking the number took two
measured passes rather than one guess; the first shift was only half far
enough.

This is worth remembering generally: in a tonemapped scene, *matching a
colour means matching what it renders as*, and two materials lit differently
need different inputs to get there.

### iOS

The overlay was running off the bottom, the same way Courtside's did. Not
re-solved: `components/Layout.js` already publishes `--vv-clip`, the
*measured* overshoot between the page box and the visible viewport, after
three attempts at predicting the right height failed there. The strip adds
it to its bottom padding alongside `env(safe-area-inset-bottom)`.

### Overlay

Headings up a step to 17 px, modal headings to 20. Corner radius doubled.
More room between the transport row and the title under it. Previous and
Next are outlined rather than fully transparent, and their disabled state is
`ring-white/12` with `text-white/45` so the outline stays visible without
passing for enabled.

Below `sm` the Previous / Next / Start over labels go `sr-only` and the
arrows carry the meaning, which keeps the controls on one row: measured at
390 px the row ends at 278 px inside a 390 px strip, and the buttons share a
single row at both sizes.

**The paragraph clamp was already right** — three lines below `sm`, two
above — and measuring it said so: `webkitLineClamp` reports 3 on a 390 px
viewport and 2 on a 1440 px one. Nothing to change.

### Grain, and a metric that stopped working

Grain is stronger (0.118) and coarser: the fineness multiplier went from
1024 across the frame to 560, since at 1024 each speck sat inside a pixel
and a half and read as digital hash rather than as film.

Which immediately broke the sharpness check used for depth of field. Edge
detail came back at 9.3 on the mark against 10.5 on the player — no
separation — because grain adds high-frequency detail everywhere and swamps
the thing being measured. The screenshot shows the separation plainly. A
measurement is only valid while the thing it measures is the loudest signal
in the frame, and the grain had just become louder.

The intro now pulls focus to the painted mark as well as the closing
chapter. Its range has zero length, so the eased progress term is forced to
1 rather than 0 — a still frame has no progress to ease along, and the mark
is the subject from the first frame.

## Round 16 — the sweep becomes a measurement

### Speed, drawn on the swing

The sweep was one colour with an alpha fade. It is now a gradient from the
scene's cyan at the slow end to its orange at the fast end, keyed to the
racket head's speed at each frame of the trail.

This is the best thing in the page, and it was free. The trail already
showed *where* the head went; colouring it by speed makes it show the
thing the whole page is about, and because 74% of the speed arrives in the
last 0.17 seconds the gradient sits overwhelmingly at the cyan end with a
short hot tip. That shape *is* chapter two's argument, drawn on the swing
itself rather than described beside it.

The ratio is squared before the lerp, so the hot end is reached only by
genuinely fast frames rather than by everything past the midpoint.

### The three contact rings

Orange, white, orange. They were orange / white / cyan, which implied a
distinction between the frame before contact and the frame after that does
not exist — both are the same racket a frame away. What separates them is
the white one being the measured instant.

### Orange, a third time

Settled at `#ffac45`, between the version that still read red on screen and
the version that read correctly but cool. Hue is what the tone curve
distorts, and a little of that distortion is exactly what makes a colour
look hot rather than merely orange.

### Focus on the overhead

Focus travels only halfway to the painted mark rather than all the way.
Pulling it fully on put the mark, the court under it and most of the lines
inside the sharp zone at once, which is a lot of frame for a shot whose job
is to settle. Landing the plane between the player and the mark leaves
neither fully crisp and the rest of the court well outside it.

### A measurement that measured the wrong thing, again

Checking that no cyan remained on the contact rings, a saturated-cyan pixel
count came back at 101,726. The court is cyan. The filter could not
distinguish three thin rings from the surface behind them, and the answer
was never going to mean anything. Looked at the screenshot instead, which
settled it in a second.

That is four times this session. The rule, written down for good: **a colour
threshold only works when the colour belongs to exactly one thing in the
frame.** In this scene that is now almost never true.

## Round 17 — the serve was a foot fault, and the launch

### The server was foot faulting

Spotted by John, confirmed by measurement, and it was drawn into every
frame of the page.

The handoff puts the baseline 4 cm in front of the tossing toe at frame 0,
which is as close to "toes behind the line" as a serve gets — and is wrong
for this serve. The front foot slides forward through the load, as it does
in a pinpoint stance.

The first measurement was also wrong: taking the furthest any foot reaches
before contact gives 0.86 m against a line at 0.19 m, a 26-inch fault. But
the player leaves the ground 0.11 s before contact, and **a foot in the air
cannot fault**. Only grounded frames count. Redone with a height condition,
the furthest a grounded foot reaches is 0.41 m — still 9 inches over the
line, so still a fault, but a very different number.

The baseline is now derived from the motion: just ahead of the furthest any
grounded foot reaches before the ball is struck. Verified at zero grounded
samples past the line. The lab recorded no court, so this is a
reconstruction either way; the question is only which one has the player
not breaking a rule while serving.

### The rest

- **The net** has a black hem along the bottom and a white centre strap,
  and is built as a grid so the cord sags as a curve. An attempt at
  unevenness was rolled back: it mostly landed on the tape, which is the
  one part that genuinely is taut, and the net is out of focus whenever it
  is in frame anyway.
- **Dust at contact.** Sixteen motes, a third of a second, aged on the
  *data* clock rather than wall time — at 1/50 speed a puff timed in real
  seconds would be over before the frame it belongs to had arrived.
- **The middle ring** now holds orange to contact, crosses to white over a
  single frame, and stays. It was a symmetric ramp, so it lit as the racket
  *approached* and faded once it passed: the diagram anticipating the
  strike and then forgetting it.
- **Camera containment.** The narrow-screen pull-back put the side view
  14 m from the centre line against a wall at 11 m, which filled the lower
  half of the frame with the back of the wall. `containInArena` slides the
  camera in along its own view direction, so framing loosens instead of the
  shot breaking.
- **`line-clamp` was fighting `block`.** Both set `display`, and which won
  depended on sheet order — which is how a clamp set to three lines was
  rendering four and five on a phone.
- Grain quieter, and re-seeded at 24 Hz rather than per frame. A fresh seed
  at 60 fps makes every speck independent three times inside one visual
  impression, which is flicker rather than grain.

### Launch

Thumbnail and OG image rendered from the page itself, matching Courtside's
dimensions. Listed on `/experiments` below Courtside; **not** on the
homepage, which keeps the one that has been there. In the sitemap, with
title, description, og:title, og:image, theme-color and an `sr-only` h1.

Two things that only showed up at launch:

- `theme-color` was a hardcoded `#05080b` copied from the arena, and had
  drifted when the scene's black point was tinted. Fixing it by importing
  from `ServeArena` would have pulled three.js into the page bundle and
  undone the dynamic import, so `SCENE_BG` and `FOG_COLOR` moved to
  `palette.js`, which imports nothing.
- The listing copy was written for people who already care about serve
  biomechanics. Rewritten: the point is that this is a fun thing to look
  at, not that anybody discovered something.

### And the recurring one

Shooting the thumbnail produced a black image with one line of text —
a client-side exception, because the dust puff called `track()` in a module
whose helper is named `trackIt`. The build passed. Cropped down it would
have made an entirely plausible dark thumbnail. The capture script now
refuses to shoot art off a page that has no canvas or is showing an error.

## Round 18 — the iOS bottom, properly this time

John, on the fourth or fifth round of this: "why do I have to keep asking
you to fix this over and over for both of these experiments". Fair, and the
answer is specific.

**Every previous fix was verified in headless Chrome, which has no browser
chrome and therefore cannot reproduce the bug under any circumstances.** I
was confirming that the CSS I had written existed, not that it worked, and
then reporting it as verified. That is why it survived three rounds on
Courtside and three more here.

### What was actually wrong

On iOS the layout viewport — what `position: fixed` and `100vh` measure
against — keeps the height of the screen with the toolbars *hidden*, while
the visual viewport shrinks when they are shown. Anything pinned to the
bottom of the layout viewport is therefore under the toolbar.

Every previous attempt tried to make the *document* the right height and
anchor to the bottom of that: measure the viewport, publish `--app-height`,
size the page to it, then add a measured `--vv-clip` overshoot to the
overlay's padding. That chain is correct only while every box in it is, and
on iOS one of them is not.

### The fix, and a test that can actually fail

The overlays are `position: fixed` now, lifted off the bottom of the layout
viewport by `window.innerHeight - (visualViewport.height +
visualViewport.offsetTop)`, recomputed on visual-viewport `resize` *and*
`scroll` — on iOS the toolbar retracting fires scroll, not resize. No
ancestor can get it wrong because no ancestor is involved.

The test that matters: force the document box 140 px taller than the
screen, which is the iOS condition, and measure where the overlay lands.

| | overlay bottom | visible bottom | off-screen by |
|---|---|---|---|
| `absolute; bottom: 0` (what it was) | 984 | 844 | **140 px** |
| `fixed` + visual-viewport inset | 844 | 844 | **0** |

Verified that way on Serve Lab and on both Courtside views. It is still a
simulation, but it is one the old approach *fails* and the new one passes,
which is the first discriminating test this bug has had.

### The readout was useless by design

`ViewportReadout` exists purely to diagnose this on a real phone, and it
returned early when `NODE_ENV === 'production'`. The build a phone loads is
a production build. The one tool for the job was absent every time it was
needed. It runs in production now, behind `?vp`, and Serve Lab renders it.

### And I broke Courtside doing it

The patch that applied this to Courtside guarded the import with
`if 'use-visual-viewport-inset' not in source` — and the explanatory
comment it had just inserted contains that exact string. The guard matched
its own comment, the import was never added, and the landing page died with
`useVisualViewportInset is not defined`. The build passed.

Two lessons, both already written elsewhere in this file and both ignored
here: check for the *import*, not for a substring that prose can contain;
and load the page after every build, because a passing build says nothing.
