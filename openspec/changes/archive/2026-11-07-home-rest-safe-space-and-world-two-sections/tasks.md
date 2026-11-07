# Tasks

## 1. Lesson content (theory-home-rest)

- [x] 1.1 Edit `content/beta/lessons/theory-home-rest/es.md` (Spanish only; there is no `en.md`): add the whole-house myth and the stand / turn 360 degrees / lie stretched on its side criterion to `## why`, the quiet zone away from busy corridors to step 2 of `## steps`, and rewrite the `## compare` do / dont, `## tip` and `## takeaways` to match. Keep 5 steps and at most 4 takeaways, `why` within 60-110 words, steps 12-30 words, body 350-700 words. Verify: `npm run content:validate -- --channel beta` reports zero errors.
- [x] 1.2 Re-read the two `## images` alt/caption entries in `es.md` and the images in `content/beta/lessons/theory-home-rest/media/`; update the alt/caption text (and, only if an image no longer fits, the media file and `images:` in `lesson.yaml`) so they match the new content. Verify: `npm run content:validate -- --channel beta` passes and the images render in the Lesson on `npm start` (beta channel).
- [x] 1.3 Promote to stable and regenerate the baseline: `npm run content:promote` (validates beta, copies to `content/stable/`, regenerates `src/shell/content/baseline.generated.ts`). Verify: `npm run content:validate -- --channel stable` passes, `git diff` shows changes only in `content/stable/lessons/theory-home-rest/` and `baseline.generated.ts`, and `npx jest src/shell/content src/shell/lessons` passes.

## 2. Sections in the map model

- [x] 2.1 In `src/shell/world.ts` `worldsFor`, for World `home` only, make the sort key put the Home Stretch group (biting or other home) before the threshold group ahead of the `started` element, so Home Stretches are contiguous and precede threshold Stretches. Leave World 1 and other Worlds' keys unchanged. Verify with new tests in `src/shell/world.test.ts`: a Dog with a started threshold Stretch and an unstarted Home Stretch gets the Home Stretch first; the existing "biting first, then plan order" and prerequisite-Node ordering tests still pass.
- [x] 2.2 In `src/shell/mapModel.ts` add `section?: 'dog' | 'more'` to `MapStop` and `sections?: { id: 'dog' | 'more'; firstIndex: number }[]` to `MapWorld`, set only for World `home` (`'dog'` when `homeConcernOfStop` of the Stretch's first Stop is defined, else `'more'`), omitting an empty section. Do not touch states, `done`/`total`, `owed`, `unlockRequirement`, `nextUp` or `stretch` numbering. Verify with new tests in `src/shell/mapModel.test.ts`: Dog with Concerns gets both sections with the right membership and order; no Home Stretch gives only `more`; started-but-removed Concern stays in `dog`; World 2 `done`/`total`/`nextUp` equal the values computed without sections; other Worlds have no sections.

## 3. Sections on the screen

- [x] 3.1 Add the keys `map.section.forDog` ("Para tu perro") and `map.section.moreHome` ("Más cosas de casa") to `src/i18n/es.trail.ts` (or `es.home.ts` if that is where the Home Behaviours map texts live). Verify: `npx jest src/i18n` passes (catalog usage and key parity tests).
- [x] 3.2 In `src/shell/ui/mapLayout.ts` add `SECTION_HEADER_HEIGHT` and a pure helper returning the y offset of a stop index given the section start indexes. Verify with a unit test next to the layout tests (header offsets shift only the Stops after each header; no sections gives `index * ROW_HEIGHT`).
- [x] 3.3 In `src/shell/screens/WorldMapScreen.tsx` `WorldArena`, draw a section header band (accessibility role header, design-system tokens) before the first Stop of each section in `entry.sections`, shift the rows with the helper from 3.2, grow the path container height and the `WorldSceneryBackground` stop count by the headers, keep connectors and "Tramo N" flags on the global index, and use the same helper in the scroll-to-next-up effect. Do not draw sections for collapsed (locked or completed) or preview renderings. Verify: `npm run typecheck`; run the app (`npm start`, beta channel) with a Dog with and without Home Concerns and confirm both layouts, no overlap, a continuous trail across the section break and correct scroll to next-up in World 2.
- [x] 3.4 Check the Home Behaviours section helper `inWorldTwo` in `WorldMapScreen.tsx` and `src/shell/screens/HomeBehavioursSection.tsx` still agree with what "Para tu perro" lists (a Home Stretch is in one or the other, never both). Verify with an extra assertion in `src/shell/homeBehaviours.test.ts` or `mapModel.test.ts`.

## 4. Validation

- [x] 4.1 Run `npm run typecheck`, `npm test` and `npm run content:validate -- --channel stable` and fix failures. Verify: all pass.
- [x] 4.2 Run `openspec validate "home-rest-safe-space-and-world-two-sections"`. Verify: reports the change as valid.
