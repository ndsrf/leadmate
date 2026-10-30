# Design

## Context

- Lessons are plain data (`LessonDef` in `src/shell/lessons/lesson.ts`) built by two factories in `src/shell/lessons/content.ts`: `FIRST_WEEK_LESSONS` (5) and `theory()` / `howToPlay()` for the trail (10 theory, 4 How-to-play). Every theory Lesson is the same six blocks: heading, p1, image, p2, (video), tip. All text is in `src/i18n/es.ts` / `es.trail.ts`; Spanish is the only catalog.
- `minutes` is hand-set per Lesson and already inaccurate for ~60-word bodies.
- Illustrations are 5 inline `react-native-svg` scenes in `src/shell/ui/lessonArt.tsx`, reused across Lessons (e.g. `theory-blind-corner` and `theory-poste` both show `leash`). How-to-play images (`howto/<id>/<n>`) resolve to nothing and show the placeholder. Primer recap media uses `url: ''` and always shows the placeholder.
- Checkpoint: `NodeDef.checkpoint` is one `CheckpointQuestion`; `recapCheckpoint()` always authors `right, wrong1, wrong2` and `CheckpointScreen` renders options in authored order, hence "the right answer is always first". `NodeRun.checkpoint` is a single `CheckpointAnswer` used only by the Debrief line `results.checkpoint.<answer>`.
- Mission Fixes reuse `LessonBlocks`, so any new block type is available to them.
- Constraints: offline-first (ADR 0008), no raw colours in UI code (`noRawColors.test.ts`), 320 pt minimum width, reduced motion, Expo web + native.

## Goals / Non-Goals

**Goals:**
- A single teaching pattern, enforced by tests, that content authors fill in.
- A repeatable illustration pipeline that produces on-style art fast, can be parallelised, and keeps editable sources in the repo.
- A Checkpoint that measures understanding and teaches through its feedback.

**Non-Goals:**
- New languages (content stays Spanish; images are word-free so a future language costs only catalog work).
- Replacing the stand-in YouTube videos with original footage (reviewed for relevance only).
- Rewriting the Primer recap cards beyond pointing their media at the new art.
- Persisting Checkpoint answers or feeding them into Learning Attributes.
- A lesson authoring CMS or remote content delivery.

## Decisions

### 1. Pattern as new block types, not a fixed Lesson template

Add `steps` (`items: TextKey[]`), `example` (`title`, `text`), `compare` (`do`, `dont`: each `{ text: TextKey; art?: string }`) and `takeaways` (`items: TextKey[]`) to the `LessonBlock` union. A `theoryLesson(id, spec)` factory builds the canonical order from per-section keys (`hook`, `why`, `steps.n`, `example.*`, `do`, `dont`, `today`, `takeaway.n`, images), so most Lessons are a few lines of data and the order is guaranteed.

*Alternative:* one rigid `TheoryLessonDef` shape with named fields. Rejected: Fixes and How-to-play would need their own renderers, and a Lesson that needs two diagrams or no video would fight the shape. Blocks keep one renderer and the factory gives the pattern.

Conformance (order, word bounds 350-700, ≥2 images, ≥3 steps, ≥2 takeaways) is a unit test over `LESSONS` that resolves keys through the Spanish catalog, so a thin Lesson fails CI rather than review.

### 2. Reading time computed from the catalog

Drop `minutes` from `LessonDef`; add `readingMinutes(lesson, t)` in `libraryText.ts`: words of all text-bearing blocks / 180 wpm + 10 s per image + 30 s per video, ceil, min 1. It takes `t`, so it follows the active language. Fixes never showed minutes, so nothing else changes.

### 3. Illustrations: SVG sources from a shared kit, rendered to bundled PNG, authored by parallel subagents

This answers "how should we generate the images?":

- **Format.** Each illustration is an SVG in `scripts/art/lessons/<name>.svg` (viewBox 640×360), rendered by `scripts/render-lesson-art.mjs` (Playwright + local Chrome, same approach as `render-icons.mjs`) to `assets/lessons/<name>.png` at 1280×720. The script also writes `src/shell/lessons/lessonArtRegistry.ts` (`name → require(png)`), so the registry can never drift from the files. `LessonImage` resolves bundled names through the registry, then remote URLs, then the placeholder (unchanged fallback order).
- **Kit.** `scripts/art/lessons/_kit/` holds the reusable pieces as `<symbol>`s, extracted from the existing `lessonArt.tsx` Dog and the app icon: Dog in ~8 poses (walk, sit, down, sniff, pull, look-at-trigger, check-in, jump), Person (stand, walk, still/"poste", crouch with treat), leash (U slack, J slack, taut), harness, mat, door, corner, bike/scooter, other dog, treat, check/cross badges, motion and attention lines, ground strips. The render script inlines `<use>` references so outputs are self-contained. Palette comes from `tokens.json`; the script rejects any colour not in the palette.
- **Shot list first.** Before drawing, each Lesson's content gets a shot list (2-4 images: what single idea each shows, which kit pieces, composition, alt, caption). The shot list is reviewed with the text, because the image must match what the text says.
- **Who draws.** Yes, subagents, but drawing *SVG code*, not prompting a raster image model:
  1. The main session builds the kit and two pilot Lessons end-to-end (text + images) to lock the style and the brief.
  2. Then one subagent per Lesson (≈13 remaining, run in parallel, in worktrees) receives the style brief, the kit, the Lesson text and its shot list. It writes the SVGs, renders them, **looks at its own PNGs** (reads the image) and iterates until they match the shot list and stay legible at 320 pt.
  3. `scripts/lesson-art-sheet.mjs` renders a contact sheet (all images with name, caption and a 320-pt-wide copy) for a single human review pass; fixes go back as targeted edits.
