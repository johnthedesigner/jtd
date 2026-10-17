# NBA Court — journal

Working notes for `/experiments/nba-court`, kept in the repo so they survive
a fresh session. This is a running log, not a spec — update it at natural
checkpoints (a finding confirmed, a decision made, a phase landed), not line
by line. Keep entries short; link out to code rather than duplicating it.

Related, more detailed docs (not always available in a fresh session — this
file should stand on its own):
- Full live-game-mode plan: `/Users/johnlivornese/.claude/plans/cryptic-singing-neumann.md`
- Original source brief (uploaded, not committed to the repo): `live-game-mode-plan.md`

---

## Live Game Mode

**Goal:** a live/replay play-by-play layer sitting beside the existing
court/basket/shots/overhead/dfence/celebration views. Scope and UX placement
still undecided on purpose — being built as an additive slice under
`components/nba-court/live/` + `pages/api/nba-live/` so it's easy to reason
about independent of that decision.

### Status: fetch mechanism confirmed working (2026-09-22)

The core blocker — reliably fetching NBA live data server-side — is solved.
Summary of the investigation, in case any of it needs revisiting:

1. **`axios`/`curl` are dead ends, permanently.** Both `cdn.nba.com`'s live
   endpoints and ESPN's unofficial API (`site.api.espn.com`) return `403`
   to any plain HTTP client, from any network, with any headers/cookies —
   verified from this project's dev sandbox and from John's own residential
   network. Root cause: both sit behind Akamai Bot Manager, which requires a
   JS "sensor" script to run in a real browser before trusting a request. No
   HTTP client can produce that.
2. **A real (but automated) headless browser isn't enough by itself either.**
   Puppeteer-driven `page.goto()`, tested directly, was ALSO blocked on both
   sources — Akamai can tell a human-driven browser apart from a
   script-driven one. Headful (visible) Chrome got through; plain headless
   did not.
3. **Root cause, found by diffing headless vs. headful sessions field by
   field** (not guessed): headless Chrome's default User-Agent literally
   contains the substring `"HeadlessChrome"`. Overriding just that string —
   swap `"HeadlessChrome"` for `"Chrome"`, nothing else touched — fixed
   ESPN's endpoint, in plain headless mode, no display needed. Confirmed
   reproducible (tested 3x, including through the real `_probe.js` route).
4. **NBA's `cdn.nba.com` endpoint does NOT get fixed by the same override** —
   still `403`, confirming deeper/separate protection there (its own Akamai
   Bot Manager cookies — `_abck`/`bm_sz`/`bm_so` — were traced directly; see
   the full plan doc). **Decision: ESPN is this app's live data source. NBA's
   endpoint is out of scope**, not used anywhere in the actual routes.
5. Because the fix needs no display/Xvfb, **hosting stays on Vercel** as
   originally decided — no need for a separate always-on process.

**The fix lives in `components/nba-court/live/nba-browser.js`**
(`fetchViaBrowser`) — the User-Agent override is baked in as a permanent,
default part of every fetch, derived from the live browser's own UA at
runtime (not hardcoded, so it can't drift out of sync with the installed
Chrome version).

### Status: Phase 1 (routes + normalization) complete and verified (2026-09-23)

Routes now target ESPN's real two-endpoint shape, and `normalize.js` was
checked against one real completed game (Knicks @ 76ers, 2025-01-15, ESPN
event `401705127`) through the actual running routes — not a guess:

- **Team mapping verified against ESPN's real teams list**, not assumed —
  fetched all 30 teams; 6 of ESPN's abbreviations don't match this app's
  tricode key (`GS`→gsw, `NO`→nop, `NY`→nyk, `SA`→sas, `UTAH`→uta, `WSH`→was).
  `nba-teams.js` was rewritten around ESPN's ids/abbreviations (NBA's numeric
  teamId table it originally had is gone — dead code now that NBA's endpoint
  is unused).
- **Coordinate conversion verified numerically, not eyeballed**: reconstructing
  each play's own stated shot distance from ESPN's `coordinate` (x, y) with
  the rim placed at `(25, 0)` matched to within **0.65ft average / 1.5ft worst
  case across 127 real shots**. Confirmed feet (not tenths, unlike NBA stats),
  origin at the rim. `playLocationToWorld` added to `shot-data.js` beside
  `shotToWorld`. **Left/right (x) sign orientation is NOT verified** — the
  distance check is symmetric under mirroring; could place corner shots on
  the wrong side until checked against a known shot visually.
- **Confirmed ESPN's coordinate is already relative to "the basket shot
  at"**, not an absolute court position — every team's shots stay in the same
  0-30ish range in every period, home or away. So orienting plays for
  rendering is a one-time per-team choice (home team's shots at `end=1`, away
  at `end=-1`), not a period-based flip. **Caught and fixed a real bug**: an
  early version of `normalizePlayByPlay` applied one `end` to the whole game
  instead of resolving it per-play from each play's own `team.id` — verified
  fixed by checking a specific away-team player's shot flipped sign correctly
  after the fix, through the real route.
- **Confirmed ESPN's "no location" sentinel**: free throws, jump balls, etc.
  come back with `coordinate` near Int32-min (~-2147483648), not `null` or an
  omitted field — `normalize.js` filters on magnitude, not on the field's
  mere presence.
- **Play `type` normalization** built from the actual distinct `type.text`
  values seen across one real game (441 plays) — shots aren't enumerated by
  id (too many variants: Pullup, Driving, Fade Away, ...) but detected via
  ESPN's own `shootingPlay` flag; free throws are also flagged
  `shootingPlay: true` by ESPN, so they're special-cased ahead of the
  generic shot check.
- **Known gap, not a bug**: the `summary` endpoint's game header doesn't
  carry `period`/`displayClock` the way the `scoreboard` endpoint's does
  (confirmed by inspecting the raw payload — the field just isn't there).
  `normalizeGameHeader` correctly falls back to `0`/`'0:00'`. Whoever builds
  the live HUD (Phase 4) should get period/clock from a concurrent
  scoreboard poll, or from the most recent play's own `period` field, not
  from the summary header.
- End-to-end verification (real routes, real running dev server, not a
  script): scoreboard → 11 games normalized correctly; summary → 441 plays,
  178 located shots, **0 out of `COURT_HALF` bounds**, made/missed counts add
  up exactly (92+86=178), "other"-type count matches rare types found by
  hand (reviews, delay of game, goaltending).

**Files as of this pass:**
- `components/nba-court/live/nba-browser.js` — Puppeteer singleton (dev:
  system Chrome; prod: `@sparticuz/chromium`) + `fetchViaBrowser(url)` with
  the User-Agent fix baked in. Exports `ESPN_FEED_BASE`, `ESPN_SUMMARY_BASE`
  (live) and `NBA_FEED_BASE` (dead, kept only as a pointer for future
  investigation).
- `components/nba-court/live/nba-teams.js` — ESPN id/abbreviation ↔ this
  app's tricode, rebuilt from real data.
- `components/nba-court/live/normalize.js` — `normalizeScoreboard`,
  `normalizeGameHeader`, `normalizePlayByPlay`.
- `components/nba-court/shot-data.js` — added `playLocationToWorld`.
- `pages/api/nba-live/_probe.js` — checks both ESPN and NBA, for comparison.
- `pages/api/nba-live/scoreboard.js` — ESPN scoreboard, normalized server-side.
- `pages/api/nba-live/summary/[gameId].js` — ESPN summary (play-by-play),
  normalized server-side. `gameId` here is ESPN's numeric event id.
- Removed: `schedule.js`, `playbyplay/[gameId].js`, `boxscore/[gameId].js` —
  were shaped around NBA's four-endpoint API, unused, and not needed until
  Phase 5 (game list drawer). Rather than leave wrong/dead routes in place,
  they were deleted; re-add against ESPN's real shape when Phase 5 starts.

### Status: Phase 2 + live scene director (camera only) working and verified (2026-09-23)

The plan's Phase 3 grew into a real design conversation with John — see the
"Live scene director" section of the full plan doc for the settled design
(tiered event→scene rules, computed spotlight poses, 3D typography for
scoreboard/status text). This pass built and verified the camera-reaction
half of that; markers and 3D typography are still ahead.

**Built:**
- `public/nba-live/sample-playbyplay.json` — the real, already-normalized
  Knicks @ 76ers game, pulled straight from the real `summary` route (not a
  hand-rolled fixture).
- `components/nba-court/live/useReplayFeed.js` — reveals saved plays on a
  timer (3.5s/play default — see the comment on `DEFAULT_INTERVAL_MS` for
  why slower than "just play them back" sounds right). `usePlayFeed`
  (Phase 6) is meant to hand out this exact same `{ game, plays, latestPlay
  }` shape.
- `components/nba-court/live/live-scenes.js` — `tierForPlay`/`sceneForPlay`
  (the four-tier table agreed with John) and `computedPoseForPlay`, which
  builds a camera pose on the fly from a play's own court location/`end`,
  mirroring the existing `hoop` pose's azimuth convention exactly
  (`azimuth = end * -60`) rather than inventing a new one.
- `components/nba-court/live/useLiveSceneDirector.js` — watches
  `latestPlay`, holds a scene for `HOLD_SECONDS[tier]` via a plain
  `setTimeout` (not `useFrame` — see the file's own comment on why that's
  the more correct choice given `useRenderActive`), reverts to idle if
  nothing new arrives.
- `components/nba-court/CourtViewer.js` — `resolvedPose` now picks the
  active scene's pose over the current view's named pose while on the new
  `live` view; a single generalized effect (comparing `resolvedPose.id`
  against the last one) drives `prevPose`/`moveRef` for *any* reason the
  pose changes — this replaced `selectView`'s own inline swap logic, which
  only had to handle explicit view changes before.
- `components/nba-court/views.js` — new `live` view (`pose: 'wide'` as its
  idle base, matching "the standard half-court view" John described),
  added to `VIEW_ORDER`.
- `normalize.js` — added `end` to the `Play` shape (was only used
  internally to compute `court` before); a scene needs to know which basket
  to face even for plays with no specific location, like a turnover.

**Real bugs found and fixed while verifying, not assumed away:**
- The `sample-playbyplay.json` fixture was generated *before* `end` was
  added to `normalize.js` — every play's `end` came back `undefined`
  client-side, and `computedPoseForPlay` silently bailed on all of them.
  Caught by adding targeted logging rather than guessing, then confirmed
  fixed by regenerating the fixture from the current route and re-checking
  the same log output.
- At the original 1.5s replay interval, new scenes kept superseding the
  previous one before its 1.1s pose transition (`POSE_MOVE_SECONDS` in
  `CourtScene.js`) could finish — the camera was chasing a constantly-moving
  target and never visibly arrived anywhere. Caught via screenshot (an
  oddly-centered, over-zoomed frame that didn't match hand-calculated target
  math for any single play), not assumed to be "just needs tuning."

**Verified via screenshot, not assumed:** the `court` view (and every other
existing view) renders unaffected; the `live` view shows the standard wide
framing while idle and visibly swings to a tighter, basket-angled framing
during an active scene, then correctly settles back to idle — both states
captured and confirmed.

### Status: floor markers (`LiveGameOverlay.js`) built, verified, and one real bug fixed (2026-09-23)

Built the shot markers: two small `InstancedMesh` pools (12 each, made =
filled disc, missed = ring), watching `latestPlay` independently of the
camera scene director (a marker is about what's on the floor; the scene
director is about where the camera looks — kept genuinely decoupled, not
just described that way). Wired into `CourtScene.js`/`CourtViewer.js` the
same way as every other overlay (`showLive`/`liveLatestPlay` props).

**A real, non-obvious rendering bug found and fixed, not tuned around:**
markers were mounting, updating, and reporting `active: true` /
`opacity: 1.00` every frame (confirmed via direct logging) and simply never
appearing on screen — not dim, not misplaced, not culled (`frustumCulled`
confirmed `false`), just absent. Isolated it systematically: a plain static
mesh with identical geometry/material rendered fine; a *forced*
permanently-active instance in the same `InstancedMesh` still didn't; an
opaque (non-transparent) version of the same instanced material rendered
correctly; a transparent version with `depthWrite: true` also rendered
correctly. That isolated the cause precisely to `depthWrite: false` — a
setting that's normally the obvious, correct choice for a flat transparent
ground decal (avoids it fighting the floor for depth), but this app's
custom `PostFX.js` pass (haze/depth-of-field) reads the depth buffer, and
an object that never writes to it gets excluded from that pass's
compositing entirely. **Worth remembering for any future overlay here**:
`depthWrite: false` is not safe to reach for by default the way it
normally would be in three.js, specifically because of this project's own
PostFX pipeline.

Verified visually at real (non-debug) size/color, not just the oversized
test version used to isolate the bug — a marker is visible but genuinely
subtle at its tuned scale/color; worth a look at boosting brightness/size a
touch, a polish item not a defect.

### Status: 3D typography (`ScoreboardText.js`) built and verified — Live Game Mode's first full pass is complete (2026-09-23)

Built the score/status typography: extruded `TextGeometry` (real 3D depth,
not flat SDF text), driven by the scene director's `content.typography` —
score numerals for each team beyond their own baseline, status text
("76ERS FULL TIMEOUT", "HALFTIME", "END OF THE 3RD QUARTER", ...) standing
at centre court, all fading in/out around the director's own hold timing.

**Font: three static Montserrat weights (400/700/900), not the variable
file itself.** John specifically asked for the variable version, which
matters for *where the fonts come from* but not for what ends up in the
browser — three.js's typeface.json format (what `TextGeometry`/`FontLoader`
actually consume) has no concept of variable axes at all, so the variable
font was only ever useful as the *source* to instantiate fixed weights
from. Pipeline, in case it needs redoing for other weights/families:
`google/fonts` GitHub repo → `fonttools varLib.instancer --update-name-table`
(pins one weight, fixes the family-name metadata the instancer leaves
stale otherwise) → convert to typeface.json using the *exact* algorithm
three.js's own `TTFLoader.js` uses (`opentype.js`), run once in Node rather
than the CDN-dependent runtime path `TTFLoader` takes in-browser. Output:
`public/fonts/montserrat_{regular,bold,black}.typeface.json`.

