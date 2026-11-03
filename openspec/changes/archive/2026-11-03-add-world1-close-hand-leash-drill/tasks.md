# Tasks

## 1. Hand Distractor and hand-drill sim

- [x] 1.1 Add `'hand'` to `DISTRACTOR_KINDS` in `src/sim/learning.ts` with a default Trigger level; run `npx tsc --noEmit` and fix every `Record<DistractorKind, ...>` consumer; verify learning-snapshot and sync-merge tests still pass unchanged
- [x] 1.2 Add `controls: 'hand_drill'` and a stationary-Distractor encounter to `src/sim/closeExercise.ts` (hand near the Handler, active for the whole run, leash length keeps the Dog out of reach); verify with a sim test that gathering keeps the Dog out of reach and an ungathered lunge stops at the leash end
- [x] 1.3 Add the no-fail result: calm hold for `calmSeconds` = success, maximum duration = timeout, reactive tier never ends the run; lunges lower the handling score in `src/sim/payload.ts`; set the 60 s cap and verify with sim tests for calm hold, repeated lunges then calm, and timeout (no failure result, Debrief payload emitted, at least one star)
- [x] 1.4 Add the reward step (mark while calm, then release tension) reusing the reward window and marker-hit drop; verify with a sim test that a calm mark lowers arousal and a mistimed mark does not end the run
- [x] 1.5 Add per-age-band config presets (puppy, adolescent, adult, senior, plus a neutral preset for no Age Band) as data in `src/shell/nodes/scenarios.ts` plus a first-run gentle preset; verify with a unit test that `null` age returns the neutral preset and that no preset changes the control set

## 2. Close scene and HUD

- [x] 2.1 Render the hand Distractor and the toy/treat reward in `bundle/src/CloseExerciseScene.ts` and `bundle/src/sprites.ts` with existing art; hide the shield control for `'hand_drill'`; verify with the sprite tests and a manual run of the scene in the simulator
- [x] 2.2 Add close-view Coach marks (Gather, Poste, Marker) in `src/hud/coach.ts` with new hint ids in `src/shell/onboarding/hints.ts`, recorded in `seenHints`, 20 s timeout, hidden when paused; verify with `coach.test.ts`/`hints.test.ts` cases for first run, press, timeout, replay, walking Marker not counting, and progress reset
- [x] 2.3 Rebuild the embedded simulator bundle (`SIM_HTML`) with the project's bundle script and verify the typecheck and bundle build commands from `docs/content/close-exercise-guide.md` succeed

- [x] 2.4 Make the drill readable: separate unzoomed HUD camera, how-to-play card that pauses the sim until start, state-driven instruction line, arousal and calm bars, pulsing control; verify in a headless-browser run that the card, bars and controls render at 390x780 and that the sim does not tick before start
- [x] 2.5 Draw the hand drill from design 18 (`handDrillView.ts`, `handDrillArt.ts`, embedded Fredoka), with the Dog's poses, leash, hand, reward, sparkles and a held final frame; align `closeHudLayout` with the round buttons; verify by screenshot against design 18 at 390x844 and 360x640, and that the leash drill still uses the Phaser scene
- [x] 2.7 Put Gather on the right and the Marker on the left (view, `closeHudLayout`, Coach marks); verify with `coach.test.ts`
- [x] 2.8 Pin the hand trigger level in the hand drill so a Dog whose hand level faded to 0 still gets excited; verify with the new case in `handDrill.test.ts`
- [x] 2.6 Antialias the generated close atlas (4x supersample) and make the dev server poll for file changes on `/mnt/c`; verify with the atlas regeneration script and a restart of `npm run sim:dev`

## 3. Node, trail and content

- [x] 3.1 Add the "calm hands and leash" Node to `src/shell/nodes/content.ts` (`mode: 'close_exercise'`, needs only the `howto-choose-action` Lesson read: add the exception to the Lesson gate in `src/shell/world.ts`), build its config and copy keys from `DogRecord.ageBand`; verify with a node test that puppy, adult and unknown ages pick the right keys, and that the Node opens with only the how-to-play Lesson read
- [x] 3.2 Place the Node first in Basics Stretch 1, before `dog-as-dog`, in `src/shell/world.ts`, and make `mission-dog-as-dog` need both Nodes in `src/shell/missions/content.ts`; verify with `world.test.ts` cases for trail order, the Lesson-gate exception, a skipped simulation completing the Node, Mission closed until both Nodes complete, and the per-Dog World 1 order with biting and home Concerns
- [x] 3.3 Verify Reset Progress clears the Node's completion and the close-view Coach marks; verify with a `world.test.ts`/record test
- [x] 3.4 Write the Spanish copy in `src/i18n/es.ts` and `es.trail.ts` (primer, Checkpoint, Debrief, real-world exercise, Coach marks, four age-band variants); verify the catalog-coverage test passes and a content test finds no physical-correction wording in the Node's text
- [x] 3.5 Add the pointer line to `theory-bite-owner`, `theory-bite-others` and their Missions after the professional-help note; verify with a content test that the pointer exists, `REQUIRED_PARTS` is unchanged and no biting Home Stretch gained a Node

## 4. Integration

- [x] 4.1 Extend `src/App.test.tsx` to open the new Node from World 1, post a `close_exercise` start with the age-band config, reach the Debrief and complete the Node; verify `npm test` passes
- [x] 4.2 Update `docs/content/close-exercise-guide.md` for the `hand_drill` scheme and age-band presets, and GLOSSARY.md for the "calm hands and leash" Node; verify the documented commands run as written
- [x] 4.3 Run the full checks (typecheck, tests, bundle build) and play World 1 end to end on a new Dog and on a Dog with a biting Concern; verify the drill appears once per Stretch and the trail order matches the spec

## Workflow follow-up

- Reword the Purpose line of `dog-basics-world` ("These basics come before any leash work") when archiving, since a delta cannot edit a Purpose.
- Archive the change after the project's review requirements are satisfied.
