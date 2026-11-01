# Tasks

## 1. Simulation Engine & Leash Manipulation Logic

- [x] 1.1 Implement close exercise simulation state and configuration types (`CloseExerciseConfig`, `CloseExerciseState`) in `src/sim/closeExercise.ts` and verify with unit tests in `src/sim/closeExercise.test.ts`
- [x] 1.2 Implement deterministic leash gathering and slack dynamics (effective leash length $L_{eff}$ adjustments and release rate) in `src/sim/closeExercise.ts` and verify tension scaling with unit tests
- [x] 1.3 Implement handler shielding stance and line-of-sight occlusion calculations against oncoming distractors in `src/sim/closeExercise.ts` and verify arousal mitigation with unit tests
- [x] 1.4 Implement tension anchor mechanics and telemetry generation in `src/sim/closeExercise.ts` and verify debrief payload output with unit tests in `src/sim/closeExercise.test.ts`

## 2. Close-View Graphics & Asset Pipeline

- [x] 2.1 Add high-resolution close-up sprite atlas for canine postures (neutral, alert, strained, relaxed, head turn) and handler hands/torso in `bundle/assets/` and verify asset loading in Vite dev server
- [x] 2.2 Add sprite loader definitions and frame mapping helpers in `bundle/src/sprites.ts` and `bundle/src/assets.ts`, verifying frame lookup with unit tests
- [x] 2.3 Implement close-up dynamic leash Bézier curve rendering with tension color states and sag clamping in `bundle/src/CloseExerciseScene.ts`, verifying rendering in the standalone sim bundle

## 3. Phaser Close-View Scene & HUD Controls

- [x] 3.1 Create `CloseExerciseScene.ts` in `bundle/src/` with high-zoom camera framing, narrow passage scenery layout, and scene lifecycle hooks, verifying scene initialization at `http://localhost:5173`
- [x] 3.2 Build specialized leash HUD controls in `CloseExerciseScene` (left thumb gather/shield controls, right thumb anchor/cue/marker buttons) and verify input dispatch with touch and keyboard bindings
- [x] 3.3 Implement approaching distractor dog trajectory animation and reactive arousal feedback in `CloseExerciseScene`, verifying pass encounter flow and failure lunges
- [x] 3.4 Wire message passing between `CloseExerciseScene` and the host shell via `src/sim/messages.ts`, verifying telemetry payload transmission on exercise completion

## 4. Shell Integration, Node Loop & Scenarios

- [x] 4.1 Update `src/shell/nodes/node.ts` and `src/shell/simViewTypes.ts` to support `mode: 'close_exercise'`, verifying `npm run typecheck` passes
- [x] 4.2 Author a close leash exercise training node scenario (narrow street dog pass) in `src/shell/nodes/scenarios.ts` and configure prerequisite trail flow
- [x] 4.3 Update `src/shell/screens/LessonScreens.tsx` and node execution runner to route `close_exercise` nodes into `SimView` and handle close exercise debrief telemetry
- [x] 4.4 Add Spanish localization strings for close leash exercises, controls, hints, and debrief feedback in `src/i18n/es.ts`, verifying catalog coverage with `npm test`

## 5. End-to-End Verification & Documentation

- [x] 5.1 Run full Jest test suite (`npm test`) and TypeScript typecheck (`npm run typecheck`) to verify zero regressions
- [x] 5.2 Build single-file embedded bundle (`npm run sim:build`) and test close exercise scene in standalone runner
- [x] 5.3 Document the close-view leash exercise architecture and scenario authoring guide in `docs/content/`, verifying documentation links and format
