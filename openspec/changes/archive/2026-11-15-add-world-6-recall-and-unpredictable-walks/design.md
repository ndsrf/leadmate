# Design

## Context

- World 6 is `content/*/worlds/recall.yaml` with `preview: true`, `nodeCount: 4` and `stretches: []`. World scenery for it already exists and is keyed by world id, so no map scenery work is needed.
- Content lives in channels. Authors work in `content/beta/` (contentVersion 4), then `content:promote` copies to `content/stable/` (contentVersion 2, bundled as the baseline, parity checked by `content:release-check` per ADR 0028).
- A Checkpoint question is `{ question, options[{text, correct}], explanation }`, text only, rendered in `NodeScreens.tsx` and validated in `src/shell/content/validator.ts`.
- Lesson art is wordless SVG built from a shared kit, rendered by `scripts/render-lesson-art.mjs`, palette-checked against `tokens.json`. Right and wrong is shown by badges.
- A Mission is one target checked on a later day. Each Stretch ends in exactly one Mission and trains one technique.

## Goals / Non-Goals

**Goals:**
- Ship World 6 as four playable Stretches in ES and EN through the existing pack flow.
- Add the image duel as a Checkpoint question kind that older apps cannot mis-render.
- Produce all art in Claude Design, to the existing art rules, with one image set for both languages.

**Non-Goals:**
- No new simulator mechanics. The Stage reuses existing scenario parameters (waypoints, `checkInFrequency`, Go Sniff, cues).
- No Stretches 2-4 in this change, and no better Stage scoring: both are follow-ups.
- No standalone image-duel Minigame Node, no other new question kinds, no 7-day plan.
- No change to Worlds 7-9 content or to Plus pricing and gating.

## Decisions

1. **Unpredictability is Stretch 1 of World 6, not World 3.** It is the engagement base for recall and keeps the Free path unchanged. World 3 only gets a one-line forward pointer in `theory-loose-leash` and `theory-slack-u`. *Alternative:* teach it in World 3. Rejected: it would grow the Free path and overlap its slack-U content.
2. **Two Lessons for Stretch 1.** The 350-700 word Lesson bound cannot hold the six topics, so `theory-unpredictable-walks` carries the why, direction/pace/stop drills, "Let's Go" vs "Go Sniff", and the do/don't mistakes. `howto-yield-pressure` carries the short pre-walk drill and the mark-and-reward steps, and links to the existing `marking-rewarding` Lesson instead of repeating it. *Alternative:* one long Lesson. Rejected: breaks the word bounds.
3. **Image duel is a Checkpoint question variant.** The question gets a kind discriminator with two image references, a correct index and an explanation; the text kind stays the default so existing packs are untouched. It then appears in any Node's Checkpoint without a new Node mode. The renderer shuffles top/bottom per presentation, and verdict badges render only after the answer. *Alternative:* a standalone Minigame Node. Deferred until engagement is measured.
4. **Duel art carries no badges and no words.** The badge components from the Lesson art kit are reused by the UI layer after answering, not baked into the images. This keeps the answer hidden and one image set serving both languages. Alt text per image is localized.
5. **Compatibility via `minAppVersion`.** A pack using duels sets `minAppVersion` to the app version that ships the renderer. Older apps keep their bundled baseline. `formatVersion` stays 1 because the change is additive. The stable baseline is regenerated with `release:prepare` when promoted.
6. **Stage design for Stretch 1 (provisional).** A Node in the park theme with zig-zag waypoints so the Handler must change direction. It is scored with existing measures (Rigid Pull and Check-in counts) and exempt from Sintonía, whose rule against reversals above 90° within 0.5 s would punish the very U-turns being taught. Go Sniff and "Let's Go" are both offered. The scoring was judged not fun enough and is parked in the stub change `rethink-unpredictable-walk-stage`; this Node ships as an interim. *Alternative:* a new turn-quality metric. Rejected here: it needs new simulator work.

10. **Scope split by simulator capability.** The simulator has only the `lets-go` and `leave-it` cues and no released-Dog or playing-Dog mechanics, so recall (Stretch 3) and play (Stretch 4) need new mechanics, and check-ins at distance (Stretch 2) is unconfirmed. This change ships Stretch 1 only; Stretches 2-4 are a follow-up change that owns that simulator work.

12. **World 6 ships playable with one Stretch.** The map shows a note that more Stretches are coming, and passing the Mission completes the World. World 7 is Coming-soon, so it gates nothing. A World that grows after completion reopens for the new Stretches, keeps done Stops done and does not relock the next World. *Alternative:* keep World 6 a Preview until all Stretches exist. Rejected: Plus users would wait for content that is ready.

11. **Terminology and cue words.** "Check-in" means the Dog's glance at the Handler; the user's report on a real walk is always "Mission check-in". Go Sniff is widened in the glossary to the release Cue usable at any time on a real walk. Text uses each language's cue words ("Vamos", "Olfatea" in Spanish; "Let's Go", "Go Sniff" in English).
7. **Art pipeline.** Claude Design (the LeadMate Design System canvas) is used to draw the new kit symbols (long line, park props, second dog) and each scene at 640x360 under the palette rules. Each artboard is exported to SVG or PNG into the owning item's `media/`. How the canvas exports is confirmed first with one trial image.
8. **Content authored in beta, promoted once.** All new folders are created under `content/beta/`, validated with `npm run content:validate -- --channel beta`, promoted at the end. Unfinished art may use the existing placeholder flag while Lessons are drafted.
9. **Roadmap shift.** World 6 becomes playable, so map copy referring to "Worlds 6-9" and the i18n planned-walk strings move to Worlds 7-9.

## Risks / Trade-offs

- [Pressure drill read as a physical correction] → Wording reviewed against the method rules (light tension, released at once, no pulling); explicitly in the specs and a review task.
- [Recall off-leash is unsafe] → All recall steps use a long line in a safe or fenced area, never near roads, and every Lesson gives an exit. Local leash rules mentioned.
- [Claude Design export not matching the SVG kit rules] → One trial image first. Fall back to PNG export validated by eye, since the art checks only run on SVG.
- [~35-40 images is large] → Reuse the kit, pair-style duel images share a scene; generate per Stretch so content can ship in slices.
- [Timed Checkpoint is tight for two-image questions] → Keep the existing configurable timer; check legibility at the default 15 s and extend the default for duel questions only if playtesting says so.
- [A completed World 6 reopens when Stretches are added later, which some users may find surprising] → The map note sets the expectation, the new Stretch is clearly marked, and World 7 never relocks.
- [Spec drift] → Map scenarios and progression text are updated in this change so tests stay truthful.

## Migration Plan

1. Land the image-duel code, tests and `FORMAT.md` tables behind a new app version.
2. Author World 6 and the World 3 teasers in `content/beta/`; validate.
3. Promote, run `release:prepare`, bump `contentVersion` and `minAppVersion`, publish.
4. Rollback: re-promote the previous stable and set `recall.yaml` back to `preview: true`; user progress stays valid because ids are permanent.

## Open Questions

- The default timer for duel questions: 15 s, like the other questions, unless playtests disagree.
- Each Checkpoint holds one Image Duel and two text questions.
