# Proposal

## Why

Reading the Dog's body language is the skill the app teaches, but on the walk view the user cannot see it. The walking Dog is a Kenney Cube Pet render with only `idle`, `walk`, `run` and `eat` clips: it has no tail, ear or head-turn poses, and at the walk camera's zoom it is roughly 30-40 px tall on a phone. Today its state is shown only through overlay icons (a "?" when Alert, a blue eye on a look, grey dots when sniffing). The planned rework of the Unpredictable Walk Stage (`rethink-unpredictable-walk-stage`) depends on the user noticing a Dog that turns its head away, plants, lifts a leg or drops its tail.

## What Changes

- **New walking Dog sprite (A).** Replace the Cube Pet with a rigged dog model rendered to the same 8 isometric directions by the existing pipeline (`scripts/kenney/render-sprites.mjs`, `pack-sprites.py`). New poses readable as a silhouette: head toward or away from the Handler, nose down sniffing, planted, leg lifted (marking), tail up / neutral / tucked, wagging, trot and slow sniffing walk. Dog coats keep working.
- **Dog portrait (B).** A Dog portrait in the HUD during walking Stages that shows a large, detailed close-up of the Dog's current state: ears, tail (wag, neutral, tucked), eyes looking left, right or at the Handler, nose working, relaxed, alert or strained. It extends the art style of the close-view Dog (`dog_close_*` frames) with new postures, and is driven by the same derived pose as the walking sprite.
- **A richer derived pose.** `DogPose` (`src/hud/pose.ts`) grows from tier/head/bark/lunge/trot flags to also describe gaze direction, tail state, ear state and actions (sniffing, planted, marking), derived from the simulation without changing it.
- **Spike first.** Before committing, find a rigged dog model with a licence that allows shipping (CC0 preferred, like the Kenney art), render one test pose through the pipeline, and check atlas size and draw cost against the power budget.
- Camera zoom-ins on key moments (option C) are out of scope, to be reconsidered after playtests.

## Capabilities

### New Capabilities
- `canine-posture`: what Dog states the user can see during a walking Stage (gaze, tail, ears, nose, planted, marking), on both the walking sprite and the Dog portrait, and how they map from the simulation.

### Modified Capabilities
None. The larger atlas and the Dog portrait must fit the existing `power-efficiency` requirements (frame cap, HUD redraws only on visible change, energy budget, scenario regression check); this is verified by tasks, not by changing those requirements.

## Impact

- **Art**: new 3D dog model and its animations; new rendered atlas frames (states x 8 directions x frames); new close-up portrait postures, drawn in the LeadMate Design System canvas.
- **Code**: `scripts/kenney/*` render pipeline, `bundle/src/sprites.ts`, `bundle/src/StageScene.ts` (actor drawing, overlay icons), `src/hud/pose.ts`, HUD layout (`src/hud/layout.ts`) for the Dog portrait's place on every screen size.
- **Performance**: atlas memory and per-frame draw cost on low-end Android.
- **Dependencies**: none on other changes. `rethink-unpredictable-walk-stage` depends on this one.
