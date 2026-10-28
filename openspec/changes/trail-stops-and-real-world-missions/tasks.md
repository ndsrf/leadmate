# Tasks

## 0. Prerequisite

- [x] 0.1 Archive `revamp-world-map` (`openspec archive revamp-world-map`), then verify that `openspec validate trail-stops-and-real-world-missions` passes against the updated main specs

## 1. Record and Walk Diary data

- [x] 1.1 Add `MissionState` (`startedAt?`, `focus?`, `target`, `skipRun`, `passedOn?`, `keepPractising?`, `attempts`) and `missions: Record<string, MissionState>` to `DogRecord`. Add `seenFixes: { fixId, missionId, at }[]` and `legacyNodes: string[]` as well, and bump `RECORD_VERSION` to 7. Default all three to empty in `newDogRecord`, and have `migrateRecord` read them tolerantly (an absent or invalid value becomes empty, and a record older than version 7 gets `legacyNodes` = its `completedNodes`). Verify with new cases in `src/shell/dogRecord.test.ts`
- [x] 1.2 Extend `WalkDiaryEntry` with optional `missionId` and `problemId`. `nodeId` becomes optional, and old entries stay valid. Update `readDiary`. Verify with `src/shell/streak.test.ts` and `dogRecord.test.ts`
- [x] 1.3 Update `src/shell/sync/merge.ts` per design Decision 6:
  - for each Mission, a passed Mission wins and `keepPractising` is OR-ed;
  - the latest `startedAt` supplies `target` and `skipRun`;
  - attempts are unioned by `at`;
  - `seenFixes` are unioned by `fixId`;
  - `legacyNodes` are unioned;
  - diary keys become `date + (missionId ?? nodeId)`.

  Verify with new cases in `merge.test.ts`: passed beats waiting, history union, Fix union, and old diary entries still merge
- [x] 1.4 Verify that Reset Progress clears `missions`, `seenFixes` and `readLessons`, with a case in `src/shell/reset.test.ts`

## 2. Mission model

- [x] 2.1 Create `src/shell/missions/mission.ts` with `MissionDef`, `Fix` and the pure functions `startMission`, `checkInOpensAt`, `canCheckIn`, `checkIn`, `offerEasier`, `acceptEasier`, `canMoveOn` and `moveOn` (design Decision 3). Verify in `mission.test.ts`:
  - the check-in is closed the same day;
  - 23:50 → 00:10 is closed and opens at 07:50;
  - 23:50 → 08:00 is open;
  - yesterday 18:00 → 10:00 is open;
  - a clock moved back keeps it closed;
  - a struggle sets the easier target and restarts the wait;
  - "completed" on the easier target passes the Mission;
  - three skips in a row offer the easier target, and a struggle resets the skip run;
  - move-on is offered only from the second struggle;
  - only one answer is accepted per day
- [x] 2.2 Make the Mission check-in update the Dog record: write the Walk Diary entry with `missionId` and `problemId`, mark the Streak active, and record a struggle's Fix in `seenFixes`. Do this by generalising `applyDiary` or adding `applyMissionCheckIn` in `dogRecord.ts`. Verify that the Learning Attributes are untouched on every outcome
- [x] 2.3 On reaching a Node's Debrief, write the `pickExercise` result into the `focus` of the Mission that ends that Node's Stretch. Verify with a case in `node.test.ts`

## 3. Lessons and the Library

- [x] 3.1 Add `kind: 'theory' | 'how-to-play'` to `LessonDef` and make `day` optional. Mark the existing first-week Lessons as `theory`, and have `todaysLesson` ignore Lessons without a `day`. Verify with `lesson.test.ts` ("trail Lessons are never for today")
- [x] 3.2 Show the kind label in the Library and the Lesson header (`LessonScreens.tsx`), and "Mundo N · Tramo M" for trail Lessons, via a `placeOfLesson` helper. Verify with a render test and `catalog-usage.test.ts`
- [x] 3.3 Extract the Lesson block renderer so it can render a Fix's blocks. Add the "Tus ajustes" Library section from `seenFixes`: most recent first, each entry naming its Mission and problem, the section hidden while empty, and each entry opening the Fix page. Verify with render tests for the empty and non-empty states and an offline check

## 4. Trail model and progression

- [x] 4.1 Replace `WorldDef.nodes` with `stretches: Stop[][]` in `src/shell/world.ts` and add a `nodeIdsOf(world)` helper. Update `worldOfNode`, `nodesOfWorld`, `isWorldComplete`, `currentWorld` and their callers (celebrations, Walk Plan, `devSeed`). Verify with `npm run type-check` and `world.test.ts`
- [x] 4.2 Implement `stopStatus`, which returns locked, open, waiting or done, plus the reason. It covers Stretch ordering, the Mission gate, Node prerequisites, grandfathered Missions and satisfied Lessons (Decision 5). Verify in `world.test.ts`:
  - the gate locks the next Stretch;
  - the user can practise while a Mission waits;
  - a Lesson read from the Library completes its Lesson Stop;
  - a returning user who finished World 1 has World 2 open;
  - a user partly through a World is gated at the first unpassed Mission;
  - a completed doorbell-mat with its theory Lesson unread does not block
