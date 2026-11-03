# Design

## Context

See proposal.md. Existing state that shapes the approach:

- The Stage loop is gated by `shouldRun()` in `bundle/main.ts`: 30 fps cap, 30 Hz timer pacing, asleep when suspended, hidden, paused or ended. It does not know about the hand drill's how-to card (`introOpen`).
- The hand drill is an HTML/SVG overlay (`HandDrillView`) driven from `CloseExerciseScene.update`; the Phaser world is not built for it, but the loop still renders its canvas. Its CSS has endless `nudge`, `bob` and `pulse` animations on SVG groups and buttons that nothing stops.
- `scripts/power.mjs` and the dev readout count Phaser `POST_RENDER` frames only, so DOM and CSS work is invisible to them.
- The shell has endless Reanimated loops (`CanineMinigameAvatar`, `MinigameProps`, `SplashScreen`); some are gated by `live`/app state, others by posture only.
- Expo Go is in use for development: no custom native modules, so no thermal or per-app energy API in the app. `cut-idle-shell-gpu-load` already unmounts the Stage view off-Stage and bounds the Next Up pulse; its device tasks are not run.

## Goals / Non-Goals

**Goals:**
- A written budget that can be judged pass or fail from energy numbers.
- Every layer (shell, DOM view, Stage bundle) visible in one dev readout and one scripted check.
- Fix what exceeds the budget in this change, so power is not revisited often.

**Non-Goals:**
- Field telemetry, production battery or thermal readouts.
- Changing the default theme or the look of the Stage and minigames beyond bounding idle motion.
- A native energy-measuring module.

## Decisions

1. **Budget is relative to a reference screen, judged on energy.** Display power dominates 10 minutes of screen-on use, so absolute battery percent cannot be a target. Reference: a static full-screen page (or the app's splash with the loop asleep) at fixed brightness. Pass or fail uses Android `dumpsys batterystats`/Battery Historian (mAh) and iPhone Xcode Energy Log; 1%-resolution battery percent is recorded only as a check. *Alternative:* absolute percent; rejected because it fails on any phone.

2. **Activity counters are the regression net; devices are the acceptance test.** Counters (frames, wakeups, running animations, live loops, timers, DOM renders) run in CI/headless and catch regressions per commit. The device run happens once for the baseline and again at the end. *Alternative:* device runs only; too slow to catch regressions.

3. **One readout, three sources.** The Stage bundle reports `document.getAnimations()` length and DOM render count next to the existing wakes/frames/steps (`?perf=1`). The shell exposes a small dev-only counter module that Reanimated loop starts, timers and screen state report into, shown in a dev overlay. Production builds compile it out. Nothing is stored or sent.

4. **Scenario runner extends `power.mjs`.** Add scenarios for the hand drill (`?scene=close`): playing, paused, how-to card open, ended; assert no running animations, no frames and no DOM renders when not playing. Shell scenarios run against the web build with the same counters. The device-only parts stay manual.

5. **Endless-animation guardrail by test.** A jest test scans `src` for endless repeats (`withRepeat(..., -1)`, `Animated.loop`, `setInterval`) and compares to an allow-list file with a reason per entry; an unlisted one fails. Allowed entries must be gated by screen focus, app state and need.

6. **Hand drill: stop animation with a root class, drive the rest at the capped rate.** Pausing, the how-to card and the end state set a class on `#hd` that sets `animation-play-state: paused` (or `animation: none`) for all endless animations. The tempting-hand nudge and Dog bob, which animate SVG groups (repaint, not composited), move to the same 30 Hz `render()` path or become composited HTML transforms; the button `pulse` stays CSS only because it is composited, and stops with the class. *Alternative:* remove the motion; kept as the fallback if profiling still shows repaint cost.

7. **Hand drill needs no canvas frames.** The scene keeps the clock and input but the loop should not render the Phaser canvas for it: hide or detach the canvas and drive the sim with a 30 Hz timer, or keep the loop and skip the render step. Pick the smaller change during implementation; either way `shouldRun()` also returns false while `introOpen` is true.

8. **Cache DOM references in `HandDrillView`.** Resolve the elements once in the constructor and write meter segments and step labels through the existing change-cache, so a frame with no change touches nothing.

9. **Shell loops follow one gate.** A shared hook (building on `useAppActive` and screen focus) decides whether an endless animation may run: app active, screen in front, and the visual state needs motion. Minigame avatar and prop loops use it; loops for postures that need motion stay but stop with the gate. Splash loop stops when the loader is covered.

10. **Stage: profile first, fix within the change.** Run a 10-minute Stage on both platforms with the readout and the device tools; fix in this order of likely return: per-frame JS work (HUD, depth sort, allocation), simulation step cost, draw cost (texture size, tint changes, Graphics redraws), WebView settings. Stop when the budget passes. Any fix must keep outcomes identical for the same seed.

11. **Ads and video: audit, then constrain.** Inspect the ad component lifecycle and refresh settings and Lesson video playback; require no ad request without a slot in view, no background refresh, no autoplay. Fix by unmounting or not rendering the ad when not in view, and by pausing media on blur.

12. **Fold in `cut-idle-shell-gpu-load` device tasks.** Run its baseline (task 1.x) and device verification (4.1) as part of this change's baseline, record in `docs/power-baseline.md`, and close those tasks when done.

## Risks / Trade-offs

- [Counters pass but the phone still heats] → the device energy run is the acceptance test, and the counters are extended when a gap is found.
- [Reference screen choice skews the delta] → define it once in `docs/power-baseline.md` and reuse it for every run.
- [Android battery stats are noisy] → repeat three runs and use the median; fix brightness and radios, airplane mode with Wi-Fi off where the scenario allows.
- [Stage profiling finds a large fix] → keep it behind the same seeded-outcome tests; if it cannot meet the budget, record the gap and the remaining cost rather than weaken the budget silently.
- [Less decorative motion] → idle motion is bounded or stops, and the hint states stay readable through colour and the instruction bubble.
- [Dev readout adds its own overhead] → it is development-only and off by default.

## Reference devices

iPhone 16 (60 Hz) and Pixel 7 Pro (120 Hz). The Pixel is the high-refresh case: display-rate behaviour (loop wakeups, DOM animation repaint rate) is judged on it, and the iPhone confirms the 60 Hz path and iOS energy numbers. Both are recorded in `docs/power-baseline.md`.
