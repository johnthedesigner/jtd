# Serve Lab: handoff notes

These notes carry everything established while prototyping Serve Lab, a 3D tennis serve viewer built from real motion-capture data. The next step is to re-imagine it as an interactive, step-by-step explanation of the service motion, as a new experimental page on johnthedesigner.com alongside the basketball court experiment.

Read this file first. It explains what the data is, how every derived number was produced, which mistakes were already made and fixed, and the visual decisions to keep.

## What is in this folder

| Path | What it is |
|---|---|
| `SERVE_LAB_NOTES.md` | This file. |
| `reference/serve-lab.html` | The finished prototype (v9) as one standalone page. Open it in a browser. |
| `reference/template.html` | The same page with `__DATA__` in place of the data, for rebuilding. |
| `reference/dataset-overview.png` | Racket speed for all 42 serves, plus one serve drawn from raw markers. |
| `reference/extrapolation-filmstrip.png` | Recorded frames handing off to the extrapolated follow-through and ready position. |
| `data/serve57_viewer.json` | Everything the viewer needs for serve 57, in millimetres (see "Viewer data format"). |
| `data/marker_map.json` | Inferred names for all 75 markers. |
| `pipeline/` | Python scripts that rebuild `serve57_viewer.json` from the raw dataset. Run `run_all.sh`. |

The raw dataset is not included. Download it from the DOI below and unzip both archives into one folder.

```
pip install -r pipeline/requirements.txt
./pipeline/run_all.sh /path/to/raw /path/to/out
python3 pipeline/build.py reference/template.html /path/to/out/serve57_viewer.json serve-lab.html
```

The pipeline was tested from a clean folder and reproduces `serve57_viewer.json` byte for byte.

## The dataset

- **Source:** Durlind, Martinez-Hernandez and Assaf (2025), University of Bath Research Data Archive. https://doi.org/10.15125/BATH-01454
- **Paper:** "Exploratory Proof-of-Concept: Predicting the Outcome of Tennis Serves Using Motion Capture and Deep Learning", Machine Learning and Knowledge Extraction 7(4), 118. https://doi.org/10.3390/make7040118
- **Licence:** CC BY 4.0. Commercial use is allowed. Attribution is required, so keep the credit line on the page.
- **Capture:** 8 Qualisys optical cameras at 180 Hz. Labelled and gap-filled in Qualisys Track Manager, then smoothed with a moving average.
- **Files:** `Spatio-Temporal Serve Data/4D_<n>.mat`, each holding `Serves3D`, an array of 75 markers x 3 coordinates x 301 frames. Units are millimetres with Z up.
- **Labels:** `Data Labels.xlsx` gives each serve's outcome (In, Out, Net) and, for serves that went in, a landing X and Y in metres.
  - My reading of the landing grid: X runs from the centre service line toward the singles sideline, Y runs from the service line toward the net, on a 0.5 m grid. The paper describes the grid but not the axes, so treat this as an interpretation.

### Things the archive page and paper get wrong or leave out

- There are **42 serves**, not the 22 the archive page states.
- It appears to be **one player**, not two. Marker spacing is identical to the millimetre across all 42 serves, which two people wearing their own marker sets would not produce.
- **The markers have no names.** See "Marker map".
- Every serve is a **flat serve from the deuce side** by a right-handed player on an indoor court.
- Each clip is cut to 301 frames: about **1.47 s before contact and about 0.2 s after**. The racket is already moving at frame 0, so the stance and first rock are not in the data. The follow-through is cut short.

### Which serves are usable

- **Excluded, contact missing from the clip:** 86, 95.
- **Excluded, sharp glitches in the racket markers:** 2, 3, 4, 5, 6, 45, 50, 52, 53.
- **31 clean serves remain.** Their outcomes: 12 in, 9 out, 9 net, 1 unlabelled (115).
- **Serve 57** is the main serve in the viewer. It landed in and has the furthest-forward contact of the good serves.
- **Serve 39** is the faded comparison serve. It also landed in, with contact 26 cm further back.
- Serve 61 was used early on before I noticed it went out. Do not use it as a reference.

