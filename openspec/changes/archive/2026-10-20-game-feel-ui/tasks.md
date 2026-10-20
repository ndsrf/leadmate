# Tasks

## 1. Tokens and component kit (`game-ui-theme`)

- [x] 1.1 Add `src/shell/ui/theme.ts` (palette, type scale, radii, depth, spacing) and import it in `tailwind.config.js` `theme.extend`; verify a unit test asserts every text/background pair used by the kit has a contrast ratio of at least 4.5:1
- [x] 1.2 Bundle one display font with `expo-font`, render with the system font until loaded, and verify `npm run web` shows titles in the display font without a blocking splash and without layout jump on chips
- [x] 1.3 Build `src/shell/ui/` components `GameButton`, `Panel`, `ProgressBar`, `Badge`, `Chip`, `StarRow` with pure style functions (variant, pressed, disabled) and verify `src/shell/ui/ui.test.ts` covers pressed offset, disabled desaturation and the 44-point minimum touch target
- [x] 1.4 Re-implement `Button`, `Backdrop` and `Row` in `src/shell/Overlays.tsx` on the kit, upgrade `Screen.tsx` (safe-area insets, readable column), and verify existing screens render unchanged in behavior and `npm test` and `npm run typecheck` pass
- [x] 1.5 Add the generated token subset for the Phaser bundle (script beside `scripts/embed-sim.mjs`, wired into `sim:build`/`sim:embed`) and use it in `bundle/src/overlay.ts` and the HUD button styles; verify a test that the shell and HUD primary-button fill, radius and label style are equal and `npm run sim:build` succeeds
- [x] 1.6 Migrate the remaining screens (`SetupScreen`, `SettingsScreen`, `NodeScreens`, `AccountScreens`, `PaywallScreen`, `PlanScreen`, `DiagnosticView`, `DoorbellMatView`, `PosteMinigameView`) off one-off class strings onto the kit; verify with a grep that no screen file uses a raw colour outside the theme and that a 320-point-wide web viewport shows no clipping or horizontal scroll
- [x] 1.7 Add new catalog keys with Spanish fallback for every new string in this group and verify `src/i18n/catalog-usage.test.ts` passes plus a long-label fixture test that labels 40 percent longer wrap or shrink

## 2. Feedback layer (`ui-feedback`)

- [x] 2.1 Add `expo-haptics` and UI sound assets, then build `src/shell/ui/feedback.ts` (`press`, `success`, `star`, `unlock`) that is fire-and-forget, swallows every error and skips UI sounds while Cue or Dog audio plays; verify `src/shell/ui/feedback.test.ts` covers failure to load, no haptics, and no-overlap with Cue audio
- [x] 2.2 Add device-local UI sounds and haptics toggles to shell storage and `SettingsScreen`, default on, and verify a test that the choice persists across a reload and that off means `press()` plays nothing
- [x] 2.3 Add the `useMotion()` hook (OS reduced-motion on native and web) and press spring and screen transitions of at most 350 ms using reanimated; verify unit tests that reduced motion yields fade-only values and that the new screen accepts input during a transition
- [x] 2.4 Call the feedback service from `GameButton` and verify pressing a button produces the visual, haptic and sound calls within one frame in a component test, and that the Marker path adds no awaited work
- [x] 2.5 Verify determinism: add a test that the same seed gives an identical telemetry payload with feedback enabled and disabled, in `src/sim/payload.test.ts` or `src/shell/ui/feedback.test.ts`

## 3. Stars and records (`reward-celebration`)

- [x] 3.1 Implement pure `starsFor(handlingScore | undefined)` in `src/shell/stars.ts` with thresholds 650 and 850 beside `SCORE_WEIGHTS`; verify `src/shell/stars.test.ts` covers 400, 649, 650, 849, 850 and an undefined score
- [x] 3.2 Add `stars` to `DogRecord` in `src/shell/dogRecord.ts` with a version bump, a validating reader defaulting to `{}`, best-of update on Node completion and display of 1 star for previously completed Nodes; verify `src/shell/dogRecord.test.ts` for migration, ignoring invalid values, and a worse replay not lowering stars
- [x] 3.3 Merge `stars` by per-Node maximum in the account-sync merge and verify a sync test that a stale device cannot lower stars and a better replay on one device wins
- [x] 3.4 Implement pure `celebrationsFor(before, after, completion)` (first completion, new unlock, Streak day, daily new best, each at most once) and verify `src/shell/celebrations.test.ts` covers each case and the no-repeat case
- [x] 3.5 Add the missed-day behavior (neutral start state, no penalty text) and verify a test that a lapsed Streak yields no loss-framed message and no star or progress is removed

## 4. World Map (`world-map-screen`)

- [x] 4.1 Implement pure `mapModel(completed, stars)` in `src/shell/world.ts` (or `mapModel.ts`) returning each Node's state `locked | open | next | done`, the next-up Node and per-World counts; verify `src/shell/mapModel.test.ts` for locked World, first open Node, completed Node with stars and all-complete
- [x] 4.2 Build the map in `HomeScreen.tsx`: World regions, zig-zag Node path with state visuals, star display, lock reason on press of a locked Node, scroll-to-next-up on open; verify a component test for each state and for the lock-reason message
- [x] 4.3 Add the sticky header with the Streak chip, Daily Stage chip (new vs best score) and Settings, and the Dog marker at the next-up Node with a Rusty variant, reusing existing sprite frames (a paw-badge fallback if none is usable); verify the header stays visible when scrolled on web and the Dog moves to the new next-up Node after a completion
- [x] 4.4 Keep the Rusty prompt, skipped-warm-up note and account banner above the map without covering a Node, and verify the existing main-screen behaviors (Warm-up, Skip, banner) still work in a component test
- [x] 4.5 Add the single next-up pulse (static highlight under reduced motion) and verify on a low-end Android device or throttled web that scrolling the map stays smooth with one running loop

## 5. Result reveal and celebrations (`reward-celebration`)

- [x] 5.1 Build the reveal state machine (`score -> stars -> rows -> done`) with count-up, per-star sound and haptic, one-press skip, and immediate `done` under reduced motion; verify `src/shell/reveal.test.ts` for sequence, skip and reduced motion
- [x] 5.2 Apply the reveal and `StarRow` to the Node debrief screen in `NodeScreens.tsx`, including the new-best note and the no-score explanation, and verify with a Stage played in web that stars match the handling score
- [x] 5.3 Apply the reveal and the new-best celebration to `DailyResultScreen.tsx` and add unlock and Streak-day celebrations driven by `celebrationsFor`; verify each shows once and not again on revisiting the screen
- [x] 5.4 Add the in-Stage HUD polish limited to tokens and press states (no layout changes) and verify the HUD tests in `src/hud/hud.test.ts` still pass and the HUD matches the shell buttons on web

## 6. Integration and docs

- [x] 6.1 Play the full path on web (World Map, Node, result, Daily, Settings) at 320 and 1280 points wide with sounds and haptics off and reduced motion on, verifying nothing is clipped and all information remains visible
- [x] 6.2 Run `npm test` and `npm run typecheck` and verify both pass
- [x] 6.3 Confirm the terms Star and World Map (already in `GLOSSARY.md`) are used consistently in code and catalog keys, and add UI sound credits, a short note on the UI kit and feedback rules in `README.md`, and record the stars-merge-by-max decision (no reset path; a correction needs a record version bump) as `docs/adr/0007-stars-merge-by-max.md`; verify with a grep that the retired name "Home" no longer names the main screen in new keys

## Workflow follow-up

- Archive the change after review.
