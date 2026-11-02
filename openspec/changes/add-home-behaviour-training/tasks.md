# Tasks

## 1. Coverage model: required parts per concern

- [x] 1.1 In `src/shell/homeBehaviours.ts` add `REQUIRED_PARTS` (biting concerns: lesson, mission; the others: lesson, node, mission) and make `contentGaps()` and `KNOWN_GAPS` use it; verify `homeBehaviours.test.ts` passes with `bite-owner:node` and `bite-others:node` absent from `KNOWN_GAPS`.
- [x] 1.2 Add tests that a biting concern with a lesson and a mission has no gaps, that content present without its gap entry removed still fails, and that `homeBehaviourProgress` totals 2 for biting; verify with `npx jest src/shell/homeBehaviours`.

## 2. Exercise scenes (barking, destroying, eating objects)

- [x] 2.1 Add the `bark-home`, `destroy` and `eat-objects` scenes to `src/shell/nodes/readDog.ts` (`ReadDogScene`, `READ_DOG.beats`, `SCENE_ACTIONS`, `CORRECT_ACTION`, `SCENE_SALT`, `buildScript`, `hintKey`) and the three `MinigameKind`s with their `SCENE_OF_MINIGAME` entries; verify `readDog.test.ts` covers each script (every state has exactly one correct action, ends calm).
- [x] 2.2 Add postures for any new Dog state in `src/shell/ui/canine.ts`, reusing the nearest existing posture when there is no art yet; verify no scene shows an undefined posture (test over all states).
- [x] 2.3 Add the three Nodes (`bark-home`, `destroy`, `eat-objects`) in `src/shell/nodes/content.ts` as `mode: 'minigame'` with no prerequisites outside Home Behaviours, exercises on `timing` and `tension`; verify `node.test.ts` and `findNode` find them and none gates a World.
- [x] 2.4 Add the `minigame.<scene>.*` and node texts to `src/i18n/es.ts` (or `es.trail.ts`); verify `i18n.test.ts` and `catalog-usage.test.ts` pass.

## 3. Lessons

- [x] 3.1 Add the professional-help note as a leading block type or shared key reused by the biting and eating-objects Lessons; verify with a lesson test that the note is the first block of both biting Lessons.
- [x] 3.2 Write the `bite-owner` and `bite-others` Lessons (safe handling first, `theoryLesson`, catalog keys, art keys) and add them to `LESSONS`; verify `LessonScreens.test.tsx` renders them and the catalog usage test passes.
- [x] 3.3 Write the `bark-home`, `destroy` and `eat-objects` Lessons (the eating Lesson separates training from "see a vet" early, with the vet text as one shared key reused in the Mission's Remediation); verify the same tests.
- [x] 3.4 Follow `docs/content/lesson-guide.md` for every Lesson and record illustration stand-ins in `docs/content/stand-in-content.md`; verify each referenced art key resolves.

## 4. Missions

- [x] 4.1 Add the five Missions in `src/shell/missions/content.ts` (`place: 'home'`), the biting ones training a Lesson Stop and the others their Node; verify `findMission` finds them and the mission tests pass.
- [x] 4.2 Add the Mission and Fix texts for all five to the Spanish catalog; verify the catalog tests pass.

## 5. Wire the content and the Home Behaviours section

- [x] 5.1 Fill `HOME_BEHAVIOUR_CONTENT` with the ids from sections 2-4 and empty `KNOWN_GAPS`; verify the coverage test passes (no gaps for any concern) and `comingSoon` is false for all five.
- [x] 5.2 Replace the "coming soon" body in `HomeBehavioursSection` with Lesson, Exercise and Mission buttons shown only for parts that exist, with per-part done marks; verify with a component test that a biting row shows no Exercise button.
- [x] 5.2b (superseded by 5b.3: the lock is removed) Disable the Exercise and Mission buttons (not the Lesson) of a Home Behaviour that is not a Concern, with the "not a problem" note and the existing "Ahora es un problema" button setting level 1 and enabling them; verify with a component test that Exercise and Mission are disabled for a non-concern, the Lesson is not, and both enable after becoming a Concern.
- [x] 5.2c Repoint the home concerns in `CONCERN_STRETCHES` (`src/shell/onboarding/plan.ts`) at the new Home Behaviour content and drop the "nearest existing material" comment; verify `plan.test.ts` is updated and passes.
- [x] 5.2d (superseded by 5b.2: Home Missions take the Day Skip and are Owed) Home Missions: hide the Day Skip and never mark one Owed; verify with a test that a waiting Home Mission offers no "Saltar el día".
- [x] 5.3 (superseded by 5b.1 and 5b.2: `missionOfStop` now finds Home Missions) Make the section open the Lesson, the Node and the Mission brief in order, return to the section from a Home Node's Debrief and open its Mission, without touching `missionOfStop`; verify with `WorldMapScreen.test.tsx` and a navigation test.
- [x] 5.4 (superseded by 5b.5: a Dog's Home Stretches count in World 1) Verify Home Behaviours still count in no World completion, unlock or progress total (existing `world.test.ts` assertions plus one for the new content).

## 5b. Home Stretches in World 1 (supersedes 5.2b, 5.2d, 5.3 and 5.4; see ADR 0021)

- [x] 5b.1 Compose World 1 per Dog: add the Home Stretches of the Dog's Concerns to World 1 in Personal Plan order, never before a Stretch holding a prerequisite Node; a Home Stretch declared after World 1 is complete stays optional and a started one stays when the Concern is removed; verify in `world.test.ts` with the reachability test.
- [x] 5b.2 Make Home Missions normal Missions (Day Skip, Owed) and make `missionOfStop` and the Debrief find them through World 1; remove the no-Day-Skip rule and its test.
- [x] 5b.3 Turn the Home Behaviours section into Other Home Behaviours: between World 1 and World 2, collapsed by default, hidden when empty, all content enabled, and "Ahora es un problema" moving the Stretch into World 1 at level 1; remove the "not a problem" lock; verify with component tests.
- [x] 5b.4 Fold the first locked World (World 2) to its header by default; verify in `WorldMapScreen.test.tsx`.
- [x] 5b.5 World 1 completion and World 2 unlock count the Dog's Home Stretches; verify in `world.test.ts`.

## 5c. World 1 order and open Lessons (see ADR 0021)

- [x] 5c.1 Open the Lessons of a Stretch together: `stopLock` gates only Nodes and Missions by the Stops before them; verify in `world.test.ts` and `mapModel.test.ts` (next-up is the first unread Lesson).
- [x] 5c.2 Make `howto-choose-action` the first Stop of World 1 and require it for every living-room read-the-Dog Node (`requiredLessonsOf`), in `stopLock` and in the `worldsFor` placement guard; a Home Node off the trail does not require it; verify with tests.
- [x] 5c.3 Order World 1: biting Home Stretches, the "Un perro, no un peluche" Stretch, other Home Stretches by plan/level, home-rest, calm-first; started Stretches keep their place; verify the exact order for Dogs with {}, {bite-owner}, {bark-home, destroy} and all five, and the reachability test.

## 6. Review and integration

- [x] 6.1 Run `npx tsc --noEmit` and the full jest suite; verify both pass.
- [ ] 6.2 Have the biting and eating-objects Lessons and Missions reviewed for safety by a named reviewer, and record the sign-off in the change before archiving; verify the sign-off note exists.

## Workflow follow-up

- Archive the change after the safety review sign-off and project review requirements are satisfied.
