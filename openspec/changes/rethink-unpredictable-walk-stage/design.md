# Design

## Context

- The Dog's only Drive is `GoalDrive` (`src/sim/drives.ts`): it steers to `currentTarget(state)`, the next waypoint, plus a seeded Wander. `moveDog` in `src/sim/sim.ts` switches on `dogMode` (`goal`, `fixated`, `holding`, `returning`, `sniffing`).
- Go Sniff (`sniff`, `sniffOfferUntil`) opens only after a Disengagement and ends on tension, time, or Arousal 0 (`reason: 'calm'`). In a calm park Arousal is usually 0, so today it would end at once.
- Turns are detected in `detectTurn` (angle over `turnAngle` while Slack → `followChance` draw → `dog-follow` + look). Stops go through `trackStop`. Pace changes are not detected.
- Distractors: one active at a time from `distractor` + `moreDistractors`, with kinds from `learning.ts`; `food` is stationary and needs Leave-it.
- Every Stretch is an ordered list of Stops ending in one Mission, trains one technique, needs a theory Lesson before its first Node and a how-to-play Lesson before the first Node that uses a new control, and takes about 10-15 minutes (`world-progression`). World 6 today has one Stretch: two Lessons, `park-unpredictable`, `mission-park-unpredictable`.
- This change depends on `readable-dog` (Canine Posture, including Plant and marking) and `in-stage-feedback` (Feedback Messages, Stage Meters, Marker timing grades). Both are archived first.

## Goals / Non-Goals

**Goals:**
- A Dog that wants smells, and a Handler whose tools (turns, pace, stops, Go Sniff, Leave-it, Jackpot) each have a clear use.
- One new idea per Stretch, with real walks in between.
- Everything opt-in per scenario: no change to any Stage outside World 6.
- Deterministic and testable from seeded event streams.

**Non-Goals:**
- A Stage mixing every technique, and the squirrel: these go to a later busy-park Stretch of World 6.
- Scent in Worlds 3-5, wind, tiredness, breed-dependent noses.
- Recall, distance and play Stretches.

## Decisions

1. **Drive blend instead of a new dog mode.** Add `ScentDrive` next to `GoalDrive`, behind the existing `Drive` interface. A `BlendDrive` combines their direction vectors with weights `w_scent = strength × (0.3 + 0.7 × autopilot)` (zero when no unsniffed Scent Spot is in range) and `w_goal = 1`. *Why:* the `dog-drives` spec already promises replaceable, blendable Drives, and the leash code never looks inside a Drive. New modes are added only for states the Dog cannot leave on its own: `planted` (a Plant) and `marking`, each with a seeded duration. *Alternative:* a "scent" `dogMode` that switches on and off. Rejected: hard switching looks robotic and makes the pull all or nothing.

2. **In scent Stages the goal is the Handler's heading (ADR 0030).** `GoalDrive` gets a `target: 'waypoint' | 'heading'` setting; with Scent Spots it aims at `handler + handlerFacing × 2 m`. The waypoints still mark the route and end the Stage for the Handler.

3. **Autopilot as one number in `SimState`.** It rises at a set rate per second while the heading changes less than 15° and the pace less than 20% with no stop, and drops on each counted change by `0.6 × Novelty`. It feeds the scent weight (Decision 1) and lowers the follow chance (`chance × (1 − 0.4 × autopilot)`).

4. **Pace changes and stops become changes.** A smoothed input strength (0.5 s window) detects speeding up or slowing down when the change exceeds 35%. Stops reuse `trackStop`. All six kinds go through one `registerChange(kind)` that applies Novelty, Autopilot and the follow window. Outside scent Stages only turns open a follow window, as today.

5. **Novelty per kind.** Six numbers in `SimState`, step −0.35 per use, recovery +0.05/s, fresh ≥ 0.7, repeated < 0.4 (`walk-novelty`). The follow chance is `followChance × (0.5 + 0.5 × Novelty) + 0.15 × [fresh]`, capped by the existing `followCap`.

6. **Scent Spots are a scenario list, usually anchored to scenery.** `scents: { pos, strength: 'weak'|'normal'|'hot', radius?, marking?: boolean }[]`. A content helper lets a scenery item carry `scent:`, so authors put smells on lamp posts and bushes without repeating positions. Food by a bin reuses the stationary `food` Distractor; in scent Stages it also attracts like a hot Scent Spot, and Go Sniff at it emits `food-eaten`.

7. **Go Sniff in scent Stages.** Availability ignores the Disengagement offer; the `calm` end reason is skipped; a sniff steers the Dog to the nearest unsniffed Scent Spot in range (granted) or meanders as today (empty). Duration comes from `goSniff.durationSeconds` per scenario.

8. **Jackpot as a second Marker.** It uses the same `evaluateMarker` path with a `jackpot` input flag and its own budget. A "hard moment" means a Reward Window is open, or a hot Scent Spot, food or an active Distractor is within its radius at the press. The HUD adds a smaller button next to the Marker only when `jackpotBudget > 0`, placed by `src/hud/layout.ts`.

