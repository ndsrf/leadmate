# Tasks

## 1. Dog reactivity and vocalizations (`dog-reactivity`)

- [x] 1.1 Implement the three Reaction Tiers in `src/sim/sim.ts` (Calm $<0.6 T_R$, Alert $0.6 T_R \le A < T_R$, Reactive $A \ge T_R$) with $+1.5\text{ m/s}^2$ outward lunging acceleration and Rigid Pull in Reactive, and verify unit tests in `src/sim/learning.test.ts` for tier thresholds and lunging pull force
- [x] 1.2 Lock out Marker hits while in the Reactive tier (recording them as `marker-reactive` events with zero hit credit), and verify unit tests in `src/sim/sim.test.ts` that pressing the Marker during Reactive barks does not award a hit
- [x] 1.3 Add the `reaction-tier-change` bridge event in `src/sim/messages.ts`, dispatch it upon crossing tier thresholds, and verify tests that tier transitions emit events with the correct simulation timestamp
- [x] 1.4 Wire shell-side dog vocalizations in `src/shell/audio.ts` (Alert whine/growl and Reactive bark) with a 2.0s repeat cooldown, and verify audio dispatch tests in `src/shell/audio.test.ts`
- [x] 1.5 Implement recovery to Alert and Calm through standard Arousal decay when line of sight or distance breaks, and verify unit tests for clean recovery transitions

## 2. Sintonía sync combo (`sync-combo`)

- [x] 2.1 Implement the Sintonía detection state in `src/sim/sim.ts` (Tension Ratio $< 0.85$, forward speed $> 0.4\text{ m/s}$, angular turn rate $|\omega| \in [0.2, 1.8]\text{ rad/s}$ for $\ge 2.0\text{ s}$ continuous), and verify unit tests in `src/sim/feedback.test.ts` for activation, interruption on Taut/Rigid tension, and sharp turn cancellation
- [x] 2.2 Add `sintoniaTimeSeconds` to `SimulationDebriefPayload` in `src/sim/payload.ts`, record cumulative duration, and verify tests in `src/sim/payload.test.ts` that Sintonía time is accurately aggregated
- [x] 2.3 Render the green flow visual glow and dog trotting gait animation in `StageScene.ts` while Sintonía is active, and verify visual state in Chrome and touch emulation

## 3. Go Sniff contextual reward (`go-sniff`)

- [x] 3.1 Implement the post-disengagement Go Sniff eligibility window in `src/sim/sim.ts` (3.0s window in Slack after Alert/Reactive Disengagement once Reward Window concludes) and the 4.0s sniffing drive ($0.4\text{ m/s}$ speed, $3\times$ Arousal decay rate), and verify unit tests in `src/sim/sim.test.ts` for decay acceleration and early termination on leash tension $\ge 0.85$ or Arousal = 0
- [x] 3.2 Add the contextual "Go Sniff" button to the HUD in `src/hud/layout.ts` enabled only from World 2 onward, and verify HUD rendering and input tests in `src/hud/hud.test.ts`
- [x] 3.3 Ensure World 1 configurations suppress the Go Sniff trigger, and verify unit tests that Go Sniff never activates in World 1 scenarios

## 4. Corridor geometry, solid boundaries, and corner leash wrapping (`world-progression`)

- [x] 4.1 Extend scenario config in `src/sim/config.ts` with sequential `waypoints: Vec2[]` and boundary `walls: Wall[]`, and verify scenario schema validation passes for indoor and outdoor themes
- [x] 4.2 Implement boundary collision sliding in `src/sim/sim.ts` for Handler and Dog along wall surface normals, and verify unit tests in `src/sim/sim.test.ts` that movement cannot penetrate solid walls
- [x] 4.3 Implement 2D line-of-sight raycasting between Dog and Distractor against walls and visual shields (`visualShield: true`), blocking Arousal generation on occlusion, and verify unit tests in `src/sim/learning.test.ts`
- [x] 4.4 Implement corner vertex leash wrapping in `src/sim/leash.ts`, calculating tension as the sum of segments around intersecting corner vertices, and verify tests in `src/sim/leash.test.ts` that corner wrapping prevents straight-line wall clipping
- [x] 4.5 Add automated scenery density validation in `src/sim/config.ts` (enforcing $\ge 1$ prop per 5m and minimum 8 props per walking scenario), and verify validator tests reject bare routes

## 5. Multi-cue progression and distractor discrimination (`world-progression`)

