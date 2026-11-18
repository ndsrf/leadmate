# Design

## Context

See proposal.md (Why). The relevant current state:

- A walking Node runs one Stage. `App.tsx` builds a `start` message from the Node's scenario (`resolveScenario` + `withPull` + the Dog's learning snapshot) and posts it to the already-loaded bundle (`SimView`); the bundle answers with one `debrief` message carrying a `SimulationDebriefPayload`, and the shell calls `advance(run, { type: 'finish', result })` in `src/shell/nodes/node.ts`, which moves the `NodeRun` to `debrief`. `onDebrief` then applies the payload to the Dog once (`applyStage`, skipped when `result.skipped`), sets stars from `payload.handlingScore` (`starsFor`, 650/850) and logs the activity.
- Debrief "Play again" already re-enters `step: 'simulation'` with `attempt + 1`, skipping Primer and Checkpoint, and a new random seed (`startStage(..., newSeed())`). Per ADR 0019 the Stage view exists only around a Node flow that contains a Stage.
- Pause Menu Exit on a Node Stage (ADR 0021) calls `countStage()`, synthesizes `skippedSimulationPayload` (`handlingScore: 500`, so 1 Star) and finishes with `skipped: true`, so the Dog is not updated.
- Stages already end by `endCondition: reach-waypoint | time-limit` (`checkEnd` in `src/sim/sim.ts`). The guided first walk (`src/shell/onboarding/introNode.ts`, 36 m, fits in 25 s) and the taste (20 s time limit) show short Stages already work end to end.
- The payload has every Paw signal except the Reaction Tier: tension shares, `markerHits`, `checkInHits`, `markGrades` (perfect/good/late, Marker hits and Check-in hits together), `reactiveMarkers`. The sim tracks `state.tier` (`calm | alert | reactive`) and emits `reaction-tier-change` but does not report its peak.
- `updateLearning` caps per-payload gains (`mainGain` once, `markCap` 4 marks), so one learning update per Node is the current rate.
- `ScenarioConfig.distractor` is required: a scenario "with no Distractor" is one whose Distractor activates past the route end.
- World 3 (`content/stable/worlds/sidewalk.yaml`) has three Stretches: walk with distractions (`walk-distraction`), blind corner (`blind-corner`), slack "U" (`slack-u`). `walk-distraction` has `simulation: {}`, so it plays `defaultScenario`: a 90 m straight sidewalk with one skateboarder activating at 30 m, about 60-75 s of walking. It is the first walking Node every player meets after the onboarding, and its Primer asks for three things at once: look far, Poste, pay slack.
- The content pack gates new Node features by the pack-wide `minAppVersion` (precedent: `IMAGE_DUEL_MIN_APP_VERSION` in `src/shell/content/schema.ts` and the check in `validator.ts`); both channels declare 1.2.0 today. An app older than a pack's `minAppVersion` keeps the content it has.
- `add-product-analytics` (not yet built) will emit `stage_started` / `stage_ended` (snake_case properties; `attempt` is the Node attempt) from the shell. `telegraph-marker-timing` (not yet built) adds a HUD-only approach ring that reads existing sim state.
- Vocabulary: GLOSSARY.md already defines **Chain** (the Unpredictable Walk's follow, mark, walk-on sequence) and uses "Goal" for the Dog's Goal Drive, so this change names the sequence of Encounters an **Encounter Series** and an Encounter's decision its **Aim**. Lower-case "encounter" in code (`calmEncounters`, `hadEncounter`) keeps its old meaning, a calm pass of a Distractor, and is not renamed.

## Goals / Non-Goals

**Goals:**
- Paw scoring and Series progression as pure, table-tested shell functions; the sim change limited to one new seeded payload field.
- Retry and Next reuse the running Stage view: no remount, no loading, no navigation.
- An Encounter Series is content (node.yaml), so tuning the prototype needs no app release once Series are supported.
- One payload shape for the Debrief whether the walk was one Stage or a Series.
- One Dog update per Node, as today.

**Non-Goals:**
- A new end condition, a new sim mode or any change to leash physics, Reward Window, grades, Feedback Messages, combos or Sintonía.
- Stage Meters, Scent Spots or Jackpots inside Encounters (rejected by validation for now).
- An in-app A/B split; the comparison is before/after (see Migration Plan).
- Converting other Worlds or the Daily Stage, or changing the Primer, Checkpoint, Lessons or Mission of `walk-distraction`.
- Saving or resuming a Series that was left before its Debrief.

## Decisions

### 1. Prototype Stretch: World 3, "walk with distractions" (`walk-distraction`)
It is the canonical long walk (`defaultScenario`, 90 m), the first walking Stage on the trail (most players, fastest analytics signal), and it already crams several new things into one minute, which is exactly what a Series splits apart. Alternatives: `blind-corner` (one bicycle, one decision: a good fit for a single Encounter but too little for a Series) and `slack-u` (two Distractors and arcs: a fine second candidate, lower traffic). The Stretch's Primer, Checkpoint, Lessons and Mission (`mission-walk`) are unchanged, so the before/after comparison measures only the Series. `keep-slack` and `stay-calm` Encounters are waypoint-ended because a time limit would let a player meet them by standing still; waypoint routes are kept to about 20-28 m so they fit in 10-20 s at walking pace.

Proposed Series (authored first in `content/beta/nodes/walk-distraction/node.yaml`, numbers tuned in playtest):

| # | id | Title (es) | Aim | Situation | End |
|---|----|-----------|------|-----------|-----|
| 1 | `loose-start` | Correa floja | `keep-slack` | Empty 20 m sidewalk (the Distractor activates past the route end) | waypoint |
| 2 | `skate-far` | Míralo venir | `stay-calm` | Skateboarder crosses well ahead of a ~25 m route; step aside or slow down before the leash tightens | waypoint |
| 3 | `skate-poste` | Poste y marca | `mark-disengagement` | Skateboarder passes close; Dog fixates at the leash limit | time-limit 18 s |
| 4 | `turn-look` | Gira y te mira | `check-in` | Short route with two turns; mark the look after the Dog follows | time-limit 15 s |

Each introduces one thing: Slack, looking far, Poste + Mark, Check-in. Encounter 4 relies on `followChance` (a chance, not a certainty); two turns in 15 s give at least two chances, and playtest decides whether to add a third.

### 2. Series data format in node.yaml
```yaml
simulation:
  encounters:
    - id: skate-poste          # kebab-case, unique in the Node
      aim: mark-disengagement  # keep-slack | stay-calm | mark-disengagement | check-in
      scenario:                # Partial<ScenarioConfig>, validated like an embedded scenario
        waypoint: { x: 24, y: 0 }
        distractor: { kind: skateboard, speed: 4, activateAfterMeters: 4, startOffset: 12, triggerRadius: 14 }
        markBudget: 3
        endCondition: { kind: time-limit, seconds: 18 }
```
Titles live in the Node's `<lang>.md` under `## encounters` / `### <id>` (first line), parsed like the existing `## exercises` section, so text stays per language with Spanish fallback. `NodeDef.simulation` gains `encounters?: EncounterDef[]` (`{ id, title: TextKey, aim, scenario }`); `scenario` and `encounters` are mutually exclusive, and `encounters` is only allowed on `mode: stage`. No per-Encounter seed is authored: a seed is drawn when an Encounter is first started in a Series run and reused for its retries (alternative: fixed authored seeds, rejected because it makes every replay of the Node identical and diverges from "Play again uses a new seed").
The validator enforces only the decided limits (3-5 Encounters, unique ids, known Aim, 10-20 s time limits, waypoint end for `keep-slack`/`stay-calm`, no meters, Scent Spots, scenery scents or Jackpots, Series XOR scenario, walking mode, titles). "One new thing per Encounter", "one situation, at most one Distractor", route length and the empty-route idiom are format-guide guidance plus the prototype's tests, because the validator ships inside the app and a rule added there cannot be relaxed without a release.
Alternatives: a separate `encounters.yaml` file (rejected: splits one Node's content); named built-in Series in `scenarios.ts` (rejected: needs a release to tune).

### 3. Paw rule (pure, `src/shell/nodes/encounters.ts`)
`pawsFor(aim, payload) -> { paws: 1|2|3, next: PawReason | null }`. Constants in one place:
- `KEEP_SLACK_MAX_PULL = 25` (%), the Aim for `keep-slack` (plus never Reactive).
- `CLEAN_MAX_PULL = 10` (%).
- Aim met: `keep-slack` pull ≤ 25 and `peakReactionTier !== 'reactive'`; `stay-calm` `peakReactionTier !== 'reactive'`; `mark-disengagement` `markerHits ≥ 1`; `check-in` `checkInHits ≥ 1`.
- Clean (3 Paws): Aim met and `peakReactionTier !== 'reactive'` (except for `mark-disengagement`, see the note below), pull ≤ 10, `reactiveMarkers === 0`, `markGrades.late === 0`, and for the two mark Aims `markGrades.perfect ≥ 1`. `markGrades` does not split Marker hits from Check-in hits, so a Perfect Check-in hit also satisfies a `mark-disengagement` Encounter; accepted rather than adding a second sim field.
- `next` is the first unmet condition in that order (Aim, reactive, pull, reactive marker, late, perfect; the reactive condition is skipped for `mark-disengagement`) and maps to one catalog key for the result card line.
- Implementation note (coordinator decision, 2026-11-18): the sim starts a Fixation only when Arousal reaches the reactivity threshold, which is exactly the Reactive tier (`tierFor`), and a Reward Window only opens on Disengagement from a Fixation. Every Marker hit therefore implies `peakReactionTier === 'reactive'`, so the never-Reactive condition would cap `mark-disengagement` at 2 Paws. It is dropped for that Aim only; `keep-slack`, `stay-calm` and `check-in` keep it.

Why these signals: they are the ones the user already sees as Feedback Messages, so the Paws never contradict what the player saw. Why 1 Paw on a miss rather than 0: matches "1 Star for completing" and the no-fail rule; the incentive to retry is the 2nd and 3rd Paw. Alternative considered: deriving Paws from `handlingScore` thresholds (rejected: composure/Sintonía weights make a short Encounter's score noisy and do not reflect its one decision).

### 4. Peak Reaction Tier in the sim
Add `peakTier` to the sim telemetry, raised in the existing tier-change step, and `peakReactionTier` to `buildPayload`. The payload field is optional in the type: always set for walking Stages, absent for close exercises and `skippedSimulationPayload`. Pure and seeded; the shell cannot derive it because `reactivityThreshold` comes from the Dog's traits inside the sim. No existing score reads it, so ADR 0005 and Daily Stage scores are unchanged. `payloadBaseline.test.ts` and the generated baselines get the new field. Alternative: listen to `reaction-tier-change` bridge events in the shell (rejected: not reproducible from the payload, not testable in the sim).

### 5. Series progression as a pure reducer
Extend `NodeRun` with an optional `series` state while `step === 'simulation'`:
`{ index, attempts: EncounterAttempt[][], seeds: number[], showing: 'running' | 'result' }` (the Dog snapshot is captured by the shell at Series start, outside the reducer) and new `NodeAction`s: `encounter-end { payload }`, `retry`, `next-encounter`, `exit-series`. `advance` stays the single state machine; the `finish` action for a Series Node is produced internally on `next-encounter` after the last Encounter, or on `exit-series`, with `result = { kind: 'stage', payload: combined, skipped? }` where `combined.encounters` lists each Encounter. Kept attempt = most Paws, latest on ties (`keptAttempt`). `combineEncounterPayloads(kept, seriesLength)` builds the Node payload (sums, duration-weighted shares with Slack as the remainder like `buildPayload`, max peaks, mean accuracy, `handlingScore = round(1000 × ΣPaws / (3 × seriesLength))`). Then `onDebrief`, `pickExercise`, Stars and the activity log work unchanged.
Why the best attempt: rewards the retry the feature exists for, keeps retries from inflating `calmEncounters` (Trigger Profile) and Learning Attributes, and mirrors "best Stars are kept". Alternative: last attempt (simpler to explain, but punishes a player who retries once more for fun).
Why one Dog update from a combined payload: ADR 0003 computes the next Dog from one payload, and `updateLearning` caps gains per payload, so one combined update keeps the per-Node learning rate of the long walk; updating per Encounter would let a Series teach the Dog up to four times as fast.

### 6. Leaving a Series: Exit, back, app killed
- `exit-series` while an Encounter runs or on its result card: the running attempt is discarded. If every Encounter already has a kept attempt, it behaves as `next-encounter` on the last one (a normal finish). Otherwise it finishes with `skipped: true` and `handlingScore` 500 (the ADR 0021 baseline, so 1 Star, no poor-score shop prompt and no Dog update), with the combined counts of the kept attempts so the Debrief can list them, or `skippedSimulationPayload` counts if none.
- The Stage Back Control and system back on a result card open the Pause Menu over the card; Resume returns to the card; system back on the Pause Menu acts as Resume, as today.
- App backgrounded on a result card: nothing runs, so nothing pauses. App killed or the flow left mid-Series: nothing was written to the Dog record (it is only touched in `onDebrief`), so the Node is not completed by that play and reopening it starts at the Primer ("No saved Stage").
Alternative for Exit: score the Series from the Encounters played, unplayed at 0 (rejected for now: it would make Exit a second scoring path and diverge from ADR 0021 for one Node; Stars are kept at their best, so Play again loses nothing).

### 7. Shell flow: Retry and Next reuse the Stage view
On a Series Node's `debrief` bridge message, `App.tsx` dispatches `encounter-end` instead of `finish` and shows an `EncounterResultOverlay` (in `Overlays.tsx`, on the existing `Backdrop`) over the ended Stage, which draws no frames while the card shows. Retry calls `startStage(scenario, seeds[index], snapshot)` with the snapshot captured at Series start; Next calls it for `index + 1` with a new seed and the same snapshot. The `SimView` stays mounted for the whole Series (the ADR 0019 lifetime is "around the Node flow's Stages", released at the Debrief), so there is no loading overlay; `simulationKey` must not change between Encounters (key on Node id + Series run attempt, not Encounter index) so the effect does not restart the Series. Play again from the Debrief remounts as today. A Series progress strip ("2/4" plus Paws so far) sits in the HUD chrome next to the back button. `accountRef.current.countStage()` is called once per Series, at its end or Exit. No advert is shown between Encounters; the existing interstitial rule (after leaving a Debrief) applies once per Series.
Alternative: draw the result card inside the Phaser bundle (rejected: retry/next are shell decisions, the text and buttons are shell UI, and the shell already owns pause overlays).

### 8. Debrief
`DebriefScreen` adds an `EncounterList` section (title, Paws or "not played", attempts per Encounter) above the existing `StageRows` when `payload.encounters` is present. Play again resets the Series (new seeds) via the existing `attempt + 1` path.

### 9. Content gating and validation
`ENCOUNTERS_MIN_APP_VERSION` (the first app version that ships this change) beside `IMAGE_DUEL_MIN_APP_VERSION`; the validator checks it and the Series rules of the `content-packs` delta. `minAppVersion` is pack-wide, so raising it on stable stops content updates for older apps until they update; the Series is therefore promoted to stable only once the supporting app version is the current store release. `formatGuide.ts`/`content/FORMAT.md` document the fields and the unvalidated guidance so `formatConformance.test.ts` stays green.

### 10. Analytics (soft dependency)
When `add-product-analytics` lands, its `stage_started` / `stage_ended` events gain optional `encounter_id` (id), `encounter_attempt` (int) and, on `stage_ended`, `paws` (int) for Encounter Stages, following that change's snake_case naming. Its existing `attempt` stays the Node attempt, and a Stage start and end are paired by `stage_id`, `attempt`, `encounter_id` and `encounter_attempt`. If Series ship first, the Series still works; the comparison simply waits for analytics. Comparison metrics for `walk-distraction`, before/after: Node completion rate (Node simulation entries that reach the Debrief without Exit) and retry rate (Encounter retries per Encounter start, read against the Play-again rate of the long walk).

### 11. Compatibility with `telegraph-marker-timing`
Encounters are ordinary walking Stages, so a HUD ring reading calm-period progress works unchanged; nothing here reads or depends on it. Short Encounters give its result-based assist more marks per minute, which is a benefit, not a dependency.

## Risks / Trade-offs

- [A 10-20 s Encounter may not contain its situation for every Dog snapshot, e.g. a fast fixation or no Check-in look] → Aims that depend on chance (`check-in`) get a time limit with at least two chances; playtest with worst and best attribute ranges; the Paw rule never blocks Next.
- [Paw thresholds feel arbitrary or too strict] → All thresholds are named constants with table tests; tune during the prototype without spec change unless the rule's structure changes.
- [Stars earned under Series scoring cannot be taken back (ADR 0007)] → 3 Stars need at least 85% of the Paws, about the same bar as the long walk's 850; rollback keeps them, which is accepted.
- [Best-attempt keeping makes the Dog update look better than the "real" play] → Learning Attributes move slowly, the update is still one per Node and the Daily Stage is unchanged; revisit if analytics show the Trigger Profile dropping faster on `walk-distraction`.
- [Combos and Sintonía cannot build across Encounters] → Accepted: they are per Stage by definition, and Sintonía only weighs in the ADR 0005 score that a Series does not use.
- [Before/after comparison is confounded by other releases] → Freeze other first-session changes during the measurement window, or compare cohorts by install week; note it in the readout.
- [Re-using the Stage view across Retry leaks state (Feedback Message queue, combo counter, Hint state)] → `start` already resets the sim; add a shell test that a retry clears hint/dog-warning state like a fresh `startStage`.
- [Old apps receive a Series pack] → `minAppVersion` gate; older apps keep their content, and stable promotion waits for adoption.
- [Exit near the end of a Series gives only 1 Star] → Exit after every Encounter has a kept attempt finishes normally; otherwise Play again is one tap from the Debrief.

## Migration Plan

1. Ship app support (sim field, reducer, overlay, Debrief list, validator) with `walk-distraction` unchanged; collect the long-walk baseline once analytics is live.
2. Add the Series to `walk-distraction` in the beta pack with the raised beta `minAppVersion`, playtest, tune; promote to stable with the raised `minAppVersion` once the supporting app version is the current store release.
3. Compare completion and retry rates over an equal window before and after promotion. Rollback: remove `encounters` from the node.yaml (back to `simulation: {}`) and republish; no app release, progress and Stars are kept because the Node id does not change.

## Open Questions

- Exact geometry and Distractor timing of the four prototype Encounters, and the turn-look tuning; settled in playtest and expressed only in node.yaml.
- How long the analytics baseline window should be before switching (depends on traffic once `add-product-analytics` is live).

## Grilling decisions

Questions raised against GLOSSARY.md, the ADRs, the main specs and the code, each resolved with its default answer.

1. Does "Encounter chain" clash with the glossary? Yes, **Chain** is the Unpredictable Walk sequence → renamed to **Encounter Series**; cheap now, confusing forever later.
2. Does an Encounter's "goal" clash? Yes, with the Dog's Goal Drive → the field and term are **Aim** (`aim:` in node.yaml, `EncounterAim`).
3. Does "Encounter" clash with `calmEncounters` / "high-Arousal encounter"? Lower-case code meaning (a Distractor pass) stays; capitalised Encounter is the set piece; spec text says "calm Disengagements" instead → no code rename, least churn.
4. Does "Paw" clash with the Diagnostic's "{n} of {total} paws" text? Only catalog wording, not a domain term → keep Paw as the canonical term.
5. Is an Encounter attempt a Stage? Yes, every attempt is a separate Stage → keeps GLOSSARY Stage, the pause, back and power rules intact; the Node definition widens to "one or more Stages" (glossary proposal).
6. One Dog update per Stage or per Node (ADR 0003)? Once per Node, from the combined kept attempts at the Debrief → `updateLearning` caps per payload, so the learning rate per Node stays the same.
7. Where does a Series' handling score come from? From the kept Paws, a third rule beside ADR 0005 and 0029, chosen only by the presence of a Series → recorded in a proposed ADR.
8. How do Paws map to Stars? `round(1000 × ΣPaws / 3n)` with the unchanged 650/850 thresholds → no new threshold to tune; Stars kept at best (ADR 0007), so rollback keeps them.
9. Which attempt counts? The best, latest on a tie (given default) → rewards retrying without inflating learning.
10. What does Exit mid-Series do? Skips like any Stage (ADR 0021): 1 Star, no Dog update, running attempt discarded, Debrief lists kept Paws → one skip rule across the app; reversible.
11. Exit when every Encounter already has a kept attempt? Finishes normally → the player earned the result; Exit there is not a skip.
12. Skipped Series handling score? 500, the skip baseline → avoids a poor-score shop prompt and Stars above 1 on a skip.
13. Back on the result card? Opens the Pause Menu; Resume returns to the card → matches "system back never leaves the Stage by itself".
14. App killed or flow left mid-Series? Nothing saved, nothing applied, Node not completed by that play → follows "No saved Stage"; the record is only touched at the Debrief.
15. Does keeping the Stage view across Encounters break ADR 0019? No: it lives for the Node flow's Stages and is released at the Debrief; Play again remounts as today.
16. Which Dog snapshot do later Encounters use? The one taken at Series start, for every Encounter and retry → follows from one update per Node and makes retries reproducible.
17. Adverts between Encounters? None; the interstitial after a Debrief applies once per Series → protects the instant retry (ADR 0018 isolation).
18. Is `peakReactionTier` required on every payload? Optional in the type, set on walking Stages, absent on close exercise and skip baselines → no fake values.
19. Does the new field change Daily Stage scores? No, no score rule reads it → Daily Stage and leaderboard unaffected.
20. Must the Perfect mark for `mark-disengagement` be a Marker hit? Any Perfect mark counts, because `markGrades` is not split → keeps the sim change to one field.
21. How is "no Distractor" expressed? A Distractor that activates past the route end → no new sim mode.
22. What does the validator enforce? Only the decided limits; one-new-thing, one Distractor and route length are format-guide guidance → app-side rules cannot be relaxed without a release.
23. Are Jackpots and scenery-carried Scent Spots rejected too? Yes → matches the Non-Goals; validation uses the same scent lookup as the sim.
24. May a Series sit on a non-walking Node? No, validation rejects it → the reducer only handles walking Stages.
25. Is `minAppVersion` enough for older apps? Yes, but it is pack-wide → promote to stable only when the supporting version is the current store release.
26. Is the Daily Stage affected? No → stated in the prototype requirement and checked in 9.2.
27. Analytics property names? `encounter_id`, `encounter_attempt`, `paws`; `attempt` stays the Node attempt → follows `add-product-analytics` naming and keeps start/end pairing unambiguous.
28. How is success measured? Before/after on completion and retry rate (given default) → no in-app A/B code.
29. Are the Primer and Checkpoint of `walk-distraction` trimmed? Not in this change → isolates the measured variable.
30. Is "each Encounter introduces one new thing" testable? Not by software → moved from the spec to the format guide and the prototype review.
31. Is "running again within one second" testable? On the device check (9.2), with App tests asserting no remount and no loading overlay.
32. Encounter layouts and turn-look tuning? Settled in playtest, node.yaml only (given default).
33. Where is the prototype authored first? The beta pack, not stable → matches the tasks and the migration plan.
34. Who updates GLOSSARY.md and writes the ADR? The implementer, as a task (11.1-11.2) → this change only proposes the text.
