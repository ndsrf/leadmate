# Tasks

## 1. Scent Spots and the blended Drive

- [x] 1.1 Add `scents` to `ScenarioConfig` and the scenery `scent:` helper, and validate them in `validateScenario`; verify with tests for a valid list, a missing position and an unknown strength.
- [x] 1.2 Add `ScentDrive` and `BlendDrive`, and the `heading` target for `GoalDrive` in scent Stages; verify with `sim.test.ts` cases: no Scent Spots gives an identical payload to before, the Dog veers toward a weak spot, and the Dog follows the Handler's heading, not the waypoint.
- [x] 1.3 Add Autopilot (rises on steady walking, drops on changes) and feed it into the scent weight; verify with tests that 10 s of straight walking raises the pull and a stop lowers it.
- [x] 1.4 Add the `planted` (Plant) and `marking` modes with seeded durations, Rigid Pull Arousal while in them, and waited/dragged/interrupted results; verify with tests for waiting, dragging and interrupting.
- [x] 1.5 Stop sniffed spots from pulling after a Go Sniff or a Plant, and make stationary food attract like a hot Scent Spot, with `food-eaten` on Go Sniff; verify with tests for a sniffed spot, Leave-it on food and food eaten.

## 2. Changes, Novelty and Chains

- [x] 2.1 Detect pace changes (smoothed strength, 35% threshold) and route turns, pace changes and stops through one change registration; verify with tests that each of the six kinds is counted only with a Slack leash.
- [x] 2.2 Add Novelty per kind (step, recovery, fresh/repeated) and scale the follow chance by Novelty and Autopilot in scent Stages only; verify with tests that a repeated U-turn is followed less often than a fresh one over many seeds, and that Stages without Scent Spots are unchanged.
- [x] 2.3 Record Chains (followed change → Marker on the look → Slack walking for 2 s or Go Sniff within 3 s); verify with a seeded test of the turn, look, Marker and sniff sequence.

## 3. Go Sniff and Jackpot

- [x] 3.1 In scent Stages, make Go Sniff available at any time on Slack, skip the `calm` end, and steer to the nearest unsniffed Scent Spot (granted) or meander (empty); verify with go-sniff tests, including Arousal at 0 when it starts.
- [x] 3.2 Add the Jackpot input, `jackpotBudget`, the smart/wasted judgment and a HUD button shown only when budgeted; verify with sim tests and a layout test at 320 points wide.

## 4. Telemetry, Feedback Messages and Debrief

- [x] 4.1 Add `scentWalk` and the capped `timeline` to the payload, only in scent Stages; verify with `payload.test.ts` for both cases and the 60-entry cap.
- [x] 4.2 Add the scent-walk kinds to `src/hud/feedback.ts`, with Spanish and English Hints and short forms; verify with feedback tests for each kind and the i18n completeness test.
- [ ] 4.3 Show the timeline, tappable moments and the "done well / try next" summary in the Node Debrief; verify with a component test fed by a fixture payload, and on device.

## 5. Progression for inserted Stretches

- [x] 5.1 Keep Stops reachable under the previous trail available when a Stretch is inserted ahead (design Decision 11); verify with progression tests for each `world-progression` delta scenario: part-way user, brand-new user, finished Stretch with an added Node, completed World.

## 6. Content release 1: Let them sniff + Unpredictable walks

- [x] 6.1 Draw the wordless art for `theory-sniffing-walks`, `park-nose-on` and `park-keep-fresh` in the LeadMate Design System canvas; verify the files exist in each item's `media/`.
- [x] 6.2 Author `theory-sniffing-walks`, `park-nose-on` and `mission-park-sniff` (target: Go Sniff 3 times after a look) in `content/beta/`, in Spanish and English, using each language's cue words; verify with `npm run content:validate -- --channel beta`.
- [x] 6.3 Retune `park-unpredictable` with Scent Spots and Stage Meters, author `park-keep-fresh`, and restructure `worlds/recall.yaml` into the "Let them sniff" and "Unpredictable walks" Stretches; verify with content validation and the progression tests.
- [ ] 6.4 Playtest the three Nodes with the devSeed on a phone and tune Autopilot, Novelty and Stage Meter targets until a good run earns 2 Stars and a great run 3; record the final values in the scenarios and a note in design.md.
- [x] 6.5 Promote to stable with the app's `minAppVersion` and a `contentVersion` bump; verify that `npm run content:validate` passes for stable and that an older app keeps its bundled baseline.

## 7. Content release 2: Sniffing on your terms

- [x] 7.1 Draw the art for `theory-sniffing-on-your-terms`, `howto-jackpot`, `park-plant-mark` and `park-not-that-one`; verify the files exist in each `media/`.
- [x] 7.2 Author the two Lessons, both Nodes and `mission-park-sniff-terms` (target: wait out 2 sniffing stops without pulling, Leave-it once on food or rubbish) in Spanish and English, and add the Stretch to `worlds/recall.yaml`; verify with content validation.
- [ ] 7.3 (automated part and promotion done; the phone playtest of both Nodes is still to do) Playtest and tune both Nodes as in 6.4, then promote to stable with a `contentVersion` bump; verify validation and the bundled baseline as in 6.5.

## 8. Integration checks

- [x] 8.1 Run the full test suite and the `power-efficiency` scenario regression check on a World 6 Node; verify both pass. Evidence: `npm test` 184 suites passed; `node scripts/power.mjs` all checks passed; `node scripts/world6-shots.mjs` playing `park-not-that-one`: 30.5 wakes/s, 30.5 frames/s.
- [x] 8.2 Update the Purpose line of `openspec/specs/recall-world/spec.md`, which still describes a single Stretch, to describe World 6 as sniffing and unpredictable walks before recall; verify it reads correctly after archive.

## Workflow follow-up

- Archive `readable-dog` and `in-stage-feedback` before this change, then archive this one and verify the main specs for `recall-world`, `go-sniff`, `dog-drives` and `world-progression`.
