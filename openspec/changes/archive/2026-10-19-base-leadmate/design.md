# Design

## Context

Greenfield repo. Development happens on Windows/WSL with AI agents, so the loop must work in a desktop browser (Chrome) while still reaching Android and iPhone. See proposal.md for scope and `GLOSSARY.md` for terms. Engine and simulation decisions are recorded in `docs/adr/0001` and `0002`.

## Goals / Non-Goals

**Goals:**
- A playable Stage testable in minutes in Chrome, then on a phone.
- Same simulation code in a browser tab and in the mobile WebView.
- Pure, deterministic TypeScript simulation, unit-testable without a renderer.
- Cheap to add languages and Dog Drives later.

**Non-Goals:**
- Accounts, backend, persistence, onboarding, audio, arousal, equipment, learning model, meta-game, custom character art.

## Decisions

1. **Phaser 3 in a WebView, same bundle in the browser** (ADR 0001). Timing-critical input and HUD live inside the bundle; the shell sends config and receives the payload via a typed `postMessage` adapter (direct callback in a browser). The Vite single-file bundle loads from the dev server on phones.
2. **Pure simulation, fixed timestep, seeded RNG** (ADR 0002). `src/sim/` exposes `tick(state, input, dt)` in simulation time. All randomness comes from a seeded generator; the seed is in the payload. A scripted-input harness produces payloads without rendering.
3. **Units and config:** 1 world unit = 1 m. A scenario config file holds all tunables: leash length 2 m, quick speed 2.0 m/s (strength 1.0), walk speed 1.2 m/s (strength 0.6), Dog Goal speed 1.6 m/s, skateboarder 4 m/s, trigger radius 8 m, calm period 3 s, Reward Window 1.1 s, route about 90 m, end condition `reach-waypoint` (`time-limit` also supported).
4. **Drives:** a `Drive` takes sim state and returns a desired direction and speed. Phase 1 ships `GoalDrive` with seeded Wander; Scent, Chase and blends come later without changing leash code.
5. **Fixation and Disengagement:** Distractor entering the trigger radius starts Fixation. Disengagement happens after a continuous calm period (Handler stopped, no Rigid Pull); the period restarts on movement or Rigid Pull. If the Distractor leaves first, no Reward Window opens and a missed opportunity is recorded.
6. **Leash:** quadratic Bézier; control point sags with slack and flattens at ratio >= 1. Thresholds 0.85 / 1.0 are constants. Handler is blocked at leash length plus tolerance; Rigid Pull is visual and counted only.
7. **Poste:** strength 0 zeroes Handler velocity and pins the leash origin; at ratio >= 1 the Dog's outward velocity is clamped.
8. **Input:** the sim takes direction plus strength (0-1). Touch joystick is analog with soft detents at walk and quick strength. Desktop keyboard: W/A/S/D at walk strength; holding 2 (in place of W) sets quick strength; a key triggers the Marker.
9. **Stage flow:** end by final waypoint or time limit; results screen shows the payload and Play again with a new seed; Stage pauses on tab/app focus loss until Resume; no saved Stage.
10. **Localization:** text catalog (Spanish only) owned by the shell and passed to the bundle at Stage start; the standalone simulation page loads the same catalog and defaults to Spanish. Missing keys fall back to Spanish. No text in images; layout allows strings 40% longer; Marker uses an icon.
11. **Art:** Kenney CC0 isometric city tiles and UI for scenery and HUD; Handler, Dog and Distractor are colored shapes with a facing marker. Credit Kenney in the README.
12. **Payload:** `durationSeconds`, tension shares, `markerAccuracyMs` (press minus Disengagement), `markerHits`, `markerMisses`, `reactiveMarkers`, `missedOpportunities`, `seed`.
13. **Check-in and follow-after-turn:** the Dog's check-in glance and turn-following draw from the seeded RNG; `checkInWindow` (about 1.0 s), `checkInMeanInterval`, `followChance` and `turnAngle` are scenario config. A look opens the Check-in window; a press inside it is a Check-in hit. If the Dog does not follow, a Taut correction turns it (never Rigid Pull).
14. **Pulling the Dog:** in Rigid Pull the Dog is moved toward the Handler by `pullStrength` (m/s, 0 disables). It is a config constant now, later derived from Dog and Handler weights (`onboarding-and-accounts`).
15. **Mark budget:** `markBudget` (default 5) is spent on every press; the Marker button shows the remainder and is disabled at 0. Hits, misses, reactive and wasted presses all cost a Mark.

16. **Camera auto-zoom:** the camera zoom is derived from the Handler-Dog distance (and Fixation/Reward Window events) so both stay in view, zooming in when they are close. Zoom limits and smoothing are config. Playtesters found the fixed zoom too far out.
17. **First-time leash hint:** the first time in a Stage the leash becomes Taut and the first time it becomes Rigid Pull, a short hint from the text catalog is shown. Playtesters did not notice the leash colors until told. This is a stopgap; the full tutorial belongs to `onboarding-and-accounts`.

## Playtest findings (task 7.1)

Informal playtest with a few friends; per-player records (understood the Poste/Marker, wanted to replay, portrait vs. landscape) were not captured.

- Players walked beside the Dog and did not understand what else to do.
- The green/yellow/red leash was only noticed after being told. Routed to 17 and to the tutorial in `onboarding-and-accounts` (Guided first stage).
- The Poste was not discoverable. Routed to a practice exercise in `training-loop-and-learning` (Practice before technique).
- The zoom was too far out. Routed to 16.
- The Dog going wherever it wants felt realistic; whether that is good for engagement is unresolved (see Risks).
- The Stage length was adequate. The scenery was sparse. Routed to `engagement-and-worlds` (Scenery per scenario).

## Risks / Trade-offs

- WebView performance on low-end Android → few sprites, test on a real device early.
- Bridge or load failure → bundle reports errors; shell shows a retry.
- Feel values are guesses → all in the scenario config.
- No ready-made isometric Dog or Handler art on Kenney → shapes now, art decision later.
- Follow chance, check-in rhythm, pull strength and budget are guesses and must be playtested; the fixed budget may be too tight for a first Stage.
- Landscape-only is unproven → compare with portrait in 6.1.
- Open question from the playtest: a realistic, self-willed Dog with no visible cause and effect gives players no reason to act beyond walking. Visible Dog reactions to the Handler's actions (Slack vs. Taut, following a turn) may be needed; undecided, no task yet.
- Fun is unproven: the playtest suggests the mechanic needs teaching (tutorial, Poste practice) rather than disproving it, but engagement should be rechecked after those land.
