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

    Implemented in `isInserted`, `stopLock` and `doneness` of `src/shell/world.ts` (tests: `src/shell/worldInsertion.test.ts`):
    - A Stretch counts as inserted when its Mission is neither passed nor owed, yet a later Stretch has a completed Node or a started Mission. The Mission gate prevents this otherwise. A Lesson read does not count, because the Theory Library opens any Lesson. So a user who had only read "Unpredictable walks" Lessons finds that Stretch behind the "Let them sniff" Mission, and their read Lessons stay done. Home Stretches keep ADR 0023's rules. A user from before Missions (a completed later Node is a legacy Node) keeps grandfathering.
    - An inserted Stretch's Mission does not lock the later Stretches (each earlier Stretch is checked on its own, so a Stretch after a passed one stays open too). It is never grandfathered (ADR 0013), even after the user starts it. Its Stops are played in order and are not satisfied by progress in the Stretches after it.
    - A Mission the user already started is not locked by Stops added before it in its Stretch.
    - In a World the user completed (`completedWorlds`), a Stop added before a passed Mission counts as satisfied. It shows as open and optional, and the World stays complete.
    - The next World opens when every Stretch of the World is done except the inserted ones. Their Missions stay to do, but they do not lock a World the user could already reach. For World 6 this means a part-way user who finishes "Unpredictable walks" opens World 7, as on the previous trail.
    - Checked against 713800d over the shipped Worlds for about 69,000 Stop statuses. The users covered were normal, started, Day Skip, Library-reading, legacy, Home Concern and Personal Plan users (trail and reversed order, with and without Library reads), each step by step along the trail. Only one case differs. When a Personal Plan moves a Stretch the user touched (for example by reading its Lesson from the Library) ahead of World 2 Stretches already finished, its Mission was grandfathered before. Now it stays to do, and World 2 is no longer complete, but World 3 stays unlocked. In that case `mission-poste` goes from done (grandfathered) to locked behind its own Node, `poste-practice`, which is open. No other Stop goes from open or done to locked.

12. **Timeline.** The simulation appends `{t, kind, polarity}` for each Feedback-worthy event to a capped list (60 entries; when full, the oldest right moments are dropped first), exported as `timeline`. The Node Debrief in `src/shell/screens/NodeScreens.tsx` draws it and picks "done well / try next" from `scentWalk` with a fixed priority table.

## Implementation notes (simulation, tasks 1.1-3.2)

Every number below is a default in `DEFAULT_SCENT_WALK` (`src/sim/config.ts`); a scenario overrides any of them under `scentWalk:` (groups merge key by key), so tuning in 6.4 needs no app release. `jackpotBudget` is a top-level scenario field.

| Tunable | Default | Note |
|---|---|---|
| `pull` weak / normal / hot | 1.5 / 3 / 5 | Strength weights in Decision 1. Lower values (0.5-2.5) made a weak spot invisible at Autopilot 0. |
| `autopilotFloor` | 0.3 | The `0.3` of Decision 1. |
| `radius` weak / normal / hot | 3 / 4 / 5 m | Nose radius when a spot sets none. Food uses the hot radius. |
| `reachDistance` | 0.6 m | The Dog is "at" a spot (Plant, marking, food, granted sniff). |
| `headingLead` | 1.4 m | **Differs from Decision 2 (2 m):** at 2 m the Dog settles at the leash limit, so the leash is Taut whenever the Handler stands and no change could count. 1.4 m keeps it Slack (ratio 0.7). |
| `autopilot.risePerSecond` | 0.05 | 10 s of steady walking gives about 0.4. |
| `autopilot.steadyAngle` / `steadyPace` | 15° / 20% | Decision 3. |
| `autopilot.steadySeconds` | 1 s | Added: walking must hold steady this long before Autopilot rises, so a weave never counts as steady. |
| `autopilot.dropPerChange` / `followDamping` | 0.6 / 0.4 | Decision 3. Autopilot before the drop sets the follow chance. |
| `novelty.step` / `recoveryPerSecond` | 0.45 / 0.025 per s | **Differ from Decision 5 (0.35 / 0.05):** with those, three right turns within 10 s never reach "repeated" (< 0.4), as `walk-novelty` requires. With 0.45 / 0.025 turns 5 s apart reach 0.35, and a stop at 0 is fresh again after 28 s (the 30 s rule). |
| `novelty.fresh` / `repeated` / `freshBonus` | 0.7 / 0.4 / 0.15 | Decision 5. |
| `pace.smoothingSeconds` / `threshold` | 0.5 s / 35% | Decision 4. The smoothed strength is the mean over the window. After a pace change the new pace is measured again once it settles (within 10% of the input), so one change counts once. |
| `uTurnAngle` | 135° | `walk-novelty`. |
| `plantSeconds` / `markingSeconds` | 3-6 s / 2-4 s | Seeded with `eventRng` when the stop starts. |
| `dragArousal` | 8 | One-off Arousal (times the Equipment Rigid Pull multiplier) of a dragged Plant or an interrupted marking, on top of the usual Rigid Pull rate. |
| `chain.walkSeconds` / `sniffSeconds` | 2 s / 3 s | `walk-novelty` Chain. |