- [x] 5.1 Extend `SimInput` and HUD controls with multi-cue support (`cueType: 'lets-go' | 'leave-it'`), adding distinct icons and button layouts in `src/hud/layout.ts`, and verify HUD tests for single-cue and dual-cue modes
- [x] 5.2 Implement distractor-specific cue matching in `src/sim/sim.ts` (ground food requires "Leave It"; moving distractors require "Let's Go"), where mismatched cues are ineffective, and verify unit tests in `src/sim/sim.test.ts`
- [x] 5.3 Configure World 3 Node sequence so the introductory food Node isolates the "Leave It" button on the HUD, while subsequent Nodes present both cues, and verify Node configuration tests in `src/shell/nodes/node.test.ts`

## 6. Daily Stage ("El Paseo del Día") and leaderboard scoring (`daily-walk`, ADR 0005)

- [x] 6.1 Implement the deterministic date seed generator (`YYYY-MM-DD` in local time) and procedural Stage generator in `src/shell/daily.ts` (strictly seeding waypoints, boundaries, and distractor schedules), and verify tests that identical dates produce identical Stage setups
- [x] 6.2 Implement the standardized 0–1,000 composite handling score calculation in `src/sim/payload.ts` (Composure up to 400, Slack % up to 300, Marker accuracy up to 200, Sintonía up to 100), and verify score calculation unit tests in `src/sim/payload.test.ts`
- [x] 6.3 Implement the standalone Daily Stage runner in `src/shell/daily.ts` (skipping Primer and Checkpoint), awarding streak credit on first clear and clearing Rusty Dog status without modifying persistent `Learning Attributes` or campaign progress, and verify lifecycle tests in `src/shell/daily.test.ts`
- [x] 6.4 Implement daily high-score tracking in `DogRecord` allowing unlimited same-day replays to update the personal best score, and verify persistence tests in `src/shell/dogRecord.test.ts`

## 7. Walk Diary and daily streak (`walk-diary-streak`)

- [x] 7.1 Extend `DogRecord` in `src/shell/dogRecord.ts` with `walkDiary: WalkDiaryEntry[]` and `streak: StreakRecord { current: number, best: number, lastActiveDate: string }`, and verify schema migration and persistence tests in `src/shell/dogRecord.test.ts`
- [x] 7.2 Implement the 1-tap Walk Diary UI on the Debrief screen (`'completed'`, `'struggled'`, `'skipped'`), recording the outcome in the Dog record, and verify Debrief component tests in `src/shell/nodes/node.test.ts`
- [x] 7.3 Implement local calendar day streak calculation in `src/shell/streak.ts` (incrementing on consecutive days, resetting to 1 after a missed day, leaving Dog Learning Attributes untouched), and verify streak edge-case tests (consecutive day, same day replay, missed day gap)
- [x] 7.4 Display the active streak flame and counter in the shell HUD / home banner, and verify visual rendering in Chrome and mobile touch emulation

## 8. World progression map and content authoring (`world-progression`)

- [x] 8.1 Define the `WorldDef` schema and sequential unlock check in `src/shell/world.ts`, and verify unit tests for locked and unlocked Worlds based on `completedNodes`
- [x] 8.2 Author World 1 content: Home & Thresholds (indoor hallway/elevator boundaries, static impulse control minigames for Harness Ritual and Doorbell Mat), and verify World 1 nodes pass all tests
- [x] 8.3 Author World 2 content: The Quiet Sidewalk (suburban 2.5D walking, U-shape leash, blind corners, Poste practice, Go Sniff), and verify World 2 nodes pass all tests
- [x] 8.4 Author World 3 content: Urban Navigations (fast scooters, parked car visual shields, ground food "Leave It" nodes), and verify World 3 nodes pass all tests
- [x] 8.5 Author World 4 content: Fast Wheels & High Arousal (open park scenery, jogger triggers, 3m leash physics), and verify World 4 nodes pass all tests

## 9. Verification, documentation, and playtesting

- [x] 9.1 Update `README.md` and verify `GLOSSARY.md` and `docs/adr/0005-daily-stage-leaderboard-scoring.md` reflect all delivered capabilities
- [x] 9.2 Run the entire automated test suite (`npm test`) across all packages, verifying zero regressions
- [x] 9.3 Perform end-to-end playtest walkthrough in headless Chrome and mobile viewport covering World progression, Daily Stage replay, Go Sniff, Sintonía combo, and Walk Diary check-in; record playtest observations in `design.md`

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied.
- Verify the archived result.
