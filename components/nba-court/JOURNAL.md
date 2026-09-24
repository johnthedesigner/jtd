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

## Backlog / ideas

(Open space for future feature and content ideas, not just live-game-mode.
See also the separate `project-nba-court-backlog` memory for the
rendering-specific queue — stanchion overhaul, backboard LEDs, lighting rig
rebuild, haze/DOF polish.)
