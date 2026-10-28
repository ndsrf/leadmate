# Design

## Context

- `WorldDef.nodes: string[]` (`src/shell/world.ts`) is the whole trail model. `isWorldComplete`, `isNodeOpen`, `currentWorld` and `mapModel` (`src/shell/mapModel.ts`) all assume a World is a flat list of Node ids, and `NodeState` is `'locked' | 'open' | 'next' | 'done'`.
- Lessons (`src/shell/lessons/`) are a separate, unlockable-free library. `readLessons` is on the Dog record and merged as a union (`src/shell/sync/merge.ts`).
- The Walk Diary (`src/shell/streak.ts`) stores `{ date, nodeId, outcome }`. It is written same-day from `WalkDiaryBar` on the Debrief (`src/shell/screens/NodeScreens.tsx`) via `applyDiary` in `dogRecord.ts`.
- Calendar-day logic already exists and is DST-safe: `localDateString` and `dayDiff`. It is used by the Streak and the Lesson Day count, and Missions reuse it.
- `App.tsx` routes everything through a `Flow` union (`node`, `lesson`, `library`, `daily`, …).
- `revamp-world-map` is implemented but not archived. It modifies the same `world-map-screen` and `world-progression` requirements, so this change's deltas are written on top of its text, and it must be archived first.

## Goals / Non-Goals

**Goals:**
- A data-only trail model (Stretches of typed Stops) that drives unlocking, the map and next-up from one pure function, as `mapModel` does today.
- The Mission is a small pure state machine with a gate of a later calendar day plus 8 hours, testable without UI.
- Corrective help is authored content (problem → Fix page made of Lesson-style blocks), not generated.
- Existing records keep their progress without a one-shot migration step.

**Non-Goals:**
- Push or local notifications reminding the user to check in. These are deferred to a separate change (see ADR 0013).
- Free-text or AI-generated troubleshooting.
- Changing the order of the Node's four steps, Stars, the Daily Stage, Rusty logic or the onboarding Walk Plan. The Walk Plan still suggests Node ids, and those Nodes are now Node Stops. Only the Primer's length and content change (Decision 11).
- Final (non-placeholder) copy and media for the new Lessons and Missions.
- Content for Preview Worlds 5–8.

## Decisions

### 1. Trail model: `stretches: Stop[][]` on `WorldDef`
```ts
type Stop = { kind: 'lesson'; id: string } | { kind: 'node'; id: string } | { kind: 'mission'; id: string };
interface WorldDef { …; stretches: Stop[][]; /* nodes removed */ }
```
The flat `nodes` field is replaced by a derived helper, `nodeIdsOf(world)`, so the existing callers (`worldOfNode`, celebrations, the Walk Plan) keep working. A validation test checks that every Stretch ends in exactly one `mission`, that ids are unique across trails, and that every id resolves.
*Alternative:* add `kind` to `NodeDef` and make Lessons and Missions pseudo-Nodes. This was rejected because the Node state machine, Stars and `onDebrief` would all need special cases. Keeping Node intact and wrapping it in a Stop is cheaper and keeps the glossary true ("a Lesson is never part of a Node").

### 2. One availability function for all Stop kinds
`stopStatus(stop, record, today)` returns `locked | open | waiting | done`, plus the lock reason. "Done" means:
- a Lesson is in `readLessons`;
- a Node is in `completedNodes`;
- a Mission is passed, or grandfathered (Decision 5).

Availability means every earlier Stop in the Stretch is done and every earlier Mission in the World is passed, which is equivalent because each Stretch ends in its Mission. A Node Stop also checks the Node's own `prerequisites`. `mapModel` maps over Stops instead of Nodes. Next-up is the first `open` Stop that is not done. A Mission whose check-in is due counts as `open`. A Mission that was started but is not due counts as `waiting`.

### 3. Mission data and state
```ts
interface Fix { id; blocks: LessonBlock[] /* reassurance, cause, corrections (with image/video), in order */;
  easierTarget: TextKey; practise: Stop; placeholder?: boolean }
interface MissionDef { id; title; target: TextKey; reps: number; successSign: TextKey; trains: string[];
  problems: { id; label: TextKey; fix: Fix }[]; generalFix: Fix; placeholder?: boolean }
interface MissionState { startedAt?: string /* ISO time; absent until "Start mission" */; focus?: TextKey; target: 'full' | 'easier'; skipRun: number;
  passedOn?: string; keepPractising?: boolean;
  attempts: { date: string; at: string; outcome: DiaryOutcome; problemId?: string }[] }
DogRecord.missions: Record<string, MissionState>
DogRecord.seenFixes: { fixId: string; missionId: string; at: string }[]
```
Pure functions in `src/shell/missions/mission.ts` handle the state changes:
- `startMission(now)` sets `startedAt`.
- `checkInOpensAt(state)` returns the later of two times: the next local midnight after the last of `startedAt` and the latest attempt, or that same moment plus 8 hours. `canCheckIn(state, now)` is `now >= checkInOpensAt(state)`, and it is false when the clock is earlier than `startedAt`. The waiting label shows "Mañana" when the opening time is the next midnight, and "A las HH:MM" otherwise.
- `checkIn(state, outcome, problemId?, now)` works as follows:
  - "completed" passes the Mission, whichever target is active.
  - "struggled" sets `target = 'easier'`, restarts the wait (`startedAt = now`), resets `skipRun` and records the Fix in `seenFixes`.
  - "skipped" restarts the wait and increments `skipRun`.
