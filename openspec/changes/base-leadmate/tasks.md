# Tasks

## 1. Project Scaffold

- [x] 1.1 Create the Expo (SDK 52+) TypeScript shell with NativeWind v4 and verify `npx expo start --web` serves a page in the browser
- [x] 1.2 Create the Vite single-file Phaser 3 simulation bundle with a standalone dev page and verify it renders a blank scene in desktop Chrome
- [x] 1.3 Add react-native-webview, load the bundle in the shell from the dev server, and verify it loads in the browser shell and in Expo Go on Android and iPhone
- [x] 1.4 Add Jest with TypeScript support and verify `npm test` runs a sample test
- [x] 1.5 Write `docs/adr/0001-phaser-in-webview.md` and `docs/adr/0002-pure-seeded-simulation.md` following the ADR format and verify both files exist and reference `GLOSSARY.md` terms

## 2. Localization (`localization`)

- [x] 2.1 Add the Spanish text catalog, a lookup with Spanish fallback, and passing of the catalog from the shell to the bundle (the standalone page loads it directly), and verify tests for lookup, fallback and that no raw key appears
- [x] 2.2 Add a test that fails when user-visible strings appear outside the catalog, and a long-string layout check on the HUD; document how to add a language in README

## 3. Leash Physics (`leash-physics`)

- [x] 3.1 Implement Tension Ratio and state classification (0.85 / 1.0) in `src/sim` and verify unit tests cover each state and boundaries
- [x] 3.2 Implement quadratic Bézier leash geometry with slack-based control point and verify tests for endpoints and sag
- [x] 3.3 Implement the fixed-timestep tick with analog movement strength, leash-length limit, the Poste lock and Dog clamp, and verify tests for walk/quick speeds, zero strength, overshoot and the Poste scenario

## 4. Dog Drives and Reward Timing (`dog-drives`, `reward-timing`)

- [x] 4.1 Implement the seeded random generator, the `Drive` interface and `GoalDrive` with Wander, and verify tests that the same seed gives the same path and that the Dog reaches the waypoint
- [x] 4.2 Implement the Distractor, trigger-radius Fixation, calm period, Disengagement, missed opportunity and the 1.0-1.2 s Reward Window, and verify unit tests for each branch including calm-period restart
- [x] 4.3 Implement Marker evaluation (hit, miss, reactive) and the Dog returning to the Handler, and verify unit tests for each outcome

## 5. Stage Flow and Telemetry (`stage-flow`, `simulation-telemetry`)

- [x] 5.1 Implement scenario config, end conditions (waypoint and time limit), pause and no saved Stage in the sim, and verify unit tests for both end conditions and pause
- [x] 5.2 Define the typed `SimulationDebriefPayload` and message adapter plus the scripted-input harness, and verify tests on shape, percentage sum, marker accuracy and replay with the same seed; document the contract in README

## 6. Rendering, HUD and Results

- [x] 6.1 Build the Phaser isometric scene with Kenney scenery, placeholder shapes and the green/yellow/red leash, and verify in desktop Chrome that tension colors and the Poste behave as specced
- [x] 6.2 Add the HUD: left-thumb analog joystick with walk and quick detents, right-thumb Marker button with icon, and desktop keyboard (WASD, 2 for quick, a Marker key); verify in Chrome and on a phone in landscape
- [x] 6.3 Build the shell results screen (payload, seed, Play again) and the Resume overlay, and verify a full play-through in Chrome and on a phone via Expo Go
- [x] 6.4 Credit Kenney in the README and verify the credit and the asset licenses are listed

## 7. Validation

- [ ] 7.1 Have you and 3-5 dog owners play the Stage unassisted on desktop, Android and iPhone; record in README, per player, whether they understood the Poste and the Marker without being told and whether they wanted to play again; also compare portrait and landscape and record which was preferred

## 8. Handling feedback (`reward-timing`, `dog-drives`, `leash-physics`, `simulation-telemetry`)

- [x] 8.1 Add the Mark budget (`markBudget`, default 5): spend on every press, ignore presses at 0, and verify unit tests for hit, miss, reactive, wasted press and exhausted budget
- [x] 8.2 Add the Check-in glance and Check-in hit with a seeded interval and window, and verify tests that the same seed gives the same glances and that a press in and out of the window counts correctly
- [x] 8.3 Add follow-after-turn on Slack with `followChance` and the Taut correction, and verify tests for follows, does-not-follow, the correction staying below Rigid Pull, and replay with the same seed
- [x] 8.4 Replace the visual-only Rigid Pull with `pullStrength` dragging, and verify tests for dragging, strength 0, and that Rigid Pull is still counted
- [x] 8.5 Add `checkInHits`, `marksUsed` and `markBudget` to the payload, results screen and catalog, and verify payload tests and the results screen in Chrome
- [x] 8.6 Show the Mark counter on the Marker button, disable it at 0, make the Dog's look at the Handler visible, and verify in Chrome and on a phone

## 9. Playtest follow-ups (`leash-physics`)

- [ ] 9.1 Add camera auto-zoom from the Handler-Dog distance with limits and smoothing, and verify unit tests on the zoom function (close, at the leash limit, limits) and in Chrome and on a phone that both stay in view
- [ ] 9.2 Add the first-time Taut and Rigid Pull hints with catalog keys, shown once per Stage, and verify tests for once-only behavior, that no literal text is added, and the layout in Chrome