**A real design gap found and fixed, not just a rendering bug this time:**
tiers had no concept of priority — a timeout (typography) was getting
clobbered by a missed shot (nudge) two plays later in the real game data,
cutting a 6-second moment down to under a second. Added `TIER_PRIORITY` in
`live-scenes.js` (nudge=1, spotlight=2, typography=3) — `useLiveSceneDirector`
now only lets a new triggering play interrupt an active scene if it's the
same tier or higher. Caught by watching the real fixture's actual play
sequence, not by noticing a visual glitch.

**A tuning gap, diagnosed precisely rather than left as "text looks
wrong":** the score numerals initially rendered as barely-visible dark
shapes despite a near-white base colour. Not a bug — they sit ~10ft beyond
the baseline, well outside the court, where this app's `pool-falloff`
dimming (tuned for stanchions receding into arena dark) is quite
aggressive. Fixed with a much gentler falloff config for text specifically
(`floor: 0.6, spill: 0.5, decay: 0.03`) plus stronger `emissiveIntensity` —
the same category of fix Confetti already needed for its own wide,
always-legible spread, reused rather than rediscovered from scratch.
Verified fixed by screenshot, not assumed.

**Materials are fully opaque**, sidestepping the `depthWrite`/PostFX bug
from the markers work entirely rather than re-solving it — text has no
real need for transparency.

**End-to-end verification used a new technique**, not just longer waits:
a screenshot-series script (`shot-series.mjs`, one browser session, many
captures at fixed intervals, console log correlated by timestamp) — this
sidesteps this environment's well-documented per-launch load-time variance
by only paying that cost once per verification run instead of once per
screenshot. Worth reaching for again over the plain single-shot script
whenever an event needs to be caught mid-window rather than at a single
known-good moment.

**This closes out the "Live scene director" design** from this pass: the
camera reacts to plays, markers show on the floor, and 3D typography
appears for stoppages — all fed by replay, all verified through the real
running app.

### Status: Phase 4 (`LiveHUD.js`, flat 2D score/clock/feed) built and verified (2026-09-23)

The always-available complement to the occasional 3D typography — score,
period, clock, last play, and an expandable newest-first feed, positioned
like `DebugPanel`/`Controls` (outside the Canvas, plain Tailwind).

- **Home/away accent colours are the actual game's teams**, not whatever
  court happens to be on screen — there's no view yet that syncs the
  team-picker to a selected live game (that's Phase 5's job), so the two
  are genuinely independent today. New `useTeamColors(tricode, era)` in
  `CourtViewer.js` piggybacks on the *existing* `loadCourt` cache purely to
  read `.userData.colors` off a team's texture, without ever rendering or
  switching to it — reused, not rebuilt. `ScoreboardText`'s status-text
  colour was also switched from the on-screen court's colour to this same
  real home-team colour, for the same reason.
- **A real correctness bug caught before it shipped, not after**: the
  first version fell back to `game.home.score`/`game.clock` whenever
  `latestPlay` hadn't arrived yet. Screenshotted at 5s in and immediately
  looked wrong — final score (125–119) with a `0:00` clock, on a replay
  that had barely started. Root cause: `game`'s score/clock are whatever
  was baked into the fixture at generation time (the *final* score for a
  completed game — the same summary-header gap already documented above),
  never "current." Fixed by never falling back to `game` for these
  specifically — 0/blank until an actual play exists to source them from.
- Verified via screenshot at multiple points (correct 0-0/1ST/12:00 at
  start, correct live-updating score/clock/last-play later) and via an
  actual simulated click (CDP `Input.dispatchMouseEvent`, not just reading
  the code) confirming the feed expand/collapse toggle really works —
  newest-first, correct per-play period/clock/description.

### Status: Phase 5 (`GameListDrawer.js` + scoreboard polling) built and verified (2026-09-23)

The drawer: today's games from the real `useScoreboardPoll` hook (polls the
actual working `/api/nba-live/scoreboard` route every 20s, only while
open), sorted live-then-scheduled-then-final, bespoke Tailwind like every
other panel in this HUD. Selecting a live/final game does what the plan
called for — switches the court to that game's home team (reusing the
existing `setTeam`, not new plumbing), jumps to the live view, and records
the `gameId` for Phase 6 to eventually use.

**Verified against real conditions, not just a demo date**: today (real
current date, NBA offseason) correctly showed "No games today" — a genuine
empty state, not a mocked one, and a nice confirmation in passing that the
scoreboard fetch still works against the live endpoint right now, not just
against the one historical date used for replay. Temporarily pointed the
hook at a real date with 11 games to verify the populated list (correct
scores, tricodes, FINAL/OT labels) and, with a scripted two-click test (open
drawer → click a row), confirmed the *entire* selection flow end to end:
drawer closes, team switches to the selected game's actual home team
(correct court art and all), view jumps to LIVE, HUD shows the honest 0-0
state from the still-hardcoded replay fixture.

**A layout regression noticed, deliberately not fixed now**: the view-chip
row (7 view chips + 2 era chips + the new Games button, in a max-w-5xl
container) now wraps at ~1280px. This is the kind of thing John flagged
wanting a dedicated visual-tuning pass for — noted here rather than
unilaterally redesigning the control bar's layout mid-feature-work.

### Status: Phase 6 (real ESPN polling) built and verified — the full plan (Phase 0-6) is now built (2026-09-23)

`usePlayFeed.js`: no `gameId` selected → falls back to `useReplayFeed`'s
demo fixture (a permanent capability, not just a development stand-in — see
the source doc's own "a working demo on any day with no games"); a real
`gameId` → polls `summary/[gameId]` every 3s (matching that route's own
`s-maxage=3`), stops polling once a game reports `status: 'final'` since a
completed game's data can't change again. `CourtViewer.js` now calls this
one hook unconditionally — it decides which source internally, nothing
downstream had to change.

**Mid-game join and revised `actionNumber`s (the doc's own two named
concerns for this phase) turned out to already be handled correctly by the
simple design, not extra cases to build**: the summary route always
returns the *entire* play history, not a delta, and this hook replaces
`plays` wholesale on every poll rather than appending — so joining an
in-progress (or, as tested, a finished) game populates the full history and
real `latestPlay` on the very first poll with no catch-up logic needed, and
a correction to an earlier play is picked up automatically on the next poll
since every downstream consumer already keys off `actionNumber`, not
array position.

**Verified with the same real completed game used throughout this
session** (Knicks @ 76ers), selected live through the actual drawer flow —
confirms the *entire* pipeline end to end with genuinely live-polled data,
not replay: HUD immediately showed the real final score and `OT 0.0`
(exactly right for a finished game — the mid-game-join behavior above), the
last play read "End of Game," and the 3D scene independently and correctly
reacted too — "END OF GAME" typography plus both teams' score numerals,
driven by the *same* polled data, through the scene director built two
passes ago. One fetch mechanism, normalized once, correctly driving camera
reactions, floor markers, 3D typography, and the flat HUD simultaneously.

**Also fixed in passing**: `usePlayFeed` always mounts `useReplayFeed` too
(React hooks can't be called conditionally), which was fetching the 98KB
demo fixture even while watching a real polled game. Gated that fetch by
the same `autoStart` flag that already gated the reveal timer.

**Still open, deliberately not answered by anything above**: whether
`@sparticuz/chromium` behaves the same as local Chrome on an actual Vercel
deployment — the one thing from Phase 0 that was never verifiable without
deploying. Everything in this pass has been verified against `next dev`
locally; production is the next real unknown, not a formality.

### Next step

A whole visual/motion tuning pass, by John's own request — scene
transition timing, camera framing numbers, marker/typography sizing and
placement, and the control-bar layout (noted above) are all first-pass,
not settled. Worth doing as its own dedicated pass rather than folding
piecemeal into feature work. After that (or alongside it): an actual Vercel
deployment, to answer the `@sparticuz/chromium` question above.

### Process notes for future sessions

- Test through the real, checked-in code path (a route via the actual dev
  server) once something is meant to be verified — not disposable one-off
  scripts that diverge from what's actually implemented. Scripts are fine
  for first exploration (pulling raw samples, inspecting shapes before
  writing normalization code against them), but the result that matters is
  the one produced by the real route.
- Plain `node script.mjs` can't import this project's own files directly
  without a file extension (Next's bundler allows extensionless imports,
  raw Node's ESM resolver doesn't) — don't fight that; verify through a
  route/the dev server instead.
- A long-running `next dev` process can go stale on a newly-added named
  export after enough edits — if something that clearly exists in the file
  throws "is not a function," restart the dev server (`pkill -f "next dev"`,
  `rm -rf .next`, restart) before assuming it's a real code bug.
- A static fixture generated from a route's output goes stale the moment
  that route's normalization logic changes — if downstream data looks wrong
  in a way the code doesn't explain, check whether the fixture predates the
  code first, before assuming a logic bug.
- When something that should visibly change on screen doesn't (two
  screenshots look identical), add targeted `console.log`s at the exact
  point of suspicion and re-screenshot rather than reasoning further from
  the outside — this found both real bugs above in one pass each.

---

### Status: refinement pass — UI restructure, marker library, planar reflections (2026-09-23)

A large pass driven by a running stream of direction. What changed, and the
findings worth keeping:

**Bottom-bar restructure.** The landing surface is now a horizontal strip of
up to three upcoming games (`UpcomingGamesStrip`) across the bottom, with
team logos, colours and an explicit HOME label (`GameCard`). The old
team/view/era controls moved behind a gear (`SettingsFlyout`), which is
mounted only outside the live view — inside a game the court and teams are
dictated by the game itself. "All games" opens `GameListOverlay`,
full-viewport and tabbed Upcoming/Past.

- **The site header floats above this canvas and above any overlay in it.**
  It doesn't just cover the top of a panel, it *swallows clicks* there. The
  Past tab looked dead while never receiving the event at all. Anything
  placed near the top of this experiment needs `top-20`/`pt-20` clearance —
  this has now bitten twice (the old landing panel, then the overlay).
- ESPN's logo CDN keys most teams by this app's tricode but not all:
  `uta.png` and `nop.png` 404, `utah.png` and `no.png` serve. Verified by
  request; see `LOGO_SLUG_OVERRIDE`.

**A finished game now replays.** `usePlayFeed` sent any `gameId` down the
live-poll path, and the summary route returns a completed game's *entire*
play history — so opening anything from the new Past tab dropped you on the
final buzzer. Final games now reveal on the same timer the demo fixture
uses. In-progress games are deliberately *not* paced: there the point is to
be caught up to now.

**Camera transitions were snapping, and easing wasn't the problem.**
`CourtViewer` handed the rig `prevPose = lastPoseRef.current` — the
*target* of a move that might still be in flight. Retargeting mid-move
teleported the camera to the unreached old target before easing on to the
new one. Live play arrives faster than a move completes, so that was most
transitions. `CameraRig` now detects the retarget itself, inside the frame
loop, and starts from the state it actually rendered. It also interpolates
in pose terms (elevation/azimuth/distance/target/fov) rather than between
two world positions — a world-space lerp cuts a chord through the orbit, so
the camera dipped toward the floor mid-move and climbed back out.

- Verified objectively rather than by eye: sample the canvas every 180ms and
  diff consecutive frames. A cut shows as an isolated spike; a pan shows as
  a continuous ramp. Result: 0 frames over 6x median, worst spike 3.7x,
  series ramping smoothly (`scratchpad/motion.mjs`). Worth reusing for any
  motion claim.
- `CameraRig`'s `distFor` cache is keyed by `pose.id`, and live scenes mint
  a pose id per play — it grew unbounded over a game. Now capped.

**One marker library, shared by the floor and the camera** (`live-markers.js`).
Previously `LiveGameOverlay` and `live-scenes.js` decided independently, so
the camera swung toward plays that put nothing on the floor. Now
`markerForPlay` is the single source: no marker means no camera move.

- **Only shots carry real coordinates.** Re-confirmed: of 441 plays, all 178
  shots had `court`; 93 rebounds, 28 turnovers and 38 free throws had none.
  So rebound/steal placement is *inferred* and says so — rebounds near the
  known rim (`play.end` is real), steals near mid-court as a
  possession-direction arrow. Free throws are the one honest addition: they
  happen on the free-throw line by definition, and the play carries both
  `end` and `made`.
- Symbols: green circle (make), red X (miss), amber hexagon (rebound), cyan
  chevron (steal). 289 of 441 plays now place one.

**Scoreboard is always up, lit rather than glowing.** Numerals sized to the
three-point distance (23.75ft), bottom-baselined at y=0 so they stand on the
floor, with team tricodes above. No emissive at all — they're lit by the room
through `applyPoolFalloff`.

- `centeredTextGeometry` gained `baseline: 'bottom'`. The measurement must
  come from the bounding box, not from `size`: `size` is the em and digits
  ink only their cap height (~70%), so resting text by arithmetic on `size`
  sinks it into the floor by the difference.

**Planar floor reflections** (`FloorReflection.js`). The floor's reflections
were entirely analytic — the shader ray-traces the mirror direction against
*described* shapes (ceiling banks, the LED ribbon) that are never drawn — so
it could not reflect anything genuinely in the room, and objects standing on
it read as pasted on. Now the scene renders a second time from a camera
mirrored through y=0, and `sceneReflection` in the court shader samples it
through the same roughness lobe. The analytic terms stay: they describe
light sources with no geometry.

- The court mesh must be hidden for the pass — its material samples the very
  target being drawn into.
- An oblique near plane clips everything below the floor.
- Runs at `useFrame` priority 0, before `PostFX`'s priority-1 pass.
- **The mirrored pass also contains the empty background of the room, and
  adding it back is double-counting** — the dark arena is already in the
  ambient term. Unsubtracted it arrived as a flat lift that washed the wood
  out while the things actually in the room stayed invisible. Subtracting a
  black point and renormalising fixed it, and makes it safe to flatten the
  Fresnel floor for this term (it can then only raise real objects).
- Debug modes earned their keep: `?reflectdebug=1` shows the raw mirrored
  pass (magenta where the projection misses), `?reflectdebug=2` shows the
  contribution alone. These are what distinguished "too dim" from
  "projection is wrong", which look identical on finished wood. Dials:
  `?reflect=`, `?reflectblur=`, `?reflectblack=`, `?reflectminf=`.
- **Honest limitation:** the silhouettes are present and correct but subtle.
  The floor is brightly-lit wood and the numerals are deliberately dim; a
  reflection can only move a bright surface a few percent. Making them
  legible would mean making the numerals brighter than the floor, which is
  in tension with "not glowing." Left at a physically sensible default with
  the dials exposed.

**Still open:** whether `@sparticuz/chromium` behaves like local Chrome on a
real Vercel deployment. Never verifiable locally.

---

### Correction: most plays DO carry court coordinates (2026-09-23)

**An earlier entry in this journal was wrong**, and the code built on it was
placing marks by guesswork that ESPN had already measured.

The claim was "only shooting plays have coordinates." What was actually true
is that `normalize.js` only *read* `coordinate` when `shootingPlay` was set,
and threw the rest away. Re-checked against the same real game (ESPN event
401705127, 441 plays), comparing each non-shooting play's coordinate with
its neighbours':

| type | n with coord | independent of neighbours |
|---|---|---|
| foul | 34 | 31 |
| turnover | 27 | 27 |
| rebound | 86 | **0** |
| free throw | 0 | — |

- **Fouls and turnovers are real, distinct locations.** Now kept, and the
  turnover position replaces the invented "park every steal near mid-court"
  placement.
- **Rebounds are not a location at all.** All 86 are an exact copy of the
  *previous* play's coordinate — separation from the miss was 0.0ft at
  every percentile across all 93 miss→rebound pairs. ESPN stamps the missed
  shot's spot onto the rebound. Using it would stack a rebound mark exactly
  on the miss mark that just landed, so rebounds still get an inferred
  near-rim position, and `live-markers.js` says so.
- Free throws correctly carry ESPN's no-location sentinel; they're placed
  on the line by rule.

**Re-deriving the transform is worth recording**, because the first attempt
at this check produced garbage (every distance under 5ft) by assuming NBA
stats' tenths-of-a-foot convention. ESPN's `coordinate` is **whole feet with
the rim at (25, 0)** — `playLocationToWorld`, not `shotToWorld`. Distance is
`hypot(x - 25, y)`, which reproduces each play's own stated shot distance to
0.65ft over 127 shots. That number is the check to re-run if this is ever in
doubt: it is invariant to which basket a play is mirrored onto, so it
validates the convention without needing to resolve `end` first.

**Which basket** is a separate question. ESPN's coordinate is already
basket-relative, so only left/right placement depends on `end`, which is
derived from the play's own team — the *attacking* team for a shot or
turnover, the *defending* one for a foul, so fouls are mirrored. Not
independently verified, and it sits on top of an x-sign orientation that was
never verified either.

**The fixture had to be regenerated** after this change — exactly the trap
already recorded below. Markers now: 123 make, 93 miss, 93 rebound, 34 foul,
18 steal, 9 turnover; 370 of 441 plays get one.

### Status: locked camera, glass typography, HUD as a score bug (2026-09-23)

**The camera no longer follows play.** Reactions were tried twice — a full
spotlight swing, then a much subtler ~16° lean — and neither worked. The
problem was never the size of the move or the easing: events arrive every
few seconds, so the camera was permanently drifting, and a floor that never
sits still is harder to read than one that does. It now holds the half-court
view for the whole game and lets the marks carry the event.
`computedPoseForPlay` is kept behind `CAMERA_FOLLOWS_PLAY` rather than
deleted — the rig infrastructure it needs is all still live.

**In-scene typography is cloudy glass** (`glass-material.js`): translucent,
chamfered around both faces, lit from a source low inside the letterforms so
they glow from their own base. Two choices there look like oversights and
aren't, both documented in the module: no real `transmission` (it forces a
separate render pass that fights `PostFX` and the planar reflection, and the
look wanted is milk-glass, not a lens), and `depthWrite: true` on a
transparent material (the long-standing PostFX trap).

