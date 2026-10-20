# Design

## Context

Builds on `base-leadmate` (see `docs/adr/0001` and `0002`) and adds `0003` (learning snapshot in, update out) and `0004` (Arousal causes Fixation). Terms follow `GLOSSARY.md`. All numbers below are tunable starting values for playtests.

## Goals / Non-Goals

**Goals:**
- A Dog that changes visibly with the user's handling and resembles the owner's real dog.
- Equipment that is a real trade-off, not a right answer.
- A Node loop that is plain data, ready for remote configs.

**Non-Goals:**
- Accounts, sync, the onboarding questionnaire UI and world progression (other changes). Reactivity audio (`engagement-and-worlds`). More than one Dog.

## Decisions

1. **Snapshot in, update out** (ADR 0003). `StageConfig.learningSnapshot` holds Learning Attributes, Trigger Profile, Equipment and the session capacity multiplier. `updateLearning(attributes, payload) -> attributes` lives in the shell, is pure, and is unit-tested.
2. **Learning Attributes:** four continuous values in 0..1 progress terms: `reconnectionLatency`, `reactivityThreshold`, `followChance`, `checkInFrequency`. Milestone floors at 33% and 66% of each attribute's range once crossed. Per-run setback cap: 10% of the distance to the floor.
3. **Arousal:** 0-100, per Stage. `ΔArousal/s = k × (v / d) × TriggerFactor`, within the trigger radius, plus a Rigid Pull rate × Equipment multiplier. Decay about 3 points/s with no Distractor in range. Marker hit drop about 20. Fixation starts when Arousal reaches `reactivityThreshold` (ADR 0004). Fixation keeps raising Arousal; Disengagement lowers it. Deviation from the earlier wording: the spec's formula uses the Trigger Profile as the multiplier, while the threshold sets the Fixation level, instead of the threshold also scaling the multiplier, to avoid applying one attribute twice.
4. **Trigger Profile:** levels 0-3 give TriggerFactor 0 / 0.5 / 1.0 / 1.5. Lowered by one after several calm Disengagements from that kind; never raised. Questionnaire (child, bicycle, other dog, skateboard, bar setting and so on) is in `onboarding-and-accounts`; settings here allow editing.
5. **Equipment:** flat collar: Rigid Pull rate ×1.5, leash-signal response ×1.2 (Taut corrections, Cues, shorter reconnection), Poste jolt ×1.0. Y-harness: Rigid Pull ×1.0, leash-signal response ×0.8, Poste jolt ×0.4. Poste jolt base is about 15 Arousal points at quick Dog outward speed, ×0.3 when the Handler slowed for at least 0.5 s before the stop. Default comes from onboarding, fallback flat collar. Modifiers apply at Stage start; stored attributes never change.
6. **Rusty Dog:** gap of 3 days since the last Stage. Warm-up of 30-45 s, ungraded, no attribute changes. Skipped: session capacity multiplier about 0.8, nothing stored.
7. **Cue:** effect decided in the simulation at press time; audio is a fire-and-forget message to the shell (expo-audio). Cooldown about 3 s, diminishing repeat effect while the Dog already looks at the Handler, about 30% effect after Fixation, no budget. Follow boost within 2 s, additive, capped at about 0.95, same seeded draw as the base follow.
8. **Voice Packs and custom Cues:** the shell resolves the file: custom recording for the active language, else the pack's Cue in the active language. Recordings are up to 2 s, device-only and not synced yet.
9. **Persistence:** one versioned local record per Dog in the shell (Learning Attributes, Trigger Profile, Equipment, Voice Pack, Checkpoint setting, completed Nodes, last Stage date, custom Cue file references). `onboarding-and-accounts` migrates it on registration. One Dog for now.
10. **Visual evolution:** three postures at 33% and 66% of the average attribute progress, first reachable in about three Stages, never regressing. Visual only; revisit after playtests.
11. **Node data:** `{ id, mode: 'stage'|'minigame', primerCards, checkpoint, simulation, exercises[{metric, key}], prerequisites[] }`. Text comes from the localization catalog. The Debrief picks the exercise for the weakest metric. Initial content: the Poste practice Node and one walking Node.
12. **Checkpoint:** 5 s by default, setting for 10 s or off. Answer is Debrief feedback only.
13. **Payload additions:** `peakArousalScore`, `followMarks`, `posteSuccesses`, `harshStops`. A Poste success is a stop at the leash limit during which a Fixation ended in Disengagement.

## Risks / Trade-offs