- **Why not AI raster generation** (DALL·E/Imagen/etc. per image): no such tool in the pipeline; the mascot would drift between images; diagrams that must be exact (U vs taut leash, positions at a corner) come out wrong; no editable source; licensing/provenance is murkier. **Why not more inline `react-native-svg` TSX** (today's approach): 40+ scenes in the JS bundle, every colour fights `noRawColors`, and art reviews become code reviews. **Why not `react-native-svg-transformer`**: a new Metro dependency for no gain over PNG at fixed sizes. A professional illustrator can later replace any PNG by name without code changes.

### 4. How-to-play captures by script

`scripts/capture-controls.mjs` drives the web build (as `shot.mjs` / `playtest.mjs` do) into each control's state with a fixed seed, screenshots the game, and composites a highlight ring and arrow (SVG overlay) over the control. Output goes through the same PNG + registry path as the illustrations. The capture list lives next to the script, so a UI change is fixed by re-running it.

### 5. Checkpoint: list of questions, shuffle in the view, grade by authored index

- `NodeDef.checkpoint: CheckpointQuestion[]`; each question gains `explanation: TextKey`. `recapCheckpoint(slug)` builds three from `node.<slug>.tq<n>.{question,right,wrong1,wrong2,why}` (existing `tq.*` keys become `tq1.*`). `INTRO_NODE` keeps one question (funnel pacing) plus an explanation.
- `NodeRun` gains `question: number` and `checkpoint: CheckpointAnswer[]` (one per asked question). `advance` on `answer`/`timeout` appends and moves to the next question, or to `simulation` after the last. The `answer` action still carries the **authored** option index.
- Shuffling lives in `CheckpointScreen`: a pure `shuffledOrder(n, random)` (Fisher-Yates, tested with a seeded random) computes a display permutation, memoised per question index so re-renders do not reorder. The pressed display slot is mapped back to the authored index. The state machine stays deterministic and testable; randomness never enters `node.ts`.
- The countdown is keyed by question index so it restarts per question.
- Debrief: replace the single line with `results.checkpoint.score` ("Preguntas: {n} de {total}") and, when not all correct, a list of missed questions (question, right answer, explanation, "se acabó el tiempo" for timeouts). The activity log is unchanged (answers stay feedback-only).

*Alternative:* shuffle in data at build time. Rejected: still a fixed position per question across sessions, and a learner replaying the Node would memorise positions.

### 6. Content authoring

A short guide, `docs/content/lesson-guide.md`, fixes voice (tú, warm, concrete, no jargon without a gloss), method (reward-based, LIMA; no corrections, leash pops or aversive tools; welfare first, "if in doubt, more distance"), the pattern, word bounds, how to write a worked example (the user's Dog by name, `{name}`, with no word that agrees with its gender; a named place, what the dog does, what you do, what happens), and Checkpoint rules (three different points of the Lesson; distractors are plausible real mistakes from the Lesson's "don't" side, never jokes; equal-ish option lengths so the longest is not a tell). Text for the remaining Lessons can be drafted by the same per-Lesson subagent that draws its images, then reviewed by a person for training accuracy.

## Risks / Trade-offs

- [Subagent art drifts in style] → shared kit symbols, palette whitelist in the render script, pilots before fan-out, one contact-sheet review.
- [Training advice inaccurate or unsafe] → content guide with explicit method rules; human review of every Lesson before its placeholder flag is removed; Lessons stay flagged until reviewed.
- [Bundle size grows] → flat-colour PNGs at 1280×720 are ~40-120 KB; ~45 images ≈ 3-5 MB. Budget asserted by the render script (fail above 6 MB total).
- [Three timed questions lengthen the loop] → 3 × 5 s worst case, still well under the Primer; timer setting applies per question.
- [Catalog keys churn (`tq.*` → `tq1.*`)] → done in one sweep with `catalog-usage.test.ts` catching orphans and missing keys.
- [Captures break when the HUD changes] → one-command regeneration; captures are not checked pixel-for-pixel in CI.

## Migration Plan

No stored data changes: read tracking, stars and the activity log are untouched, and `NodeRun` is in-memory only. Lessons can ship incrementally: a Lesson keeps `placeholder: true` until its text and images are final and reviewed, so partial delivery never shows unreviewed content as final. Rollback is a revert.

## Open Questions

- Which stand-in YouTube videos to keep, swap or drop per Lesson (does not affect the pattern; the video block is optional).
- Whether a professional illustrator later replaces the SVG-rendered art (the name-based registry already allows it).
