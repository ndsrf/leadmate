# Design

## Context

See [proposal.md](./proposal.md) for motivation.

In the current implementation:
- **Turn Detection**: In `src/sim/sim.ts` (`detectTurn`), any angle deviation > 45° from `headingAnchor` triggers a turn change event immediately and updates `headingAnchor = dir`. A continuous 90° corner turn fires 2–3 turn events in a few fractions of a second.
- **Novelty Math**: In `src/sim/config.ts` (`DEFAULT_SCENT_WALK.novelty`), `step: 0.45` drops novelty from 1.0 to 0.10 in two moves. Recovery is only `0.025`/s (12s to escape repeated zone, 24s to fresh).
- **Feedback Decider**: In `src/hud/feedback.ts`, `repeated-move-ignored` has tier `wrong` with no interval limit (`minIntervalSeconds: undefined`), resetting combos and playing the bonk sound repeatedly. Meanwhile, a followed repeated turn reports `dog-follow` which triggers `followed-turn` ("Nice turn!"), creating contradictory feedback.
- **Canine Posture & Signs**: In `src/hud/pose.ts` and `src/hud/portrait.ts`, Autopilot is not wired to `DogPose`. The Dog portrait and walking Dog look identical during calm attentive walking and high Autopilot. `DOG_SIGNS` in `src/sim/messages.ts` does not include Autopilot.
- **Lesson Content**: `theory-unpredictable-walks` explains the concept of unpredictable walking but does not instruct the player how to read Autopilot in the simulator.

## Goals / Non-Goals

**Goals:**
- Eliminate multi-triggering of turns on continuous corner turns.
- Rebalance Novelty to make 3–4 turns required to fatigue, with natural recovery and reciprocal recovery between opposite directions and stops.
- Rate-limit `repeated-move-ignored` to at most once per 6 seconds, preserve combos, and suppress praise for repeated turns.
- Visually telegraph Autopilot on the Dog portrait (wandering gaze looking away) and overhead (drifting cloud Dog sign) at Autopilot >= 0.7, clearing at < 0.4.
- Update `theory-unpredictable-walks` to teach reading these visual indicators.

**Non-Goals:**
- Creating new sprite atlas textures for the Dog portrait (existing layers `portrait_eyes_left`/`portrait_eyes_right`/`portrait_head_left`/`portrait_head_right` and atlas icons provide full fidelity).
- Changing non-scent Stage turn mechanics or existing Stage Meter formulas.

## Decisions

### 1. Directional Turn Cooldown in `detectTurn`
In `src/sim/sim.ts`:
- Maintain `lastTurnTimes: Partial<Record<ChangeKind, number>>` on `ScentWalkState`.
- When `detectTurn` evaluates a turn direction, if less than `1.5` seconds has elapsed since the last turn of that **same** direction, update the anchor to track the curve but do not register a new change event.
- *Alternatives considered:*
  - Global turn cooldown across all directions: Rejected because quick intentional zigzags (right then left) would be swallowed. Per-direction cooldown allows instant left turns after right turns while smoothing a single continuous turn.
  - Angular rate threshold (gyro/physics smoothing): Overly complex for a 2D vector input and less deterministic across frame rates.

### 2. Novelty Parameters & Reciprocal Recovery
In `src/sim/config.ts` and `src/sim/sim.ts`:
- Rebalance `DEFAULT_SCENT_WALK.novelty`:
  - `step: 0.25` (down from 0.45).
  - `recoveryPerSecond: 0.06` (up from 0.025).
- In `registerChange`:
  - When a `stop` is registered, increment novelty of all turn directions (`left-turn`, `right-turn`, `u-turn`) by `0.15` (capped at 1.0).
  - When `left-turn` is registered, increment `right-turn` novelty by `0.15`.
  - When `right-turn` is registered, increment `left-turn` novelty by `0.15`.
- *Rationale:* Aligns with real canine training where pausing or changing directions resets the dog's anticipation.

### 3. Rate-Limiting and Demoting `repeated-move-ignored`
In `src/hud/feedback.ts`:
- In `FEEDBACK_RULES`, add `minIntervalSeconds: 6` to `repeated-move-ignored`.
- In `FeedbackDecider.step`, when `kind === 'repeated-move-ignored'`, do not call `this.combos.clear()`.
- In `FeedbackDecider.step`, if a `dog-follow` event occurs on a `walk-change` whose freshness is `repeated`, suppress `followed-turn`.
- *Rationale:* Eliminates negative feedback spam and removes contradictory praise without penalizing unrelated player achievements.

### 4. Telegraphing Autopilot in Canine Posture and Dog Signs
In `src/hud/pose.ts`, `src/hud/portrait.ts`, and `src/sim/messages.ts`:
- Add `'autopilot'` to `DOG_SIGNS` and `DogSign`.
- In `dogPose(state)`:
  - If `state.scentWalk && state.scentWalk.autopilot >= 0.7`:
    - Set `pose.gaze = 'away-right'` (or alternate away-left based on facing), reflecting attention drifting to the environment.
    - Add `'autopilot'` to active Dog signs.
  - Apply hysteresis: clear once Autopilot falls below `0.4`.
- In `dogSignsShown`, include `'autopilot'` when active.
- In `portraitLayers`:
  - The pose gaze `'away-right'` / `'away-left'` maps directly to `portrait_head_right`/`portrait_eyes_right` or `left`, presenting a clear turned-away posture distinct from calm forward attention.
- In `StageScene`, draw the drifting cloud icon when `'autopilot'` is active.

### 5. Curriculum & Pedagogical Alignment
In `content/beta/lessons/theory-unpredictable-walks/`:
- Update English and Spanish lesson text to explicitly explain:
  - Watch the Dog portrait in the top-right corner and the drifting cloud sign above the dog.
  - When the dog looks away and the drifting cloud appears, the dog is on Autopilot.
  - Surprise them with a turn, pace change, or stop to regain voluntary focus.

## Risks / Trade-offs

- **[Risk] Per-direction 1.5s cooldown might feel unresponsive if a player tries to make two rapid 90° right turns in an S-bend.**
  → *Mitigation*: 1.5s is tuned to human walking speed (approx 2–3 paces). An S-bend naturally alternates right and left turns, which are not restricted by the per-direction cooldown.
- **[Risk] Seeded simulation tests in `scentWalk.test.ts` may have assertions expecting the old 0.45 drop.**
  → *Mitigation*: Update test assertions to reflect `step: 0.25` and the 4-turn repetition threshold.
