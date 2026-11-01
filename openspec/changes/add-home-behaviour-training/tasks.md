# Tasks

## 1. Coverage model: required parts per concern

- [ ] 1.1 In `src/shell/homeBehaviours.ts` add `REQUIRED_PARTS` (biting concerns: lesson, mission; the others: lesson, node, mission) and make `contentGaps()` and `KNOWN_GAPS` use it; verify `homeBehaviours.test.ts` passes with `bite-owner:node` and `bite-others:node` absent from `KNOWN_GAPS`.
- [ ] 1.2 Add tests that a biting concern with a lesson and a mission has no gaps, that content present without its gap entry removed still fails, and that `homeBehaviourProgress` totals 2 for biting; verify with `npx jest src/shell/homeBehaviours`.

## 2. Exercise scenes (barking, destroying, eating objects)

- [ ] 2.1 Add the `bark-home`, `destroy` and `eat-objects` scenes to `src/shell/nodes/readDog.ts` (`ReadDogScene`, `READ_DOG.beats`, `SCENE_ACTIONS`, `CORRECT_ACTION`, `SCENE_SALT`, `buildScript`, `hintKey`) and the three `MinigameKind`s with their `SCENE_OF_MINIGAME` entries; verify `readDog.test.ts` covers each script (every state has exactly one correct action, ends calm).
- [ ] 2.2 Add postures for any new Dog state in `src/shell/ui/canine.ts`, reusing the nearest existing posture when there is no art yet; verify no scene shows an undefined posture (test over all states).
- [ ] 2.3 Add the three Nodes (`bark-home`, `destroy`, `eat-objects`) in `src/shell/nodes/content.ts` as `mode: 'minigame'` with no prerequisites outside Home Behaviours, exercises on `timing` and `tension`; verify `node.test.ts` and `findNode` find them and none gates a World.
- [ ] 2.4 Add the `minigame.<scene>.*` and node texts to `src/i18n/es.ts` (or `es.trail.ts`); verify `i18n.test.ts` and `catalog-usage.test.ts` pass.

## 3. Lessons

- [ ] 3.1 Add the professional-help note as a leading block type or shared key reused by the biting and eating-objects Lessons; verify with a lesson test that the note is the first block of both biting Lessons.
- [ ] 3.2 Write the `bite-owner` and `bite-others` Lessons (safe handling first, `theoryLesson`, catalog keys, art keys) and add them to `LESSONS`; verify `LessonScreens.test.tsx` renders them and the catalog usage test passes.
- [ ] 3.3 Write the `bark-home`, `destroy` and `eat-objects` Lessons (the eating Lesson separates training from "see a vet" early); verify the same tests.
- [ ] 3.4 Follow `docs/content/lesson-guide.md` for every Lesson and record illustration stand-ins in `docs/content/stand-in-content.md`; verify each referenced art key resolves.

## 4. Missions

- [ ] 4.1 Add the five Missions in `src/shell/missions/content.ts` (`place: 'home'`), the biting ones training a Lesson Stop and the others their Node; verify `findMission` finds them and the mission tests pass.
- [ ] 4.2 Add the Mission and Fix texts for all five to the Spanish catalog; verify the catalog tests pass.

## 5. Wire the content and the Home Behaviours section

- [ ] 5.1 Fill `HOME_BEHAVIOUR_CONTENT` with the ids from sections 2-4 and empty `KNOWN_GAPS`; verify the coverage test passes (no gaps for any concern) and `comingSoon` is false for all five.
- [ ] 5.2 Replace the "coming soon" body in `HomeBehavioursSection` with Lesson, Exercise and Mission buttons shown only for parts that exist, with per-part done marks; verify with a component test that a biting row shows no Exercise button.
- [ ] 5.3 Make the section open the Lesson, the Node and the Mission brief in order, return to the section from a Home Node's Debrief and open its Mission, without touching `missionOfStop`; verify with `WorldMapScreen.test.tsx` and a navigation test.
- [ ] 5.4 Verify Home Behaviours still count in no World completion, unlock or progress total (existing `world.test.ts` assertions plus one for the new content).

## 6. Review and integration

- [ ] 6.1 Run `npx tsc --noEmit` and the full jest suite; verify both pass.
- [ ] 6.2 Have the biting and eating-objects Lessons and Missions reviewed for safety by a named reviewer, and record the sign-off in the change before archiving; verify the sign-off note exists.

## Workflow follow-up

- Archive the change after the safety review sign-off and project review requirements are satisfied.
