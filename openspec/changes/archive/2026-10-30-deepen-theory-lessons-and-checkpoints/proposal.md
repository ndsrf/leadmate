# Proposal

## Why

The theory Lessons are too thin to teach anything: each one is a heading, two short paragraphs (~60 words), one placeholder illustration and a tip, all flagged "placeholder". They tell the user *what* to do but not *why it works*, *how to do it step by step*, or *what it looks like on a real walk*, so the app's core promise (transferring technique to the real dog) rests on content that cannot carry it. The Checkpoint that follows asks a single question and always lists the right answer first, so it measures neither understanding nor attention.

## What Changes

- **Lesson pattern.** Every theory Lesson follows one teaching pattern: hook (the problem the user recognises) → why it happens (the behaviour science, in plain words) → illustration → how to do it (numbered steps) → worked example on a real walk → common mistakes (do / don't) → video (where one exists) → "try it today" → key takeaways.
- **New Lesson block types** to express that pattern as data: `steps`, `example`, `compare` (do / don't), `takeaways`. Existing heading, text, image, video and tip stay.
- **Rewritten content** for the 15 theory Lessons (5 first-week, 10 trail), in Spanish, at a depth of roughly 350-600 words each, with at least two illustrations per Lesson (one concept diagram, one scene or do/don't pair).
- **Real illustrations replace placeholders.** Lesson and Primer art becomes bundled images authored as SVG in the existing flat paper-cut style from a shared kit, rendered to PNG by a script, and reviewed on a contact sheet. How-to-play Lessons use real, annotated captures of the controls taken by a script. The placeholder badge disappears from every Lesson whose text and media are final.
- **Reading time is derived** from the Lesson's words instead of hand-set minutes.
- **Multi-question Checkpoint.** Each Node's Checkpoint asks 3 questions (each 3 options) on the theory Lesson before it; the timer applies per question.
- **Shuffled options.** Option order is shuffled every time a question is shown, so the right answer's position carries no signal.
- **Checkpoint feedback teaches.** The Debrief shows the score (e.g. "2 de 3") and, for each question missed or answered wrongly, the right answer with a one-line explanation.
- **Primer media** can name bundled Lesson art, so recap cards show the real illustration instead of a pending placeholder.

## Capabilities

### New Capabilities
- `lesson-illustrations`: how Lesson and Primer illustrations are produced, bundled and verified: a shared art kit and style rules, SVG sources rendered to bundled images, annotated control captures for How-to-play Lessons, and a review contact sheet.

### Modified Capabilities
- `theory-lessons`: the teaching pattern every theory Lesson follows, the new block types, minimum depth and illustration count, derived reading time, and placeholder badges removed from final Lessons.
- `training-node-loop`: the Checkpoint becomes a multi-question quiz with per-question timing, shuffled option order, and explanatory feedback in the Debrief.
- `remote-media-content`: a Primer media item may reference bundled Lesson art, which draws offline without the placeholder.

## Impact

- **Data and logic:** `src/shell/lessons/lesson.ts` (block union, reading time), `src/shell/lessons/content.ts`, `src/shell/nodes/node.ts` (`CheckpointQuestion` → list of questions with explanation; `NodeRun.checkpoint` → per-question answers; `advance`), `src/shell/nodes/content.ts` (`recapCheckpoint`), `src/shell/onboarding/introNode.ts`.
- **UI:** `src/shell/ui/LessonBlocks.tsx` (new blocks), `LessonImage.tsx` / `lessonArt.tsx` (bundled image registry instead of inline SVG scenes), `NodeScreens.tsx` (Checkpoint stepper, Debrief feedback), Primer media rendering. Mission Fixes reuse `LessonBlocks` and gain the new blocks for free.
- **Content:** `src/i18n/es.ts`, `src/i18n/es.trail.ts` — large catalog additions; `src/shell/lessons/lessonMedia.ts` video ids reviewed.
- **Assets and tooling:** new `scripts/art/lessons/` SVG sources and kit, `assets/lessons/*.png`, `scripts/render-lesson-art.mjs`, a capture script for How-to-play controls, and a contact-sheet script. App bundle grows by a few MB of PNGs.
- **Tests:** lesson/content tests (pattern conformance, minimum depth, every image resolves), node tests (multi-question advance, shuffle, timeouts), catalog-usage test.
- **Sync / storage:** none; Checkpoint answers are never persisted and read tracking is unchanged.