- `offerEasier(state)` is true when `skipRun >= 3` and `target === 'full'`, and `acceptEasier` switches the target. The easier text for a skip run is the general Fix's `easierTarget`.
- `canMoveOn(state)` is true when there are 2 or more struggled attempts, and `moveOn` passes the Mission with `keepPractising`.

`checkIn` also appends to `walkDiary` and calls `markActive` for the Streak, through the existing `applyDiary` path. That path is generalised to `{ date, nodeId?, missionId?, outcome, problemId? }`.
*Why both a later calendar day and 8 hours:* the calendar day matches the Streak and what the user is told ("tomorrow"). The 8 hours stop a Mission started at 23:50 from being checked in at 00:10, before any walk could have happened (ADR 0013).
*Why the Fix is Lesson blocks:* the Fix page reuses the Lesson renderer (text, image, video, tip, accessibility, placeholder badge), and it can be listed in the Library's "Tus ajustes" without a second content format.

### 4. The gate is the daily limit
There is no separate per-day counter. Each Stretch is sized at 10–15 minutes, and the Mission gate caps forward progress at one Stretch per day.
*Alternative considered:* an "N Stops per day" quota. This was rejected because it blocks the user arbitrarily mid-theory without tying the wait to real practice, and it adds a second rule to explain.

### 5. Grandfathering is derived, with one legacy snapshot
A Mission is treated as passed (grandfathered) when it was never started and either:
- a Node Stop after it in its World is in `completedNodes`. The gate stops a Dog that started with Missions from completing such a Node, so only a Dog from before Missions can meet this, and it is never locked out of a Node it already reached; or
- it is its World's last Mission and every Node Stop of its Stretch is in `legacyNodes`.

The second rule is needed because a World's last Mission has no Node Stops after it, so the first rule cannot tell a returning user from a new one. `legacyNodes` is a snapshot of `completedNodes` that `migrateRecord` takes once, when it reads a record older than version 7. New records start with it empty, sync merges it as a union, and Reset clears it. Everything else is computed in `stopStatus`, so sync merge cannot undo it. An unread Lesson Stop is *satisfied* when any later Node Stop in its World is completed. It counts as done for gating, so it never blocks the Stops after it, but it is not marked read. The map draws it as open with an "optional" mark, and it is never next-up. Without this rule, a user who finished doorbell-mat under the old structure would find Stretch 2's Mission blocked by the doorbell theory Lesson placed before it.

### 6. Merge rules
`missions` merges per id:
- `passedOn` is set if either side has it (earliest date wins);
- `keepPractising` is OR-ed;
- `attempts` are unioned by `at`;
- the side with the latest `startedAt` supplies `startedAt`, `target` and `skipRun`.

`seenFixes` is unioned by `fixId`, keeping the earliest `at`.

`walkDiary` keys become `date + (missionId ?? nodeId)`. Reset clears `missions` and `seenFixes` (it already resets the record to `newDogRecord()`, so adding the fields to the factory is enough).

### 7. Lessons gain `kind`, `day` becomes optional
`LessonDef.kind: 'theory' | 'how-to-play'` and `day?: number`. `todaysLesson` filters on `day !== undefined`. The Library shows "Mundo N · Tramo M" for trail Lessons, found from the Lesson's id via a `placeOfLesson` helper. Existing first-week Lessons become `kind: 'theory'` and stay in the Library only, not on the trail, so the "for today" behaviour is unchanged. The Library gains a "Tus ajustes" section built from `seenFixes` (most recent first). It is hidden while empty, and each entry opens the same Fix page.