- Score numerals 5x deeper, team lettering 5x, on-court callouts 2x.
- `centeredTextGeometry` gained `chamfer` (`bevelSegments: 1` — a flat cut,
  not a rounded fillet) and `baseline: 'bottom'`.
- **The label/numeral overlap was perspective, not arithmetic.** At 8ft
  deep, a numeral's highest *visible* edge is its far top corner, while
  lettering centred on the same Z sits several feet nearer the camera and
  therefore projects lower. Fixed by flushing the rear faces, not by adding
  more vertical gap.

**Marks**: fade out in 0.2s rather than 1.6s; a localized additive flash
lands with each one; sparks doubled to 32.

Retuned once seen in motion, and two of the corrections are worth keeping:

- **Softening gravity to get a longer arc was a mistake.** At -11 (a third
  of real) the path was the right *shape* but read unmistakably as slow
  motion — everything else in this scene is measured in real feet, so the
  eye knows how fast a thrown spark should fall and isn't fooled. Fixed by
  using true -32.2 and throwing them harder (4-15 ft/s out, 7-16 up) over a
  1s life instead of 1.9s.
- **Sparks were sub-pixel.** At 0.1ft they render thinner than a pixel on a
  ~94ft court in a ~1100px frame and simply vanish however bright, which is
  why they read as absent rather than subtle. 0.2ft is still tiny in world
  terms and actually visible.
- Colour is warm white (`#fff0d6`) with only a 16% tint of the mark's own
  colour — hot metal reads white almost regardless of what threw it off.
- The flash decays as a fourth power over 0.16s after a single-frame rise.
  At a square over 0.42s it still read as a ramp being animated, which is
  the one thing a flash must not look like. The spread barely moves, so what
  the eye catches is the brightness change rather than something growing.

**On-court callout fades are asymmetric** — 0.35s in, 0.2s out. A slow
dissolve on a word lying across the middle of the floor hangs around looking
like it's still saying something after the moment has passed.

**`?replayfrom=`** jumps into a finished game as a fraction of its length. A
full replay is ~25 minutes at 3.5s/play, which made the end of a game — and
everything that fires there — effectively unreachable. This is how the win
state was verified at all.

**The HUD is a broadcast score bug now.** The call is the top line and the
largest thing on it; the score sits under it, small, as reference. Team
logos and colours, a back control lifted out into its own button (offset
below the site header, which floats over this canvas), an expand chevron
leading the call rather than a "Feed" button trailing it, 2D symbol glyphs
matching the floor marks on every event, and feed clocks right-aligned in
IBM Plex Mono at a fixed column width so they line up and never wrap.

- **Timeouts are derived, not reported.** ESPN's payload carries only a
  `timeoutsAvailable` boolean — a feed capability flag, not a count. Every
  timeout is a play though, so remaining = allowance − taken, where the
  allowance is 7 plus 2 per overtime. That OT clause is load-bearing: the
  game this was built against went to one OT and one team took 8 timeouts,
  which a flat 7 would have rendered negative.
- **There is no per-half allowance in the NBA** — looked up rather than
  assumed. The seven are spread across all four quarters with no
  first/second-half split. What makes a broadcast bug show two or three late
  in a game is a set of ceilings on how many a team may still *hold*: at
  most 4 in the fourth (anything unused from the first three quarters is
  forfeited, not carried), at most 2 from the later of 3:00 left or the
  second mandatory TV timeout, and 2 per overtime. So the displayed number
  is `min(left, ceiling)` and the pip row is sized to the ceiling — it
  shrinks 7 → 4 → 2 as the game closes out. Checked across the real game:
  P1 7/7, P2 6/5, P4 8:00 4/2, P4 2:30 2/2, OT 2/2 → 1/2.

