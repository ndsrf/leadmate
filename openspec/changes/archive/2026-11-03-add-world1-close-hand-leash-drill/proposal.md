# Proposal

## Why

World 1 is only theory Lessons and choose-the-action Nodes. The first real-time, playable simulation is the narrow-street close view in World 4, reached only after three Worlds, so a new user can finish most of their first sessions without playing anything. That makes LeadMate look like a quiz app. The close view already has the mechanics a mouthy-puppy drill needs (gather the leash, hold steady, mark, release, reward), so it can be brought into the first minutes of World 1.

## What Changes

- Add a close-view Node, the Hand Drill, to World 1, Basics Stretch 1 ("Tu perro es un perro") as the Stretch's first Node, before `dog-as-dog`. It needs only the how-to-play Lesson read, not every Lesson of the Stretch, so a user plays it within the first minutes. It is a "calm hands and leash" drill: a hand is offered to the Dog, the Handler gathers the leash to keep it out of mouthing range, holds steady until the Dog settles, marks calm and releases for a reward.
- Add a `hand` Distractor kind and a stationary near-Handler Distractor to the close simulation, alongside the existing approaching-dog Distractor. The shielding control is not offered in this scheme.
- Make the drill no-fail: a lunge costs Debrief score and never ends the run; there is no correction, no "No" and no leash lift. The Node counts as complete when its Debrief is reached.
- Tailor the drill by the Dog's `ageBand` through copy and config values only (puppy gets the mouthing-hands framing and a toy reward; other bands get the same mechanics with different copy and tuning; unknown age gets neutral copy). No per-age art.
- Add first-run Coach marks to the close view (Gather, Poste, Marker), shown once and non-blocking, because a World 1 user has not met these controls.
- A skipped simulation (pause menu) completes the Node, as for every other simulation Node. The Stretch's Mission needs both Nodes.
- Make the biting Lessons (`theory-bite-owner`, `theory-bite-others`) and Missions point to this Node. The biting Home Stretches stay without an exercise of their own.
- Out of scope: the guarding / "drop it" technique (the second source video), ear-tugging and rough-handling segments, per-age sprites, and any new bite-training exercise inside a biting Home Stretch.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `close-leash-exercises`: adds the hand Distractor and its stationary encounter, a no-fail pass/score rule, and the gentle first-run configuration with age-band tailoring.
- `first-run-coaching`: extends Coach marks from the walking Stage to the close view controls.
- `dog-basics-world`: adds the close-view Node to Basics Stretch 1, with an exception to "a Node needs every Lesson of its Stretch", and relaxes the "basics come before any leash work" purpose to allow this indoor hand-and-leash drill.
- `home-behaviour-training`: biting Lessons and Missions reference the Node; the rule that the biting Home Stretches have no exercise of their own is kept and clarified.

## Impact

- `src/sim/closeExercise.ts`, `src/sim/learning.ts` (new `hand` Distractor kind; check Trigger Profile consumers), `src/sim/payload.ts`: stationary-Distractor encounter and no-fail result handling.
- `bundle/src/CloseExerciseScene.ts`, `bundle/src/sprites.ts`: hand Distractor and puppy/toy reward visuals using existing art.
- `src/hud/coach.ts`, `src/shell/onboarding/hints.ts`, `src/shell/Overlays.tsx`: close-view Coach marks.
- `src/shell/nodes/content.ts`, `scenarios.ts`, `src/shell/world.ts`, `src/shell/missions/content.ts`: new Node, scenario config, trail placement and prerequisites, including the per-Dog World 1 ordering.
- `src/i18n/es.ts`, `es.trail.ts`, lesson content for the biting Lessons: new copy, age-band variants.