## Marker map

Full list in `data/marker_map.json`. Summary, using 0-based row indices of `Serves3D`:

- **Racket:** 0 is the throat (base of the head), 1 and 2 are the two sides of the rim at its widest point.
- **Head:** 3 front left, 4 front right, 5 back right, 6 back left.
- **Chest:** 7 top of the breastbone (IJ), 10 base of the neck (C7), 27 lower breastbone (PX). 8 and 9 are the right and left shoulder tips.
- **Pelvis:** 45 and 48 are the front hip bones (ASIS, medium confidence). 49 and 50 are the back of the pelvis (PSIS, medium). 44, 46 and 47 are uncertain.
- **Marker plates (rigid clusters):** upper arms 11-14 (tossing) and 28-31 (hitting); forearms 16-19 and 20-22 (tossing), 37-39 (hitting); thighs 63-65 and 51-54; shanks 68-71 and 56-59.
- **Joints:** elbows 15 (tossing) and 35 (hitting); wrist styloids 23, 24 (tossing) and 40, 41 (hitting); hands 25, 26 and 42, 43; outer knees 67 and 55; hitting ankle 60 (outer) and 61 (inner); toes 74 (tossing) and 62 (hitting).

How the names were found: markers were grouped by which ones stay a fixed distance apart (rigid segments). Single markers that hold still relative to both neighbouring segments sit on a joint axis. The rest were placed in a body frame (forward, left, up) built from the hip joint centres.

## Methods

### Joint centres (the most important step)

Joint centres are solved from the motion, not guessed from markers. This is the SCoRE method: for two neighbouring rigid segments, find the one point that stays fixed in both of their frames across all frames. `pipeline/score.py` fits it across all 9,331 frames of the 31 clean serves.

| Joint | Segments (marker rows) |
|---|---|
| Shoulders | chest (7, 10, 27) vs upper-arm plate |
| Elbows | upper-arm plate vs forearm plate |
| Hitting wrist | forearm plate vs hand plus racket (42, 43, 0, 1, 2) |
| Hips | pelvis (45-50) vs thigh plate |
| Knees | thigh plate vs shank plate |
| Tossing ankle | shank plate vs foot (72, 73, 74) |

Results: the fixed point agrees from both sides within about 6 to 17 mm at most joints (shoulders 17 to 26 mm, because the shoulder blade moves). Bone lengths then vary by only 3 to 7 mm over all frames. With guessed joints they had varied by up to 30 mm, and the elbow at contact read 131°, which was wrong.

Joints taken from landmarks instead:

- Neck = midpoint of IJ (7) and C7 (10).
- Hitting ankle = midpoint of the ankle bones (60, 61).
- Tossing wrist = midpoint of the styloids (23, 24).
- Hands = midpoint of the two hand markers.
- Toes = 62 and 74.

### Chest and pelvis orientation

- **Chest long axis:** neck minus a mid-chest point, where mid-chest = PX + (C7 - IJ) / 2. This estimates the ISB thorax axis without a T8 marker.
  - **Bug to avoid:** do not orient the chest from the IJ-to-C7 line. That line slopes about 50° even when standing straight, and using it made the figure look badly hunched.
- **Chest sideways axis:** tossing shoulder centre minus hitting shoulder centre.
- **Pelvis:** sideways axis from the hip joint centres; forward from the midpoint of the front hip bones minus the midpoint of the back of the pelvis.

### Racket

- Head centre = throat marker + 0.185 m along the racket's long axis (throat toward the midpoint of markers 1 and 2).
- Near-tip point = throat + 0.33 m along the same axis.
- Face normal = cross(width axis, long axis), where the width axis runs from marker 1 to marker 2. The sign is chosen to point the way the racket is swinging.
- Rendered head is an ellipse with half-length 0.185 m and half-width 0.135 m. The handle runs 0.31 m back from the throat.

### Finding contact

The ball was not tracked, so contact is inferred.

