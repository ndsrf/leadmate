# Proposal

## Why

Once the core leash mechanic is validated (`base-leadmate`), the product needs structure and depth: lessons around the simulation, a Dog that learns and resembles the owner's real dog, and richer handling tools. Phase 2 of 4.

## What Changes

- Add the 4-step Node (Theory Primer, 5 s Checkpoint, Interactive Simulation, Debrief) with static (Minigame) and walking (Stage) modes, and the Node data shape with prerequisites.
- Add the persistent Dog learning model: Arousal meter and formula, Rusty Dog warm-up, visual evolution.
- Make Fixation come from Arousal instead of a fixed trigger radius (ADR 0004).
- Add the Trigger Profile, a per-Distractor-kind reactivity level that makes the Dog resemble the owner's real dog (the onboarding questionnaire that fills it belongs to `onboarding-and-accounts`).
- Make the Dog's follow chance after a turn and its check-in frequency evolve from the user's marks (replacing the fixed values from `base-leadmate`).
- Add practice Nodes for techniques players cannot discover on their own, starting with the Poste (playtest finding from `base-leadmate`).
- Add Equipment (flat collar vs. Y-harness) as a trade-off: leash-signal response against Arousal during Rigid Pull and at a Poste stop.
- Add the proactive Cue, Voice Packs (per language) and custom recorded Cues.
- Extend the telemetry payload (`peakArousalScore`, `followMarks`, `posteSuccesses`, `harshStops`) and add the Cue button to the HUD.

## Capabilities

### New Capabilities
- `training-node-loop`: 4-step Node structure, Minigame and Stage modes, Node data, practice before technique.
- `dog-learning-model`: Learning Attributes, Arousal, Rusty Dog, visual evolution, snapshot-in/update-out (ADR 0003).
- `dog-trigger-profile`: Per-Distractor-kind reactivity levels.
- `equipment-physics`: Collar vs. Y-harness trade-offs, including the Poste stop.
- `voice-cues`: Cue button, Voice Packs per language, custom Cues.

### Modified Capabilities
- `dog-drives`: Fixation is caused by Arousal reaching the reactivity threshold.
- `simulation-telemetry`: add `peakArousalScore`, `followMarks`, `posteSuccesses` and `harshStops` to the payload.
- `leash-physics`: HUD adds the Cue button under the right thumb; abrupt-stop measure.

## Impact

- Depends on `base-leadmate` being archived. Voice Packs must hold one set of Cues per supported language. Adds a Node state machine, local persistence in the shell (one versioned record per Dog, shaped for the later migration in `onboarding-and-accounts`) and expo-audio. `engagement-and-worlds` consumes the Node data and the Arousal meter. See `design.md` and `tasks.md`.
