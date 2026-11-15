# Tasks

## 1. Image duel Checkpoint question

- [x] 1.1 Extend the node schema (`src/shell/content/schema.ts`) with an image duel question kind (two images, correct index, explanation); verify with a schema unit test that text questions still parse unchanged.
- [x] 1.2 Extend `validator.ts` to reject a duel without exactly two existing images or exactly one correct; verify with failing-case tests that name the Node.
- [x] 1.3 Carry duel images and per-language text through `nodes/content.ts` and the content build; verify the built content exposes both images and localized alt text.
- [x] 1.4 Render the duel in the Checkpoint (`NodeScreens.tsx`): stacked images, random top/bottom order, no markers before answering, check/cross badges plus explanation after, screen-reader labels, existing timer and timeout behavior; verify with `NodeScreens.test.tsx` cases for shuffle, hidden verdict, wrong choice and timeout.
- [x] 1.4a Confirm the Checkpoint answer still never blocks the simulation or changes the Dog for duel questions; verify with a test.
- [x] 1.5 Regenerate the schema tables in `content/FORMAT.md` and `docs/content/lesson-guide.md` for the new kind and its art rule (no badges, no words); verify `content:validate` still passes on the current pack.
- [x] 1.6 Bump the app version that ships the renderer and set the `minAppVersion` rule for packs using duels; verify an older-version load test keeps the bundled baseline.

## 2. Art pipeline in Claude Design

- [x] 2.1 Produce one trial image (a 640x360 park scene with the mascot dog and person) in the LeadMate Design System canvas, export it, and confirm the export path into an item's `media/`; verify it renders in a Lesson and update the design note if SVG export is not possible.
- [x] 2.2 Add any kit symbols Stretch 1 needs (park props) to the canvas; verify the mascot dog and person match the existing kit.
- [x] 2.3 Produce the Stretch 1 art as PNG (SVG if the trial export allows it): Lesson diagrams and scenes, a do/don't pair, and one duel pair for the Node (autopilot vs turn-and-look; further pairs optional); verify palette by eye, legibility at 320 pt, and that duel images have no badges or words.

## 3. World 6 content, Stretch 1 (unpredictable walks)

- [x] 3.1 Create `theory-unpredictable-walks` in `content/beta/lessons/` with `lesson.yaml`, `es.md`, `en.md` following the lesson pattern and word bounds; verify with `npm run content:validate -- --channel beta` and the lesson conformance test.
- [x] 3.2 Create `howto-yield-pressure` (5-minute light-pressure drill, marking and rewarding check-ins) in ES and EN; verify method-rule wording by review (light pressure, released at once, no pulling, no repeated cues).
- [x] 3.3 Create the Stage Node (park theme, zig-zag waypoints, check-in scoring, the language's structured and Go Sniff cues, no Sintonía) with a 3-question Checkpoint (one Image Duel and two text questions), primer cards and exercises, in ES and EN; verify it loads and plays in the simulator preview.
- [x] 3.4 Create the Mission for Stretch 1 with target, success text and problems in ES and EN; verify validation and the Mission brief shows "Tu foco" from the Debrief.
- [x] 3.5 Wire Stretch 1 into `recall.yaml` and `recall/{es,en}.md` with `preview` cleared; verify the world-progression and map tests.

## 4. Review and decisions

- [x] 4.1 Implement the one-Stretch World 6 behavior: completion after its Mission, the "more Stretches coming" map note, and reopening of a completed World that grows without relocking the next one; verify with progression and map tests, including a record that completed World 6 before a second Stretch exists.
- [x] 4.2 Check every Stretch 1 text against the method rules, the cue-word rule and the ES/EN voice rules (`{name}`, no gendered adjectives, no exclamation marks in body); verify `i18n.test.ts` and the lesson conformance tests.

## 5. World 3 teaser and map copy

- [x] 5.1 Add the one-line pointer to World 6 in `theory-loose-leash` and `theory-slack-u` (`es.md` and `en.md`), keeping word bounds; verify content validation and that no paywall opens from the Lesson.
- [x] 5.2 Update the Coming-soon map copy and i18n keys (World 6 playable, World 7 first Coming-soon, "Más próximamente" for Worlds 7-9); verify `WorldMapScreen.test.tsx` and fix any test that names World 6 as coming soon.
- [x] 5.3 The glossary terms (Check-in, Go Sniff, Unpredictable Walk, Image Duel) are already written; verify the new content uses them consistently.

## 6. Release

- [ ] 6.1 Promote beta to stable, run `npm run release:prepare` and the content release check; verify baseline parity passes.
- [ ] 6.2 Bump `contentVersion` and set `minAppVersion`; run the full test suite; verify green and that the app starts with the World 6 trail visible to a Plus user who has completed World 5.
- [ ] 6.3 Publish the beta pack and play World 6 end to end in EN and ES on a device or emulator; verify the duel, the Stage, the Mission brief and the World 3 teaser.
