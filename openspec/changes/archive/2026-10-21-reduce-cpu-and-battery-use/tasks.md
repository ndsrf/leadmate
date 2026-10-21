# Tasks

## 1. Measure

- [x] 1.1 Add a dev-only perf readout (frames drawn per second, simulation steps per second, ms per frame) in `bundle/main.ts` behind a debug flag, and verify it shows live numbers in `npm run sim:dev`.
- [x] 1.2 Record a baseline (frames/s and steps/s while playing, paused, on results) in the design notes or PR text, and verify paused/results currently still draw every frame.

## 2. Stop rendering when nothing is shown

- [x] 2.1 Add `suspend`/`wake` shell messages (`src/sim/messages.ts`, with decode tests) and verify the message tests pass.
- [x] 2.2 Add a single `setRunning` owner in `bundle/main.ts` that sleeps/wakes the Phaser loop from pause, stage end, `visibilitychange`, blur, and `suspend`/`wake`; draw one frame before sleeping and reset the loop delta on wake. Verify with a Playwright script on `__leadmate` that the frame counter does not advance while paused, ended or hidden, and that resume continues with no Dog jump.
- [x] 2.3 Wake for a single frame on `resize` while asleep and verify the paused view re-lays out after a window resize.
- [ ] 2.4 In `App.tsx`, send `suspend` when `playingStage` turns false or the app leaves `active`, and `wake` when a Stage is shown; verify on a device/emulator that the World Map and screen-off draw no frames (perf readout stays flat).
- [x] 2.5 Keep the automated check from 2.2 as a regression test in the repo and document how to run it in README.

## 3. Cap work while playing

- [ ] 3.1 Set the Phaser fps target/limit to 30, resolution cap 2, `antialias: false` and `powerPreference: 'low-power'` in the game config; verify frames/s ≤ 30 on a 60 Hz and a 120 Hz display (or throttled emulation) and that simulation speed is unchanged (existing sim tests still pass).
- [x] 3.2 Add dirty-checking for the HUD, labels and camera updates in `StageScene` (unit-test the change detector) and verify the HUD and camera are not redrawn while their inputs are unchanged.
- [ ] 3.3 Re-measure; only if `Graphics` redraw of the scenery remains the dominant cost, render the static scenery to a texture once per Stage and verify the visual output is unchanged.

## 4. Shell background work

- [x] 4.1 Add a `useAppActive()` hook and use it to cancel `withRepeat` in `WorldMapScreen` and the `setInterval` timers in `NodeScreens` and `useReveal` while inactive; verify with a hook test (or manual AppState toggle) that timers stop and restart.
- [x] 4.2 In `DiagnosticView`, `DoorbellMatView` and `PosteMinigameView`, move per-tick values out of React state (refs or reanimated shared values, timestamp-based elapsed time) and pause the timers while the app is inactive; verify the minigames behave the same and re-render only on discrete changes.

## 5. Verify

- [ ] 5.1 Play a 15-minute session on a real phone and compare device temperature/battery drop (Android battery stats or Xcode energy gauge) with the baseline; record the result in the PR.
- [ ] 5.2 Confirm the pass criteria: at most 30 frames/s while playing and zero frames while paused, ended or hidden.
- [x] 5.3 Run `npm test` and `npm run typecheck`; confirm both pass.
