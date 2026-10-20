# Tasks

## 1. Learning state and persistence (`dog-learning-model`)

- [x] 1.1 Define the typed `LearningSnapshot` (Learning Attributes, Trigger Profile, Equipment, session capacity multiplier) in `src/sim`, add it to the Stage config, and verify a replay with the same seed, inputs and snapshot gives the same payload
- [x] 1.2 Implement the pure `updateLearning(attributes, payload)` in the shell with milestone floors, the per-run setback cap and the `peakArousalScore` gain, and verify unit tests for success, a poor run, the floor and that a Minigame leaves attributes unchanged
- [x] 1.3 Implement the versioned local Dog record (attributes, Trigger Profile, Equipment, Voice Pack, Checkpoint setting, completed Nodes, last Stage date, custom Cue references) and verify it survives an app restart and that absence changes nothing
- [x] 1.4 Implement the Rusty Dog gap check (3 days), the 30-45 s ungraded warm-up and the session-only capacity multiplier when skipped, and verify tests for completed, skipped and no-gap cases
- [x] 1.5 Implement the three visual posture stages (33% and 66% of average attribute progress, never regressing) and verify tests for the thresholds and no regression

## 2. Arousal and Fixation (`dog-learning-model`, `dog-drives`)

- [x] 2.1 Implement the Arousal meter (0-100, starts at 0, decay, clamp) and the formula with the Trigger Profile factor, and verify tests that halving the distance doubles ΔArousal and that Arousal does not persist between Stages
- [x] 2.2 Replace trigger-radius Fixation with Arousal reaching `reactivityThreshold` (radius limits who affects Arousal), keep Arousal rising during Fixation, lower it at Disengagement and by the Marker-hit amount, and verify the existing Fixation and Reward Window tests are updated and pass, plus a lower threshold reacting from farther away
- [x] 2.3 Apply the persisted `followChance` and `checkInFrequency` in place of the fixed values and raise them from `followMarks` and Check-in hits, and verify tests that marked follows raise the chance across Stages

## 3. Trigger Profile (`dog-trigger-profile`)

- [x] 3.1 Implement levels 0-3 per Distractor kind (factors 0 / 0.5 / 1.0 / 1.5) as a Stage input, and verify level 0 adds no Arousal and a replay with the same profile gives the same payload
- [x] 3.2 Implement lowering a level after repeated calm Disengagements and never raising it, and verify tests for lowering, a poor run and absence
- [x] 3.3 Add the Trigger Profile editor to settings and verify an edit applies to the next Stage; leave the questionnaire to `onboarding-and-accounts`

## 4. Equipment (`equipment-physics`, `leash-physics`)

- [x] 4.1 Implement the Equipment profiles (collar: Rigid Pull ×1.5, signal response ×1.2, Poste jolt ×1.0; harness: ×1.0, ×0.8, ×0.4) applied at Stage start with the stored attributes untouched, and verify tests for the Rigid Pull rate and the Taut correction strength
- [x] 4.2 Implement the abrupt-stop measure in `leash-physics` and the one-time Arousal bump with the smooth-stop reduction, and verify tests for abrupt, smooth, collar and harness
- [x] 4.3 Add Equipment selection (onboarding value, flat collar fallback) and change in settings, and verify the next Stage uses the new profile
- [x] 4.4 Show the harsh-stop mention and the neutral trade-off wording in the Debrief and verify the text comes from the catalog

## 5. Cues and audio (`voice-cues`)

- [x] 5.1 Add the Cue button under the right thumb and its desktop key, and verify the layout on a phone and the key in Chrome
- [x] 5.2 Implement the Cue effect in the simulation (reorient before Fixation, about 30% after, 3 s cooldown, diminishing repeats, signal response by Equipment, 2 s follow boost capped at 0.95 with the seeded draw), and verify unit tests for each branch and that audio timing does not change the outcome
- [x] 5.3 Add the `playCue` bridge message, expo-audio playback in the shell, Voice Packs per language in the catalog and Cue resolution (custom recording for the active language, else the pack), and verify tests for resolution and playback on a phone
- [x] 5.4 Add custom Cue recording (2 s, microphone permission, device-only) with the denied-permission explanation, and verify recording, playback, other-language fallback and the denied case

## 6. Telemetry (`simulation-telemetry`)

- [x] 6.1 Add `peakArousalScore`, `followMarks`, `posteSuccesses` and `harshStops` to `SimulationDebriefPayload`, and verify tests for each field and that the contract is documented in README
- [x] 6.2 Show the peak Arousal in the results as "how worked up your dog got" and verify it appears with the catalog text

## 7. Node loop (`training-node-loop`)

- [x] 7.1 Define the Node data shape (mode, Primer cards, Checkpoint, simulation config, exercises, prerequisites) and the prerequisite check, and verify tests for met and unmet prerequisites
- [x] 7.2 Implement the Node state machine (Primer, Checkpoint, Interactive Simulation, Debrief, no skipping) with the Checkpoint timer (5 s, 10 s or off in settings) as feedback only, and verify tests for order, timeout and a wrong answer
- [x] 7.3 Implement the Minigame and Stage modes (only a Stage emits the payload and updates the Dog), and verify a Minigame leaves attributes unchanged
- [x] 7.4 Implement the Debrief with results and one exercise chosen by the weakest metric, and verify the choice for Rigid Pull share
- [x] 7.5 Write catalog content and config for the Poste practice Node and one walking Node, make the Poste practice a prerequisite for Poste scenarios (completed when the Debrief is reached, replayable), and add the practice link after two failed Poste attempts; verify in Chrome and on a phone

## 8. Documentation and validation

- [x] 8.1 Add the new terms to the README where relevant and verify `GLOSSARY.md` and ADRs 0003 and 0004 match the implementation
- [x] 8.2 Run the full test suite and a manual play-through in Chrome and on a phone covering a Node, a Cue, an Equipment change and a Rusty Dog return; record playtest findings in `design.md`
