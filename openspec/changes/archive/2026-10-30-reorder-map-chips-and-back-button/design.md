# Design

## Context

- **Map header** (`src/shell/screens/WorldMapScreen.tsx`, `header`): row 1 holds the Streak chip and the `IconChip` gear pinned right. Row 2 is a `flex-wrap` row with Daily, Barkdoku, Library and a "Diario" `Chip`. The Diary chip goes against the existing `world-map-screen` "Diary entry" requirement. The Streak chip already calls `onDiary`.
- **Back button**: nothing registers a `BackHandler`, so Android back exits the app from every screen.
- **Routing**: `routeFor` in `src/shell/navigation.ts` picks the route from state. `App.tsx` then builds the screen inline and passes each one its own back/close/done closure (`goHome`, `setFlow({ name: 'library' })`, `onAuthDone`, the paywall's `onLater` with its pending `then`, and so on). Several of these closures have side effects, so a duplicate back table would drift.
- **Pause**: the shell can send `{ type: 'pause' }` to the sim (the AppState handler already does). The bundle answers `paused`, which sets `paused` and shows the Pause Menu (`ResumeOverlay`) while `playingStage`. Resume sends `resume`. Exit calls `goHome`, except in the onboarding Stages, where it resumes instead.

## Goals / Non-Goals

**Goals:**
- One place decides what system back does in each state, and that decision is unit-testable without rendering.
- System back runs the same closure the visible back button runs, so the two can't drift.

**Non-Goals:**
- No navigation library and no history stack. The app stays state-driven.
- No iOS swipe-back and no browser history integration on web.
- No change to the onboarding funnel's forward-only steps. Back there keeps the platform default (leave the app), except during a Stage, which pauses.

## Decisions

### 1. Header: one wrapping row in the given order
Replace the two rows with a single `flex-row flex-wrap items-center` row: `StreakChip`, Library `Chip`, gear `IconChip`, Daily `Chip`, `BarkdokuChip`. Drop the Diary `Chip`. The gear keeps `IconChip` (icon-only, min touch target, `accessibilityLabel={t('map.settings')}`). Its face is already sized to match the chips.
- *Alternative*: keep the gear pinned top-right and reorder only the others. Rejected because the user asked for the gear in third position.
- `diary.chip` stays in the catalog because the Streak chip's accessibility label uses it.

### 2. Back policy as a pure function in `navigation.ts`
Add `backAction({ route, playingStage, paused, bundle, hasScreenBack, payoff, choosingDog })` that returns the first match of:
1. `playingStage && bundle === 'error'`: `'screen'` if a back closure is registered (Stages outside onboarding), otherwise `'consume'`
2. `payoff` (the taste payoff is showing) or `choosingDog` (Choose Dog is showing): `'consume'`
3. `'resume'`: `playingStage && paused`
4. `'consume'`: `playingStage && bundle === 'loading'`
5. `'pause'`: `playingStage` and the Stage is running
6. `'screen'`: run the current screen's registered back closure
7. `'exit'`: route is `splash`, `map` with no flow or settings, a funnel step, or the onboarding `paywall`. Let the OS handle it.
8. `'consume'`: any other screen that has no back closure (for example the Checkpoint)

It sits next to `routeFor` because it is part of the same "single place for navigation decisions" requirement. `navigation.test.ts` covers each branch.

### 3. Screen back closures are registered where they are created
In `App.tsx`, keep a `screenBack = useRef<(() => void) | null>(null)`. Reset it to `null` at the top of each render. Every branch that builds a screen assigns the same closure it passes to the screen's `onBack`/`onClose`/`onExit`/`onLater`, using a small helper so the assignment and the prop share one value, for example `const back = withBack(goHome)`. Screens with no on-screen back but a defined back in the specs get an explicit closure:
- Node Debrief → its `onDone`, which opens the Mission brief after a Stretch's last Node and otherwise goes home.
- Daily result, Mission passed → `goHome`. Results are already recorded when these screens appear.
- Barkdoku (Node and Daily) → its `onExit`.
- Settings → `() => setSettingsOpen(false)`. Lesson → its `back`. Mission problem → back to `checkin`. Auth → `onAuthDone`. Paywall → its `onLater` branch.
- Onboarding first-stage Primer → its `onExit` (back to `plan`).
- Stages outside onboarding (Node, Daily, warm-up) → `goHome`, the Pause Menu's Exit. Branches 3–5 run before `'screen'`, so it only runs when the bundle failed to load.
- Nothing is registered, so the press is consumed, for: the Checkpoint (Node and first-stage), the first-stage Debrief (its `onDone` records the first Stage), and the Minigames with no `onExit` (Doorbell, ReadDog, Poste). An accidental edge swipe must not throw an attempt away.
- *Alternative*: a static `Route → target` table in `navigation.ts`. Rejected because it would copy closures that carry side effects (auth return, paywall `then`, lesson `returnTo`) and drift from the buttons.

### 4. One `BackHandler` listener in `App.tsx`
`useEffect` registers `BackHandler.addEventListener('hardwareBackPress', ...)` once and reads the latest state through refs (`playingStageRef` exists already; add refs for `paused`, `bundle`, `route`). It calls `backAction`:
- `pause` → `send({ type: 'pause' })`. The bundle's `paused` reply shows `ResumeOverlay` through the existing path.
- `resume` → the same code as the overlay's `onResume` (`setPaused(false); send({ type: 'resume' })`).
- `screen` → `screenBack.current?.()`.
- It returns `true` for everything except `exit`, where it returns `false`.

`BackHandler` is a no-op on iOS and web, so no platform guard is needed.

### 5. One press on the World Map leaves the app
On the bare World Map, `exit` hands the press to the OS, which closes the app on the first press. The lock note toast doesn't change this; it closes itself after 5 s.
- *Alternative*: a "press back again to exit" toast. Rejected to keep the platform default and avoid an extra state.

## Risks / Trade-offs

- [The bundle might not answer `pause` with `paused` when focus hasn't changed] → Check during apply that a shell `pause` alone triggers `paused` (the AppState path relies on this already). If it doesn't, set `paused` optimistically in the handler.
- [A new screen branch forgets to register its back] → The default is `consume`, which keeps the user on the screen and never exits the app. The `WorldMapScreen`/navigation tests and a manual pass over the screens listed in tasks catch gaps.
- [Fast double press: pause then resume before `paused` arrives] → A second press before `paused` is set calls `pause` again, which does nothing extra.

## Migration Plan

UI only, with no persisted data. Rollback means reverting the commit.
