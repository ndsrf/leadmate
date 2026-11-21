# Tasks

## 1. Terrace scene in the choose-the-action Minigame

- [ ] 1.1 Add Minigame kind `cafe-settle` to `SUPPORTED_MINIGAMES` (`src/shell/content/schema.ts`) and `MinigameKind` (`src/shell/nodes/node.ts`); regenerate the `content/FORMAT.md` tables; verify a schema test accepts `minigame: cafe-settle` and still rejects an unknown kind.
- [ ] 1.2 In `src/shell/nodes/readDog.ts`, add the scene `cafe` (5 beats, `SCENE_ACTIONS` = ignore, wait, marker, feed), the action `feed`, the states `begging_table` and `staring_waiter`, the `CORRECT_ACTION` map, `SCENE_OF_MINIGAME['cafe-settle']`, the salt and the script from design.md. Verify with `readDog.test.ts` cases for the correct actions, 5 beats, seeded variation, ending relaxed and at least three distinct buttons needed.
- [ ] 1.3 Make `feed` always a mistake with the hints `minigame.cafe.hint.feed` and `minigame.cafe.hint.feedCalm`, and per-action hints `minigame.cafe.hint.<action>`; verify with `readDog.test.ts` cases for feed while begging, feed while relaxed and a wrong Wait.
- [ ] 1.4 Report `timing` and `tension` plus the handling score for the scene; verify with a perfect run (100/100) and a run with two feeds (lower `tension`).
- [ ] 1.5 Add the postures `begging_table` and `staring_waiter` with captions and cues to `src/shell/ui/canine.ts`; verify `canine.test.ts` covers that the states differ from `sitting_attentive` in head direction and ears, tail or mouth.
- [ ] 1.6 Draw `TerraceScene` in `src/shell/ui/MinigameProps.tsx` (café front, table with cup, chair with the seated Handler, mat; a waiter crossing on `staring_waiter`; a treat dropping on a correct Marker) using the canvas "Kit de terraza" shapes and tokens only. Choose it in `ReadDogView.tsx`. Verify with a render test and `noRawColors.test.ts`, and by eye in the web build.
- [ ] 1.7 Add the ES and EN i18n keys: help text, action labels and accessibility labels for `feed`, state captions, cues and hints. Verify `i18n.test.ts` (parity and voice rules) and a screen-reader label test on the action row.

## 2. World 7 art

- [x] 2.1 Port the canvas terrace symbols (cafe-table, cafe-chair, cafe-cup, cafe-plate, cafe-parasol, cafe-planter, cafe-front, ground-terrace, person-seated, person-seated-drop, person-seated-feed, waiter, waiter-trip, dog-rest, dog-down-alert, dog-down-back, dog-sit-alert, dog-beg, chew, treat-drop, pant, top-cafe-table, top-cafe-chair, top-waiter, top-mat, top-dog-down, top-wall, top-planter, top-lane) into `scripts/art/lessons/_kit/kit.mjs`, and regenerate `kit.svg`. Verify `node scripts/art/lessons/_kit/kit.mjs` runs and that the existing Lesson art renders unchanged.
- [x] 2.2 Copy the 14 Lesson scenes from the canvas board "Mundo 7 — Escenas de terraza" to `scripts/art/lessons/` (`cafe-setup-{1,2,do,dont}`, `cafe-settle-{1,2,do,dont}`, `cafe-waiters-{1,2,do,dont}`, `cafe-leave-{1,2}`), named after their Lesson ids (`theory-cafe-*`), with `data-caption` and `data-alt` keys. Fix the two nits: the whining lines in `cafe-leave-1` and the clipped tail in `cafe-waiters-do`. Verify `node scripts/render-lesson-art.mjs` passes its palette and no-words checks.
- [x] 2.3 Copy the 6 Duel scenes to `scripts/art/nodes/{cafe-arrive,cafe-settle,cafe-passing-dog}/` (with the duel-* names from design.md) and render them. Verify the PNGs exist in `assets/nodes/`, `nodeMediaRegistry.ts` lists them, and no Duel image carries a badge.
- [x] 2.4 Check the total PNG weight against `BUDGET` in `scripts/art/lessons/_kit/svg.mjs`; raise it with a dated comment only if the render fails on it; verify the render script finishes green.

## 3. World 7 content, Stretches 1 and 2

