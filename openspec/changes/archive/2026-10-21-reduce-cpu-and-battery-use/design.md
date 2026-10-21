# Design

## Context

See proposal.md for motivation. Observed in the code:

- `bundle/main.ts` creates `Phaser.Game` with defaults: Phaser's RAF loop runs forever at the display refresh rate, with no fps target, no resolution cap.
- `StageScene.update()` always runs `showHints`, `followCamera`, `draw` and `drawHud`, even when `sim.paused || ended`; `draw` and `drawHud` do `Graphics.clear()` plus a full redraw each frame, and `drawHud` calls `setText` on the marker count every frame.
- Pause (`pauseStage`) only sets `sim.paused`. The shell's `AppState` handler sends `pause` when not active, and the bundle also listens to `visibilitychange`/`blur`, but neither stops the game loop. On native, the WebView is a separate renderer process; a WebView on a screen-off device may keep timers/RAF throttled but not guaranteed stopped (Android WebView in particular).
- `App.tsx` mounts `SimView` unconditionally, behind every shell screen, so the Phaser loop also runs under the World Map and menus.
- Shell has several `setInterval`s and a `withRepeat` pulse on the World Map; reanimated's `withRepeat(-1)` keeps the UI thread working while the view exists. `DiagnosticView` (20 ms) and `DoorbellMatView` / `PosteMinigameView` (50 ms) call `setState` on every tick and have no `AppState` handling.

## Goals / Non-Goals

**Goals:**
- Zero frames drawn when the Stage is hidden, paused or ended, or the app is backgrounded.
- At most 30 fps and bounded pixel count while playing.
- A cheap, repeatable way to verify both.

**Non-Goals:**
- Replacing Phaser/WebView, changing simulation behaviour or visuals.
- A user-facing battery-saver setting.
- Profiling audio (expo-audio players are created per cue and removed; revisit only if measurements show cost).

## Decisions

1. **Stop the loop, don't just skip draws.** Use `game.loop.sleep()` / `game.loop.wake()` (or `game.pause()`/`resume()`) driven by one `setRunning(bool)` function in `bundle/main.ts`, fed by: sim paused, stage ended, `document.hidden`, window blur, and a new shell message `suspend`/`wake`. Alternative: keep looping and early-return in `update` — rejected, the RAF wakeups and compositing still cost power.
2. **Draw-once on state changes.** Before sleeping, render one frame so the paused/ended picture is on screen; on `resize` (RESIZE scale mode) wake for one frame, then sleep again. Alternative: render nothing and rely on overlay cards — rejected, the last frame would be stale or blank on some GPUs after a context pause.
3. **Resume without a time jump.** On wake, reset the loop's time delta (Phaser `loop.resetDelta()`, plus the existing `accumulator = 0` and the existing 100 ms delta clamp) so no catch-up occurs; Stage time still only advances through `tick`.
4. **Suspend the bundle from the shell when no Stage is playing.** `App.tsx` already derives `playingStage`; send `suspend` when it turns false and `wake`+`start` when it turns true, in addition to the AppState handler. Alternative: unmount the WebView — rejected, it makes each Stage start pay the bundle load time and breaks the ready handshake.
5. **Frame cap and render quality.** Phaser `fps: { target: 30, limit: 30 }`, `antialias: false`, `powerPreference: 'low-power'`, and resolution/DPR capped at 2 (`Math.min(devicePixelRatio, 2)`). The fixed 60 Hz step accumulator runs up to two simulation steps per rendered frame, so simulation speed and training outcomes are independent of fps. Alternative: 60 fps — rejected, it roughly doubles render cost for a game that does not need it. Antialiasing off softens line edges slightly on dense screens; accepted for the power savings.
6. **Dirty-checking for HUD and camera.** Cache the last HUD inputs (joystick state, marker count, bar level, label text/size) and the last camera inputs (target position, zoom) and skip `clear()`/redraw/`setText`/`setZoom`/`centerOn` when unchanged. The world layer keeps redrawing every frame. Alternative: pre-rendering the static scenery to a texture once per Stage — only if the measurement in task 3.3 shows `Graphics` redraw is still the dominant cost.
7. **Shell timers follow visibility.** A small `useAppActive()` hook cancels `withRepeat` and `setInterval` effects when `AppState` is not `active` (World Map pulse, Checkpoint countdown, reveal counters). The minigame timers (`DiagnosticView`, `DoorbellMatView`, `PosteMinigameView`) additionally stop calling React `setState` on every tick: per-tick values live in refs or reanimated shared values, and only discrete changes (phase, score) update React state.
8. **Measure first-class.** A dev-only overlay (`?perf=1` or a debug flag) shows frames/s, simulation steps/s and ms per frame from `game.loop`; a Playwright-based check (playwright-core is already a devDependency) drives the debug handle `__leadmate`, pauses, and asserts the frame counter does not advance. Pass criteria: at most 30 frames/s while playing and zero frames while paused or hidden, compared against a recorded baseline.

## Risks / Trade-offs

- [Loop sleeps and never wakes (blank/frozen game)] → one `setRunning` owner, wake on every shell `start`/`resume`/`wake` message and on `visibilitychange` to visible; a Playwright check covers pause → resume.
- [WebView `visibilitychange` unreliable on Android/iOS] → rely on the shell's explicit `suspend`/`wake` messages as the primary signal, DOM events as a backup.
- [Stale frame after sleeping, black flash on resume] → draw one frame before sleeping and one on wake before the first tick.
- [30 fps makes the joystick or leash feel less smooth] → input is sampled by the fixed 60 Hz simulation, not the render rate; check by hand on a device.
- [DPR cap and no antialiasing soften edges on 3x phones] → HUD text is large; check visually on a high-density device.
- [Dirty-checking bugs leave stale HUD or camera] → compare against inputs, not time; keep a unit test for the change detector.
- [Minigame timing drifts after moving off React state] → keep timestamp-based elapsed time, not tick counting.

## Open Questions

(none)
