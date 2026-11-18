# Design

## Context

See proposal.md for why. What the code already gives us:

- **The calm period is already readable.** The walking simulation runs inside the bundle (`bundle/src/StageScene.ts` owns the `SimState`). `SimState.calmElapsed` (seconds of continuous calm in the current Fixation) and `state.config.calmSeconds` (default 3 s, per scenario) are public fields, and `updateFixation` in `src/sim/sim.ts` sets `calmElapsed` to 0 when a Fixation starts and on any non-calm tick (`input.strength !== 0` or leash past Rigid). `disengage()` fires on the tick where `calmElapsed >= calmSeconds` and sets `rewardWindow = { openedAt, closesAt }` (1.1 s by default). A "Leave It" Cue on food also calls `disengage()` while the Dog is fixated, with `calmElapsed` still below `calmSeconds`. `disengage()` does not reset `calmElapsed`, so it keeps its last value until the next Fixation starts. The close-view hand drill (`bundle/src/handDrillView.ts`) already draws a calm meter from `calmElapsed / calmSeconds`, which shows that this works. **No sim change is needed, not even a read-only one.** The HUD only reads these fields, which ADR 0002 and ADR 0003 allow: the sim's inputs, seed and outputs are untouched.
- **Only one Fixation at a time.** `dogMode` is a single value and `updateFixation` works on the one active Distractor, so two Fixations can never overlap. The telegraph needs no rule for simultaneous Fixations.
- **Check-ins are predictable from seeded state.** `updateCheckIn` starts a Check-in look (event `check-in-glance`) on the first tick where `dogMode === 'goal' && time >= nextCheckInAt`, then draws the next `nextCheckInAt` from `eventRng`. Running the guided first Stage for seeds 1 to 8 showed the look starts within one fixed step (1/60 s) of the stored `nextCheckInAt` whenever the Dog stays in `goal`. When the Dog is fixated, holding or returning at that time, the Check-in is put off and starts on the first tick the Dog is back in `goal`. That moment depends on play, so it can't be predicted honestly. Follow looks and Cue looks are caused by the player's own input. An unmarked Check-in look ends with no event.
- **Grades:** `PERFECT_MARK_SECONDS = 0.3`, `LATE_PRESS_SECONDS = 1.0`, `rewardWindowSeconds = 1.1`, `checkInWindow = 1.0`. They are graded from the window's start (`rewardWindow.openedAt`, `lookStartedAt`).
- **Feedback:** `src/hud/feedback.ts` (`FeedbackDecider`) picks one message per tick, and event Hints such as `leash-hint` enter it as top-priority candidates. The bundle sends `feedback` messages (never for `leash-hint`), and the shell (`App.tsx` `onMessage`) plays the sound with a pitch rate (`comboSemitones`, capped, tick sound only) and records `feedback:<kind>` in `seenHints` for `firstTime` messages outside the Taste Stage (`src/shell/ui/feedback.ts`, `feedbackBackends.ts`). The Perfect grade uses the medium tier (chime), which today always plays at rate 1. A platform that rejects a playback rate plays the sound at its own pitch.
- **First-Fixation Hint already exists.** The bundle sends the `stage-signal` `first-fixation` once per Stage. The shell maps it through `hintFor` (`src/shell/onboarding/hints.ts`) to the `marker` Hint ("Your Dog locked onto something. When it relaxes and disengages its gaze, tap Marker…"), shows it in `HintOverlay`, and records `marker` in `seenHints`, never in the Taste Stage. This is the same moment the approach ring first appears.
- **Dog record and sync:** `migrateRecord` in `src/shell/dogRecord.ts` reads every field explicitly with a default and drops unknown fields. Optional fields (`billing`, `completedWorlds`) were added without a `RECORD_VERSION` bump. The record syncs as one JSON value (`dogs.record`), and `resolve` in `src/shell/sync/merge.ts` takes the later `updatedAt` whole, then unions only listed growing fields. A new field therefore needs no Supabase column and follows last-write-wins unless it is listed.
- **Settings:** UI sounds, haptics and Appearance are device-local in `src/shell/ui/uiSettings.ts` (`leadmate.ui`). They are not in the Dog record and they survive a progress reset.
- **Recorded Stages** are every Stage except the Taste Stage (the `seenHints` gate in `App.tsx` checks only `route.name === 'taste'`), so the Daily Stage and the Rusty warm-up count. The guided first Stage is `route.name === 'first-stage'`.
- **Poste practice Node** (`poste-practice`) is a static shell Minigame (`PosteMinigameView.tsx`, `nodes/posteMinigame.ts`): hold Stop for `holdToSettle` (2 s) across 3 rounds. It has no Marker. The **guided first Stage** (`INTRO_NODE`, `FIRST_WALK` in `src/shell/onboarding/introNode.ts`) is a 36 m walking Stage with one Distractor. A probe over seeds 1 to 8 showed that stopping at Fixation always reaches the Disengagement about 3.0 s later with no missed opportunity. It is already the forgiving Distractor the proposal asks for, so no scenario change is needed.

