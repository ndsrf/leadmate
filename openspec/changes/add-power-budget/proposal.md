# Proposal

## Why

Playing LeadMate makes the phone hot and drains the battery. `power-efficiency` and the in-flight `cut-idle-shell-gpu-load` fixed the Stage loop and the World Map, but the spec states no battery target, no baseline has ever been recorded (`docs/power-baseline.md` is empty), and the checks only watch Phaser frames. Whole areas are unwatched: the close-view hand drill (an HTML/SVG layer with infinite CSS animations that keep repainting while paused, at display refresh rate), looping Reanimated animations in minigames, the Stage itself over a 10-minute session, ads and Lesson video. The owner does not want to revisit performance often, so this change sets a budget, makes it measurable, and fixes what exceeds it in one go.

## What Changes

- **Budget.** Measured against a static reference screen (display on, fixed brightness, no app work) over 10 minutes on a production-like build: idle shell screens add 0 (no frames, wakeups, running animations or timers; at most 0.3% energy noise), and a simulator session (Stage or hand drill) adds at most 2%. Pass or fail uses energy numbers (Android `batterystats` mAh, Xcode Energy Log); battery % is a sanity check only.
- **Lab observability, no field telemetry.** One development-only readout spanning the shell (JS-thread rate, live Reanimated loops, active timers, screen, app state), the DOM views (running CSS/SVG animations, render calls per second) and the Stage bundle (existing wakes/frames/steps). A scripted scenario runner (extending `scripts/power.mjs`) walks World Map, Barkdoku, hand drill and a Stage and asserts the counters. A guardrail test fails on an infinite animation outside an allow-list.
- **Close view fixes.** No infinite CSS/SVG animation while the drill is paused, behind the how-to card or ended; DOM animation respects the 30 fps cap instead of running at display rate; the Phaser loop does not render an empty canvas for the hand drill and sleeps while the how-to card is open; `HandDrillView` stops re-querying and rewriting unchanged elements every frame.
- **Shell animation fixes.** Minigame avatar, prop and splash loops run only while their screen is in front, the app is active and the animation is visible; none runs on a resting screen. Allow-list for any loop that must stay.
- **Stage.** Profile a 10-minute session on both platforms; fix what keeps it over budget (candidates: render cost per frame, sim step cost, HUD/DOM overhead, WebView settings). Applies fixes found, within the budget.
- **Ads and Lesson video.** Audit ad load/refresh and Lesson video playback; fix or constrain what breaks the budget (no ad work on idle screens, no ad refresh timers in the background, no autoplay).
- **Finish `cut-idle-shell-gpu-load`'s device tasks** as part of the baseline run instead of duplicating them; record all results in `docs/power-baseline.md`.
- **Gate.** A power-affecting change is not merged without the counters passing in the scenario runner and a device energy record inside budget.

Out of scope: field/production telemetry, an in-app battery or thermal readout, changing the default theme, redesigning minigames or the Stage's look.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `power-efficiency`: adds the energy budget and reference definition, whole-app (shell, DOM view, Stage) observability and a scenario regression check, a no-infinite-animation rule for resting, paused or covered views including the close view, a bounded-DOM-animation rule, an idle loop rule for the hand drill, and an ads/video requirement.

## Impact

- `bundle/src/handDrillView.ts`, `bundle/src/CloseExerciseScene.ts`, `bundle/main.ts` (loop gating for the hand drill and intro card).
- `src/shell/ui/CanineMinigameAvatar.tsx`, `MinigameProps.tsx`, `screens/SplashScreen.tsx` and other looping animations; a new animation-guardrail test.
- `src/shell/` dev readout and the app-wide perf surface; `scripts/power.mjs` (scenario runner, close-scene case).
- Stage code (`bundle/src/StageScene.ts`, sim step) only where profiling shows over-budget cost.
- Ads (`src/shell/ads/`) and Lesson video (`LessonVideo.tsx`) as the audit finds.
- Docs: `docs/power-baseline.md` filled in; budget and method written down.
- Depends on, and supersedes the device-verification tasks of, `cut-idle-shell-gpu-load`.
- Trade-off: some decorative motion (nudge, bob, pulse) becomes bounded or stops when idle.
