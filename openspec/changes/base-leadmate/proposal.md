# Proposal

## Why

Before building onboarding, accounts, content and meta-game, we need to validate the core idea: that handling a leash in a short 2.5D simulation (keep it slack, Poste, mark the Dog's Disengagement at the right moment) feels engaging and teaches real skill. This phase delivers the smallest playable slice, running in a desktop browser and on Android and iPhone, so the mechanic can be judged early. Terms follow `GLOSSARY.md`.

## What Changes

- Scaffold an Expo (SDK 52+) React Native shell in TypeScript, runnable with `npx expo start --web` and on Android and iPhone via Expo Go.
- Add a Phaser 3 simulation bundle that runs in a browser tab and in a WebView on native, with pure-TypeScript, unit-tested simulation logic that uses a seeded random generator.
- Add leash physics: Bézier leash, Tension Ratio, three states, Poste, analog movement strength (joystick on the left thumb, Marker on the right).
- Add Dog Drives behind a replaceable interface, with only the Goal Drive (plus Wander) implemented.
- Add one hard-coded scenario: a walk to a final waypoint where a skateboarder Distractor causes Fixation, then Disengagement and a Reward Window.
- Add Marker recording (hit, miss, reactive), plus Check-in hits for the Dog's eye contact and a fixed Mark budget per Stage.
- Let the Dog follow (or not) when the Handler turns with Slack, and let the Handler pull the Dog toward the path at a configured strength.
- Add Stage flow: end conditions (waypoint or time limit), results screen with Play again, pause on focus loss.
- Add the `SimulationDebriefPayload` shown on the results screen.
- Add text localization with Spanish as the only language shipped.
- Zoom the camera automatically with the Handler-Dog distance, and show a first-time hint when the leash first turns Taut and Rigid Pull (from playtest findings).
- Use Kenney CC0 isometric scenery and UI; draw Handler, Dog and Distractor as simple placeholder shapes.

## Capabilities

### New Capabilities
- `leash-physics`: Leash curve, Tension Ratio and states, movement strength, Poste, pulling the Dog, steering with Slack, HUD controls (touch and desktop keyboard).
- `dog-drives`: Replaceable Dog Drives, Goal Drive with Wander, seeded randomness, Fixation on Distractors, Check-in glances, following a turn.
- `reward-timing`: Disengagement, missed opportunity, Reward Window, Marker hit/miss/reactive, Check-in hit, Mark budget.
- `stage-flow`: Stage end conditions, results and replay, pause, no saved Stage.
- `simulation-telemetry`: Debrief payload with tension shares, marker accuracy, counts and seed.
- `localization`: Text catalog, Spanish only, fallback, shell-owned language, layout tolerance.

### Modified Capabilities

(none — no existing specs)

## Impact

- New codebase: Expo shell, Phaser 3 + Vite single-file simulation bundle, WebView bridge, text catalog, Jest tests.
- New dependencies: expo, react-native, nativewind, phaser, react-native-webview, vite, Jest; Kenney assets (CC0, credit in README).
- Documents: `GLOSSARY.md`, `docs/adr/0001`, `docs/adr/0002`.
- Out of scope (follow-up changes): `training-loop-and-learning`, `onboarding-and-accounts`, `engagement-and-worlds`. Playtest findings routed there: the leash/Marker tutorial (onboarding), Poste practice (training loop), richer scenery per scenario (engagement and worlds).
- Assumptions: the follow chance, Check-in frequency and pull strength are fixed config values here; they later come from the dog's learning (`training-loop-and-learning`) and the Dog/Handler weights (`onboarding-and-accounts`).
- Assumptions: Slack < 0.85, Taut 0.85-1.0, Rigid Pull > 1.0; landscape-only on phones is a hypothesis to test in task 6.1; no accounts, persistence or backend; no pass/fail.