## Goals / Non-Goals

**Goals:**
- A pure, tested HUD model of the telegraph (ring progress, Check-in arc, count-in beats) and of the Timing assist and how it progresses, read from existing `SimState` fields.
- Bundle drawing and shell sound/persistence wired through the existing bridge, with the debrief payload byte-identical at every assist level.

**Non-Goals:**
- **Footsteps or music locked to the Sintonía trot.** The app has no music or footstep audio today. Locking to the gait would need new assets and a beat clock sent across the WebView bridge, whose jitter would break the lock. It is also a movement reward, not a Marker beat. Deferred to its own change.
- Telegraphing close leash exercises (the hand drill already has its own calm meter and Marker hint), static Minigames other than the Poste practice, and looks the player causes (follow, Cue) or Check-ins that were put off.
- An announcement when the assist steps down or up. Steps are silent; an announcement can be added later as a new Feedback kind without changing the model.
- A haptic count-in. Ticks are sound only; a haptic beat can be added later.
- Analytics events. `add-product-analytics` isn't archived yet, so `product-analytics` has no spec to change. See Migration Plan.
- Any change to the calm period, windows, thresholds, `src/sim/` logic (`src/sim/messages.ts` bridge types are the only `src/sim/` file touched), scenario content or the debrief payload.

## Decisions

### 1. Read `SimState` directly through a narrow read-only view, with no sim exposure layer
`src/hud/telegraph.ts` takes a `TelegraphView = Readonly<Pick<SimState, 'time' | 'dogMode' | 'calmElapsed' | 'rewardWindow' | 'nextCheckInAt' | 'dogLookUntil' | 'lookStartedAt' | 'lookCause'>> & { calmSeconds: number }` and returns plain data (`{ ring: { shown, progress, phase: 'open' | 'closing' | 'landed' | 'good' | 'fading', snap } | null, checkInArc: {...} | null }`).
- *Why:* the fields already exist and the bundle already holds the state. A narrow `Readonly<Pick>` keeps the HUD from depending on, or writing to, anything else (ADR 0002), and tests can build the view without running the sim.
- *Alternative:* add a `telegraphSnapshot()` export in `src/sim/`. Rejected: it would add sim surface for no gain and put the "sim unchanged" promise at risk.
- **Snap detection:** the model keeps the previous tick's `calmElapsed` and `dogMode`. A drop in `calmElapsed` while `dogMode === 'fixated'` on both ticks is a restart, which gives the `snap` flag (draws a short snap effect, re-arms the ticks). The reset to 0 when a new Fixation starts (previous tick not fixated) is not a snap.
- **Landing:** a ring lands only on the tick a Reward Window opens with `calmElapsed >= calmSeconds` (a calm-period Disengagement) after a ring was being computed in this Fixation. It is `landed` while `time - openedAt <= 0.3`, then `good` until the window closes or the Marker hits. A window that opens with `calmElapsed < calmSeconds` (a "Leave It" Cue, even mid-ring) gets no landing and the ring fades.
- **Late ring:** the ring shows only for `progress >= 0.5`, but it still draws at the true progress, so it lands on the same frame.

