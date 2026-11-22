# Proposal

## Why

In World 6 Unpredictable Walk stages (`park-unpredictable`, `park-keep-fresh`), players experience severe feedback spam and confusing logic around repeated turns. Minor joystick adjustments or normal 90-degree corner turns frequently trigger 2–3 turn events in less than a second without cooldown, rapidly draining novelty from 1.0 to 0.1 in a single corner. Recovery takes 12–24 seconds of straight walking, which is unachievable in dense park maps. When novelty is low, the Dog's follow probability drops and the simulator continually bombards the player with negative "Repeated move" messages, bonk sounds, and combo clears, while giving contradictory praise ("Nice turn!") if a repeated move happens to be followed. Furthermore, the player cannot see when the Dog has tuned out on Autopilot, leaving them with no clear signal of when to vary movement.

## What Changes

- **Turn Detection Smoothing**: Introduce a turn stabilization cooldown (`minTurnInterval: 1.5s`) in `detectTurn` so continuous corner turns (such as a 90° curve) or minor joystick adjustments register as a single deliberate change rather than multi-triggering 2–3 rapid events.
- **Novelty Rebalancing & Reciprocal Recovery**:
  - Reduce the novelty drop per change (`step` from 0.45 to 0.25) so it takes 3–4 distinct turns to enter the repeated zone (< 0.4).
  - Increase the base recovery rate (`recoveryPerSecond` from 0.025 to 0.06).
  - Add reciprocal recovery: a `stop` restores +0.15 Novelty to all turn directions, while opposite turns (left and right) restore +0.15 to each other.
- **Rate-Limiting & Feedback Clarification**:
  - Rate-limit `repeated-move-ignored` in `FEEDBACK_RULES` with `minIntervalSeconds: 6` (matching `rigid-pull`), preventing negative message spam.
  - Preserve active Combos when a repeated move is ignored, treating it as an informational coaching notice rather than an aggressive failure.
  - Silently suppress `followed-turn` ("Nice turn!") praise when the move was repeated (`novelty < 0.4`), eliminating contradictory praise.
- **Visual Autopilot Telegraph on the Dog Portrait and World View**:
  - Connect the simulation's `autopilot` state to `CaninePosture`, `DogPose`, and `DOG_SIGNS`.
  - When Autopilot reaches high attention loss (`>= 0.7`), the Dog portrait displays a wandering gaze looking away into the distance (`portrait_eyes_left`/`portrait_eyes_right`), and a drifting cloud **Dog sign** (`autopilot`) appears overhead.
  - Hysteresis clears the sign and re-engages the gaze once Autopilot drops below `0.4` (after an unpredictable move or stop).
  - Clearly distinguishes an Autopilot dog from a Calm, connected dog.
- **Instruction & Lesson Alignment**: Update `theory-unpredictable-walks` and stage primer cards to teach players to read the Dog's portrait and the drifting cloud sign to identify when the Dog is on Autopilot and ready for an unpredictable maneuver.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `walk-novelty`: Turn detection smoothing (cooldown between counted turns of the same kind), adjusted novelty step and recovery rates, and reciprocal recovery across opposite changes.
- `stage-action-feedback`: Rate-limiting for `repeated-move-ignored` (`minIntervalSeconds`), and removing feedback dissonance between repeated turns and praise.
- `canine-posture`: Deriving and displaying an Autopilot state in Canine Posture and the Dog portrait (wandering gaze and relaxed posture during high Autopilot).
- `theory-lessons`: Updating `theory-unpredictable-walks` to teach reading the Dog portrait's Autopilot posture.

## Impact

- **Simulation**: `src/sim/sim.ts` (`detectTurn`, `registerChange`, `trackPace`), `src/sim/config.ts` (`ScentWalkConfig` defaults), `src/sim/scentWalk.ts`.
- **HUD & Presentation**: `src/hud/pose.ts` (`dogPose`), `src/hud/portrait.ts` (`portraitLayers`), `src/hud/feedback.ts` (`FEEDBACK_RULES`).
- **Content & Catalogs**: `content/beta/lessons/theory-unpredictable-walks/en.md` and `es.md`, primer cards in `content/beta/nodes/`.
- **Tests**: Unit tests for turn detection cooldown, novelty recovery math, feedback rate-limiting, and portrait layer mapping for autopilot.