**Winning** dims the beaten team's numerals by switching off the light
inside them, puts "{TEAM} WIN(S)!" on the court in white glass, and fires
confetti and the winner's colour through the house lights — without the
celebration view's orbiting camera, which lives on that view's own pose and
is deliberately not adopted. Verb agreement follows the nickname ("Knicks
win", "Heat wins"). The trigger is the replay reaching the last play, not
the payload saying `final` — a completed game is final from the first frame,
and celebrating at tip-off would give away the result.

---

### Correction: measure the geometry, don't estimate it (2026-09-23)

The team lettering overlapped the score numerals through three attempted
fixes. Each one guessed at a bigger gap; none worked, because the thing that
was wrong was not the gap.

`LABEL_Y` was built on `SCORE_SIZE * 0.72`, reasoning that digits ink to
about their cap height. **`TextGeometry`'s `size` is not the em box.** It's
a scale factor on the font's own units, and measured across `0123456789` in
Montserrat Black it inks to **1.0581 x size**. So the numerals' top was at
25.13ft, not the assumed 17.10ft — the lettering was being placed *8ft
inside the numbers*, and every "add a bit more clearance" was still landing
underneath them.

Two consequences beyond the overlap:

- **The numerals were never the size they were specified to be.** The brief
  was "height equivalent to the 3-point distance"; `size = 23.75` drew them
  25.13ft tall. `SCORE_SIZE` is now solved from the intent
  (`23.75 / 1.0581`), so the inked height is the stated one.
- The whole assembly was over-tall and pushed the lettering off the top of
  the frame, which the correct sizing plus a smaller label ratio fixed.

**The method is the point.** `scratchpad/measure.mjs` builds the real
`TextGeometry` in Node (three.js and `FontLoader.parse` both work headless
— the typeface is just JSON), reconstructs the live view's actual camera by
replicating `solveDistance`, and projects candidate positions to *screen*
pixels. That last part matters: the two rows sit at different depths, so the
lettering's front face projects lower than its world Y suggests, and a world
gap that measures fine on paper still reads as touching. The solve reports
the world offset that produces a given **screen** gap — 0.614x the label's
ink height yields a half-cap-height gap on screen. Reach for this before
nudging a number in a 3D layout again.

`centeredTextGeometry` already returned `userData.inkHeight`; the component
now measures at runtime through `useInkHeight` rather than carrying a
constant, so the layout survives a size change. It measures the full digit
set, not the score on screen, or the lettering would shift as the score went
from 9 to 10 to 100.

### Tuning: translucent glass, snuffing sparks, live-view depth of field

- **Translucent, not transparent.** The glass read as an empty outline
  because `side: DoubleSide` literally draws the opposing faces and interior
  edges through the letterform, and 0.74 opacity transmits an image rather
  than scattering light. `FrontSide` plus 0.93 opacity plus a rougher body
  under a smooth clearcoat is what makes it milk glass. The interior light
  also needed a grazing-angle term — scattering escapes most where the
  surface turns away — and a *dimmer* body to read against; at the previous
  brightness the gradient was present but invisible, which is why it looked
  like matte plastic.
- **The interior light is an LED rope on the glyph's medial axis, and
  needs a real distance field.** Three cheaper models were tried and each
  failed in a way worth remembering:
  1. A gradient keyed to **world Y** lit the foot of each character — read
     as a lamp standing on the floor underneath the scoreboard.
  2. A band keyed to **`abs(localZ)`**, distance from the mid-depth plane,
     lit a slab through the middle of the extrusion. It reads as exactly
     what it is: three sandwiched layers with a lit one in the centre. It
     knows distance from the *faces* and nothing about distance from the
     *outline*, so the middle of a thick stroke and the very rim of it come
     out identically.
  3. Distance-from-edge with a **smoothstep ramp** — right quantity, wrong
     curve. A linear or smoothstepped falloff reads as a bevel.
  4. Distance-from-edge **inverted against the field's maximum** as a
     stand-in for distance-from-the-axis. Invisible on a straight stem,
     obvious on a '3' or a '4': it assumes every stroke is as wide as the
     widest part of the glyph, and at a reflex corner the nearest edge point
     *is* that corner, so distance-from-edge stays low across a whole wedge
     fanning out from it. Inverting that painted a dark wedge radiating from
     every inside corner.
  The working model computes the axis for real. `text-sdf.js` rasterises the
  run's shapes to a canvas, runs a **vector** distance transform (8SSEDT) to
  get the offset to the nearest outline point, ridge-detects that to find
  the medial axis, then runs a **second** distance transform outward from
  the axis. That final field is the genuine distance from the rope, and it
  uploads as a `DataTexture` in the geometry's own local frame so the shader
  samples it straight from `position.xy`. Light attenuates
  **inverse-square** through it.
- **Ridge detection has one trap and one robust answer.** The obvious test —
  a local maximum of the distance field — fails silently and completely:
  along a straight stroke the distance to the outline is *constant* in the
  direction of the stroke, so every cell in the stroke is a local maximum
  along that axis and the whole interior gets flagged (measured: 17% of
  cells, and the letterforms lit flat). The medial axis is properly defined
  as the points with more than one nearest boundary point, which is why the
  vector transform is needed. Comparing the two neighbours' *directions* to
  the outline is the robust form — same side means agreement, straddling the
  crest means they point at opposite edges. An absolute "how far apart are
  the two boundary points" threshold is far too sensitive to the jitter of a
  rasterised outline.
- **Verify this kind of thing headlessly.** `scratchpad/axis-check.mjs`
  draws a '3'-shaped blob into a grid, runs the two algorithms straight out
  of the module source, and prints the axis and the falloff as ASCII. It
  caught both the flat-lit bug and the fix in seconds, with no browser and
  no screenshot — the artifact is a property of the algorithm, not of the
  render.
- **A distance field built on a canvas has a Y-flip trap.** `getImageData`
  returns rows top-down, and `DataTexture` presents row 0 at `v=0`. Drawing
  the glyph the visually-correct way up therefore puts the field upside down
  against the geometry — which renders as mirrored letterforms sitting over
  correct ones. `text-sdf.js` draws upside down on purpose; it is only ever
  read back as data.
- Material follows the spec for LED-diffuser acrylic: satin (roughness 0.5,
  **no clearcoat**), effectively total haze so nothing behind the wall is
  legible, and a 3000K emitter (`#ffd9ad` — a warm white, not the far more
  orange blackbody value). Haze is modelled as near-opacity rather than low
  transmittance, because alpha blending transmits a *sharp* image of the
  background, which is the one thing a 100%-haze diffuser cannot do; the
  transmitted-light budget lives in `glowStrength` instead.
- **Sparks snuff, they don't fade.** A real ember cools a little, holds, and
  then stops; no two go out together. Fading the pool on one shared curve is
  unmistakably an animation being played. Per-instance brightness is the
  only way to get that, and `material.opacity` is one number for the whole
  pool — so brightness moved to `instanceColor` (`setColorAt`), which in
  turn required swapping the spark material to an unlit `MeshBasicMaterial`,
  since `instanceColor` modulates diffuse and would have been swamped by the
  emissive term. Each spark now carries its own life (0.42-1.15s) and its
  own cooling amount, and simply ceases at its own moment.
- **Depth of field is widened for the live view only.** The scoreboard
  stands ~35ft beyond whatever the camera focuses on, and the default 2ft
  in-focus band put it at 94% blur. `PostFX` takes a `focusRange` prop and
  `CourtViewer` passes 46ft in the live view, so the compositions tuned
  around a shallow field elsewhere keep it.
- Flash peak down to 0.15 and radius to under 2x the mark; on-court callout
  fade-out down to 0.1s.
- **Sparks were sized for visibility and overshot badly.** 0.2ft reads as
  debris, not sparks. The framing is ~12px per foot, so 0.075ft is a hair
  over a pixel — enough to register, small enough to stay embers. Burst cut
  to 18, lives to 0.26-0.68s, and speeds kept tight (1.8-6 out, 3.2-7.4 up)
  so the burst stays a few feet across instead of spraying over the paint.
  Worth remembering as a pattern: "invisible" and "too big" are one tuning
  step apart at this scale, and the useful unit is pixels-per-foot at the
  view's actual framing, not feet.

---

### Scoreboard characters: channel lettering, and the cost of a bezel (2026-09-23)

The characters are now a matte gunmetal body with a lit translucent face —
channel lettering. This replaced a run of attempts to render them as solid
diffuser acrylic lit from within, none of which worked.

**The final build is two materials on one mesh, and that is the whole
thing.** `ExtrudeGeometry` already splits itself exactly where this needs a
split: material index 0 is the front and back lids, index 1 is the sides and
bevel. Verified against the geometry's own `groups` and normals rather than
assumed — index 0 came back as pure ±Z normals, index 1 as everything else.
So the face is lit, the body is metal, and *nothing has to be computed* to
know which is which. The chamfer is the bezel: real angled metal around the
face, needing no decisions at all.

**What made the earlier versions hard was the bezel, not the lighting.**
John asked the question directly — "is it my insistence on having a bezel
that's adding complexity?" — and the answer was yes, completely. A one-inch
inset means knowing each fragment's distance from the glyph outline, which
means a distance field, which means rasterising font outlines. Every bug in
that stretch came from the rasterising:

- **`fill('evenodd')` cancels overlapping contours.** Fonts routinely
  contain them — the bar of a '4' crossing its stem. Even-odd turned those
  junctions into holes, which showed up as clean geometric notches punched
  out of the lit panels.
- **`fill('nonzero')` depends on winding that font conversion does not
  preserve.** This font's '4' arrives as *two separate solid shapes with no
  holes at all*; three.js's own outline/hole split is derived from the same
  winding, so it inherits the problem. The '4' came out with its diagonal
  reduced to a hairline.
- **Canvas antialiasing leaves hairline seams** where contours meet, which
  a threshold at 50% drops to "outside" — and the bezel cut then renders
  them as scratches across the panel.
- **Single-channel `DataTexture` needs `unpackAlignment = 1`.** WebGL
  defaults to 4-byte row padding, which shears every row of a texture whose
  width isn't a multiple of 4. It does not look like a texture fault; it
  looks like wedges and blocks sliced out of the glyph.

The robust answer, if this is ever needed again, is to decide solid-vs-hole
by **containment depth** (a contour nested inside an odd number of others is
a counter) and to rasterise directly rather than through Canvas2D — which
removes winding rules, blend modes and antialiased seams in one go. That
version worked. It was then deleted along with the bezel, because none of it
was worth an inch of flat return that measured under a pixel anyway.

**Diagnosing this needed the raster, not the render.** A `?sdfdebug` hook
that published the rasterised glyph as a data URL settled in one look what
four rounds of shader-side guessing had not: the field was wrong, not the
shader reading it. When a render looks wrong and the input is generated,
look at the input.

**Floor reflections.** The scene-reflection sample is now dragged by the
floor's own normal so it breaks up with the grain like every other
reflection on the court, instead of sitting there as a crisp decal. Two
things matter:

- The ripple is in **UV**, so it is necessarily tiny — the first value tried
  was 1.1, which displaces the sample across the entire frame.
- **Coverage is sampled unrippled.** The reflection target's alpha is a
  coverage mask (see `FloorReflection.js`, which now clears to transparent
  for this) used to let standing geometry block the analytic rig and ribbon
  reflections behind it. Displacing a *mask* puts the occlusion edge where
  the geometry is not, and since the floor normal carries the wood's
  high-frequency grain, it turned the mask into speckle scattered over the
  court. Reading coverage flat is what lets the colour ripple freely.

---

### Bug: an optional prop that is `undefined` clobbers its default (2026-09-23)

The scoreboard panels ignored two consecutive rounds of colour tuning and
reported nothing wrong. `#ffd9ad` and `#ffa04a` rendered identically —
neutral grey — which sent the investigation after `PostFX`'s atmospheric
haze on the theory that 160ft of distance was washing the colour out. That
was wrong.

`makeSignPanelMaterial({ color: panelColor, ... })` merged with
`{ ...PANEL_DEFAULTS, ...options }`. A prop that isn't set still arrives as
a key whose value is `undefined`, and object spread overwrites a good
default with it — so `o.color` became `undefined`, and `new THREE.Color(
undefined)` is **white**. Every panel with no explicit colour had been white
since the material was written.

The same line did it to the frame: `falloff` went `undefined`, so
`applyPoolFalloff` fell back to the default light pool instead of the
courtside chairs' — which was the one thing that had been explicitly asked
for about the metal.

Both fixed by `withDefaults()`, which skips undefined values rather than
spreading them. **Worth watching for anywhere a component forwards optional
props into a factory with defaults** — it fails silently, it survives
review, and it makes subsequent tuning look like it has no effect, which
sends you hunting in the renderer.

### On-court marks: visible until superseded (2026-09-23)

A mark now stays up until the next one lands, with a five-second floor, so
the floor always shows the most recent thing that happened rather than going
blank between plays. A mark superseded a moment after it appeared still gets
its own time on screen, and several overlap while play is quick.

`expireAt` replaces a fixed `TOTAL_LIFE`: set to the minimum on spawn, then
pulled in to `max(age, MIN_VISIBLE)` when any newer mark lands — across
every pool, since "the next mark" means one of any kind. Fade-out is 0.1s.

Verified by sampling the court region every 200ms and counting saturated
marker pixels: a rebound mark held flat from 7.0s to 12.0s — exactly the
five-second floor — then fell from 164 pixels to 27 inside one sample.

---

### The scoreboard lights the room it stands in (2026-09-23)

The lit characters now spill onto the deck in front of them and the
courtside chairs between them and the floor. Two mechanisms, because the two
surfaces are built differently:

- **The deck carries its own `ShaderMaterial`**, so scene lights do nothing
  to it and the spill has to be an explicit term — an inverse-square falloff
  from each sign's position, gated by a forward-only `smoothstep` so the
  deck *behind* the scoreboard stays dark.
- **The chairs are standard materials**, so for them it is a real light.

**A point light was wrong twice over.** It spills backward into the bowl
standing behind the scoreboard, which lit up a whole bank of seating that
should see nothing — light leaves the front of the characters and nowhere
else. Switching to a spot fixed that but introduced a subtler version of the
same mistake: a spot's default target is the **world origin**, which from
either sign aims diagonally across at centre court and leaves the chairs
immediately in front of it outside the cone. The target has to be set
explicitly, straight out from the face.

`scoreboardLights()` exports where the faces are and how hard each is
burning, keyed off the same per-side intensity the panels use — so at the
final buzzer the losing team's characters stop lighting the room along with
themselves. That asymmetry does more for the moment than the dark numerals
alone did.

---

### The ball: seam geometry from spec, with the JTD mark embossed (2026-09-23)

Built to `basketball-seam-geometry.md`. `ball-seams.js` holds the geometry
and the bake; `Basketball.js` is the mesh; there is a new `ball` view with a
low, close pose that throws the court out of focus behind it.

**The seam network is three loops** — two exact great circles plus a wavy
loop near the ZX plane — meeting at six points with four seams at each,
which gives twelve edges and eight curved-triangular panels. Seams are baked
into equirectangular maps rather than modelled as tube geometry on the
sphere, per the spec: tubes z-fight at grazing angles and break the lighting
where they meet the surface, while one bake yields colour, roughness and
height together.

**Written with no DOM**, so the spec's verification runs headlessly against
the real module rather than a reimplementation
(`scratchpad/ball-verify.mjs`). All checks pass:

| check | result |
|---|---|
| samples on the unit sphere | worst \|len-1\| = 4.4e-16 |
| fast local search vs brute force | 0.00 rad disagreement |
| region count at A=0.30 | 8 |
| panel areas | 1.164 / 1.741 sr, ratio 1.50 (spec: 1.19 / 1.76, 1.48) |
| region count at the shipped A=0.34 | 8 |

The local search is worth keeping in mind: the wavy loop is a graph over the
azimuth in the XZ plane, so `atan2(z, x)` lands within a small window of the
nearest sample and a full scan of 2048 samples per texel is unnecessary.
Verified exactly equal to brute force before being relied on.

**The anchor comes out at `(0.656, -0.380, 0.652)`** where the spec lists
`(0.646, 0.405, 0.647)` — same magnitudes, same ~40 degree clearance,
differing in one sign because the bow direction decides which octants are
the large panels. It is computed rather than hard-coded, so it tracks `A`,
which is what the spec asks for. The containment test passes at every size
tried, and the bake refuses to place a mark that would cross a groove.

**Two things about making an emboss actually read**, both of which cost a
round:

- **Relief needs grazing light, not a head-on view.** Aiming the mark
  straight at a camera 4.5 degrees off the floor put it on the ball's
  equator facing sideways, where the overhead rig throws nothing across it
  — so a mark unambiguously present in the height map (confirmed by
  printing it as ASCII) showed as nothing at all. It is now turned to 36
  degrees of elevation: still well inside the silhouette from the low
  camera, now angled into the house lights.
- **A fully matte surface has no highlight for relief to break up.** The
  leather was at roughness ~0.91, which is defensible for composition
  leather and left the emboss invisible regardless of bump scale. Dropping
  to ~0.7 gave it a sheen and the mark appeared.

The mark shows only in the height and roughness maps, sharing the leather's
colour — moulded, not printed, which is what "embossed" means on a real
ball.

`logo-hero-gpu/logo-glyph.js` gained a `buildLogoMask` export beside its
existing SDF builder. Coverage is what an emboss wants, and deriving it back
out of a signed distance stored as a half float is a lossy way to ask a
simple question. Both share the flattening and scan conversion, so they
cannot disagree about the shape.

---

## Finalizing the flow (2026-10-12)

The pass that turned a set of views into an app: a landing you arrive at, a
way to find a game, a way to watch it, and a way back out. Plus three real
bugs, two of which had been on screen for weeks without being understood.

### The basketball is gone

Removed entirely — `Basketball.js`, `ball-seams.js`, `glass-material.js`,
`text-sdf.js`, and the `ball` pose/view. The spec it was built from was
followed faithfully and the geometry verified (the table above still
stands), but the result did not read as a real ball next to a court that
does. The embossing research survives where it is still useful:
`logo-hero-gpu/logo-glyph.js` keeps `buildLogoMask`, and now also exports
`logoRings()`, which is what `LandingLogo.js` extrudes.

### The deploy was broken, in two places at once

`@sparticuz/chromium` failed on Vercel with *"the input directory
`/var/task/node_modules/@sparticuz/chromium/bin` does not exist"*. Two
separate fixes, both needed:

1. `serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core']` — so
   the bundler stops relocating it.
2. `outputFileTracingIncludes` for the binaries. **On its own, (1) traced
   zero files out of `bin/`.**

The trap inside (2): the literal key `'/api/nba-live/summary/[gameId]'`
matches nothing. It has to be a glob (`'/api/nba-live/**'`), and a missing
include looks exactly like a working one until the function tries to launch
a browser in production. Verified by reading the `.nft.json` for all three
browser routes — 4 bin files each.

### Rebounds were being drawn at the wrong end of the floor

Measured before touching anything: **54 of 86 rebounds in a real game were
on the wrong side** — every defensive one. The cause is that a play's
coordinates are normalised to the team *in possession*, and a defensive
rebound's team attacks the other basket, so keying the mark off the play's
own `end` put it a full court away from the miss it came off.

`normalize.js` now tracks the last shooting play's `end` and exposes
`actionEnd` on each play; `live-markers.js` keys rebounds off that.
Re-measured after: **86 of 86 correct.**

### The letters were wrong, and my first two explanations were also wrong

John: *"the B in 'BOS' has an issue that makes it look like the upper
negative space in the letter is missing entirely."* I blamed extrusion
depth, then bevel geometry. Both wrong.

**The real cause was in the font file.** Montserrat's TTFs use
*self-overlapping* contours that rely on nonzero winding to resolve — the
bowl of a `B` is two overlapping strokes, not an outline plus two counters.
`ShapeUtils.triangulateShape`, which `ExtrudeGeometry` runs on every glyph,
has no winding rule and cannot resolve them, so it filled the counters
solid. `B` had 2 contours where it needs 3; `e` had 1 where it needs 2.

Fixed at build time rather than in the renderer:

```
Montserrat[wght].ttf
  → fontTools.varLib.instancer wght={400,700,900} --update-name-table
  → fontTools.ttLib.removeOverlaps          (skia-pathops)
  → scripts/ttf-to-typeface.mjs             (three's own TTFLoader algorithm)
```

`scripts/ttf-to-typeface.mjs` carries an `EXPECTED_CONTOURS` table and
**exits non-zero** if any glyph comes out with too few — the failure mode
here is silent and visual, so it needed a gate. Verified independently with
a point-in-triangle test against the real `ExtrudeGeometry`.

**Knock-on worth remembering:** `NUMERAL_INK_RATIO` in `ScoreboardText.js`
moved from 1.0581 to 1.0160 when the fonts were regenerated. It is a
*measured* value, not a derived one — any change to the font file invalidates
it, and the numerals would have been 4% oversized if it had been left alone.

### `{...defaults, ...options}` silently clobbers

An unset optional prop arrives as `undefined` and overwrites the default it
was supposed to fall through to. Every scoreboard panel had been plain white
and the frame's chair falloff had been quietly lost — through two rounds of
colour feedback that were therefore about the wrong thing.
`sign-material.js` now has a `withDefaults()` that skips `undefined` keys.
Worth looking for elsewhere.

### The site header eats clicks

The nav floats above this canvas and owns the top of the screen. An overlay
control placed at `top-4` looks fine and never receives a single event — the
"Replays" tab appeared dead for a while for exactly this reason. Everything
in the top band now sits at `top-20` / `pt-20`.

### Structure now

- **`LandingLogo.js`** — the JTD mark extruded in-scene, standing where the
  score numerals stand during a game (`z = -38`), same two-material
  treatment. Hole detection is by containment, not winding, for the same
  reason the typeface work landed there.
- **`GamesStrip.js`** (replaces `UpcomingGamesStrip` + `GameListOverlay`) —
  one full-width row along the bottom, tabs "Watch live" / "Replays". Live
  games sort to the front of the first; the second scrolls to its far end on
  mount, because that end is the most recent game.
- **`CourtMenu.js`** (replaces `SettingsFlyout`) — trigger carries the
  current team's logo rather than a gear, opening a full-screen grid of all
  thirty over a blurred court. Landing only.
- **`PlaybackSpeed.js`** — 0.5/1/2/4x, replays only.
- **`ProductTour.js`** — numbered tooltips with Previous / Next / Skip tour.
  Two step lists, picked by the current view, since the landing and a game
  share no controls at all. A step whose anchor isn't on screen is dropped
  *before* numbering, which is what makes the speed step disappear during a
  live game without leaving a gap. Anchors are `data-tour="…"` attributes on
  the real controls, re-measured every frame (the strip loads async and
  scrolls). Auto-runs once per browser, then only on request.
- **Lighting transitions** — `PostFX` takes a `fadeKey`
  (`${viewId}|${team}|${era}`) and ramps the composite to black and back,
  0.26s down / 0.5s up. Measured 70 → 21 → 79 in mean brightness.
- **Full bleed** — `fullBleed` page flag drops the site footer and pins the
  page to `100dvh` with no scroll.

### Timeouts: John's premise was wrong, the code was already right

Checked against the NBA rulebook. There is **no per-half timeout
allowance**. The seven are spread across the whole game, and what makes a
broadcast bug show two or three late is a *shrinking ceiling on how many may
still be held* — 4 max usable in Q4, 2 from the later of 3:00 left or the
second mandatory TV timeout, 2 more per overtime. `LiveHUD.js` already
implemented exactly this; the long comment there is the citation.

---

## The memory pass (2026-10-14)

John's laptop was being eaten alive while working on this. It was not the
scene. Measured before touching anything: **3,034 Chrome processes holding
22.3GB**, 424 of them orphaned headless browsers — and the dev server was
not even running at the time. Killing them took total RSS from 27.5GB to
3.8GB.

### Why there were 424 of them

`nba-browser.js` kept the browser in a module-level `let`, with a comment
calling it a singleton. **It was not one.** Next's dev server re-evaluates
server modules per request, so that variable resets every time. Measured
directly, with the browser count read off `ps` between calls:

| | browsers after |
|---|---|
| 3 sequential requests to one route | 3 |
| + touch a shared module | 4 |
| + touch the route file | 5 |

One browser per request, ~25MB each, and nothing ever closed them.
`puppeteer.launch()` detaches the child, so each one outlived not just the
request but the dev server itself — the oldest survivors were from two days
earlier, reparented to launchd.

### Three things were needed, not one

1. **`Symbol.for` on `globalThis`.** The only place that survives module
   re-evaluation. (Confirmed `globalThis` itself *is* shared across requests
   — same object identity, same pid — so this works.)
2. **Exit hooks that kill the child process.** `process.on('exit')` alone is
   not enough: Node does not emit it for a signal-terminated process, which
   is exactly how a dev server dies. The signal handlers re-raise so this
   doesn't take over Next's own shutdown.
3. **An idle timer**, so a server left running overnight isn't holding a
   Chromium.

### A latent bug that only surfaced once the singleton worked

The reuse path called `existing.isConnected()`. On puppeteer-core 25 that is
`browser.connected`, a property, not a method — so the call throws. Nobody
ever saw it, because **the path had never once executed**: there was never
an existing browser to check. Fixing the singleton turned every request
after the first into a 502. `isUsable()` now accepts both spellings.

The same shape of bug sat in the relaunch path: several callers awaiting one
dead promise would each start a replacement and orphan all but one.

**Verified after:** 5 sequential → 1 browser. 8 concurrent → 1 browser. Hot
reload of the shared module → 1. Hot reload of the route → 1. SIGTERM on the
dev server → 0 left behind. Request time also fell from ~690ms to ~35ms,
because the browser is finally being reused.

### The reaper

`scripts/reap-orphan-browsers.mjs`, wired to `predev`, for the cases that
skip exit handlers entirely (`kill -9`, a crash, a stranded child). Three
conditions, all required, so it can never take out a browser in use:
`--headless`, a temp-dir `--user-data-dir`, and **PPID 1** — a live
automation session still has its parent.

Tested both ways: a parent killed with `-9` leaves its browser alive with
PPID 1 (this is the real orphan mechanism, reproduced), the reaper killed
exactly that one, and a concurrently running live session survived.

### Client side: the court cache was unbounded

60 courts (30 clubs x 2 eras) at 2016x992 — 10.2MB each once mipmapped, plus
a CPU-built grain mask apiece. `loadCourt`'s `Map` never evicted, and the
court picker now shows all thirty marks at once, so clicking through them is
an obvious thing to do rather than a stress test.

Now LRU-capped at 8 with real disposal of both the texture and its mask.
Eviction never reaches the live court or the one being cross-faded out,
because those are by construction the two most recent entries.

Measured by patching `createTexture`/`deleteTexture` on the WebGL prototypes
before the canvas initialises — R3F v9 does not hang its state off the
canvas, so `renderer.info` is not reachable from outside:

| 16 team switches | GPU textures deleted | live textures | JS heap |
|---|---|---|---|
| unbounded (before) | 3 | 17 -> 47 | 74 -> 150MB |
| capped at 8 | 27 | 17 -> 23 | 50 -> 84MB |

That is ~2 leaked textures per court switch before, and this was only 16 of
the 60 courts.

### What was already fine

Worth recording so it isn't re-audited: every `addEventListener`,
`setInterval` and `requestAnimationFrame` in the experiment is balanced by
its teardown; `ResizeObserver`s disconnect; the PostFX and reflection render
targets are created once at 1x1 and `setSize`d rather than recreated, and
disposed on unmount; and `frameloop` already stops the loop entirely when
the tab is hidden or unfocused. The only per-frame allocation found was two
`THREE.Vector2`s behind the `?debug` flag, now hoisted.

---

## Card footer, control row, landing framing (2026-10-14)

- **Game cards are one fixed height** (measured: 171px on both tabs). The
  footer is two rows that never vary — when on the left and state on the
  right, call to action below — so switching tabs no longer makes the strip
  jump. The state slot says `Final`/`Final/OT`, or the live period and
  clock, or how near a scheduled game is: `Tonight` / `Today` / `Tomorrow` /
  `Upcoming`, split at 5pm because nearly every NBA game is an evening game
  and "Today" against a 7pm tip reads as already gone.
- **The card is no longer a button.** A scheduled game needs a *disabled*
  affordance, and a disabled button inside a clickable card is both a
  nesting violation and a lie about what is clickable. The CTA is now the
  card's only control.
- **`landing` is its own camera pose**, a copy of `wide` with `target.y` 12
  -> 8. `wide` is what a live game settles back to between plays, so the two
  were sharing a pose and moving the court on the landing moved it mid-game
  as well. Note `target.y`, not `elevation`, is the control: `solveDistance`
  fits the four floor corners, so aiming above the floor is what pushes it
  down the picture. Worth knowing when judging this: the court's *front*
  edge is behind the game strip either way, so only the back edge reads as
  movement — about 40px at 1280x800.
- **Overlay surfaces come from `overlay-surface.js`.** They had drifted to
  pure black across six files, which against a `#0b0d12` scene reads as a
  hole cut in the picture rather than a panel resting on it. Values, not
  Tailwind classes, because Tailwind only compiles class names it can find
  literally in the source — `bg-[${COLOR}]` silently compiles to nothing.
  Moving off black cost the panels their edges, so they carry a
  `ring-1 ring-white/10` hairline now; the speed selector read as loose text
  floating over the court without it.
- The tour trigger is a labelled **"How to use JTD Courtside"** button
  rather than a `?` in a corner, sharing the strip's control row with the
  tab switch (tour left, tabs right). In a game there is no strip, so it
  sits beside the way out, at a matched 40px height.

---

## Responsive framing, team badges, device tilt (2026-10-14)

### The camera solves its own vertical placement now

`solveFraming` replaces `solveDistance` at the call site. It returns
`{ dist, targetY }`, solved *together* and alternating, because each moves
the other: pulling back to fit a narrow viewport shifts where the floor
sits, and re-aiming to place the floor changes what has to fit. A pose
declares `framingY` — where the court's centre should land as a fraction of
frame height — instead of a hand-tuned `target[1]` that only held at the
aspect it was tuned at.

The aim is **bisected, not derived**. The camera's own height is
`sin(elevation) * dist` and does not follow `target[1]`, so changing the aim
pitches the camera rather than translating it, and aim-height to
screen-position is not the straight line it looks like. It is monotonic,
which is all bisection needs.

Verified against the real geometry at seven aspects from 1920x1080 to
844x390: the court's centre lands at **exactly 37.0%** (landing) and
**44.0%** (live), and the widest corner projects to **exactly 0.950** in NDC
— the `fill` margin — so the full width fits at every one.

**`minFitX` is gone.** It framed only the middle of the floor on narrow
viewports, which meant a phone never saw a whole court. It had no effect on
desktop aspects (the lerp saturated by ~1.35:1), so dropping it changes only
the case it was wrong for.

A caution for anyone measuring this by eye or by pixel: the rendered "wood"
includes the apron and arena surround well beyond the court's own corners,
and the game strip occludes the front edge. A screenshot-based reading of
the court centre comes out around 52% while the geometry is exactly 37%.
Trust the projection, not the pixels.

### The lockup needs headroom that a landscape phone does not have

`LandingLogo` scales with viewport height and hides below 440px. At 844x390
the court's back edge sits about 14% down the screen, leaving ~50px above
it — less than the mark alone needs at any scale worth rendering, and it was
running off the top of the screen entirely. Scaling the group shrinks it
*toward the floor*, since everything in it is positioned up from one
baseline.

### Team badges

Between the marker glyph and the description, in both the headline and the
feed. Resolved on **`teamId`, not `end`** — `end` says which basket the team
is attacking, which is the same question only until a defensive play comes
along. A defensive rebound is credited to the side *not* attacking that end,
and the badge now says so.

The badge uses the brand hex as shipped rather than `brandFill`'s dark band,
which costs a readable foreground: the league runs from Brooklyn's black to
Golden State's yellow. Split on relative luminance at 0.38 — only Golden
State (0.56) takes dark text, and the next brightest is Charlotte at 0.22,
so the threshold sits in a wide empty gap rather than near any team.

### Device tilt drives the parallax where there is a sensor

`use-device-tilt.js` writes into the same `{x, y}` ref the pointer does, so
nothing downstream knows the difference, and reports whether it has taken
over so the pointer handler can stand down — a phone fires both, and a tap
that jumped the camera would fight the tilt already driving it.

Three things that are not obvious:

- **Nobody holds a phone flat.** A comfortable reading angle already reports
  30-70 degrees of pitch, so zero-as-neutral pins the parallax to its limit
  and leaves it there. The first reading becomes neutral, and it drifts
  slowly toward how the device is actually being held.
- **Landscape swaps the axes**, and a half turn flips their signs;
  `screen.orientation.angle` says which.
- **`requestPermission` exists on desktop Chrome**, not just iOS Safari —
  confirmed by probing. So the gesture-gated path is the normal path
  everywhere, which is fine: a machine with no sensor simply never leaves
  pointer parallax. It also means a test that does not dispatch a touch
  measures nothing at all, which cost a confusing round of zero results.

Measured by holding a tilt and tracking the court's left edge across several
frames, since a single pixel-diff cannot separate parallax from the scene's
own animation:

| | edge shift |
|---|---|
| tilt -30 vs +30 | **50.4px** |
| control: -30 vs -30 again | 0.02px |
| mouse swept while tilt active | 0.03px (ignored) |
| mouse with no tilt present | 60.2px (still works) |

Sample sd was 0.03-0.05px. **Untested on real hardware**: the events are
synthetic and permission is stubbed, so the axis mapping for the 90/270/180
orientations is reasoned rather than measured.

---

## Framing against the overlays, and the mobile chrome (2026-10-14)

### The scene is framed into the band between the nav and the overlay

`solveFraming` now takes `topFraction` and `bottomFraction` — the shares of
the frame already spoken for by the site's floating nav and by the game
strip or score bug — and frames the scene into what is left between them.
Both are **measured from the DOM** (`[data-bottom-overlay]`, `header`) by a
ResizeObserver rather than carried as constants, because they genuinely
change shape: the strip's cards are shorter on a phone, and the score bug
grows when its feed is open.

This replaces a hand-tuned `framingY` per pose, which could not work: those
two overlays are a roughly fixed number of pixels, so together they are a
third of a laptop's height and three quarters of a landscape phone's. One
tuned number drove the court either underneath an overlay or down to a
third of the width it could have used.

### Three real bugs found by measuring instead of looking

1. **`LOGO_HEIGHT` is not a height.** It is a scale factor on a 41-unit
   viewBox whose glyphs only ink **17.06** of it. Reading it as the lockup's
   height reserved thirteen feet of empty air and shoved the whole scene
   down the frame. The landing's `fitTop` is now measured off `logoRings`.
2. **The scoreboard was under-reserved**, which is what clipped the tops of
   the scores: measured off the real `TextGeometry`, the numerals ink
   24.29ft and their labels reach **35.28ft** against the 33.2 I had
   estimated from the size constants, and three digits span 57.95ft so the
   pair reaches **x = 62.98** against 55.
3. **`solveDistance` was constraining the wrong thing vertically.** It
   measured `|ndc.y|` — distance from the *centre of the frame* — while
   `framingY` deliberately pushes the content off-centre. So offsetting the
   content upward made the solve pull back as though it had grown, and the
   court came out about half the size it could have been. It now constrains
   the content's **span**, with the horizontal axis still measured from the
   centre, where the content really is centred.

Verified by screenshot at eight breakpoints from 1920x1080 to 844x390, with
the DOM overlays hidden so only the canvas is measured: nothing is clipped,
and the air above the scene against the air below it runs 84-93% balanced on
tall viewports. Wide viewports sit lower (21-41%) because the court's glow
spills past the floor corners the fit is built from — the geometry itself is
exact, confirmed by projecting the fit box: wanted centre equals got centre
at every size.

**`AIR` is 0.12 and should stay small.** It is subtracted from a band that
is *already* the screen minus both overlays, so it compounds — at 0.16 the
court read as a postage stamp on a laptop.

### Depth of field has to scale with the camera

The band (2ft) and falloff (35ft) are in feet and were tuned at a laptop
aspect, where the rig sits about 130ft out. Fitting a whole court across a
phone's width pushes it past 380ft, and at that range the floor's own
near-to-far spread grows with it — so almost the entire scene fell beyond
full blur. The landing came out soft end to end on a phone and sharp on a
desktop from the same numbers. Both now scale by the focus distance against
a 130ft reference, which holds the *proportion* of the scene that is sharp
constant. Measured after: mean local contrast across the court band is 13.68
on a phone against 11.39 on a laptop.

### Mobile browser chrome

- The viewport meta moved from `_document` to `_app` (Next warns about it
  there, and a page cannot override it) and gained **`viewport-fit=cover`**,
  without which `env(safe-area-inset-*)` is always zero.
- `theme-color` is set on the court page, and `html`/`body` get the scene's
  background while it is mounted. The site stylesheet makes the body white,
  and **the body's colour is what a mobile browser samples to tint its
  address bar** — so the arena was ending in a white band top and bottom.
  `overscroll-behavior: none` stops the rubber band revealing it.
- `--strip-gap` is **px, not rem**. This stylesheet drops the root font size
  to 18px under 900px and 14px under 600px, so a rem gap shrank on exactly
  the screens that needed it: 34px on a laptop, 14px on a phone. Now 28px at
  every size measured, with the device's own bottom inset added on top.

### The card is a button again

The whole card is the control, with the call to action a `span` carrying the
card's hover state through `group-hover` — a nested button would be invalid
and would swallow the click meant for the card. Unplayable games stay a
plain `div`: a disabled wrapper would make the whole card a focus stop that
does nothing, and a scheduled game is a thing to read.

---

## Brightness, in-game controls, the viewport floor (2026-10-14)

- **Panels are brighter.** Score 0.7 -> 1.0, labels 0.6 -> 0.88, status
  0.76 -> 1.05, and the landing lockup 0.7 -> 1.0 so the two read as the
  same kind of sign in the same building. These multiply the panel colour
  rather than adding emissive, so it reads as the sign being driven harder,
  not as the scene being re-exposed.
- **One depth-of-field setting everywhere.** The landing was on the default
  2ft band while a game used 46ft, and the landing has the same problem for
  the same reason — its lockup stands exactly where the scoreboard does, so
  a band sized for a single subject blurred the entire back wall. Now one
  `FOCUS_RANGE`, which `PostFX` already scales by camera distance.
- **"Courtside" is half again as large** (size 7 -> 10.5), which moves the
  lockup's top from 26.4 to 29.3ft; the landing pose's `fitTop` follows.
  Both numbers are measured, not estimated — see the note on `LOGO_HEIGHT`
  in the previous entry for why estimating here goes wrong.
- **The tour button and the speed control moved into the score overlay**, as
  a row along its bottom. They had been in opposite top corners of the
  court, which put the two controls for watching a game as far from each
  other, and from the thing they act on, as the screen allows. `TourButton`
  grew a `bare` variant for sitting inside a surface that already has its
  own panel and hairline; `PlaybackSpeed` no longer positions itself.
- **A small-screen notice**, once per session, keyed on width rather than on
  a user-agent test — what matters is how much room there is, which is also
  true of a narrow desktop window and does not go stale the way a device
  list does. It does not block: the phone layout works, it is just that a
  94-foot floor across 390 points loses the detail the thing is about. The
  tour's auto-start is held back on those widths so the two don't stack.

### The bottom really was being cut off, and it was a CSS floor

`100vh` on mobile is the **large** viewport — the height with the address
bar hidden. The global stylesheet floors both `body` and `main` at
`min-height: 100vh`, so while the bar was showing those ancestors stayed
taller than the screen and anything pinned to the bottom sat below the fold.
A `100dvh` child cannot shrink past a `100vh` floor.

Full-bleed pages now clear that floor (a `.full-bleed` rule, plus the page's
own effect for `body`) and size to **`100svh`** — the small viewport, the
height with the browser's chrome at its largest. `dvh` tracks the bar as it
retracts, which also means it is momentarily taller than what can be seen;
`svh` is the one that is always reachable, and when the bar retracts the
extra simply becomes a little more room.

Verified structurally: every element from `html` down to the page's `main`
measures exactly the viewport height with `min-height: 0`, and
`scrollHeight === innerHeight`, at 390x844, 360x740 and 1280x800.

**Not verified on real hardware.** Headless Chrome has no browser chrome, so
`svh`, `lvh` and `dvh` all resolve to the same number there and the actual
address-bar and notch case cannot be reproduced locally. The structural
cause is removed, but it wants a look on a real phone.

---

## Courtside: the name, the listing, and a no-reflow overlay (2026-10-14)

### The score overlay no longer resizes the court

The call row used to render only once there was a play to put in it, so the
overlay grew by a row a second or two after a game opened. Because the
camera frames the scene into the band above that overlay, the reflow
*rescaled the whole court*. It now always renders, with "Waiting for
tip-off…" / "Starting playback…" as its empty state and the chevron dimmed
and disabled.

Measured across 158 samples from the moment the HUD appears: 3 rows and
exactly one distinct height (160px), spanning the empty state and the first
real play.

### LON is the London Lions, and the data is fine

A preseason exhibition against a British club (`season.type: 1`,
`"preseason"`), ESPN id `134478`. ESPN ships **no `logo` and no `color`**
for it — the fields are absent, not empty — where every NBA club has both.
So there is nothing to fetch and nothing to fix: `teamLogoUrl` returns null
because `espnAbbrToTeam('LON')` is not one of the thirty, and the neutral
gradient and bare abbreviation are the fallbacks doing their job. Worth
remembering before chasing it again.

### The experiment is called Courtside

`/experiments/nba-court` -> `/experiments/courtside`, with a permanent
redirect since the old path was shared while it was being built. There is
now an `/experiments` listing and a matching section on the homepage, built
on `utils/experiments.js` the way the case studies are — an entry without a
`thumbnail` renders as a text-only card, so a new experiment can be listed
the day it exists rather than the day its art is ready.

**`?game=` is now a URL parameter.** It is the only way to reach a specific
game without clicking through the strip, which is also what makes a given
moment reproducible — the thumbnail is a URL, not a lucky screenshot:

    /experiments/courtside?view=live&game=401898398&team=bos&replayfrom=0.965

`replayfrom` is a *fraction* of the play list, not an index (see
`useReplayFeed`). Two things to know if you re-render it: the feed keeps
advancing during the ~15s the scene takes to light, so the frame you land on
is several plays past where you started; and the drift is not quite
deterministic, so capturing a short series and picking the frame beats
trying to compute the offset. The shipped thumbnail is Boston 143,
Philadelphia 104, 4th quarter, 1:14 — Duke Miles's second free throw.

### Smaller things

- Court picker: logos doubled to 88px, labels to 17px, grid cells to 150px,
  and the grid centres itself vertically when it fits (`m-auto` inside a
  flex column) while still scrolling when it doesn't. Padding is symmetric
  `py-6`, which is what makes the centring exact — `pt-2`/`pb-8` left it
  24px out.
- `ExperimentCard` uses `object-contain`, not `cover`: the panel beside the
  text is tall and narrow, and cropping a 16:10 render to fill it cut the
  score — the most legible thing in the picture — off both edges. The
  render's background is the same colour as the panel, so the letterboxing
  is invisible.

---

## The score overlay on a phone (2026-10-14)

### The missing safe-area inset

The overlay's bottom gap was a flat `pb-4` — 16px, with no device inset.
Under `viewport-fit=cover` the page reaches *beneath* the home indicator, so
on a phone the last row (the tour button and the speed control) sat
underneath that bar and could not be read. The game strip had been given
`env(safe-area-inset-bottom)` and this had not; they now share the same
`--strip-gap` + inset expression, and the left/right insets too for
landscape.

Headless Chrome reports every safe-area inset as zero, so the real case
cannot be reproduced locally. Verified instead by injecting a 34px inset and
confirming the overlay moves up by **exactly 34px** — the layout responds to
the term, and the term is in the source. Still worth a look on a real phone.

### The feed is open by default on a phone

The call row truncates hard at that width, so the single line of context it
can show is often not the line you wanted, and there is no hover or tooltip
to recover the rest. Wide screens read the call in full and keep it closed.

Two details that matter: a `touched` flag means that once the viewer has
opened or closed it themselves a resize never overrules them; and the feed's
height cap is shorter on a phone (`max-h-40` against `sm:max-h-64`) because
this overlay's height is what the camera frames the court against — an
uncapped feed would squeeze the floor to a strip. Even so the overlay is
about a third of a phone screen when open, and the court is correspondingly
small. That is the trade this asks for.

`useNarrow` moved to `components/nba-court/use-narrow.js`, shared with the
game strip rather than duplicated.

---

## iOS bottom clipping, attempt three (2026-10-14)

Two fixes missed. Both were *assumptions* about how a browser lays itself
out, neither reproducible locally, and both wrong on the device:

1. `100svh` plus clearing the `min-height: 100vh` floors on `body`/`main`.
2. `env(safe-area-inset-bottom)` on the overlay.

A detail that should have redirected this sooner: it happens in **Safari and
Chrome alike on iPhone**, and Chrome on iOS is WebKit. It was never a
browser-specific bug, so a units-and-insets explanation was always a weak
fit.

### Measure, don't assume

The page is now sized from **`visualViewport.height`**, published as
`--app-height` by `useViewportHeight` in `Layout`, with `100svh` kept only
as a fallback where the API is missing. That number is not a guess about
chrome; it is what is on screen at that instant.

It listens to the visual viewport's `scroll` as well as its `resize`,
because on iOS the toolbar retracting fires **scroll**, and that is exactly
the moment the usable height changes.

The body is also **pinned** (`position: fixed`) rather than merely
`overflow: hidden`, which on iOS does not actually stop the document
scrolling — and any scroll is what lets the toolbar retract and shift the
visual viewport under a page that has already been laid out. This page is
one screen in every view, so it gives up nothing. Verified that ordinary
pages still scroll, keep a static body and never see `--app-height`, and
that leaving this page releases the pin and restores the white background.

### `?vp` prints the numbers

`ViewportReadout` exists because none of this is reproducible here —
headless Chrome has no browser chrome, so `svh`, `lvh`, `dvh` and every
safe-area inset all read identically. It pins a readout to the **top** of
the screen (the bottom is the thing under investigation) showing
`innerHeight`, `visualViewport` height/offsetTop/pageTop, each viewport
unit, `--app-height`, the panel's bottom against the visible height,
`safe-area-inset-bottom`, `scrollY` and the document's scroll height.

It measures the **panel**, not its wrapper: the wrapper is pinned to
`bottom: 0`, so its edge is the bottom of the box by definition and would
report "fine" while the panel inside sat under the toolbar.

If it is still wrong, that readout says which assumption is still off —
`--app-height` unset means the hook is not running; `safe-bottom` of 0 means
`viewport-fit=cover` is not applying; a non-zero `scrollY` or `offsetTop`
means the page is still moving.

---

## The score bug, rebuilt against broadcast practice (2026-10-14)

Worked from Justin Russo's 2023-24 ranking of NBA broadcast scorebugs. His
criteria, roughly: the score should dominate; timeouts, team fouls and bonus
all need to be present and countable; team colour and logos beat muted
design; the bonus marker is the thing nearly every real bug gets wrong, by
being tiny, vertical, or white-on-white.

### The hierarchy is inverted on purpose now

The score used to sit small under the play description, on the stated
argument that the in-scene scoreboard already carries it three storeys tall.
That argument holds until the camera turns, or the viewport is a phone — and
it was never true of the clock, the fouls or the bonus, none of which exist
anywhere else in the scene. The score is now the largest thing in the
overlay and each side sits on a panel of its own colour.

### Team fouls and bonus, counted from the play-by-play

ESPN reports neither. Both are derived, and the counting rules came from
**Rule 12 of the official rulebook**, not from the explainers — I checked
those first and they contradicted each other on both the last-two-minutes
case and overtime.

- Four team fouls per regulation period, so the fifth is penalised. **Three**
  in overtime.
- A team under quota gets one free foul in the last two minutes, whose
  practical effect — and what broadcasts show — is that inside two minutes
  the *second* foul of those two minutes puts a team in the penalty however
  few it has overall. Confirmed in the data: this game had teams in the
  penalty on only four fouls twice, both inside two minutes.
- Offensive fouls are **not** charged as team fouls; technicals are not
  common fouls charged as team fouls either; flagrant and clear-path fouls
  **are**.

`countsAsTeamFoul` therefore **excludes rather than allows**: anything ESPN
calls a foul counts unless it is a technical, an offensive foul, or the
duplicate `Offensive Foul Turnover` row emitted beside one. An allowlist
would silently drop an unfamiliar new type — which is exactly what happened
on the first attempt, where an allowlist of three types missed
`Personal Take Foul`, `Clear Path Foul` and `Flagrant Foul Type 1`.

**Attribution is by `teamId`, not by the play's `end`.** `end` is which
basket the play happened at, and for a foul that is the other team's.

### How it was checked

- Counted personal fouls the same way across 7 games and compared with each
  box score: 5 exact, 2 short by one. Both gaps were ESPN emitting an
  `Offensive Foul Turnover` with no paired `Offensive Foul` row — a category
  excluded from the team total anyway, so the bonus figure is unaffected.
- Then compared the *rendered* bug against an independent implementation of
  the rule at eight successive moments of a real game: **8/8**, including
  the bonus flags on both sides.
- Confirmed the flag is absent at 0 fouls, and that nothing overflows at
  390px.

One worry ruled out along the way: `usePlayFeed` returns
`livePlays.slice(0, revealed)` — index 0 onward — so jumping into a game
mid-way with `?replayfrom=` still counts the whole period's fouls rather
than only those since the jump.

### Deliberately absent

**No shot clock and no possession arrow.** ESPN publishes neither. The
hoop's on-court clock is already decorative and says so, but the score bug
is the one place people read real numbers, and a fabricated value there is
worse than an honest gap. Possession could be guessed from the last play's
team and would be wrong often enough to mislead.

Kept bottom-centre rather than moved to a corner, against the article's
advice: this is not an overlay on a live feed, so the bug is the primary
read rather than something to keep out of the way of play.

---

## The score stripe, made graphic (2026-10-14)

The bug's score band now looks like the game cards rather than like a
table: each team's mark bookends its end, cropped by the stripe, over a
gradient running that team's colour -> neutral -> the other team's.

- `scoreBandGradient` is **symmetric**, unlike a card row's. A card belongs
  to one team and reads left to right; this belongs to two facing each
  other, so the neutral middle is where the clock lives and neither side
  owns it. Both ends use `brandFill` for the same reason the cards do —
  shipped brand hex is jersey colour, and a logo on it disappears.
- The tricode **lost its coloured chip**. The stripe behind it is already
  that team's colour, so a second coloured badge on top was saying the same
  thing twice.
- Bookend marks are larger than the band and pulled past its edge, so they
  break three sides. They carry a drop shadow, because a mark drawn in the
  club's own colour would otherwise melt into the colour behind it, which
  is the club's own — the same thing the cards needed.

### A phone needed its own numbers

Two bookends at the wide inset eat 140 of a 390pt screen, and the first
attempt put the clock on top of the scores with the two bonus flags
overlapping each other in the middle. The marks shrink rather than
disappear (88 -> 62, inset 70 -> 40, band 66 -> 60) and the foul label drops
to "FLS", which is the difference between fitting and colliding.

Checked by measuring every leaf text node in the band and looking for actual
rectangle intersections at 360, 390, 430 and 1280 — **no collisions at any
width**, and the three columns stay in their own ranges. Worth keeping that
test shape in mind: `scrollWidth > clientWidth` is useless here, because the
bookends overflow *on purpose* and are clipped by `overflow-hidden`.

---

## The experiments hero, with a different glyph (2026-10-14)

`/experiments` uses the real `LogoHeroGPU` with the case-studies page's exact
props — `height="42vh"`, `animate={false}`, `tearEndsAt={0.9}`,
`contentLift={0.06}` — and differs only in the glyph its field is built
from. I first built a lookalike in SVG; that was wrong and got sent back,
correctly.

### Getting a stroked icon into a filled pipeline

`buildLogoSdf` flattens closed **filled** M/L/C/Z outlines and scan-converts
them with the nonzero rule. Lucide's `flask-conical` is a **stroked** icon
with elliptical arcs, so neither its curve types nor its fill model fit.

Converted once, offline (`flask-glyph.js` records the recipe): arcs to
cubics by the SVG spec's endpoint-to-centre parameterisation, each subpath
stroked at the icon's own 2-unit width with round caps and joins via
skia-pathops, the three unioned, simplified, emitted as cubics. Three
contours come out — the outer edge and the two areas the stroke encloses,
which nonzero reads as holes.

**Verified by pixel diff against the real stroked icon**: 100.2% of the ink
area and 135 differing pixels out of 230,400 (0.06%).

Two things cost time and are worth knowing:

- `stroke()` emits **conics**, which `simplify()` cannot take. Convert to
  quads first, then emit cubics.
- `buildLogoSdf` and `buildLogoMask` contain an **identical** line, `for
  (const d of LETTER_PATHS) {`. A replace aimed at the first one hit the
  wrong function and left `buildLogoMask` referencing an undeclared `paths`
  — a latent `ReferenceError` in a function with no current callers. The
  symptom was a field still drawing the logomark, oversized and cropped,
  because `viewBox` had taken effect and `paths` had not.

### A square glyph needs resizing, not just substituting

The field sizes a glyph by its **width**. The logomark is a wide 90x41; the
flask is a square 24x24, so at the same width it comes out well over twice
as tall. At full size the flasks overlapped into a solid slab that the
canvas clipped to a hard bottom line — **no ragged edge**, because that edge
is made of the gaps between marks and there were none.

Scaling by `41 / 90` — matching the logomark's *height* — restores it.
Area-matching (`sqrt(41/90)`) was tried and is too dense: the edge all but
disappears again. Measured across four widths: 187-209px of edge variation,
ragged at every one.

`pad` matters too. The scene default is 140 against a 1260px-wide glyph;
left there, the flask sat in a mostly-empty distance field and rendered as
a blob. Proportional padding (40) holds the shape.

---

## iOS clipping, attempt four — measure the overshoot (2026-10-14)

Three fixes had missed, all of them *predictions* about how the browser
lays itself out: `100svh` plus clearing the `min-height: 100vh` floors;
`env(safe-area-inset-bottom)` on the overlays; sizing from
`visualViewport.height` with the body pinned. Each helped a little and none
finished the job — the report after the third was "moved up a little, still
cut off a bit".

So this one stops predicting. `--vv-clip` is **how far the page container
still hangs below the visible area**, measured, and the two bottom overlays
add it to their own padding:

    calc(var(--strip-gap) + env(safe-area-inset-bottom, 0px) + var(--vv-clip, 0px))

Two properties make it safe:

- **It cannot over-correct.** It only ever reports a positive overshoot, so
  where the height is already right it is `0px` and nothing moves.
- **It cannot oscillate.** The box measured is the page container, whose
  bottom does not move when padding *inside* it changes. Measuring the
  overlay itself would feed its own output back into its input.

Verified by simulating the failure rather than waiting for a device: forcing
the container 200px taller than the visible area leaves the panel's bottom
exactly where it was, having absorbed the full 200px. On a desktop
`--vv-clip` reads `0px` and the layout is untouched.

Also re-reads on a short schedule (60ms, 250ms, 800ms, 2s) plus `pageshow`,
because iOS reports a stale height for a moment after load and after an
orientation change, while the toolbar settles. A measurement taken once, too
early, is its own version of a wrong prediction.

### A runtime error the build could not see

Swapping `brandBadge` for `brandBright` in the HUD's import replaced it
rather than adding to it, and `TeamBadge` still used the old one. `next
build` passed — it is a *runtime* `ReferenceError`, not a compile one — and
the screenshot checks looked like they were measuring a scene. They were
measuring the Next.js error overlay. Worth remembering that a green build
says nothing about a component that throws on render; only loading the page
does.

### Smaller things

- The beaten side's scoreboard panel is `0.34`, not `0`. Unlit against a
  dark arena is not a dimmed score, it is an absent one. The light it casts
  on the floor is scaled by the same ratio, or the sign reads as lit while
  the floor under it reads as dark. Measured after: 70 against 136 mean
  luminance between the two totals.
- Timeout notches use `brandBright`, a new variant that lifts the brand hue
  *above* the fill band rather than sitting in it. The shipped hex is within
  a step or two of the `brandFill` behind it, which at 3px wide is not
  enough to count them by.

---

## The call ticker, and two colour corrections (2026-10-14)

### The latest call hands over rather than cutting

The top row of the score bug now moves like a ticker: the outgoing call
slides up out of the window while the incoming one rises into its place,
both on `cubic-bezier(0.16, 1, 0.3, 1)` over 420ms. **The same curve for
both halves** — they are one strip of paper moving past a window, and giving
the outgoing line its own easing makes them slide at visibly different rates
and breaks the illusion.

The row's height is now fixed (50px, 44 on a phone). It has to be: the
camera frames the scene into the band above this overlay, so a row that grew
with its contents would rescale the court underneath it. It is also what
gives the old line somewhere to go.

Three things went wrong, in order, and each is worth remembering:

1. **A conditional hook.** `useCallTicker` went in beside the other
   derivations, which sit *below* `if (!active || !game) return null` — so it
   ran only on the renders that got that far. React counts that as a
   changing number of hooks and refuses outright.
2. **The effect cancelled its own animation.** It depended on `shown`, which
   it also set; the resulting re-run's cleanup cancelled the very frames it
   had just scheduled. Both lines mounted in position and never moved. It is
   driven by a *token* now, which only changes on a real handover, so the
   frames and the timeout survive long enough to do their work.
3. **One frame is not enough** to release the incoming line. The browser can
   coalesce the mount and the class change into a single style
   recalculation, and the line simply appears in place. Two nested
   `requestAnimationFrame`s.

Verified by sampling the computed transforms through a handover: `0/50 ->
-21/29 -> -37/13 -> -43/7 -> -46/4 -> -48/2 -> -50/0`, which is both the
lockstep travel and the deceleration. Under `prefers-reduced-motion` only
the two endpoints are ever seen.

### Two colours that were not pulling their weight

- **The miss marker.** `#ff4f42` measured 0.272 relative luminance against a
  0.522 mean for the other four marks — about half as bright, and on a lit
  parquet floor it read as a dark smudge where the green, amber and cyan all
  popped. Lifting it to the others' level gave `#ff877e`, which was bright
  enough and had gone pale — raising lightness at full saturation walks a
  hue toward white, and its channel spread fell from 189 to 129. Settled at
  the midpoint, `#ff6b60`: luminance 0.326, spread 159, brighter than it was
  and still unmistakably red. Shared by the floor marker and the HUD glyph,
  which had been two separate literals.
- **Skeleton rows** now run three cards past the edge rather than ending
  flush. A placeholder row that stops at the viewport says the list is that
  long, and then the real cards arrive and it runs off the screen. They are
  clipped, not scrollable — there is nothing at the far end to reach, and a
  row that scrolls through placeholders then snaps back when the real ones
  land.

### A build that passes says nothing

Twice in this pass `next build` compiled cleanly while the page threw on
render — once on the missing `brandBadge` import, once on the conditional
hook. Both times the screenshot checks looked like they were measuring a
scene and were measuring the Next.js error overlay. Any check here should
assert on `pageerror` as well as on pixels.

---

## Deployment pass on the new pages (2026-10-14)

### The fallback was rendering the wrong shape

The worst finding, and invisible on this machine: `LogoHeroGPU` falls back to
a pre-rendered image wherever WebGPU is missing, and the experiments header
was pointed at `COMPACT_FALLBACK_IMAGES` — the *logomark* renders. WebGPU is
Chrome/Edge desktop and Safari 18+ only, so most real visitors were seeing
JTD marks on a page whose whole header is meant to be flasks.

Found by stubbing `navigator.gpu` to `undefined` in `evaluateOnNewDocument`;
`--disable-features=WebGPU` does not actually turn it off.

The fix is `hero-flask-{wide,tall}.webp`, generated by the same script and
scene as the live hero. The settings moved to `flask-hero.js` so the page and
`scripts/generate-fallbacks.mjs` import *one* copy — that script's own header
says a fallback must not be able to drift from the real thing, and this is
exactly how it drifted.

### What else the audit turned up

Reported before changing anything, and the ones acted on:

- `<html lang>` was missing **site-wide**, not just here.
- The court page had no `h1` at all — it is a canvas — so it now carries a
  visually hidden one. The lockup in the scene is the title on screen, but
  it is geometry, not text.
- The scene canvas is `aria-hidden`. Everything a screen reader can use is
  in the DOM overlays; the canvas would announce as an unlabelled graphic.
  Worth knowing: R3F puts the attribute on its wrapper `div`, not on the
  `canvas`, so a check that reads the element's own attribute reports
  nothing while the subtree is correctly hidden.
- `ViewportReadout` is development-only now. It was built to diagnose the
  iOS clipping and had no env guard, so any visitor could summon it.
- `logo-hero` and `pomodoro` are `noindex, nofollow`. They are unlisted but
  still reachable, and `pomodoro` had no `<Head>` at all.

### The rest of the audit, closed

- **Both new routes are in the sitemap.** It is generated from `pages.json`,
  so metadata written inline in a component is invisible to it — which is
  exactly how they came to be missing. Both pages now read their title,
  description and image from their `pages.json` entry, which means a page
  cannot be added to the sitemap without also having metadata, or vice
  versa.
- **`og:image` on both, absolute.** A relative one is not resolved by most
  crawlers and the card comes back blank. `utils/site.js` holds the origin,
  defaulting to the real domain and overridable with `NEXT_PUBLIC_SITE_URL`
  so a preview deployment can point at itself — `DOMAIN`/`PROTOCOL` already
  exist but are read in `getServerSideProps`, so they are server-only.
- **Canonical tags site-wide**, built in `_app` from the route rather than
  written per page, so a new page cannot ship without one. `asPath` carries
  the query string and hash and both are stripped: leaving them would make
  every linked variant its own URL.
- **The thumbnail is WebP: 1247KB -> 57KB**, and social gets its own
  `courtside-og.jpg` at 1200x630. A square image is the wrong shape for a
  card — it gets cropped arbitrarily — and JPEG is the safest format for the
  platforms that render them.

### Left deliberately

- **Card text contrast is below AA** — 3.71 title, 2.90 body, 3.29 eyebrow
  against 4.5. The experiment card measures *identically* to the existing
  case-study card because it copies its palette, so this is a site-wide
  decision rather than a new-page fix.
- `/work` sets `og:image` with `name=` rather than `property=`, so Open
  Graph does not see it. Pre-existing, on an existing page.

---

## "Watch live" never showed a live game (2026-10-14)

ESPN keys its scoreboard by the **US** date. `games.js` computed "today"
with `getUTC*`.

An NBA evening game is already the next day in UTC before it has tipped off
— 7pm Eastern is 23:00 UTC, and a 10:30pm game runs past 03:00 UTC the
following day. So from late afternoon Eastern onward, "today" in UTC was
*tomorrow's* scoreboard, and because the upcoming window starts at today,
every game actually being played was filtered out before a request was made
for it. Observed directly at 20:08 ET: ESPN had two live games on
`20261014`, and the route fetched `20261015, 20261016, 20261020, ...` and
returned 30 scheduled, 0 live.

The window now formats dates in `America/New_York`, which is the date ESPN
itself is using.

**It also reaches back one day.** A game that tipped at 10pm Eastern is
still being played at 1am, by which point ESPN's own day has rolled over
while the game sits on yesterday's scoreboard — starting the window at today
would drop it at exactly the moment someone wants to watch it. It costs one
extra scoreboard fetch, and the status filter discards anything on that date
that has already finished.

Verified end to end against two real live games: the route returns
`live: 2` sorted to the front, the strip shows them first with a "Watch
live" call to action, and clicking one opens a genuine live game — Miami's
floor, the real score and clock, timeouts and bonus counted from the live
feed, and no speed control, since a live game arrives at the pace it is
being played.

This was invisible to every test written so far: each one replayed a
*finished* game by id, which never touches the date window.

---

## The landing keeps itself current (2026-10-14)

`useGamesList` polls every 30s. A live game's score, quarter and clock are
stale the moment they arrive, and a game that ends has to leave "Watch live"
on its own — the route already decides which tab a game belongs to from its
status, so a refetch is all that takes.

Three things had to be right for that to be worth anything:

- **`loading` is only true for the first load of a tab.** It drives the
  skeletons, so setting it on every refetch would blink the whole row twice
  a minute.
- **The scroll position is set once per visit to a tab, not once per
  update.** `games` has to be a dependency of that layout effect because
  `scrollWidth` is wrong until the cards exist — but with polling, every
  refresh would have yanked the Replays row back to its end while someone
  was reading it.
- **Polling stops when the tab is hidden**, and catches up immediately on
  return rather than waiting out another interval.

### The caching was wrong in two different ways

**`s-maxage` alone does not speak to the browser.** With no `max-age`,
Chrome fell back to heuristic freshness and served its own copy: the page
polled on schedule and redisplayed the same score for minutes while the
route itself was returning fresh ones. Confirmed by curling the route twice
35s apart and watching the clock advance while the browser's view did not.
`max-age=0` fixes that.

**`stale-while-revalidate` is right for the edge and wrong for this
client.** Chrome honours it by handing the *cached* body straight back to
the fetch and revalidating in the background — which is why every poll
produced exactly two requests and could still show a minute-old score. The
fetch now passes `cache: 'no-store'`, which keeps it out of the browser's
cache only; the edge keeps its 30s plus SWR, which matters because a miss
here costs several real browser navigations and someone would wait for them.

Worth knowing: that double request was visible in production too, so it was
never React's StrictMode — the obvious suspect, and the wrong one.

**Unverified locally:** `no-store` makes Chrome send `Cache-Control:
no-cache` as a *request* header, and this assumes Vercel's CDN ignores it
for `s-maxage` responses, as CDNs generally do. `next start` has no CDN, so
it cannot be checked here. If it were honoured, every poll would reach the
origin.

Measured end to end on a production build against six real live games: one
request per 30s, no skeleton flash, scroll position held at 300px across
polls, and the clock and score advancing between snapshots.

### Team order: already right

North American pro sports list the **away team first**, home second — the
convention that gives "AWAY @ HOME" — and basketball follows it. Checked
rather than assumed, and every surface here already matched: the card rows,
the score bug's band, the "X at Y" title, and the 3D scoreboard, which puts
home at `+SCORE_BENCH_X` and away at the negative. Nothing to change.

### Live games dropped half their on-court marks

Reported from watching a real game: the floor showed rebounds but very few
makes or misses, while the event list beside it had everything. The cause
was `usePlayWatcher` in `LiveGameOverlay`, which took `latestPlay` — one
play — and marked that. A replay reveals one play per tick so it never
noticed; a live poll hands over everything published since the last one.

Quantified before fixing, against game 401898398's real `wallclock` stamps
(542 plays):

- **46%** of three-second windows contain more than one play.
- So **48%** of plays never reached the floor.
- **98%** of the time, a shot and the rebound off it land in the same
  window — and the rebound is second, so the *shot* is what disappeared.
  That is exactly the reported symptom, and it is not a coincidence: ESPN
  publishes the pair together because they happen together.

**Polling faster does not help.** The same measurement at 1.5s still drops
47%. The plays are bunched in wall-clock time, not merely in our sampling
of it, so a shorter interval re-slices the same bursts. `POLL_MS` stays at
3000, matched to the route's `s-maxage=3`; the note there records this so
the interval doesn't get "optimised" later on the same wrong hunch.

The fix marks every play past a watermark of the last-marked
`actionNumber`, staggered 260ms apart so a shot and its rebound read as a
sequence rather than collapsing into one event — the mirror of the bug.
Capped at four per batch: a backgrounded tab can return with minutes of
basketball queued, and flushing it is worse than skipping it.

First sight of a feed takes the watermark **silently**, marking nothing.
Two reasons: joining a game in progress would otherwise carpet the floor
with its whole history, and `usePlayFeed` keeps the previous game's plays
while the next game's request is in flight, so marking there would drop a
play from the game you just left onto the court of the one you just opened.
Feed identity is the `gameId`, threaded down as `liveGameId` — needed
because a new game's action numbers can be *higher* than the old game's, in
which case a watermark alone reads the switch as a catch-up batch.

**Verified in a real browser**, not by inspection: a puppeteer run
intercepting `/api/nba-live/summary/*` to serve a game marked `live` whose
plays jump by three in one poll. All three marks appear on the floor
together — a green circle, a cyan arrow and a purple triangle — with the
HUD on the last of them. Replay checked separately for regression: still
one mark per tick, no console errors.

Two things worth knowing that came out of this:

- `next build` passing says nothing about runtime here. It passed on the
  `brandBadge` `ReferenceError` too. The browser check is the real gate.
- The client's plain `fetch` of the summary route was suspected of the
  stale-body problem `useGamesList` had. Measured: **0 of 6** polls served
  from Chrome's cache. The games route sets `max-age=0, swr=60`, which
  gives the browser an explicit stale window; this route sets no `max-age`
  at all, so no fresh lifetime is established and Chrome revalidates every
  time. No fix needed — but the two headers are not interchangeable.

### Background tabs filled the whole marker pool

Asked whether the four-per-batch cap also covers leaving the tab and coming
back. It did not, and the question found a **pre-existing** bug rather than
anything the batching work introduced.

Two timers disagreed about whether the page was running. R3F's render loop
is `requestAnimationFrame`, which a browser stops for a hidden page —
measured at **1 frame in 45 seconds**. `setInterval` is not stopped:
Chrome clamps hidden-tab timers to 1s, and only after the first five
minutes, so a 3s poll keeps its full rate. Measured: **15 polls in 45
seconds hidden, against 1 rendered frame.**

So the feed advanced into a scene that had stopped drawing. Marks were
spawned but never aged, so nothing ever reached `expireAt` and nothing was
released. They accumulated until the 12-slot pool was full, and returning
to the tab showed **all twelve at once**, scattered over the floor. The
per-batch cap can't help: it bounds one batch, and this is many batches
landing into a frozen scene.

Pre-existing because the old one-mark-per-poll code filled the same pool
from the same 15 polls, just more slowly. The batching change only makes it
fill faster; the end state was always the whole pool.

Fixed in `usePlayFeed` with a `useDocumentVisible` gate on both timers —
the live poll and the replay reveal — which is what `useGamesList` already
did and this hook never had. Catching up on return still happens and is
still capped: flipping back re-runs the poll effect, which fetches
immediately, and `LiveGameOverlay` caps the batch that arrives. Pausing a
replay is independently right — you return to where you left it rather than
to a game that ran on without you.

Measured after: **0 polls while hidden** (was 15), and three marks on
return (cap is four). Replay re-checked for regression, reaching the same
point in the game as before the change.

**Careful with the measurement here.** Counting pixels of a mark's colour
and dividing by a per-mark estimate said "~3 marks" when the screenshot
plainly showed twelve — these marks are small, semi-transparent and lit, so
a pixel count is not proportional to how many there are. The screenshot was
the thing that gave the right answer both times; the number was misleading
in both directions.

### Surfacing errors that `next/dynamic` swallows

Extracting the shared hooks and generalising `ProductTour` /
`SmallScreenNotice` for a second experiment broke Courtside completely — the
canvas never mounted, the page rendered as an empty dark rectangle — and
**everything reported success**: `next build` compiled, and the browser
logged no `pageerror`, no console error, and no failed request.

The cause was one line. `components/nba-court/overlay-surface.js` was changed
to re-export the panel colours from their new home:

```js
export { OVERLAY_RGB, ... } from '../webgl/overlay-surface'
```

`export ... from` forwards a binding without introducing it into the module's
own scope, and `CARD_BG` further down still interpolates `OVERLAY_RGB`. So
the module threw `ReferenceError: OVERLAY_RGB is not defined` on evaluation.
The fix is to import it as well as re-export it.

The interesting part is why nothing said so. `pages/experiments/courtside.js`
loads the viewer through `next/dynamic` with `ssr: false`, so the whole module
graph below it is evaluated **on the client, inside the dynamic loader**,
which catches the rejection and renders nothing. The build never evaluates it,
so the build passes.

**The technique that found it:** temporarily replace the `dynamic()` call with
a plain static import and run `next build`. That forces the same module graph
to evaluate during page-data collection, where a throw is a hard build error
with a real stack. It turned a silent blank page into
`ReferenceError: OVERLAY_RGB is not defined` in one run. Restore the dynamic
import afterwards — it is there so the three/R3F bundle doesn't travel with
every page.

Worth keeping, because this is the third time a passing `next build` has meant
nothing (see the `brandBadge` ReferenceError above), and the first time there
was a cheap way to make the build actually check.

---

## Backlog / ideas

(Open space for future feature and content ideas, not just live-game-mode.
See also the separate `project-nba-court-backlog` memory for the
rendering-specific queue — stanchion overhaul, backboard LEDs, lighting rig
rebuild, haze/DOF polish.)
