# Proposal

## Why

World 6, "The Park and Recall", is a Plus Preview World with no Stops: it shows "Próximamente" and promises 4 walks. Plus users who finish World 5 hit a dead end. Recall also rests on a skill the app has never taught: a dog that chooses its handler over a busy park. Predictable, autopilot walks make dogs tune out, and unpredictable ones rebuild focus. That is the foundation to teach before recall.

## What Changes

This change is the first slice of World 6. It covers only what the simulator can already do. Stretches 2-4 need new simulator mechanics (a recall cue, a Dog released at a distance, a Dog that plays) and move to a follow-up change.

- Add **Stretch 1, unpredictable walks**, to World 6: two Lessons (`theory-unpredictable-walks`, `howto-yield-pressure`), a Stage Node and a Mission. It covers why predictable walks lose the dog, a 5-minute drill to give way to light leash pressure, sudden turns, pace changes and stops, "Let's Go" vs Go Sniff, and rewarding Check-ins.
- Score the Stage with existing measures (Rigid Pull and Check-in counts) and exempt it from Sintonía. This scoring is **provisional**: it was judged not fun enough and is parked in `rethink-unpredictable-walk-stage`.
- Add a new Checkpoint question kind, the **Image Duel**: two stacked wordless images, the user taps the better one, the order is shuffled, and the verdict is shown only after answering. It requires a Content Pack format change and a `minAppVersion` bump.
- Add a forward-pointing teaser to the World 3 Lessons (loose leash and slack U), saying the idea of making walks unpredictable comes back in World 6.
- Use each language's own cue words: "Vamos" and "Olfatea" in Spanish, "Let's Go" and "Go Sniff" in English.
- Author all new text in Spanish and English, in `content/beta/` first, then promote to stable.
- Produce the Stretch 1 art, about 12-15 wordless illustrations, in Claude Design and export it as PNG (SVG if the trial export allows it).
- Update the glossary: Check-in, Image Duel and Unpredictable Walk are new, and Go Sniff is widened (done).
- World 6 ships **playable with one Stretch**. Passing its Mission completes it, a map note says more Stretches are coming, and a World that later grows reopens for the new Stretches without relocking the next World.

## Capabilities

### New Capabilities
- `recall-world`: World 6 and its first Stretch, unpredictable walks, with the method rules and the World 3 teaser. Stretches 2-4 are added to it by the follow-up change.
- `image-duel-checkpoint`: the two-image Checkpoint question kind, its pack format, shuffle, accessibility and after-answer feedback.

### Modified Capabilities
- `world-progression`: World 6 may hold one Stretch, and a completed World can reopen when it grows.
- `world-map-screen`: Coming-soon scenarios and the "Más próximamente" card move to Worlds 7-9, and a World with more Stretches coming shows a note.

## Impact

- **Content**: `content/beta/worlds/recall.yaml` and `recall/{es,en}.md`; new Lesson, Node and Mission folders for Stretch 1; edits to the World 3 Lessons' `es.md` and `en.md`; promotion to stable.
- **Code**: `src/shell/content/schema.ts`, the validator, the Checkpoint UI, `FORMAT.md` and its generated tables; the i18n keys `world.recall.*`; tests (progression, map, content validation).
- **Release**: `minAppVersion` bump, `contentVersion` bump.
- **Art**: Claude Design canvas export into each item's `media/` folder.
- **Specs**: the two new capabilities and the two deltas.
- **Follow-ups**: Stretches 2-4 (new simulator work) and `rethink-unpredictable-walk-stage`.