9. **Stretches and Nodes.**

   | Stretch | Stops | Scent setup |
   |---|---|---|
   | Let them sniff | `theory-sniffing-walks` → `park-nose-on` → `mission-park-sniff` | weak and normal Scent Spots only |
   | Unpredictable walks | `theory-unpredictable-walks` → `howto-yield-pressure` → `park-unpredictable` → `park-keep-fresh` → `mission-park-unpredictable` | normal Scent Spots; Autopilot; Novelty matters from `park-keep-fresh` |
   | Sniffing on your terms | `theory-sniffing-on-your-terms` → `howto-jackpot` → `park-plant-mark` → `park-not-that-one` → `mission-park-sniff-terms` | hot spots and marking posts; food by a bin and the Jackpot in the last Node |

   `park-unpredictable` keeps its id (saved Stars), and its scenario is retuned with Scent Spots. Node prerequisites follow trail order. The how-to-play Lesson `howto-jackpot` satisfies the rule for a new control.

10. **Stage Meters per Node.** Meter Points per action:

    | Node | Nose | Connection |
    |---|---|---|
    | `park-nose-on` | granted sniff 20 | none |
    | `park-unpredictable` | granted sniff 10 | Check-in after a followed change 15 |
    | `park-keep-fresh` | granted sniff 10 | fresh move followed 15, Chain 30 |
    | `park-plant-mark` | waited Plant 25, waited marking 20, granted sniff 10 | Check-in 10 |
    | `park-not-that-one` | granted sniff 10, Leave-it on food 25 | Check-in 10, smart Jackpot 20 |

    Targets are tuned so a good but not perfect run earns 2 Stars. The values live in each Node's scenario, so tuning needs no app release.

11. **Inserting "Let them sniff" ahead of an existing Stretch.** Availability stays "every Stop before it done and every earlier Mission passed", with one exception: a Stop the user could reach under the previous trail stays available. This is computed from the user's existing progress (any done Stop or passed Mission in a later Stretch makes that Stretch's reachable Stops stay open) and needs no stored migration.

    Implemented in `stopLock`/`doneness` of `src/shell/world.ts` (tests: `src/shell/worldInsertion.test.ts`):
    - A Stretch counts as reached when the user read a Lesson, completed a Node or started a Mission in it, or in a Stretch after it. An earlier Stretch the user never touched is then treated as inserted, and its Mission does not lock the reached Stretch. Gates inside the reached Stretch still apply, and a brand-new user follows trail order strictly.
    - A Mission the user already started is not locked by Stops added before it in its Stretch.
    - Grandfathering (a Mission treated as passed for a Dog from before Missions) applies only when the Mission's own Stretch was touched, or a later completed Node is a legacy Node. Without that rule, a user who completed `park-unpredictable` would find the inserted "Let them sniff" Mission already passed.
    - In a World the user completed (`completedWorlds`), a Stop added before a passed Mission counts as satisfied. It shows as open and optional, and the World stays complete.

12. **Timeline.** The simulation appends `{t, kind, polarity}` for each Feedback-worthy event to a capped list (60 entries; when full, the oldest right moments are dropped first), exported as `timeline`. The Node Debrief in `src/shell/screens/NodeScreens.tsx` draws it and picks "done well / try next" from `scentWalk` with a fixed priority table.

## Risks / Trade-offs

- [The Dog feels too stubborn or too easy] → Every weight is a scenario value; tune per Node with playtests; the devSeed jumps straight to each Node.
- [Seeded determinism broken by new random draws] → All new draws use `eventRng`, in a fixed order per tick; golden-payload tests per Node.
- [Three Stretches means more days of real-walk Missions before World 6 is done] → Intended: real practice between ideas. Plus users already have Day Skip.
- [The availability exception hides a bug for new users] → Tests cover both a part-way user and a brand-new user after the insertion (world-progression delta scenarios).
- [Content with Scent Spots on an old app] → Bump `minAppVersion` in each World 6 content release; older apps keep their bundled baseline.
- [Pace detection is noisy on a joystick] → Smoothed strength and a 35% threshold; tune with recorded inputs.

## Migration Plan

1. Ship the app code (simulator, Jackpot button, Debrief timeline, availability exception) with `minAppVersion` X. It does nothing without content that declares Scent Spots.
2. **Content release 1:** "Let them sniff" plus "Unpredictable walks" retuned with Scent Spots and the new `park-keep-fresh`. Author in `content/beta/`, validate, playtest, promote to stable with `minAppVersion` X and a `contentVersion` bump.
3. **Content release 2:** "Sniffing on your terms", after tuning it on data from release 1.
4. Rollback: re-promote the previous World 6 content; the app code is inert without Scent Spots.

## Open Questions

- Exact Autopilot rates, Novelty steps and Stage Meter targets: tuned in playtests within the spec rules.
- Whether the Dog portrait shows Autopilot (for example a sleepy look): a presentation detail decided in playtests.
