# Tasks

## 1. Simulation: Turn Smoothing & Novelty Rebalancing

- [x] 1.1 Add per-direction turn stabilization cooldown (`minTurnInterval: 1.5s`) in `detectTurn` in `src/sim/sim.ts` and verify with unit test in `src/sim/scentWalk.test.ts` showing a 90° curve counts once.
- [x] 1.2 Rebalance `DEFAULT_SCENT_WALK.novelty` (`step: 0.25`, `recoveryPerSecond: 0.06`) in `src/sim/config.ts` and verify config tests pass.
- [x] 1.3 Implement reciprocal recovery in `registerChange` in `src/sim/sim.ts` (+0.15 to all turns on stop, +0.15 between opposite left/right turns) and verify with unit tests in `src/sim/scentWalk.test.ts`.

## 2. HUD: Feedback Decider & Combo Rules

- [x] 2.1 Add `minIntervalSeconds: 6` to `repeated-move-ignored` in `FEEDBACK_RULES` (`src/hud/feedback.ts`) and verify rate-limiting unit tests pass in `src/hud/feedback.test.ts`.
- [x] 2.2 Preserve active Combos when `repeated-move-ignored` occurs in `FeedbackDecider.step` and verify with unit test in `src/hud/feedback.test.ts`.
- [x] 2.3 Suppress `followed-turn` praise when the Dog follows a repeated turn (`novelty < 0.4`) in `src/hud/feedback.ts` and verify in `src/hud/feedback.test.ts`.

## 3. HUD: Autopilot Telegraph (Portrait & Dog Sign)

- [x] 3.1 Add `'autopilot'` to `DOG_SIGNS` and `DogSign` in `src/sim/messages.ts` and verify signal gating tests pass.
- [x] 3.2 Update `dogPose` in `src/hud/pose.ts` and `dogSignsShown` in `src/hud/dogSigns.ts` to trigger turned-away gaze and the `'autopilot'` Dog sign at Autopilot >= 0.7 (clearing at < 0.4), and verify in `src/hud/pose.test.ts` and `src/hud/dogSigns.test.ts`.
- [x] 3.3 Verify `portraitLayers` in `src/hud/portrait.ts` correctly draws head and eyes turned away during high Autopilot, and verify `src/hud/portrait.test.ts` passes.

## 4. Content & Curriculum

- [x] 4.1 Update English and Spanish text in `content/beta/lessons/theory-unpredictable-walks/en.md` and `es.md` to instruct reading the portrait gaze and drifting cloud sign for Autopilot, and verify word counts and format tests pass.
- [x] 4.2 Update primer cards and copy in `content/beta/nodes/park-unpredictable/` and `park-keep-fresh/`, verifying content validation passes.

## 5. Integration & Regression Verification

- [x] 5.1 Run full project test suite (`npm test`) and OpenSpec validation (`openspec validate`) to ensure all tests pass and specs are intact.