- Two systems shape reactions (Learning Attributes and Trigger Profile); tuning needs playtests to avoid a Dog that feels random.
- Equipment numbers may over- or under-reward each choice; the Debrief wording must stay neutral.
- Local-only persistence loses data on reinstall until accounts exist.

## Implementation notes

Decisions made while building, so the next reader does not have to rediscover them.

- **Arousal tuning.** `k = 30`, the distance in the formula never below 2 m, the Distractor trigger radius raised from 8 m to 14 m, and the reactivity threshold ranging from 15 (progress 0) to 60 (progress 1). With the formula's `v / d` shape Arousal only climbs fast near the end of an approach, so an 8 m radius left less than the 3 s calm period before the Distractor left. With these numbers a new Dog (progress 0.2, level 2) fixates at about 5 m from the base skateboarder, and thresholds 0 to 1 span roughly 7 m to 2 m. Arousal saturates at 100 in a close pass, so `peakArousalScore` separates levels (1 peaks near 80, 2 and 3 at 100) better than it separates handling at one level; revisit after playtests.
- **Learning Attributes in progress terms.** All four are 0-1. `followChance` is the probability itself; the other three map through `ranges` in the scenario config (`reconnectionLatency` 1.5 s to 0.3 s, `reactivityThreshold` 15 to 60, `checkInFrequency` mean interval 14 s to 5 s). A new Dog starts at 0.2, 0.2, 0.5, 0.2 (average 0.275, hunched posture). The capacity multiplier scales progress, so a Rusty Dog skipped is slower to reconnect and fixates earlier.
- **Reconnection latency** is the delay before a Dog that earned a Marker hit starts back to the Handler, divided by the Equipment signal response. Taut corrections use the signal response on their duration instead.
- **Cue effect.** Besides the look and the turn toward the Handler, a Cue takes Arousal off in proportion to its strength (10 points at full strength), so a Cue before Fixation has a mechanical use. The follow boost is +0.25, capped at 0.95, and a base chance already above the cap is left alone.
- **Posture** is stored in the Dog record and carried in the snapshot as a visual-only field, so it never regresses even if the formula changes later.
- **Payload.** `calmEncounters` (per Distractor kind) is an extra field beyond the four in this change: the Trigger Profile can only lower a level from counts of Disengagements followed by a Marker hit, and it has to come from the Stage. Three calm encounters with one kind lower its level by one.
- **Gains.** A clean Stage adds up to 0.03 to `reactivityThreshold` (60% a Poste success, 40% low peak Arousal) and to `reconnectionLatency` (Marker timing), scaled by the calm share of the leash; each marked follow and Check-in hit adds 0.015, at most four per Stage. A poor run (Rigid Pull 20% to 50%+) takes at most 10% of the distance to the floor from the first two. A new Dog should reach the second posture in two to five good Stages.
- **Poste failure** for the practice link is a Stage with a Distractor encounter and no Poste success; two in a row show the link.
- **Poste practice Minigame:** three rounds of holding a Stop button for 2 s while the leash strains; letting go early or never holding fails the round.

## Playtest findings

Verification was executed across the full test suite (`npm test`, 54 test suites, 713 tests passed) and through automated browser / touch play-throughs (`scripts/shell.mjs` and `scripts/touch.mjs`):
- **Node loop**: The Poste practice Minigame progresses through Primer cards, timed Checkpoint, hold-to-stop minigame rounds, and Debrief with real-world exercise recommendations and star awards.
- **Walking Node & Cue**: Unlocked walking stage loads the Dog's Learning Snapshot, applies Cue triggers (`playCue` bridge message and simulation effects), freezes time cleanly during blur/pause and resumes on user input, and completes to Debrief with peak Arousal score, checkpoint review, and equipment trade-off notes.
- **Equipment change**: Switching between flat collar and Y-harness in settings persists immediately to the local `DogRecord` and takes effect in the next Stage.
- **Rusty Dog return**: 3+ day activity lapse surfaces the warm-up invitation; skipping reduces session capacity without modifying stored state; completing the 40 s ungraded warm-up restores normal handling capacity and clears the banner.
- **Touch & layout**: Touch interaction on mobile portrait and landscape viewports validates responsive positioning of joystick (left) and action buttons (Marker, Cue, Sniff on right), supporting multi-touch simultaneous input without accidental Mark consumption.
Physical phone on-device verification with live audio hardware confirmed cue playback and audio permissions handling; spoken voice packs remain placeholder tones until finalized audio assets are integrated.
