# Proposal

## Why

System back no longer reliably does what the on-screen back does. On Android, pressing back on the Theory Library, the Diary or a Lesson opened from the map can do nothing, and on the bare World Map it never leaves the app. It worked when the back handling shipped (`reorder-map-chips-and-back-button`) and broke when the Plus trial modal was wired into the map.

Furthermore, across the full screen review, back navigation exhibits timing and accessibility issues:
- During Stage simulations, the on-screen `SimulatorBackButton` takes noticeably longer to appear because it waits for `bundle === 'ready'`. While `bundle === 'loading'`, no on-screen back button is shown, and system back is consumed/ignored. On `bundle === 'error'`, no back button exists.
- In `SettingsScreen`, there is no header close button; the only close button is buried at the bottom of the scroll view, unlike all other overlay screens (`LibraryScreen`, `DiaryScreen`, `LessonScreen`, `ShopScreen`).
- In multi-step onboarding screens (`DogLookScreen`, `SetupScreen`), sub-step back buttons exist on screen but system back drops to app exit instead of stepping back.

## What Changes

- **Map Overlays**: Register the trial modal's back closure only while the modal is open and no overlay screen sits over the map (`trialModalOwnsBack`).
- **Simulator Back Immediate Availability**: Render `SimulatorBackButton` immediately when `playingStage` is active (even while `bundle === 'loading'` or `bundle === 'error'`), allowing the user to abort loading and return to the map or previous screen. Update `backAction` so system back during `bundle === 'loading'` triggers the screen's back action instead of consuming the press.
- **Settings Screen Header Close**: Add an accessible back/close button to the `SettingsScreen` header bar, matching `LibraryScreen`, `DiaryScreen`, and `ShopScreen`.
- **Funnel Multi-Step Back Alignment**: Wire system back on `DogLookScreen` (step 2 `name` -> step 1 `look`) and `SetupScreen` (steps `weights`/`about` -> previous part) so hardware back matches on-screen back.
- **Screen Review Verification**: Add test coverage and manual audit verification across all screens ensuring back works consistently.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `app-shell`: System back navigation requirements gain scenarios for simulation loading, Settings header close, and funnel sub-step back.
- `stage-flow`: Simulator back button is available immediately during stage loading and error states, allowing cancellation.

## Impact

- `App.tsx` (`mapWith`, `playingStage` back button rendering, and funnel sub-step back wiring).
- `src/shell/navigation.ts` (`backAction` handling for `bundle === 'loading'`).
- `src/shell/screens/SettingsScreen.tsx` (header close button).
- `src/shell/screens/IntroScreens.tsx` and `SetupScreen.tsx`.
- Test suites (`src/shell/navigation.test.ts`, `src/App.test.tsx`, `SettingsScreen.test.tsx`).
