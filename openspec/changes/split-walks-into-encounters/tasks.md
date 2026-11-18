# Tasks

## 1. Peak Reaction Tier in the sim payload

- [x] 1.1 Write failing tests in `src/sim/payload.test.ts`: a time-limited Stage where a nearby Distractor drives the Dog to Reactive and back reports `peakReactionTier: 'reactive'`; a Stage whose Distractor activates past the route end reports `'calm'`; same seed, inputs and snapshot give the same value; a close exercise payload and `skippedSimulationPayload` have no `peakReactionTier`. Verify they fail.
- [x] 1.2 Track the peak tier in sim telemetry where `reaction-tier-change` is emitted (`src/sim/sim.ts`) and add optional `peakReactionTier` to `SimulationDebriefPayload` / `buildPayload` (`src/sim/payload.ts`), set for walking Stages only; verify 1.1 passes and `npx jest src/sim` is green.
- [x] 1.3 Update the payload baseline (`payloadBaseline.test.ts`, `src/shell/testPayload.ts` and any payload fixtures) for the new field, and check that Daily Stage handling scores in the baselines are unchanged; verify `npx jest` and `npx tsc --noEmit` pass.

## 2. Paw rule (pure, test-first)

- [x] 2.1 Add `EncounterAim` and the Paw constants (`KEEP_SLACK_MAX_PULL = 25`, `CLEAN_MAX_PULL = 10`) in `src/shell/nodes/encounters.ts`, and write a table test `encounters.test.ts` covering every scenario of the "Encounter Aims", "One to three Paws" and "Clean result" requirements (each Aim met/not met; 3 Paws only when never Reactive, pull ≤ 10, no reactive or Late press, and a Perfect mark, Marker or Check-in, for mark Aims). Verify the tests fail.
- [x] 2.2 Implement `pawsFor(aim, payload) -> { paws, next }`, where `next` is the first unmet condition in the order Aim, reactive, pull, reactive marker, late, perfect; verify 2.1 passes, including a same-payload-same-Paws check.

## 3. Series progression and combined payload (pure, test-first)