- [ ] 3.1 Create `theory-cafe-setup` (`lesson.yaml`, `es.md`, `en.md`, media) on choosing the table, arriving after a sniffing walk, the mat, a first visit of about 10 minutes, and "ask the venue" for access. Verify `npm run content:validate -- --channel beta` and the Lesson conformance test (word bounds, voice rules).
- [ ] 3.2 Create the Node `cafe-arrive` (`stage`, `urban_street`, waypoint route ending at benches and a kiosk, `food` on the route, Leave-it available, density check met). Give it primer cards and a 3-question Checkpoint (the `duel-wall` / `duel-aisle` Image Duel and two text questions) in ES and EN. Verify validation and that it plays in the simulator preview.
- [ ] 3.3 Create `mission-cafe-short-visit` (target, success, problems with fixes) in ES and EN; verify validation and the Mission brief.
- [ ] 3.4 Create `theory-cafe-settle` (mat, chew, treats dropped while calm, never paying begging, the calm scale) in ES and EN; verify validation and the conformance test.
- [ ] 3.5 Create the Node `cafe-settle` (`minigame: cafe-settle`, help text, primer cards, a Checkpoint with the `duel-calm` / `duel-asking` Image Duel and two text questions) in ES and EN. Verify validation and that the Node plays the Terrace scene from the map.
- [ ] 3.6 Create `mission-cafe-settle` (stay settled through one coffee) in ES and EN; verify validation.

## 4. World 7 content, Stretches 3 and 4, and the World

- [ ] 4.1 Create `theory-cafe-waiters` (gather short and slack, Dog on the wall side, body as a shield, mark the look back, an exit) in ES and EN; verify validation and the conformance test.
- [ ] 4.2 Create the Node `cafe-passing-dog` (`close_exercise`, `leash_drill`, a `dog` distractor walking past the table, `urban_street`), with primer, debrief text and a Checkpoint (`duel-short` / `duel-long` plus two text questions) that names a passing dog, in ES and EN. Verify validation and that the close view plays.
- [ ] 4.3 Create `mission-cafe-waiters` (waiters and passers-by at a real terrace) in ES and EN; verify validation.
- [ ] 4.4 Create `theory-cafe-leave-early` (overload signals, leave while calm, an exit) and `mission-cafe-leave-early` (trains `cafe-settle`; target: get up and leave while the Dog still lies calm) in ES and EN; verify validation.
- [ ] 4.5 Wire the four Stretches into `content/beta/worlds/cafe.yaml` in order, removing `preview` and `nodeCount`, and update `cafe/{es,en}.md` topics. Verify `world.test.ts` and progression tests: World 7 unlocks after World 6, Plus gate, completion unlocks World 8 as Coming-soon.
- [ ] 4.6 Review every World 7 text against the method rules (no paying begging, no corrections, an exit wherever triggers appear, no legal claims) and the ES/EN voice rules; verify `i18n.test.ts`, the Lesson conformance tests and a read-through checklist in the change.

## 5. Map copy and versioning

- [ ] 5.1 Update the map copy and tests so World 7 is playable, World 8 is the first Coming-soon World and the "Más próximamente" card refers to Worlds 8-9. Verify `WorldMapScreen.test.tsx`, `mapModel.test.ts` and `mapText.test.ts`, fixing tests that name World 7 as Coming-soon.
- [ ] 5.2 Bump the app version to 1.4.0 (`app.json`, `package.json`), and set `minAppVersion: 1.4.0` and the next `contentVersion` in `content/beta/pack.yaml`. Verify an older-version load test keeps the bundled baseline with World 7 as a Preview.

## 6. Release integration

- [ ] 6.1 Run the full test suite and `npm run content:validate -- --channel beta`; verify all green.
- [ ] 6.2 Promote beta to stable and run `npm run release:prepare` (sim embed, baseline, release check); verify baseline parity passes.
- [ ] 6.3 Play World 7 end to end in ES and EN on a device or emulator with a 1.4.0 build. Verify each Stretch: the Stage with Leave-it, the Terrace Minigame including a Feed mistake, the close-view passing dog, all three Image Duels and every Mission brief.

## Workflow follow-up

- Run an EAS build for 1.4.0 and release; promote content to stable only once the 1.4.0 build is in review.
- Archive the change after release review.
