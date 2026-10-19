# Proposal

## Why

Once the core leash mechanic is validated (`base-leadmate`), the product needs structure and depth: lessons around the simulation, a dog that learns, and richer handling tools. Phase 2 of 4.

## What Changes

- Add the 4-step training node (Theory, 5 s Checkpoint, Interactive Simulation, Debrief) with static and 2.5D walking modes.
- Add the persistent dog learning model: arousal formula, anti-punitive "Rusty Dog" warm-up, visual evolution.
- Make the Dog's follow chance after a turn and its check-in frequency evolve from the user's marks (replacing the fixed values from `base-leadmate`).
- Add practice nodes for techniques players cannot discover on their own, starting with the Poste (playtest finding from `base-leadmate`).
- Add equipment (collar vs. Y-harness) affecting arousal.
- Add the proactive Cue, voice packs (per language) and custom recorded cues.
- Extend the telemetry payload with `peakArousalScore` and add the Cue button to the HUD (modifies `simulation-telemetry` and `leash-physics`).

## Capabilities

### New Capabilities
- `training-node-loop`: 4-step node structure with static and walking modes.
- `dog-learning-model`: Persistent attributes, arousal formula, Rusty Dog, visual evolution.
- `equipment-physics`: Collar vs. Y-harness effect on arousal.
- `voice-cues`: Cue button, voice packs per language, custom cues.

### Modified Capabilities
- `simulation-telemetry`: add `peakArousalScore` (0-100) to the payload.
- `leash-physics`: HUD adds the Cue button under the right thumb.

## Impact

- Depends on `base-leadmate` being archived. Voice packs must hold one set of Cues per supported language. Adds node state machine, local persistence, expo-audio. Design and tasks are still to be written.
