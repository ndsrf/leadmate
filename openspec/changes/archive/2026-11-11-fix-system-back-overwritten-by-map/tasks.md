# Tasks

## 1. Reproduce & Audit

- [x] 1.1 Write a failing test for the map-with-overlay shape: with the Plus trial modal closed, the Library, Diary and Lesson back closures are the current ones, and the bare map has none (so `backAction` returns `'exit'`).
- [x] 1.2 Audit all app screens for on-screen back presence, header location, and system back registration.

## 2. Fix System Back Overwritten by Map

- [x] 2.1 In `mapWith` (`App.tsx`), pass `onCloseTrialModal={() => setTrialModalOpen(false)}` and call `withBack` for it only when `trialModalOpen && overlay === null`.
- [x] 2.2 Audit every `withBack` call in `App.tsx` for unconditional registration on a layer that stays mounted; fix any found.

## 3. Fix Simulator Back Appearance & Loading Cancellation

- [x] 3.1 In `App.tsx`, render `SimulatorBackButton` during `playingStage && !paused && !tastePayoff` without requiring `bundle === 'ready'`. Wire cancellation while `bundle !== 'ready'` to return cleanly without penalties (Taste Stage to Taste Brief, First Stage to Primer, Nodes/Daily/Warmup to Primer/Map).
- [x] 3.2 In `src/shell/navigation.ts`, update `backAction` so `playingStage && bundle === 'loading'` returns `hasScreenBack ? 'screen' : 'consume'`.
- [x] 3.3 Ensure `withBack` is registered during stage loading across all simulation types (Node stage, daily, warmup, taste, first-stage).

## 4. Fix Settings Screen & Funnel Back Navigation

- [x] 4.1 In `SettingsScreen.tsx`, add a close button to the fixed `header` bar matching `LibraryScreen` and `DiaryScreen`.
- [x] 4.2 In `DogLookScreen` and `SetupScreen`, ensure system back steps back to previous sub-parts when on step 2 or 3.

## 5. Verify & Test

- [x] 5.1 Add tests for `trialModalOwnsBack` and overlay back retention.
- [x] 5.2 Add tests for immediate `SimulatorBackButton` rendering during loading and cancellation via system back.
- [x] 5.3 Add tests for `SettingsScreen` header close button.
- [x] 5.4 Run the unit tests and typecheck.
- [x] 5.5 Manual pass on Android and web: verify back on all screens (Map, Library, Diary, Lesson, Shop, Settings, Mission screens, Puzzles, active simulations during loading and play, and onboarding funnel).
