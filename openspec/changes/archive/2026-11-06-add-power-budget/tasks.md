# Tasks

## 1. Budget and observability

- [x] 1.1 Write the budget, the reference screen and the measurement method (fixed brightness, production-like build, three runs, median) into `docs/power-baseline.md`; verify the doc states 0.3% / 2% over 10 minutes and how energy is read on Android and iPhone.
- [x] 1.2 Add `document.getAnimations()` count and a DOM-render counter to the Stage bundle's `?perf=1` readout and `window.__leadmate.perf`; verify with a unit or script check that the values change when the hand drill animates and read zero when it rests.
- [x] 1.3 Add a development-only shell counter module (live endless animations, active timers, current screen, app state) with an on-screen dev overlay compiled out of production builds, hidden by default and shown with `EXPO_PUBLIC_DEV_PERF_OVERLAY=1`; verify with a test that it reports a started and a cancelled loop, and that the production flag removes it.
- [x] 1.4 Add the endless-animation guardrail test and allow-list file (each entry with a reason); verify the test passes on the current allow-list and fails when an unlisted `withRepeat(..., -1)` is added.

## 2. Close view (hand drill)

- [x] 2.1 Add a root class on `#hd` that pauses every endless animation while the drill is paused, ended or showing the how-to card, and clears on resume/start; verify with a bundle test that `document.getAnimations()` has no running endless animation in those states and runs again when playing.
- [x] 2.2 Make `shouldRun()` return false while the how-to card is open and drive the clock without rendering an empty Phaser canvas for the hand drill; verify with `power.mjs` that frames drawn are zero with the card open, paused and ended, and the sim still advances at its fixed rate while playing.
- [x] 2.3 Move the tempting-hand nudge and Dog bob off display-rate SVG CSS animation (30 Hz `render()` path, or composited transforms); verify on a 120 Hz profile that repaints stay at about 30 per second and the motion still reads.
- [x] 2.4 Cache element references in `HandDrillView` and route meter segments and step labels through the change-cache; verify with a test that a frame with unchanged state performs no DOM writes and no `querySelector` calls.
- [x] 2.5 Add the close-scene cases (`?scene=close`: playing, paused, card open, ended) to `scripts/power.mjs`; verify the script passes and fails when an endless animation is left running while paused.

## 3. Shell animations

- [x] 3.1 Add a shared gate hook (app active, screen in front, motion needed) and use it for `CanineMinigameAvatar`, `MinigameProps` and `SplashScreen` loops; verify with component tests that each loop starts only when the gate is open and is cancelled when it closes.
- [x] 3.2 Audit every remaining endless loop and timer in `src` (including `ticker.ts` consumers); remove, bound or gate each, and list the ones that stay in the allow-list with a reason; verify the guardrail test passes with no unexplained entry.
- [x] 3.3 Add shell scenario checks (World Map, Barkdoku, Settings, a minigame idle, a minigame backgrounded) to the scenario runner asserting zero looping animations and timers when resting; verify the runner passes.

## 4. Baseline and Stage

- [ ] 4.1 On the iPhone 16 and the Pixel 7 Pro (120 Hz), record the reference screen and the "before" energy for the World Map, Barkdoku, the hand drill and a Stage (10 minutes each), plus `cut-idle-shell-gpu-load` tasks 1.1–1.3 and the cold-load time; verify `docs/power-baseline.md` is filled in for every row and the Decision 1 choice there is recorded.
- [ ] 4.2 Profile a 10-minute Stage on both platforms with the readout and the device tools; list the top costs in `docs/power-baseline.md` and verify the list names a measured number for each.
- [ ] 4.3 Fix the top Stage costs in order (per-frame JS work, sim step cost, draw cost, WebView settings) until the budget passes; verify the existing seeded-outcome tests still produce identical results and `power.mjs` still passes.

## 5. Ads and media

- [x] 5.1 Audit ad load, refresh and lifecycle in `src/shell/ads/` and Lesson video playback; record findings in `docs/power-baseline.md` and verify each finding states whether it breaks the budget.
- [x] 5.2 Fix the findings: no ad request or animation without a slot in view, no background refresh, no autoplay, media pauses on blur; verify with tests that a screen with no ad slot has no ad activity and that backgrounding stops refresh.

## 6. Verify against the budget

- [ ] 6.1 Re-run the task 4.1 measurements after the changes on the iPhone 16 and the Pixel 7 Pro; verify idle screens are within 0.3% and the hand drill and Stage within 2% of the reference over 10 minutes, and record the table next to the baseline.
- [ ] 6.2 Close the device tasks of `cut-idle-shell-gpu-load` (1.1–1.3, 2.5, 3.2, 4.1) with the recorded results and verify each is ticked or explicitly skipped with a reason.
- [x] 6.3 Run `npm test`, `npm run typecheck` and `node scripts/power.mjs`; verify all pass.