### 8. Flows and screens
`App.tsx` `Flow` gains `{ name: 'mission'; id: string; view: 'brief' | 'checkin' | 'fix' | 'waiting'; problemId?: string }`. The existing `lesson` flow gets `returnTo: 'map' | 'library'`, so a Lesson Stop returns to the map. When the Debrief of a Stretch's last Node Stop is closed, the shell opens the `mission` flow on `brief` instead of the map. The brief reads "Tu foco" from the `pickExercise` result of the latest Debrief in the Stretch, which is written to the Mission state's `focus` when the Debrief is reached. The new `MissionScreens.tsx` (brief, waiting, check-in, problem picker with a fixed list plus "Otra cosa", and the three-skip offer) reuses `WalkDiaryBar` for the three answers. The Fix page renders its blocks with the Lesson block renderer, followed by the easier target, "Practise again" (which opens the `node` or `lesson` flow) and, when `canMoveOn`, "Move on anyway". `DebriefBody` drops `WalkDiaryBar` and shows a "Practise this for: «Mission»" line instead.

### 9. Map rendering of longer Worlds
`mapLayout` already positions by index, with alternating sides and a fixed `ROW_HEIGHT`, so length is not a problem. The new parts are:
- a glyph per Stop kind in `nodeVisual`;
- a `waiting` visual;
- a Stretch flag with a "Tramo N" label drawn at each Mission;
- the Dog marker placed at the waiting Mission when `nextUp` is null.

`MapModel.nextUp` gains a `stopKind` field, and the model gains `waitingAt?`.

### 10. Content shape for Worlds 1–4 (placeholder text)
Each Stretch trains one technique and follows this pattern: theory Lesson → (How-to-play Lesson when the controls are new) → Node(s) → Mission.

- **World 1:**
  - Stretch 1: harness theory, How-to-play "Tap & Hold", harness-ritual, Mission "harness at home".
  - Stretch 2: doorbell theory, doorbell-mat, Mission "doorbell drill".
  - Stretch 3: Poste theory, poste-practice, Mission "Poste on the stairs".
- **World 2:**
  - Stretch 1: loose-leash theory, How-to-play "Walking: joystick, leash, Poste, Go Sniff", walk-distraction, Mission "5-minute walk past one distraction".
  - Stretch 2: blind-corner theory, blind-corner, Mission "corners on your block".
  - Stretch 3: slack "U" theory, slack-u, Mission "U-leash walk".
- **World 3:**
  - Stretch 1: leave-it theory, How-to-play "Cue buttons", leave-it-intro, Mission.
  - Stretch 2: visual shields theory, scooter-crossing, Mission.
  - Stretch 3: choosing the cue theory, urban-mix, Mission.
- **World 4:**
  - Stretch 1: 3 m leash theory, How-to-play "Long leash", park-jogger, Mission.
  - Stretch 2: park mix theory, park-mix, Mission.

Each Mission has 3–4 problems, each with a Fix, plus a general Fix.

### 11. Primer recap on the trail
Nodes on the trail get one or two `primerCards` that recap the preceding Lessons, and their Checkpoint question is rewritten to test the theory Lesson. `INTRO_NODE` (the guided first Stage, `App.tsx`) is not on any trail and keeps its 3–5-card dual-aspect Primer. A content test enforces both card counts.
*Alternative:* drop the Primer on the trail. This was rejected because a Node replayed weeks later would open on a Checkpoint with no context.

## Risks / Trade-offs

- [Users find the gate frustrating and churn] → Practice, the Daily Stage and the Library stay open, the waiting Stop explains why, and "Move on anyway" after the second struggle prevents dead ends. Track time-to-next-check-in in telemetry later.
- [Users lie with "¡Conseguido!" to skip ahead] → This is accepted. The gate only adds friction, it does not enforce anything, and the next Stretch's sim still trains the skill.
- [Conflicting deltas with `revamp-world-map`] → Archive `revamp-world-map` first. The deltas here copy its requirement text.
- [Placeholder content volume (≈ 15 Lessons, 11 Missions, ≈ 45 Fixes)] → All of it is flagged placeholder with the existing badge. The structure ships first, and the copy is replaced as data later.
- [Clock tampering opens the check-in early] → This is accepted. It is the same exposure as the Streak.
- [Grandfathered users see unread Lessons behind them] → They are satisfied for gating, marked optional and never next-up (Decision 5).

## Migration Plan

1. Bump `RECORD_VERSION` to 7. Add `missions: {}`, `seenFixes: []` and `legacyNodes: []` to `newDogRecord`, and have `migrateRecord` read them tolerantly. An absent or invalid value becomes empty. For a record older than version 7, `legacyNodes` becomes a copy of its `completedNodes`.
2. Add the optional `missionId` and `problemId` fields to `WalkDiaryEntry`. Old entries keep `nodeId`.
3. Ship the trail content. Grandfathering (Decision 5) keeps existing users where they were.
4. Rollback: older builds ignore the unknown `missions` field, and their World unlock reads `completedNodes` only, so rolling back loses nothing.

## Open Questions

- What are the final copy, images and clips for every new Lesson, Mission and Fix? These come from the training content author. They replace the placeholder data and need no code changes.
