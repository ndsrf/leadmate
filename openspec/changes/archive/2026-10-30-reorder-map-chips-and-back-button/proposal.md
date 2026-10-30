# Proposal

## Why

The World Map header splits its buttons across two rows in an order that doesn't match how often people use them, and it still shows a "Diario" chip even though the Streak chip already opens the Diary (the `world-map-screen` spec already says there must be no separate Diary chip). Separately, the app never handles the Android system back button: pressing it anywhere exits the app, even from the Diary or mid-Stage, which loses context and feels broken.

## What Changes

- Show the World Map header buttons as a single wrapping row in this order: Streak ("X días seguidos"), Biblioteca, the Settings gear, El Paseo del Día, Guaudoku.
- The Settings gear moves from the pinned top-right corner into that row, in third position. It stays icon-only, keeps the minimum touch target and keeps its accessible name. **BREAKING** (to the current spec): the gear is no longer pinned to the top-right corner.
- Remove the "Diario" chip. The Streak chip stays the only way to open the Diary from the map.
- Handle the system back button (Android hardware/gesture back) in the shell:
  - On a screen opened from the map (Diary, Library, Settings, Guaudoku, a Lesson, a Mission screen, the Paywall, registration, a Node's screens, the Daily result), back does the same thing as that screen's own back/close action, which usually returns to the World Map, or to the screen that opened it (for example Library → Lesson → back → Library). On a Node Debrief that is its Done action, so the last Node of a Stretch opens its Mission brief.
  - Where leaving would lose an attempt or skip a required choice, back does nothing: the timed Checkpoint, the Minigames with no exit button (Doorbell, ReadDog, Poste), the onboarding first Stage's Checkpoint and Debrief, the taste payoff and the Choose Dog screen.
  - During a Stage (Node simulation, Daily Stage, warm-up, onboarding taste/first Stage), back pauses the Stage and shows the existing Pause Menu (Continue / Exit). Pressing back again while that menu is open is the same as Continue.
  - If a Stage failed to load, back leaves it for the World Map. In onboarding, back does nothing there.
  - On the World Map itself, back keeps the platform default and leaves the app on the first press, with no "press again to exit" toast.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `world-map-screen`: "Persistent status chips" changes the header layout and the gear position; "Diary entry" stays as it is (the code is brought in line with it).
- `app-shell`: adds a requirement for system back-button navigation that follows each screen's own back action and pauses an active Stage.
- `stage-flow`: adds a requirement that the system back button pauses a running Stage and shows Resume/Exit, and that back again resumes.

## Impact

- `src/shell/screens/WorldMapScreen.tsx`: header layout, remove the Diary chip, update its tests (`WorldMapScreen.test.tsx`).
- `src/shell/navigation.ts`: new pure back-target resolver next to `routeFor`, plus tests in `navigation.test.ts`.
- `App.tsx`: register a `BackHandler` listener that uses the resolver, sends `pause` to the sim during a Stage, and resumes while the Pause Menu is open.
- `src/i18n/es.ts`: `diary.chip` stays because the Streak chip's accessible label uses it.
- Android only for the hardware back button. iOS and web have no system back button, so nothing changes there.
