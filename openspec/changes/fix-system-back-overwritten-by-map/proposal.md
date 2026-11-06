# Proposal

## Why

System back no longer reliably does what the on-screen back does. On Android, pressing back on the Theory Library, the Diary or a Lesson opened from the map can do nothing, and on the bare World Map it never leaves the app. It worked when the back handling shipped (`reorder-map-chips-and-back-button`) and broke when the Plus trial modal was wired into the map.

## What Changes

- Root cause: `mapWith` in `App.tsx` builds the World Map for every map-based screen (map, Settings, Library, Diary, Lesson). It passes `onCloseTrialModal={withBack(...)}` on every render, whether or not the trial modal is open. `withBack` is last-write-wins, and the overlay's `withBack(goHome)` is evaluated as the argument before `mapWith` runs, so the map's modal-closing no-op replaces it. Result: back on Library, Diary and Lesson closes an already closed modal and is consumed. On the bare map `hasScreenBack` is always true, so the press is consumed instead of leaving the app.
- Register the trial modal's back closure only while the modal is open and no overlay screen sits over the map.
- Prove the fix with a regression test of the registration; no new priority mechanism.
- Add tests that catch this class of bug: the back policy for map-based screens, and a check that each map-based screen's registered back wins.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `app-shell`: the "System back button follows the screen's own back" requirement gains scenarios for the Plus trial modal and for screens opened over the map while the map stays mounted.

## Impact

- `App.tsx` (`mapWith`) and a regression test.
- No data, API or dependency changes.