### 2. Check-in arc only for Check-ins whose start is already decided
Show the arc when `dogMode === 'goal'`, `nextCheckInAt > time`, `nextCheckInAt - time <= lead(level)` (0.9 s at Full and Ring only, 0.45 s at Late ring, none at Off) and `dogLookUntil <= nextCheckInAt` (the Dog won't already be looking, so the Check-in starts a new gradable look). The arc lands on the tick the sim actually starts a `glance` look (`lookStartedAt === time && lookCause === 'glance'`), never on the predicted time. If `dogMode` leaves `goal`, or another look starts first (so `dogLookUntil > nextCheckInAt`), the arc fades without landing. Check-ins that were put off, follow looks and Cue looks get no arc.
- *Why:* it reads only the seeded schedule the sim already committed to and never draws from `eventRng`. Landing on the real look start means the landing frame is always exact; the prediction only sets when the build-up starts, and it is right to within one fixed step in every case the arc is shown.
- *Alternative:* key the arc to the Dog's head-turn onset. Rejected: the look and the grade's window start on the same tick, so there is no onset before it to telegraph without adding sim behaviour.

### 3. Count-in ticks at quarter beats, played by the shell
The beats sit at `calmSeconds × {1/4, 2/4, 3/4}`, with the Disengagement on the fourth. `beatsCrossed(prevElapsed, elapsed, calmSeconds)` returns the beats crossed this tick. A restart re-arms them. The bundle sends a new fire-and-forget `telegraph-tick` message (`{ beat: 1 | 2 | 3 }`), and the shell plays the existing `tick` asset at a fixed lower pitch (-5 semitones) and lower volume. That keeps it distinct from Combo ticks and puts it under the UI sound setting, with no haptic. On a platform that rejects the rate, the lower volume is what sets it apart.
- *Why:* all Stage audio already lives in the shell with the sound setting. Bridge latency (tens of ms) is fine for a count-in, because the beat itself is the visual landing, drawn in the bundle on the exact tick.
- *Alternative:* WebAudio in the bundle. Rejected: it would duplicate the sound setting and the asset loading.

### 4. Timing assist model: pure reducer in `src/hud/markerAssist.ts`
`type AssistLevel = 'full' | 'ring' | 'late' | 'off'` and `type AssistState = { level; successRun; failRun }`. `applyOutcome(state, outcome): AssistState` handles `outcome ∈ 'success' | 'failure' | 'neutral'`: a success adds to `successRun` and clears `failRun`; a failure adds to `failRun` and clears `successRun`; a neutral outcome changes nothing (it neither counts nor breaks a run). Three successes step down, two failures step up, both runs reset on a change, and the level is clamped at both ends (runs still reset when the clamp holds the level). `effectiveLevel(state, { alwaysFull, guidedFirstStage }) = 'full'` when either flag is set. With `alwaysFull`, `applyOutcome` is not called at all, so the stored state stays frozen. In the guided first Stage outcomes do count.
- `assistOutcomeOf(event, ctx)` maps sim events: `marker-hit` and `check-in-hit` (any grade) are success. `marker-miss` and `marker-late` are failure, except that `marker-miss` is neutral when the Stage's Mark budget was already spent (the player could not press). `marker-reactive` is failure only if the calm period was under way (`dogMode === 'fixated' && calmElapsed > 0`) at the press, whether or not the ring is drawn at the current level. Everything else (`missed-opportunity`, `marker-wasted`, an unmarked Check-in) is neutral.
- Only walking Stages that run the telegraph feed the model. Close leash exercises, Minigames, the Poste practice and the Taste Stage never change it.
- **Applying changes only between approaches:** the scene samples the effective level when a Fixation starts (and for the Check-in arc when it begins building), so a level change never alters a ring that is already on screen.
- *Why 3 down and 2 up:* the assist fades on clear competence and comes back quickly on frustration. Resetting the runs after each change gives hysteresis against bouncing between levels. These are tunable constants (`ASSIST_STEP_DOWN_RUN`, `ASSIST_STEP_UP_RUN`) and can be tuned after playtesting or once analytics exist.
- *Alternative:* step by World number. Rejected by the user: progression must follow the player's own results.

### 5. Persistence: Dog record field, bridge messages, recorded Stages only
- `DogRecord.markerAssist?: AssistState`. A missing or invalid value reads as `{ level: 'full', successRun: 0, failRun: 0 }` in `migrateRecord`, which needs no `RECORD_VERSION` bump because it reads fields with defaults, as `billing` and `completedWorlds` did. `newDogRecord` sets it, so a progress reset clears it with the rest of the record. Existing Dogs start at Full.
- **Sync:** the field is not listed in `resolve`, so it follows the whole-record last-write-wins rule (ADR 0006). Losing a run or a level on a conflict is harmless: the assist re-settles within a few marks. An older build drops the field when it rewrites the record, which reads back as Full: also harmless.
- `start` message (`src/sim/messages.ts`) gains `markerAssist?: AssistState`, `alwaysTimingHelp?: boolean` and `guidedFirstStage?: boolean`, sent by `startStage` in `App.tsx` (`guidedFirstStage` is `route.name === 'first-stage'`). The bundle sends `marker-assist` (`{ state: AssistState }`) on every change. The shell writes it to the Dog record only in recorded Stages, through the same `route.name !== 'taste'` gate that `firstTime` Hints use, so the Daily Stage and the Rusty warm-up count. `decode` validates the new message shapes.
- The setting `alwaysTimingHelp: boolean` (default false) is added to `UiSettings`, so it is device-local and survives a reset, like sounds and haptics. It takes effect from the next Stage.
- *Why the Dog record and not device-local:* the assist describes how well this user reads this Dog, so it travels with the Dog to a second device and is cleared by a progress reset, like `seenHints`. The setting, by contrast, is a device accessibility choice.
- *Why not the debrief payload:* the payload must stay byte-identical, and the assist is not a Learning Attribute, so ADR 0003's payload-driven update does not apply.
- *Why per change, not at Stage end:* a quit mid-Stage still keeps what was learned (as with `seenHints`), and it works the same for short Encounters (`split-walks-into-encounters`), where each instant retry starts from the latest record.

### 6. Perfect run pitch in the HUD, played by the shell
`FeedbackDecider` keeps `perfectRun` (Perfects in a row; not a Streak or a Combo). It starts at 0 each Stage. A Marker press graded Perfect (`marker-hit` or `check-in-hit`) increments it. Any other Marker outcome (`marker-hit`/`check-in-hit` Good, `marker-miss`, `marker-late`, `marker-reactive`, `marker-wasted`) resets it to 0. `missed-opportunity` and unmarked Check-ins don't touch it. The `feedback` message gains an optional `perfectRun` (an integer of 1 or more), set on the message shown for a Perfect press, including when that message is a more specific kind such as `change-check-in`. The shell sets `rate = 2^(comboSemitones(perfectRun)/12)` for that message's sound, whichever tier sound plays; for all other messages the existing Combo rate on the tick sound is unchanged. The existing Combo merging is unchanged.

### 7. Rhythm Hint through the existing first-Fixation Hint
The rhythm Hint replaces the text of the existing first-Fixation Hint when the telegraph is at effective Full, instead of adding a second Hint in the Feedback Message slot. The `stage-signal` `first-fixation` gains an optional `assist?: AssistLevel` (the effective level the bundle sampled for that Fixation). A new `HintId` `marker-rhythm` with text `onboarding.hint.markerRhythm` (es and en, e.g. "Stop and wait for the ring to close, then tap Marker.") is chosen by `hintFor` when `assist === 'full'` and `marker-rhythm` is not in `seenHints`; it records both `marker-rhythm` and `marker`. Otherwise the old `marker` Hint rule applies unchanged. It is never shown in the Taste Stage (existing gate), and it has no short form.
- *Why:* both Hints fire at the same moment for the same job. Showing "Stop" at the Fixation start is also when the user needs it, while a Hint at the first closing ring would come after they had already stopped. This reuses the shell's Hint path and `seenHints` recording and needs no new Feedback kind in `src/sim/feedbackKinds.ts`.
- *Alternative:* a `rhythm-hint` candidate in `FeedbackDecider`, as first drafted. Rejected: it would show two Hints at once for a new user and need a new Feedback kind in `src/sim/`.
- An existing Dog that saw `marker` but not `marker-rhythm` sees the rhythm Hint at its next first Fixation at Full, which explains the ring it is meeting for the first time.

### 8. Drawing in `StageScene`
- The ring is a Phaser `Graphics` circle on the world layer at the Dog's projected ground position. Its radius is lerped from `RING_OPEN` (about 3× the Dog footprint) to `RING_CLOSED` (the footprint). Its stroke is solid while closing. The landed look is a filled disc pulse, and the Good look is a thin dashed ring that empties as the window runs out. Landed and Good differ by shape and fill, not colour alone. Colours come from `tokens.generated.ts`.
- The Check-in arc is a small arc at the Dog's head, using the same progress logic.
- Reduced motion (`StageOptions.reducedMotion`): a fixed-radius ring whose arc fills clockwise with `progress`. A snap becomes a 150 ms fade to empty. There is no pulse, and the Marker highlight is a steady outline.
- The Marker highlight is an outline ring drawn outside the button radius, which leaves the hit area unchanged, during the Perfect span of a Reward Window that the ring landed on or of a Check-in look the arc landed on. It is drawn in the existing Marker draw block.
- While paused, `StageScene` skips its update, so the ring, arc and highlight stay as they were and no tick is sent.
- Redraws go through the existing dirty/quantize helpers (`src/hud/dirty.ts`), with progress quantized to about 60 steps, so idle frames don't redraw (power-efficiency).

### 9. Poste practice ring in the shell
`posteRingProgress(state) = clamp(held / holdToSettle)`, with a phase of `landed` on a `settled` outcome and a snap on `released`, as a pure helper next to `posteMinigame.ts`. `PosteMinigameView` draws it around the Dog in `LeashScene` with react-native-svg, and the reduced-motion form comes through the existing motion gate. It ignores the assist level and never writes it.

## Risks / Trade-offs

- [The telegraph turns marking into following a UI ring instead of reading the Dog] → The assist fades on the player's own results down to Off. The ring is centred on the Dog so the eyes stay on the Dog. Analytics (later) will check that players actually get to Off.
- [Telegraphed Check-ins teach a timing that real dogs don't have] → The arc is small and short (0.9 s at most), it disappears at Off and shrinks at Late ring, and Check-ins that were put off stay untelegraphed. That's honest about what the game can and can't know.
- [Bridge latency makes the ticks drift from the visual] → The ticks only count in. The scored beat is the visual landing drawn on the exact sim tick. Ticks are fire-and-forget and never gate anything.
- [A silent level change confuses the player mid-Stage] → It applies only from the next approach. An announcement can be added later as a Feedback kind.
- [Payload or determinism regression] → A test runs the same seed and inputs with the telegraph computed at every level, with "always show timing help", and with it disabled, and asserts identical payloads. `payloadBaseline.test.ts` stays green.
- [Extra draw cost on low-end phones] → One `Graphics` object, redrawn only when the quantized progress changes, and hidden when nothing is telegraphed.
- [Sync conflicts on `markerAssist`] → It follows the record's whole-record last-write-wins rule, and losing a run or a level is harmless.
- [`add-product-analytics` also modifies "Section grouping by area" in `settings-screen`] → Whichever change archives second rebases its MODIFIED text to name both switches (see tasks).

## Migration Plan

- Existing Dogs have no `markerAssist`, so they read as Full. They meet the ring (and, if `marker-rhythm` is unseen, the rhythm Hint) once and step down after three good Marker hits. No record version bump.
- Rollback: drop the `start` fields, the `marker-rhythm` Hint and the drawing. Older builds' `migrateRecord` drops the record field, which is harmless, and the payload never changed.
- Analytics follow-up: once `add-product-analytics` is archived, a separate change adds a mark-grade event carrying `assistLevel`, sourced in the shell from the `feedback` and `marker-assist` messages. Nothing in this change blocks that.

## Open Questions

- The final values for the 3-down/2-up runs, `RING_OPEN`, the Late ring threshold (0.5) and the Check-in lead (0.9 s / 0.45 s) are first guesses, to be tuned in playtesting. They are named constants in `src/hud/`, not spec promises beyond the scenarios.

## Grilling decisions

Questions raised against GLOSSARY.md, the ADRs, the main specs and the code, each resolved with the recommended (or most conservative, reversible) answer.

| # | Question | Answer taken | Why |
|---|---|---|---|
| 1 | Announce assist steps? | No, silent | Already decided default; can be added later as a Feedback kind. |
| 2 | Step-down/up run lengths and ring sizes fixed in spec? | 3 down / 2 up and ring sizes are tunable constants | Already decided; scenarios pin the starting values only. |
| 3 | Where do existing Dogs start? | Full | Already decided; missing field reads as Full. |
| 4 | Trot-locked music/footsteps in scope? | No, stays a non-goal | Already decided. |
| 5 | "Check-in cue" clashes with the glossary's Cue (a Handler signal). Rename? | Yes: "Check-in arc" | Avoids implying a Cue; describes what is drawn. |
| 6 | "Glance" is an _Avoid_ word for Check-in. | Use Check-in / Check-in look in specs; `check-in-glance` stays a code event name | Keeps spec prose on canonical terms. |
| 7 | "Mark" means one unit of the Mark budget, yet the spec says "good marks". | Say "Marker hits"/"Marker presses graded Perfect" | Avoids clashing with the Mark budget term. |
| 8 | "Perfect streak" clashes with the daily Streak (and Combo avoids "streak"). | Rename to "Perfects in a row" / `perfectRun` | Streak is reserved for the daily habit. |
| 9 | New glossary terms needed? | Approach ring and Timing assist (with its four levels) proposed; Check-in arc, count-in tick and Marker highlight stay design terms | Only terms a player or designer will use across features earn an entry. |
| 10 | Does the HUD reading `SimState` break ADR 0002/0003? | No: read-only `Readonly<Pick>` view, no sim writes, no RNG draws | Seed, inputs and payload are unchanged; the hand drill already does this. |
| 11 | Does `src/sim/` change? | Only `messages.ts` bridge types; no sim logic, no `feedbackKinds.ts` | Keeps the "sim unchanged" promise checkable. |
| 12 | New Dog record field without a version bump: safe for sync? | Yes; whole-record LWW, no Supabase column, older builds drop it to Full | `migrateRecord` reads with defaults; record syncs as one JSON value. |
| 13 | Should sync merge `markerAssist` specially (e.g. take the lower level)? | No, plain LWW | Harmless to lose; avoids new merge code. |
| 14 | Is the Check-in arc deterministic enough? | Land on the sim's real look start; only the build-up uses the prediction; fade if the Dog leaves its Drive or another look starts | Landing frame is always exact; no false landing. |
| 15 | Verify the Check-in prediction beyond the guided first Stage? | Yes: sim-backed test over the guided first Stage, a Daily Stage and a scent Stage, seeds 1 to 8 | One scenario is a thin base for a timing claim. |
| 16 | The reset to 0 at a new Fixation looks like a snap. | Snap only when fixated on both ticks | Avoids a false snap on each new Fixation. |
| 17 | A "Leave It" mid-ring opens a window after a showing ring: landing? | No: landing needs `calmElapsed >= calmSeconds` when the window opens | Only calm-period Disengagements are telegraphed beats. |
| 18 | Simultaneous Fixations? | Not possible; one Fixation at a time in the sim | No rule needed. |
| 19 | Does a neutral outcome break a run? A failure clear the success run? | Neutral neither counts nor breaks; success and failure clear each other | "In a row" means consecutive scored outcomes. |
| 20 | Early (reactive) press at Late ring/Off when no ring is drawn? | Counts as failure whenever the calm period is under way | Rule independent of level; it is still a timing error. |
| 21 | Reward Window missed because the Mark budget is spent? | Neutral | The player could not press; not a timing failure. |
| 22 | Do the Daily Stage and Rusty warm-up change the assist? | Yes, like `seenHints` (all Stages but the Taste Stage) | The assist is player skill, not a Learning Attribute. |
| 23 | Do close exercises, Minigames or the Poste practice change the assist? | No | Only telegraphed walking Stages feed it. |
| 24 | Rhythm Hint in the Feedback slot vs the existing first-Fixation Marker Hint at the same moment? | Rhythm text replaces the first-Fixation Hint at effective Full; records `marker-rhythm` and `marker` | One Hint at a time, shown when "Stop" is useful, no new sim Feedback kind. |
| 25 | Rhythm Hint use `{name}`? | No | The first-Fixation Hint path has no name substitution; keeps scope small. |
| 26 | Does the Perfect run carry across Stages or time gaps? | No time limit inside a Stage; resets at each Stage start | Matches `FeedbackDecider`'s per-Stage life. |
| 27 | Perfect press shown as `change-check-in`: pitch rise? | Yes, on whatever message is shown for the Perfect press | The sound the player hears is what should rise. |
| 28 | Count-in tick on a platform that can't change pitch? | Lower volume distinguishes it | Avoids a new asset; existing backend falls back to fixed pitch. |
| 29 | Haptic count-in for sound-off players? | No (non-goal for now) | Scope; can be added later. |
| 30 | Marker highlight for Check-ins too? | Yes, on Check-in looks the arc landed on, at Full | Spec already promised it; design now matches. |
| 31 | Pause mid-approach? | Ring, arc and highlight freeze; no tick until resume | `StageScene` skips its update while paused. |
| 32 | Reduced motion and colour-blind reading? | Keep fill-ring, fade snap, steady highlight; landed vs Good by shape/fill | Already designed; unchanged. |
| 33 | Settings change mid-Stage? | Applies from the next Stage | Simple, matches the spec's setting scenario. |
| 34 | Analytics in this change (proposal Impact listed it)? | No; follow-up after `add-product-analytics` is archived | No spec to modify yet. |
| 35 | Both this change and `add-product-analytics` MODIFY "Section grouping by area". | Second to archive rebases the text to include both switches | Avoids one archive silently dropping the other's edit. |
| 36 | ADR for keeping the Timing assist in the Dog record, outside the payload? | Proposed as ADR 0034 (not written here) | Hard to move later, surprising next to ADR 0003, real trade-off. |
