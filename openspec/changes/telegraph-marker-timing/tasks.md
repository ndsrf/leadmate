# Tasks

## 1. Timing assist model (pure, test-first)

- [x] 1.1 Write failing tests in `src/hud/markerAssist.test.ts` for `applyOutcome`: three successes step Full→Ring→Late→Off, two failures step back up, runs reset on a level change (also when the clamp holds the level), a success clears the failure run, a failure clears the success run, neutral outcomes neither count nor break a run, clamping at Full and Off. Verify: `npx jest src/hud/markerAssist` fails for the right reason.
- [x] 1.2 Implement `AssistLevel`, `AssistState`, `DEFAULT_ASSIST`, the tunable constants `ASSIST_STEP_DOWN_RUN = 3` and `ASSIST_STEP_UP_RUN = 2`, and `applyOutcome` in `src/hud/markerAssist.ts`. Verify: the 1.1 tests pass.
- [x] 1.3 Add tests and then `effectiveLevel(state, { alwaysFull, guidedFirstStage })` (Full when either flag is set, otherwise the stored level). Verify: tests pass.
- [x] 1.4 Add tests and then `assistOutcomeOf(event, ctx)`: hits of any grade count as success; `marker-miss` and `marker-late` as failure, except `marker-miss` with the Mark budget spent, which is neutral; `marker-reactive` as failure only while the calm period is under way (fixated with `calmElapsed > 0`), at every level; everything else including `missed-opportunity` and `marker-wasted` as neutral. Verify: tests pass.

## 2. Telegraph model (pure, test-first)

- [ ] 2.1 Write failing tests in `src/hud/telegraph.test.ts` for ring progress: `calmElapsed / calmSeconds` mapping (1.5/3 → 0.5, 4 s calm period), open ring while fixated with no calm yet at Full/Ring, no ring at Late below 0.5, no ring at Off. Verify: tests fail.
- [ ] 2.2 Implement `TelegraphView` (a `Readonly<Pick>` of `SimState` plus `calmSeconds`) and the ring part of the telegraph model in `src/hud/telegraph.ts`. Verify: the 2.1 tests pass.
- [ ] 2.3 Add tests and then the phase logic: a drop in `calmElapsed` while fixated on both ticks gives a snap, and the reset at a new Fixation does not; a Reward Window that opens with `calmElapsed >= calmSeconds` after a ring gives `landed` for 0.3 s, then `good` until it closes; a window that opens with `calmElapsed < calmSeconds` (Leave It, also mid-ring) gives no landing and fades the ring; a Fixation that ends without a window fades the ring. Verify: tests pass.
- [ ] 2.4 Add tests and then `beatsCrossed(prev, elapsed, calmSeconds)`: beats at 1/4, 2/4 and 3/4, each reported once, re-armed after a restart, none while paused (no elapsed change). Verify: tests pass.
- [ ] 2.5 Add tests and then the Check-in arc: building only when `dogMode === 'goal'`, `0 < nextCheckInAt - time <= lead(level)` (0.9 s at Full/Ring, 0.45 s at Late, none at Off) and `dogLookUntil <= nextCheckInAt`; landing on the tick a `glance` look starts (`lookStartedAt === time`, `lookCause === 'glance'`); fading when `dogMode` leaves `goal` or another look starts first. Verify: tests pass.
- [ ] 2.6 Add a sim-backed test: run the guided first Stage scenario, a Daily Stage generated scenario and a scent Stage scenario for seeds 1 to 8, compute the telegraph every tick, and assert that every Check-in arc that lands does so on a `check-in-glance` tick, that every building arc that does not fade is followed by one within one fixed step of its predicted time, and that every ring `landed` frame equals a `disengagement` tick. Verify: test passes.

## 3. Feedback addition (pure, test-first)

- [ ] 3.1 Add tests to `src/hud/feedback.test.ts` and then `perfectRun` in `FeedbackDecider`: it increments on Perfect hits regardless of time between them inside a Stage, starts at 0 in a new decider, resets on Good, miss, Late, reactive and wasted, is not touched by `missed-opportunity`, and is carried on the message shown for the Perfect press (also when that is `change-check-in`). The existing Combo tests stay green. Verify: `npx jest src/hud/feedback` passes.

## 4. Bridge contract

- [x] 4.1 Extend `src/sim/messages.ts`: the `start` fields `markerAssist`, `alwaysTimingHelp` and `guidedFirstStage`; the bundle messages `telegraph-tick` (`beat` 1 to 3) and `marker-assist` (`state`); optional `perfectRun` on `feedback`; optional `assist` on `stage-signal` (for `first-fixation`); `decode` validation for each. Add tests that reject malformed shapes. Verify: `npx jest src/sim/messages` passes and no file under `src/sim/` other than `messages.ts` and its test changed.

## 5. Shell persistence, Hint and settings