Behaviour decisions:

- **Scent Stage switch.** A scenario is a scent Stage when `scents` or any scenery item's `scent:` declares a spot. Only then does `SimState.scentWalk` exist; every other Stage takes no new random draw and sends no new event (golden payloads of both content channels, `payloadBaselineChannels.json`, stay byte-identical).
- **Random draws** in a scent Stage, all on `eventRng`, in tick order: a stop change, a pace change, a turn (each one follow draw), the Plant or marking duration, then the existing Check-in and Go Sniff draws.
- **Plant and marking.** Only hot spots make the Dog Plant; any spot with `marking: true` makes it mark. Rigid Pull ends either at once (dragged / interrupted) and uses the spot up. A followed turn (not a pace change or a stop) ends a Plant as waited. A marked post is used up too, so the Dog does not mark it again on every pass. A Go Sniff during a Plant or a marking ends it (`result: 'granted'`, no Feedback kind) and is a granted sniff at that spot.
- **Following a stop or a pace change.** On a followed stop the Dog stops too and looks; on a pace change it walks the Handler's way and looks. Neither leaves a Taut correction pending (only turns do).
- **Go Sniff in a scent Stage** is on offer on Slack with no Go Sniff running, except during a Reward Window and during a Fixation (unless the Dog is fixated on food it has reached). A granted sniff takes the Dog to the spot at its Goal speed, then it noses around at Go Sniff speed. The Handler must keep the spot within Slack, or tension ends the Go Sniff as usual.
- **Food in a scent Stage.** A stationary `food` Distractor pulls like a hot spot while in play. A Go Sniff with the Dog within `reachDistance` of it eats it (`food-eaten`, the Distractor is used up). "Leave It" on it, fixated or not, puts it out of play (`food-left`).
- **Scent dragged past.** Reported once per spot, when the leash reaches Rigid Pull while the Dog (walking by its Drive) has that unsniffed spot in nose range.
- **Jackpot.** `SimInput.jackpot` runs the same judgment as a Marker press but spends a Jackpot (`telemetry.jackpots.used`), never a Mark. Only a hit (`marker-hit` or `check-in-hit`) adds a `jackpot` event, `smart` when a Reward Window was open or a Distractor in play, the food, or an unsniffed hot spot was within its radius at the press, else `wasted`. A press with nothing to reward is a wasted (or Late) Marker press as usual. HUD: `hudLayout(..., jackpot)` puts a 26 px button under Go Sniff, or left of it on a short screen; the bundle draws it with the HUD atlas `icon_star` and a badge of Jackpots left, key J. It has no text label, so no new i18n key.
- **Events for Feedback, Stage Meters and the timeline** (`FEEDBACK_ACTION_KINDS`, `feedbackKindOf`): right `granted-sniff`, `waited-plant`, `waited-marking`, `check-in-after-change`, `fresh-move`, `chain`, `leave-it-food`, `smart-jackpot`; wrong `scent-dragged-past`, `dragged-plant`, `interrupted-marking`, `food-eaten`, `repeated-move-ignored`, `empty-sniff`, `wasted-jackpot`. In a scent Stage `go-sniff-start` maps to `granted-sniff` or `empty-sniff` (not `go-sniff`), so a meter there uses those ids. "Check-in after a followed change" is its own `change-check-in` event next to the plain `check-in-hit`, so a Node can score either; the Feedback Message layer (4.2) should show one of the two. Events carry positions, spot indices, change kinds, Novelty and results for the timeline (4.1).
- **Counts for `scentWalk` (4.1)** are kept in `telemetry.scentWalk` (scent Stages only); the Jackpot counts are in `telemetry.jackpots` (any Stage with a budget). `freshMoves` / `repeatedMoves` count every counted change by its freshness, followed or not.

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
