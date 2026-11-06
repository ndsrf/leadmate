# Tasks

## 1. Reproduce

- [x] 1.1 Write a failing test for the map-with-overlay shape: with the Plus trial modal closed, the Library, Diary and Lesson back closures are the current ones, and the bare map has none (so `backAction` returns `'exit'`).

## 2. Fix

- [x] 2.1 In `mapWith` (`App.tsx`), pass `onCloseTrialModal={() => setTrialModalOpen(false)}` and call `withBack` for it only when `trialModalOpen && overlay === null`.
- [x] 2.2 Audit every `withBack` call in `App.tsx` for unconditional registration on a layer that stays mounted; fix any found.

## 3. Verify

- [x] 3.1 Add a test: modal open and no overlay makes the modal close the current back; modal open or closed with an overlay leaves the overlay's back current.
- [x] 3.2 Run the unit tests and typecheck.
- [ ] 3.3 Manual pass on Android: back from the Library, the Diary, a Lesson from the Library, a Lesson from the map and Settings, after opening and closing the Plus trial modal; back closes the modal when open; back on the bare map leaves the app.