- [ ] 3.1 Write failing tests for `keptAttempt` (most Paws, latest on ties: 1, 3, 2 keeps the second; 2, 2 keeps the second) and `combineEncounterPayloads` (10 s at 0% + 20 s at 30% pull gives 20%, shares sum to 100; counts and `markGrades` summed; peaks are max; `markerAccuracyMs` mean or absent; `handlingScore` 1000 / 667 / 833 / 917 for the spec's Paw sets; unplayed Encounters count 0 Paws and have no seed; skipped gives `handlingScore` 500; no kept attempt at all gives the skip baseline counts; `encounters` entries hold id, Paws, attempts, seed). Verify they fail.
- [ ] 3.2 Implement both in `src/shell/nodes/encounters.ts`; verify 3.1 passes.
- [ ] 3.3 Add `EncounterDef` and `simulation.encounters` to `NodeDef`, and the optional `series` state plus `encounter-end`, `retry`, `next-encounter` and `exit-series` actions to `NodeRun` / `advance` in `src/shell/nodes/node.ts`. Write tests first in `node.test.ts`: retry keeps the index and seed and adds an attempt; next moves to the following Encounter with a new seed slot; next after the last finishes with a `stage` result carrying the combined payload; exit with an Encounter still unplayed finishes `skipped` with "not played" entries and discards the running attempt; exit when every Encounter has a kept attempt finishes unskipped; actions outside a Series Node are ignored. Verify the tests pass and existing `node.test.ts` cases stay green.
- [ ] 3.4 Extend `onDebrief` tests: a finished Series Node applies the Dog update once from the combined payload (kept attempts only, so `calmEncounters` is not inflated by retries) and earns Stars from the Paw score; a skipped Series earns 1 Star and leaves the Dog unchanged; earlier higher Stars on the Node are kept; verify with `npx jest src/shell/nodes`.

## 4. Content pack: Series format, validation, guide

- [ ] 4.1 Add the Series types to `src/shell/content/schema.ts` and `ENCOUNTERS_MIN_APP_VERSION` (the first app version that ships this change) beside `IMAGE_DUEL_MIN_APP_VERSION`; parse `## encounters` / `### <id>` titles from the Node's `<lang>.md` in `parser.ts`, with Spanish fallback, and resolve them into `NodeDef.simulation.encounters` in `resolver.ts`. Verify with a parser/resolver test on a fixture Node with four Encounters, including one with no English title.
- [ ] 4.2 Write failing validator tests for each rule of "Encounter Series validation" (count 3-5, duplicate ids, unknown Aim listing the supported ones, time limit 10-20 s, `keep-slack`/`stay-calm` not waypoint-ended, Stage Meters, Scent Spots including scenery-carried ones via `scentSpotsOf`, Jackpots, Series on a non-walking Node, Series plus scenario, missing Spanish title) and for the `minAppVersion` gate, plus a test that a 40 m waypoint route and a scenario with `moreDistractors` still validate (guidance only); implement them in `validator.ts` reusing `validateScenario`; verify the tests pass and each error names Node, Encounter and field.
- [ ] 4.3 Document the Series fields, Aims, size and time-limit rules, the `## encounters` text section and the unvalidated guidance (one new thing per Encounter, one situation with at most one Distractor, waypoint routes of about 20-28 m, a Distractor past the route end for an empty route) with a worked example in `content/FORMAT.md` and `src/shell/content/formatGuide.ts`; verify `formatConformance.test.ts` passes and the worked example validates.

## 5. Shell flow: result card, retry, next, leaving

- [x] 5.1 Add the result-card and progress strings (Paws, Retry, Next, "Encounter {n} of {total}", one line per `next` reason, "done perfectly", "not played") to the catalogs in `src/i18n` for every shipped language; verify the i18n completeness test passes.
- [x] 5.2 Add `EncounterResultOverlay` (Paws, title, next-Paw line, Retry, Next) and a Series progress strip in `src/shell/Overlays.tsx`; verify with a component test that 1/2/3 Paws render the right count and line, Retry and Next fire their callbacks, and Next is enabled at 1 Paw.
- [ ] 5.3 In `App.tsx`, for a Series Node: capture the Dog snapshot at Series start; route the bundle's `debrief` message to `encounter-end` and show the overlay; start Encounter `index` with its stored seed on Retry and the next Encounter with a new seed on Next, both with the Series-start snapshot; keep `simulationKey` stable across Encounters; call `countStage()` once per Series (at its end or Exit); show no advert between Encounters. Verify with an `App.test.tsx` case that drives a mocked bundle through end, retry (same seed and snapshot in the second `start` message, no remount, no loading overlay, Primer and Checkpoint not shown), next (new seed, same snapshot) and the last next to the Debrief.
- [ ] 5.4 Wire leaving a Series: Pause Menu Exit dispatches `exit-series` while an Encounter runs or on its result card; the Stage Back Control and system back on a result card open the Pause Menu and Resume returns to the card. Verify in `App.test.tsx`: Exit on the third of four Encounters opens the Debrief with 1 Star and an unchanged Dog record; Exit after every Encounter has a kept attempt finishes normally; back on the card shows the Pause Menu; unmounting the flow mid-Series leaves the Dog record and completed Nodes unchanged.
- [ ] 5.5 Verify in `App.test.tsx` that a retry clears hint, dog-warning and controls-used state like a fresh Stage start, and that a non-Series walking Node still goes straight to its Debrief.

## 6. Debrief

- [ ] 6.1 Add an Encounter list (title, Paws, attempts, "not played") above the telemetry rows of `DebriefScreen` when `payload.encounters` is present; verify with a `NodeScreens.test.tsx` case for a finished Series and one for an exited Series, and that a non-Series Debrief is unchanged (snapshot).
- [ ] 6.2 Make Play again on a Series Node's Debrief restart the Series at Encounter 1 with new seeds; verify in `App.test.tsx` that the first `start` message after Play again has a different seed and no Primer or Checkpoint is shown.

## 7. Prototype Series on `walk-distraction`

- [ ] 7.1 Author the four Encounters (`loose-start`, `skate-far`, `skate-poste`, `turn-look`) from design decision 1 in the beta pack's `nodes/walk-distraction/node.yaml`, with titles in `es.md` and `en.md`, leaving its Primer, Checkpoint, Lessons and Mission unchanged, and raise beta `minAppVersion` to `ENCOUNTERS_MIN_APP_VERSION`; verify `content:validate --channel beta` passes.
- [ ] 7.2 Add a sim-level test that scripts a good run through each Encounter scenario (stop for the skateboarder then mark, turn and mark the look) and asserts 3 Paws, and a passive run that asserts 1 Paw where the Aim needs an action; verify each time-limited Encounter ends at its limit, each waypoint Encounter's route is 20-28 m, and `loose-start`'s Distractor never activates.
- [ ] 7.3 Playtest the Series on device with the worst and best attribute ranges and adjust timings in node.yaml only; record each Encounter's typical duration (target 10-20 s) and whether each introduces one new thing in the change notes.

## 8. Analytics hook (after `add-product-analytics` lands)

- [ ] 8.1 Add optional `encounter_id`, `encounter_attempt` and (on `stage_ended`) `paws` properties to the Encounter Stage start/end events, keeping `attempt` as the Node attempt and pairing start and end by Encounter id and attempt, respecting opt-out; verify with the analytics module's event tests that a retry emits two `stage_ended` events with Encounter attempts 1 and 2 and the same Node `attempt`, that Exit mid-Series emits `outcome` skipped for the running Encounter only, and that opted-out installs emit none.

## 9. Integration checks

- [ ] 9.1 Run `npx jest`, `npx tsc --noEmit` and `content:validate` for both channels; all pass, and stable still plays `walk-distraction` as one walking Stage until the Series is promoted.
- [ ] 9.2 On a device build, play the Series end to end: retry starts within one second with no loading screen; no frames are drawn while a result card shows; Pause/Exit mid-Series opens the Debrief with completion credit and 1 Star; killing the app mid-Series and reopening resumes nothing and leaves the Node as it was; the Daily Stage and `blind-corner` are unchanged.

## 10. Rollout

- [ ] 10.1 Promote the Series to stable with stable `minAppVersion` raised to `ENCOUNTERS_MIN_APP_VERSION` only once that app version is the current store release and the long-walk baseline is collected; verify `content:validate --channel stable` passes.

## 11. Domain docs

- [x] 11.1 Add the Encounter, Encounter Series, Aim and Paw entries to `GLOSSARY.md` and widen the Node definition to "one or more Stages", as proposed in the grilling report.
- [x] 11.2 Save the proposed ADR on Series scoring as `docs/adr/0033-encounter-series-score-from-paws.md`.

## Workflow follow-up

- Compare completion and retry rates over an equal window before and after promotion, before converting other Worlds.
- Rollback if needed: remove `encounters` from `walk-distraction/node.yaml` and republish; no app release.
- Archive the change after review.