- [x] 4.3 Add a trail validation test that checks:
  - every Stretch ends in exactly one Mission;
  - every Node Stop in a Stretch trains the Mission's technique;
  - ids are unique across trails;
  - every id resolves;
  - the first walking Stage is preceded by a theory Lesson and a How-to-play Lesson;
  - every Fix's `practise` Stop is in the same Stretch or an earlier one.

  Verify that the test fails on a deliberately broken fixture

## 5. Content (placeholder-flagged)

- [x] 5.1 Author the theory and How-to-play Lessons for Worlds 1–4 per design Decision 10, in `src/shell/lessons/content.ts`, with catalog strings in `src/i18n/es.ts`, all placeholder-flagged. Verify with `lessons/content.test.ts` (catalog keys exist, and every How-to-play Lesson has an image or video block) and `catalog-usage.test.ts`
- [x] 5.2 Author the Missions for Worlds 1–4 in `src/shell/missions/content.ts` with catalog strings. Each Mission needs a target, reps, a success sign, the technique it trains, 3–4 problems and a general Fix. Each Fix is made of Lesson-style blocks in this order: reassurance, cause, corrections (with at least one placeholder image or video), easier target, practise Stop. Verify with a content test that checks the block order and the media in every Fix
- [x] 5.3 Rewrite the trail Nodes' `primerCards` as 1–2 recap cards and their Checkpoints so they test the preceding theory Lesson. Keep `INTRO_NODE` at 3–5 dual-aspect cards. Verify with a content test of both card counts and an update to `node.test.ts`
- [x] 5.4 Rewrite `WORLDS` for Worlds 1–4 as one Stretch per technique, keeping Preview Worlds 5–8 with their `nodeCount`. Verify with the validation test from 4.3

## 6. Map model and World Map

- [x] 6.1 Update `mapModel` to work over Stops. It needs:
  - the `waiting` state with its opening time;
  - the Stop kind on each entry;
  - done/total counted in Stops;
  - `nextUp` that skips satisfied Lessons and waiting Missions;
  - `waitingAt`;
  - an unlock banner that names the last missing Stop.

  Verify with `mapModel.test.ts`
- [x] 6.2 Update `mapLayout.ts`:
  - `nodeVisual` glyphs per Stop kind;
  - the waiting visual (moon, plus "Mañana" or "A las HH:MM");
  - the "¿Cómo fue?" badge;
  - the optional and "keep practising" marks;
  - a Stretch flag with a "Tramo N" label.

  Verify with `mapLayout.test.ts` and a 12-Stop layout test with no overlap
- [x] 6.3 In `WorldMapScreen.tsx`, render Stops by kind with accessibility labels that name the kind. Place the Dog marker at `waitingAt` in a resting pose when nothing is next-up, and route Stop presses by kind. Verify with render tests for every scenario in the `world-map-screen` delta

## 7. Flows and screens

- [ ] 7.1 Add the `mission` flow and the `lesson` `returnTo` to `App.tsx`. Closing the Debrief of a Stretch's last Node Stop opens the Mission brief, and finishing a Lesson Stop returns to the map at the same scroll position. Verify with `navigation.test.ts` and a manual check
- [ ] 7.2 Build `src/shell/screens/MissionScreens.tsx` with these screens:
  - the brief, with "Tu foco" and "Start mission";
  - the waiting screen, with its opening time;
  - the check-in, reusing `WalkDiaryBar`;
  - the problem picker: a fixed list plus "Otra cosa";
  - the three-skip easier-target offer;
  - the Fix page: Lesson blocks, easier target, "Practise again" and, after the second struggle, "Move on anyway".

  Use design-system tokens, 44 pt targets and a reduced-motion fallback. Verify with render tests and a 320 pt narrow-screen check
- [x] 7.3 Remove `WalkDiaryBar` from `DebriefBody` and add the "Practise this for: «Mission»" line. Verify that `NodeScreens` tests show no check-in answers on the Debrief
- [x] 7.4 Play the existing celebration when a Mission passes, via `celebrationsFor` with a new `{ kind: 'mission' }` source. Verify with `celebrations.test.ts`

## 8. Docs and integration

- [x] 8.1 Check that `GLOSSARY.md` (Stop, Stretch, Mission, Fix, How-to-play Lesson, and the revised Lesson, Theory Primer, World, World Map and Walk Diary) and `docs/adr/0013-real-world-mission-gate.md` still match the implemented behaviour, and correct any drift
- [ ] 8.2 Run `npm test`, `npm run type-check` and `openspec validate trail-stops-and-real-world-missions --strict`. Then walk World 1 in the app:
  1. Lesson → How-to-play → Node.
  2. The brief opens automatically → start the Mission → the Stop shows waiting.
  3. Move the device time forward ≥ 8 h to the next day → "Costó un poco" → pick a problem → the Fix page appears.
  4. "Tus ajustes" lists the Fix.
  5. Next day → "¡Conseguido!" on the easier target → Stretch 2 opens.

## Workflow follow-up

- Archive the change after review, once `revamp-world-map` has been archived.