- [ ] 5.1 Add `markerAssist` to `DogRecord`, `newDogRecord` and `migrateRecord`, so missing or invalid values read as Full with empty runs, with no `RECORD_VERSION` bump. Add tests in `src/shell/dogRecord.test.ts`, including that a reset record has Full, and in `src/shell/sync/merge.test.ts` that `resolve` takes `markerAssist` from the later copy whole. Verify: tests pass.
- [ ] 5.2 Add `alwaysTimingHelp` (default false) to `UiSettings` and `readUiSettings`, with tests, including that a progress reset keeps it (`src/shell/reset.test.ts`). Verify: tests pass.
- [ ] 5.3 In `App.tsx` `startStage`, send `markerAssist`, `alwaysTimingHelp` and `guidedFirstStage` (`route.name === 'first-stage'`) in the `start` message; close exercises send none. In `onMessage`, on `marker-assist`, write the record only when `route.name !== 'taste'`, the same gate as `firstTime` Hints. Add tests for the recorded, Daily and Taste cases (extract a pure helper if `App.tsx` is not testable directly). Verify: tests pass.
- [ ] 5.4 Add the `marker-rhythm` `HintId` and `onboarding.hint.markerRhythm` (es and en, no `{name}`). Make `hintFor('first-fixation', seenHints, assist)` return `marker-rhythm` when `assist === 'full'` and it is unseen, otherwise the old `marker` rule; recording `marker-rhythm` also records `marker`. Extend `src/shell/onboarding/hints.test.ts`, and the i18n parity/catalog tests. Verify: tests pass.
- [x] 5.5 Play `telegraph-tick` in `src/shell/ui/feedback.ts` as the `tick` sound at -5 semitones and lower volume with no haptic, subject to the sound setting. Apply the `perfectRun` pitch to the sound of the message that carries it. Add tests with the fake backends. Verify: `npx jest src/shell/ui/feedback` passes.
- [ ] 5.6 Add the "always show timing help" switch, its label and help text (es and en) to the interface feedback section of the "Preferencias" tab in `SettingsScreen.tsx`, with an accessible label and state. Extend `SettingsScreen.test.tsx`. Verify: tests pass and the snapshot is updated deliberately.

## 6. Bundle drawing and wiring

- [ ] 6.1 In `StageScene`, build the telegraph model each tick from the sim state, sample the effective level at Fixation start and at the start of each Check-in arc, feed events through `assistOutcomeOf`/`applyOutcome` (skipped when `alwaysTimingHelp` is on or in the Taste Stage), send `marker-assist` on change, `telegraph-tick` for crossed beats at Full, and the sampled level as `assist` on the `first-fixation` signal. Verify: build the bundle (`npm run` bundle build script) with no type errors.
- [ ] 6.2 Draw the approach ring, snap, landed and Good looks, and the Check-in arc, with redraws gated by the quantized progress via `src/hud/dirty.ts`. Draw the reduced-motion fill-ring variant and the steady highlight when `reducedMotion` is set. Verify: run the app (web) and see each look at each assist level, with and without reduced motion, and that a pause freezes them.
- [ ] 6.3 Draw the Full-assist Marker highlight outside the button radius during the Perfect span of a landed Reward Window or a landed Check-in look, leaving the hit area and the Marker Coach mark unchanged. Verify: `src/hud/layout.test.ts` still passes and a press during the highlight registers on the same tick.
- [ ] 6.4 Add a determinism test: the same seed and inputs with the telegraph at each level, with `alwaysTimingHelp`, and not computed give identical debrief payloads, and `payloadBaseline.test.ts` stays green. Verify: `npx jest src/sim src/hud` passes.

## 7. Poste practice ring

- [ ] 7.1 Add tests and then `posteRingProgress` (held / holdToSettle, landed on `settled`, snap on `released`) next to `src/shell/nodes/posteMinigame.ts`. Verify: tests pass.
- [ ] 7.2 Draw the ring in `PosteMinigameView` around the Dog, with the reduced-motion form through the motion gate, without reading or writing the assist. Verify: run the Poste practice Node and see the ring close on hold and snap open on release.

## 8. Integration checks

- [ ] 8.1 In the guided first Stage, check that the telegraph is at Full whatever the stored level, the rhythm Hint shows once in place of the Marker Hint, the three ticks play, the Marker highlights on landing alongside the Coach mark, and the record's `markerAssist` updates. Verify: manual run on web or device after a progress reset.
- [ ] 8.2 Check that the Taste Stage, a close leash exercise and a non-Poste Minigame show no telegraph and leave `markerAssist` unchanged. Verify: manual run.
- [ ] 8.3 Run the full suite and the type check. Verify: `npm test` and `npx tsc --noEmit` pass.

## Workflow follow-up

- `add-product-analytics` also MODIFIES "Section grouping by area" in `settings-screen`. Whichever change archives second rebases its MODIFIED text so the requirement names both the usage analytics switch and the "always show timing help" switch.
- Glossary entries (Approach ring, Timing assist) and ADR 0034 are proposed in the grilling report for whoever owns `GLOSSARY.md` and `docs/adr/`; add them before archiving.
- After `add-product-analytics` is archived, propose a follow-up change for a Marker grade event carrying the assist level.
- Footsteps and music locked to the Sintonía trot stay a separate future change (see design Non-Goals).
- Archive this change once implemented and reviewed.