- **Use the sudden drop in racket speed.** In the frame where the ball meets the strings the racket loses about a third of its speed. Contact is placed half a frame before the first slow frame, which pins it to within about 3 ms.
- **Do not use peak racket speed.** Peak speed is the frame just before impact. Using it shows the face 10 to 15° too open.
- The face turns about 10° per frame (1/180 s) around contact. Any face angle near contact carries a few degrees of uncertainty.
- Serve 57 contact is at frame 266.5. Serve 39 is also at 266.5.

### Other key moments for serve 57

| Moment | Frame | Seconds from contact | How it is found |
|---|---|---|---|
| Ball released | 52 | -1.19 | Simulated (see below) |
| Deepest knee bend | 196 | -0.39 | Minimum front knee angle between toss and racket drop |
| Racket drop | 236 | -0.17 | Lowest racket head point before contact |
| Feet leave the ground | 246 | -0.11 | Both toes more than 40 mm above their starting height |
| Contact | 266.5 | 0 | Impact slowdown |
| Front foot lands | 290 | +0.13 | Toe back within 40 mm of the court |
| Recording ends | 300 | +0.19 | End of clip |
| Ball lands | 345.8 | +0.44 | Simulated |
| Ready position | 411 | +0.80 | Extrapolated |

### Readouts

- **Racket face:** angle of the face normal above or below horizontal. 0° is square to the court.
- **Elbow and knee:** the angle between the two segments. 180° is straight.
- **Shoulder tilt:** angle of the line between the shoulder centres from horizontal, labelled by which side is higher.
- **Hip-shoulder turn:** difference in horizontal heading between the hip line and the shoulder line.

### Court placement (approximate)

- Baseline: 4 cm in front of the tossing toe at frame 0.
- Centre mark: 0.5 m to the player's left of the starting pelvis. The paper says the players stood 50 cm right of the centre mark.
- Orientation: the court is turned 5.7° so the recorded landing spot lies along the racket's horizontal swing direction at contact. The lab's real court orientation is not in the data.

### Ball simulation

Simulated, not measured. Its job is to look physically right, not to be evidence.

- **Toss:** the ball rides in the tossing hand (4.5 cm above the hand point) until release. The release frame is the one where the hand's measured velocity best matches a free flight that passes through the contact point at the contact time. For serve 57: frame 52, 1.65 m up, hand rising at 5.8 m/s versus the ball's required 6.7 m/s. The toss then peaks near 3.9 m and falls 1.3 m to contact.
- **Ball at contact:** racket head centre plus 3.5 cm along the face normal.
- **Speed off the racket:** an assumed 1.45 times the racket head-centre speed just before impact, giving 42.9 m/s (154 km/h).
- **Flight:** quadratic air drag (Cd 0.55) and 1,500 rpm of topspin. The launch angle is solved so the ball lands on the recorded spot. Result: 4.3° below horizontal, clears the net by 18 cm, lands 0.44 s after contact.
- **Bounce:** vertical rebound 0.75, horizontal speed kept at 0.62.

### Motion after the recording ends (extrapolated)

