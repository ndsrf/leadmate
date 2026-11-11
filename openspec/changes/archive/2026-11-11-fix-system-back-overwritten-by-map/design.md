# Design

## Context

- `App.tsx` keeps `screenBack`, a ref reset to `null` at the top of each render. `withBack(fn)` stores `fn` and returns it, so the last call during a render wins. `backInput.current.hasScreenBack` is set from it at the end of the render, and the `hardwareBackPress` handler runs `screenBack.current` when `backAction` answers `'screen'`.
- `mapWith(overlay)` renders `WorldMapScreen` plus the overlay (Settings, Library, Diary, Shop, or Lesson). Callers build the overlay element first, so their `withBack(...)` runs before `mapWith` does.
- `mapWith` previously passed `onCloseTrialModal={withBack(() => setTrialModalOpen(false))}` unconditionally, overwriting the overlay's registration.
- In addition, an audit of all screens revealed three areas where back was either delayed or failed to work:
  1. `SimulatorBackButton` was rendered only when `bundle === 'ready'`, causing it to take longer to appear during bundle download and initialization. Furthermore, `backAction` returned `'consume'` while `bundle === 'loading'`.
  2. `SettingsScreen` placed its only close button at the bottom of its scrolling content with no close control in the header bar.
  3. `DogLookScreen` and `SetupScreen` contained internal sub-steps with on-screen back controls in `StepHeader`, but did not register with `withBack`, causing Android system back to exit the app.

## Goals / Non-Goals

**Goals:**
- Topmost screen's back is always the one registered.
- The bare World Map leaves the app on the first press.
- `SimulatorBackButton` appears immediately on stage entrance without waiting for `bundle === 'ready'`.
- Tapping back or pressing system back while a Stage is loading returns to the caller screen.
- `SettingsScreen` includes a header close button.
- Multi-step funnel screens step back to previous sub-steps on system back.

**Non-Goals:**
- Full navigation library or history stack.
- Modifying static minigames with no exit (Doorbell, ReadDog, Poste) or timed checkpoints.

## Decisions

### 1. Register the modal's back only while it matters
In `mapWith`, call `withBack` for the trial modal only when `trialModalOpen && overlay === null`, and pass a plain `() => setTrialModalOpen(false)` as the prop. With nothing registered, the bare map yields `hasScreenBack = false` and `backAction` returns `'exit'`.

### 2. Immediate SimulatorBackButton & Loading Cancellation
- In `App.tsx`, render `SimulatorBackButton` whenever `playingStage && !paused && !tastePayoff`, removing the `bundle === 'ready'` restriction so it is visible during `loading` and `error` states.
- When `bundle !== 'ready'`, tapping `SimulatorBackButton` or pressing system back aborts the stage:
  - Trail nodes, daily walks, and warm-ups return to the Primer or Map without an attempt counted or penalty recorded.
  - Taste Stage returns to the Taste Brief screen (`tasteBriefed = false`).
  - First Stage walk returns to the First Stage Primer (`introRun.step = 'primer'`).
- In `src/shell/navigation.ts`, update `backAction` so when `playingStage && bundle === 'loading'`, if `hasScreenBack` is true it returns `'screen'` (allowing clean cancellation), rather than `'consume'`.

### 3. Settings Header Close Button
Add a close button to `SettingsScreen`'s header bar, aligned to the top-right next to the title, matching `LibraryScreen` and `DiaryScreen`.

### 4. Wire Sub-Step Back in Onboarding Funnel
In `App.tsx`, pass an `onBack` handler or wire `withBack` for `DogLookScreen` and `SetupScreen` when in sub-steps > 1 so system back steps back through internal parts before leaving the screen.

## Risks / Trade-offs

- [Aborting a loading stage while Phaser bundle is in flight] → The WebView's `onLoadError` / `viewWanted` lifecycle cleanly suspends and destroys the view when `route` changes away from `playingStage`.
- [Screen regression] → All existing screen tests and navigation tests must pass.

## Migration Plan

UI only, no persisted data. Rollback is reverting the commit.
