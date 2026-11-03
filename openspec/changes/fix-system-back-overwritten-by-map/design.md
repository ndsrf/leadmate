# Design

## Context

- `App.tsx` keeps `screenBack`, a ref reset to `null` at the top of each render. `withBack(fn)` stores `fn` and returns it, so the last call during a render wins. `backInput.current.hasScreenBack` is set from it at the end of the render, and the `hardwareBackPress` handler runs `screenBack.current` when `backAction` answers `'screen'`.
- `mapWith(overlay)` renders `WorldMapScreen` plus the overlay (Settings, or the Library, Diary or Lesson passed in). Callers build the overlay element first, so their `withBack(...)` runs before `mapWith` does.
- `mapWith` passes `onCloseTrialModal={withBack(() => setTrialModalOpen(false))}` unconditionally. It runs after the overlay's registration (except Settings, whose JSX is built after the map), so it overwrites Library, Diary and Lesson, and on the bare map it makes back always "handled".
- Observed: this matches "used to work, not always". Settings and non-map screens still work, and the map-based ones fail. The `withBack` call was added by the RevenueCat trial-modal work after the back-button change shipped.

## Goals / Non-Goals

**Goals:**
- The topmost screen's back is always the one registered.
- The bare World Map leaves the app on the first press, as specified.

**Non-Goals:**
- No navigation library or history stack.
- No change to `backAction`'s policy table.

## Decisions

### 1. Register the modal's back only while it matters
In `mapWith`, call `withBack` for the trial modal only when `trialModalOpen && overlay === null`, and pass a plain `() => setTrialModalOpen(false)` as the prop. With nothing registered, the bare map yields `hasScreenBack = false` and `backAction` returns `'exit'`.
- *Alternative*: first-write-wins in `withBack`. Rejected as the only fix because the build order is not "top first" (Settings is built after the map), so it would trade one ordering bug for another.

### 2. Prove it with a regression test, not a new registry
The `backAction` tests pass today because the bug is in what gets registered. Add a test of the map-with-overlay shape that asserts which back closure is current: modal open and closed, with and without an overlay. If the registration can't be tested in place, extract only the minimal seam needed.
- *Alternative*: a priority registry so a lower layer can't replace the screen on top. Rejected for now as machinery for a one-line bug. Revisit if a second case of the same failure appears.

### 3. The trial modal is map-only
The modal opens only from the map's own chip and covers the map, so it can't be open under a Library, Diary or Lesson. Back closes the modal first and stays on the map. The map never registers the modal's back while an overlay screen is on top.

### 4. Policy unchanged
The bare World Map keeps the specified first-press exit. The fix restores that behavior; `backAction` is not changed.

## Risks / Trade-offs

- [Another unconditional `withBack` exists elsewhere] → Audit every `withBack` call during apply (the greps show only `mapWith` registers outside a screen branch).
- [A test of the registration needs a render harness] → Extract the smallest seam that makes it testable.

## Migration Plan

UI only, no persisted data. Rollback is reverting the commit.