- Each body part continues with its last measured velocity, and segments keep their measured spin, then ease into an end pose using critically damped springs.
- Chest, pelvis and racket move as rigid bodies. Their rotation blends from the measured spin into the end orientation, so speed is continuous across the handoff (racket speed 10.3, 9.8, 8.4 m/s).
- Limbs are solved with two-bone inverse kinematics so bone lengths never change.
- The swinging back leg is lifted up to 12 cm so it does not drag along the court.
- **Ready position** (built from the player's own segment shapes and limb lengths): facing the net, knees at about 155°, chest leaning 5° forward, racket tilted 62° up with the head near face height (1.52 m), grip at about belt height in front, off hand on the throat, front foot where it landed, back foot about 43 cm to its right.
- The player reaches it 0.80 s after contact. A returner would typically be striking the ball at about that moment.
- The racket wraps past the left side in the follow-through before coming up. That arc is a plausible blend, not recorded motion.

## Checked against published research

Medians across the 31 clean serves. Sources: R = Jacquier-Bret and Gorce 2024, a review of 27 studies (https://www.frontiersin.org/articles/10.3389/fspor.2024.1432030/full). L = a 200 Hz analysis of Li Na's flat first serve, ISBS 2012 (https://ojs.ub.uni-konstanz.de/cpa/article/view/5368).

| Measure | This player | Published | Verdict |
|---|---|---|---|
| Contact height | 2.61 m | 2.5 m (L) | Matches |
| Contact height / body height | about 1.45 | 1.48 (L) | Matches |
| Racket speed near the tip | 39 m/s | 38 m/s (L) | Matches |
| Front knee bend while loading | 68° | 64 ± 10° (R) | Matches |
| Shoulder turned back at racket drop | about 128° | 130 ± 27° (R) | Matches (approximate method) |
| Elbow bend at contact | 15° | 30 ± 16° (R) | Straighter |
| Trunk lean while loading | 13° | 25 ± 7° (R) | More upright |
| Toss peak and drop | 3.9 m, 1.3 m (simulated) | 3.65 m, 1.1 m (L) | Plausible |
| Ball speed | 154 km/h (simulated) | 153 km/h (L) | Plausible |

Caveats: the two differences may come partly from definitions. The review uses the trophy position where this uses the deepest knee bend, and the elbow is measured on the last frame before impact. The Li Na figures describe one elite player. Matches on simulated rows only show the simulation is reasonable.

## Visual design decisions

### Figure: artist's drawing mannequin

- Tapered wooden limbs (lathe shapes) with ball joints; egg-shaped chest, pelvis and head; paddle hands and wedge feet; a small nose so head direction reads.
- Wood `#d4b287`, joint balls `#a98352`. Hitting arm tinted 50% toward `#f07a42`, tossing arm 50% toward `#5aa3c7`.
- Limb radii (top to bottom, metres): upper arm 0.050 to 0.037; forearm 0.042 to 0.027, flattened across the wrist; thigh 0.078 to 0.050; shank 0.056 to 0.034.
- Forearm twist comes from the wrist styloid markers, so pronation shows. After the recording ends it eases toward the elbow-plane normal.
- After the recording ends the figure turns 50% translucent so measured and estimated motion are never confused.

### Arena

- Inner court `#3f7ab8`; surround a deeper shade of the same blue `#142c4a`; lines `#eef2f5`.
- Run-off about 8.5 m behind each baseline and 5.5 m beside each sideline, approximating Arthur Ashe Stadium. I could not find official figures. The ITF minimum for international play is 6.4 m and 3.66 m.
- Walls about 1.0 m along the sides and 1.2 m behind the baselines, `#0c1a2c`, with a dim emissive board band and a lighter cap.
  - **Bug to avoid:** the band must sit in front of the wall face, not flush with it, or the two flicker against each other.
- Stands: 22 rows, 0.85 m deep and 0.42 m rise per row, starting 1.5 m high behind a 1.6 m aisle, near-black `#0b0d10`.
- Lighting (three.js with physically correct lights, ACES filmic tone mapping, exposure 1.0):
  - 10 warm-white spotlights `#fff1dc` at 24 m height, 10 m out from the centre line on each side, at 5 points along the court, aimed 2.2 m in from each side. Intensity 900, cone 0.42 rad, penumbra 0.8, decay 2.
  - 1 key spotlight above the server for the shadow. Intensity 650, cone 0.32 rad, 2048 shadow map.
  - A faint hemisphere fill (0.05) and exponential fog (density 0.024) so everything beyond the walls falls into darkness.
  - Faint additive light shafts under each spot (very subtle; may need strengthening).
- Performance: 11 spotlights may be heavy on phones. Consider fewer lights or baked lighting.

### Page layout (v9)

- The scene fills the window and the page never scrolls.
- Top edge: title, the current moment, camera buttons, Details button.
- Bottom edge: moment caption, playback controls, and a speed trace you drag to scrub, with the key moments marked.
- Details overlay with tabs: key moments, readouts, display options, research check, about the data.
- One deliberate dark look. Fonts: Barlow Condensed (display), IBM Plex Sans (body), IBM Plex Mono (numbers).
- **Camera framing:** the view is shifted up so the player is centred in the space between the overlays.
  - **Bug to avoid:** compute that shift from fixed reserved heights, recalculated only when the window resizes. Measuring the overlays live made the camera jump every time the caption changed length.
- Camera presets: Side, Behind, Shoulder, Front, Above, Court. Transitions ease over 0.7 s and respect reduced motion.
- The prototype uses three.js r147 from a CDN with the old `examples/js` OrbitControls. In the repo, use the module build.

### Copy style used on the page

Plain language, one idea per sentence, no em dashes, no exclamation points. Say plainly what is measured, what is estimated and what is simulated.

## Viewer data format (`serve57_viewer.json`)

All positions are millimetres in the lab frame (X, Y horizontal, Z up), flattened as `[x0, y0, z0, x1, y1, z1, ...]`, one entry per frame at 180 Hz. Frames 0-300 are recorded, 301-433 are extrapolated.

- `fps`, `n` (434 frames), `recLast` (300).
- `joints`: `head, neck, sh_hit, el_hit, wr_hit, hand_hit, sh_toss, el_toss, wr_toss, hand_toss, pelvis, hip_hit, kn_hit, an_hit, toe_hit, hip_toss, kn_toss, an_toss, toe_toss`.
- `land`: landmark tracks `ij, c7, px, asisR, asisL, psisR, psisL, headF, headB`.
- `racket`: three marker tracks (throat, rim, rim).
- `markers`: raw 75 markers for frames 0-300, flattened by frame then marker.
- `speed`, `elbow`, `knee`, `sep`, `face`, `headZ`: per-frame readout series.
- `events`: `toss, load, drop, takeoff, contact, land, peak`. `readyF`: ready position frame.
- `fwd`: the court's forward direction. `ground`, `start`, `toeToss0`: court placement inputs.
- `ball`: simulated ball positions per frame plus `release, land, cp, landPt, apex, speed, net, flight, launch, spin, X, Y, releaseH`.
- `twist`: per-frame forearm twist directions (unit vectors x 1000) for `hit` and `toss`.
- `ghost`: comparison serve 39, with `joints`, `racket`, contact point `cp`, contact frame, and distances inside the baseline.

## Known limitations

- One player, flat serves only, deuce side only, right-handed only.
- The stance and first rock are missing; the clip starts mid-motion.
- No finger data. The grip and toss release are not measured.
- Marker names are inferred, not the lab's. Medium and low confidence labels are marked.
- Shoulder centres are the loosest joint fit, so shoulder-based measures are less precise than elbow and knee.
- The ball, the toss, everything after 0.19 s past contact, and the court placement are estimates.
- 180 Hz is coarse near contact: the racket moves about 18 cm and the face turns about 10° per frame.

## Starting points for the step-by-step version

A first outline of steps, with what the data can show for each. Treat it as raw material.

1. **Stance and start.** Not in the data. The clip begins mid-motion, so this step would need illustration or a different source.
2. **Toss and release.** Release about 1.2 s before contact, 1.65 m up; toss peaks near 3.9 m (simulated, consistent with the hand's measured speed).
3. **Loading (trophy).** Front knee bends to about 68°; tossing shoulder sits about 20° above the hitting shoulder; hips and shoulders turned together.
4. **Racket drop.** Racket head at its lowest behind the back 0.17 s before contact; shoulder turned back about 128°.
5. **Drive up and takeoff.** Feet leave the court 0.11 s before contact; shoulders begin turning toward the court faster than the hips.
6. **Contact.** About 2.6 m up (about 1.45 times body height) and 0.8 m inside the baseline. Elbow nearly straight, face nearly square, hitting shoulder now about 46° higher than the tossing shoulder, shoulders 32° past the hips.
7. **Follow-through and landing.** Front foot lands 0.13 s after contact, inside the court. The rest is extrapolated.
8. **Recovery to ready.** Balanced and facing the net about 0.8 s after contact.

Useful teaching contrasts already available: serve 57 versus serve 39 (contact point 26 cm apart, both in), and in, out and net serves (they look nearly identical at this capture rate, which is itself a lesson about how small the differences are).
