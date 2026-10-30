# Tasks

## 1. Multi-question Checkpoint with shuffled options

- [x] 1.1 In `src/shell/nodes/node.ts`, make `NodeDef.checkpoint` a `CheckpointQuestion[]` with an `explanation` key per question, add `question: number` and `checkpoint: CheckpointAnswer[]` to `NodeRun`, and make `advance` step through questions on `answer`/`timeout` before `simulation`; verify `node.test.ts` covers three answers in order, a timeout mid-quiz, the last answer starting the simulation and out-of-step actions being ignored
- [x] 1.2 Add a pure `shuffledOrder(n, random)` (Fisher-Yates) and verify with a seeded random that it is a permutation and that, over many runs, the correct option lands in every position
- [x] 1.3 Update `recapCheckpoint()` in `src/shell/nodes/content.ts` to build three questions from `node.<slug>.tq<n>.{question,right,wrong1,wrong2,why}` and give `INTRO_NODE` an explanation key; rename existing `tq.*` keys to `tq1.*`; verify `catalog-usage.test.ts` and `introNode.test.ts` pass
- [x] 1.4 Author questions 2 and 3 plus every `why` explanation for all 11 trail Node slugs in `es.trail.ts`, each testing a different point of its Lesson with plausible, similar-length distractors (per `docs/content/lesson-guide.md`, task 3.1); verify by a test that every trail Node has 3 questions of 3 options with exactly one correct
- [x] 1.5 In `CheckpointScreen` (`NodeScreens.tsx`), show "n de 3" progress, render options in the memoised shuffled order mapped back to authored indices, and restart the countdown per question; verify in the running app (`/run`) that the right answer moves between positions across replays and the timer resets each question
- [x] 1.6 Replace the Debrief checkpoint line with the score ("Preguntas: n de N") and a list of missed/timed-out questions with right answer and explanation; add the catalog keys; verify in the app with one wrong and one timed-out answer, and that an all-correct run shows no list

## 2. Lesson pattern blocks and reading time

- [x] 2.1 Add `steps`, `example`, `compare` and `takeaways` to the `LessonBlock` union in `src/shell/lessons/lesson.ts` and render them in `LessonBlocks.tsx` with design tokens only (numbered list with list a11y role, set-apart example panel, do/don't with check/cross icons and labels that stack at 320 pt, bulleted takeaways); verify `noRawColors.test.ts` and `ui.test.ts` pass and check the Lesson screen at 320 pt and with reduced motion on
- [x] 2.2 Add a `theoryLesson(id, spec)` factory in `src/shell/lessons/content.ts` that emits the canonical order (hook, why, image, steps, example, image/compare, video?, today tip, takeaways); verify a unit test asserts the block order it produces
- [x] 2.3 Remove `minutes` from `LessonDef` and add `readingMinutes(lesson, t)` to `libraryText.ts` (180 wpm + 10 s/image + 30 s/video, ceil, min 1) and use it on Library cards; verify `libraryText.test.ts` covers the 450-word, two-image example and a Lesson whose text grows

## 3. Content guide and conformance test

- [x] 3.1 Write `docs/content/lesson-guide.md` (voice, reward-based/LIMA method rules, the pattern, word bounds, worked-example recipe, shot-list format, Checkpoint authoring rules); verify it is linked from `README.md`
- [x] 3.2 Add a conformance test over theory Lessons that are not `placeholder`: pattern order, 350-700 Spanish words, ≥2 images, ≥3 steps, ≥2 takeaways, every image name present in the art registry, and no `placeholder` flag on any of their image blocks; verify it passes on an empty set and fails on a deliberately thin fixture

## 4. Illustration pipeline

- [x] 4.1 Build the kit in `scripts/art/lessons/_kit/` (Dog poses, Person poses, leash shapes, props, check/cross badges, ground) from the existing `lessonArt.tsx` Dog and the app icon, using only `tokens.json` colours; verify a kit preview sheet renders every symbol
- [x] 4.2 Write `scripts/render-lesson-art.mjs`: inline `<use>` symbols, reject non-palette colours and any `<text>`, render each SVG to `assets/lessons/<name>.png` at 1280×720, generate `src/shell/lessons/lessonArtRegistry.ts`, and fail above a 6 MB total; verify by running it on a sample SVG and on one with a forbidden colour
- [x] 4.3 Write `scripts/lesson-art-sheet.mjs` that renders all images with name, caption and a 320-pt copy into one review page; verify it opens with the sample image
- [x] 4.4 Make `LessonImage` resolve bundled names through the registry before remote URLs and the placeholder, and let Primer `NodeMedia` name bundled art (`MediaPlaceholder` path); verify `media.test.ts` covers registry hit, unknown name and offline, and a recap card shows its art with no placeholder badge
- [x] 4.5 Write `scripts/capture-controls.mjs` with a capture list for the 4 How-to-play Lessons (10 controls), seeded, with highlight ring and arrow overlay, output through the same PNG + registry path; verify all 10 captures render and appear on the contact sheet

## 5. Pilot Lessons (lock style and brief)

- [x] 5.1 Rewrite `calm-leash` (Day 1) and `theory-poste` with `theoryLesson`: shot list, full Spanish text, 2-4 illustrations, Checkpoint questions where the Lesson precedes a Node; verify they pass the conformance test with `placeholder` removed and look right on the contact sheet and in the app at 320 pt
- [x] 5.2 Freeze the per-Lesson subagent brief (inputs: guide, kit, existing Lesson text, Node Checkpoint keys; outputs: shot list, catalog text, SVGs, rendered PNGs it has looked at, Checkpoint questions) in `docs/content/lesson-guide.md`; verify the brief reproduces the pilot's quality on a dry run of one more Lesson

## 6. Remaining Lessons (fan-out)

- [x] 6.1 Rewrite the other 4 first-week Lessons (`body-language`, `smile-leash`, `marking-rewarding`, `sniffing-decompression`) using one subagent per Lesson in parallel worktrees; verify each passes the conformance test and the contact-sheet review
- [x] 6.2 Rewrite the World 1-2 trail theory Lessons (`theory-harness`, `theory-doorbell`, `theory-loose-leash`, `theory-blind-corner`, `theory-slack-u`) the same way, keeping each Node's Checkpoint aligned with its Lesson; verify conformance, contact sheet and Checkpoint questions reference the rewritten text
- [x] 6.3 Rewrite the World 3-4 trail theory Lessons (`theory-leave-it`, `theory-visual-shields`, `theory-choosing-cue`, `theory-long-leash`, `theory-park-mix`) the same way; verify as in 6.2
- [x] 6.4 Point every Primer recap card's media at its Lesson's bundled art and review `lessonMedia.ts` stand-in videos for relevance (keep the badge on any stand-in); verify no Primer card shows the pending placeholder
- [x] 6.5 Human review pass of all 15 theory Lessons for training accuracy and tone; remove `placeholder` only from reviewed Lessons; verify the Library shows no placeholder badge on reviewed Lessons

## 7. Integration checks

- [x] 7.1 Run `npm test`, typecheck and lint; verify all green
- [x] 7.2 Play through onboarding, one World 1 Node and one World 3 Node in the app (`/run`), offline for the Lesson part; verify Lessons render fully offline, reading times look plausible, the Checkpoint asks 3 shuffled questions and the Debrief explains misses

## Workflow follow-up

- Archive the change with `/opsx:archive` after review, syncing the `theory-lessons`, `training-node-loop`, `remote-media-content` deltas and the new `lesson-illustrations` spec.
