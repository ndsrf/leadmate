# close-leash-exercises Specification

## Purpose

Provides a close-up 2D isometric simulation view with high-detail canine and handler graphics, fine-grained leash management mechanics (gathering, tension anchoring, slack release), handler shielding positioning, and narrow-passage approaching distractor encounters.

## Requirements

### Requirement: Close 2D isometric view and high-detail graphics
The system SHALL render dedicated close-view exercise stages in a 2D isometric perspective focused closely on the Handler, the Dog, and the immediate passage, utilizing high-detail character and canine posture graphics rather than the broad walking view.

#### Scenario: Close camera framing
- **WHEN** a close leash exercise stage starts
- **THEN** the camera frames the Handler and Dog with high zoom and tight padding, keeping leash manipulation and canine body posture clearly visible

#### Scenario: Canine posture visual fidelity
- **WHEN** the Dog's arousal or attention shifts during the close exercise
- **THEN** the close view renders detailed visual posture transitions including ear tilt, head turn, and body tension

### Requirement: Leash length gathering and slack control
The system SHALL allow the handler in close-view exercises to gather or release leash length, adjusting the effective working leash distance between the Handler and Dog.

#### Scenario: Shortening leash on gather input
- **WHEN** the user activates the leash gathering control
- **THEN** the effective leash length shortens smoothly, drawing the Dog closer to the Handler's side without inducing abrupt rigid tension

#### Scenario: Releasing leash slack
- **WHEN** the user releases the gather control after a distractor passes
- **THEN** the leash length returns to normal working slack, maintaining a relaxed curve

### Requirement: Handler shielding positioning
The system SHALL provide a handler shielding stance control in close-view exercises that positions the Handler between the Dog and an oncoming distractor, breaking line of sight.

#### Scenario: Shielding breaks fixation
- **WHEN** another dog approaches in a narrow street and the user activates the shielding stance on the side facing the oncoming dog
- **THEN** the Handler's body blocks direct line of sight, preventing fixation and slowing the Dog's arousal rise

#### Scenario: Exposed flank without shielding
- **WHEN** another dog passes without the user establishing a shielding position
- **THEN** the Dog maintains unbroken line of sight with the approaching dog and arousal rises at full trigger rate

### Requirement: Leash tension anchoring and buffering
The system SHALL allow the handler to anchor leash tension during sudden lunges or stops, preventing rigid pull spikes while stabilizing the Dog.

#### Scenario: Anchored hold absorbs strain
- **WHEN** the Dog strains toward an approaching distractor while the handler engages the tension anchor control
- **THEN** leash tension is absorbed with buffered resistance, keeping tension below the rigid pull threshold

#### Scenario: Unanchored jolt creates rigid pull
- **WHEN** the Dog lunges while the leash is unanchored and ungathered
- **THEN** the leash snaps taut into rigid pull and arousal rises accordingly

### Requirement: Approaching distractor encounter in narrow passage
The system SHALL simulate narrow passage encounters where an approaching distractor dog moves past the Handler and Dog on a constrained trajectory, testing the timing of leash gathering, shielding, and cues.

#### Scenario: Successful narrow street pass
- **WHEN** the approaching dog crosses the passage while the user gathers leash, maintains shielding, and calls a cue or marks calm disengagement
- **THEN** the Dog stays below the reactive threshold and the stage completes successfully

#### Scenario: Reactive flare on mistimed handling
- **WHEN** the handler fails to shorten leash or shield before the approaching dog enters the trigger radius
- **THEN** the Dog enters the alert or reactive tier and lunges toward the distractor

### Requirement: Close exercise telemetry and debrief metrics
The system SHALL record leash handling metrics during close-view exercises—including leash gather timing, shielding duration, peak tension, and marker accuracy—and emit debrief telemetry for the stage results.

#### Scenario: Debrief telemetry emitted
- **WHEN** a close leash exercise stage finishes
- **THEN** the simulation emits a debrief payload containing leash handling accuracy, peak tension ratio, and shielding coverage score

### Requirement: Hand Distractor encounter
The system SHALL support a close exercise in which the Distractor is a hand offered near the Handler, held in place rather than walking past, so the user practises keeping the Dog out of mouthing range with the leash. The hand SHALL NOT be offered to the Dog's mouth: a lunge toward it ends at the leash length, never in contact.

#### Scenario: Hand offered
- **WHEN** the hand-and-leash drill starts
- **THEN** a hand is shown near the Handler within the Dog's reach at full leash length, and the Dog shows interest in it

#### Scenario: The hand always matters to the Dog
- **WHEN** the hand-and-leash drill starts for a Dog whose Trigger Profile has lowered the hand level, even to 0, through earlier calm runs
- **THEN** the drill still treats the hand at the normal trigger level, so the Dog gets worked up when it is offered and there is something to calm

#### Scenario: Gathered leash keeps the Dog out of range
- **WHEN** the user gathers the leash while the Dog strains toward the hand
- **THEN** the Dog stays beyond reach of the hand and the leash does not snap taut into a rigid pull

#### Scenario: Ungathered leash lets the Dog reach
- **WHEN** the user does not gather the leash and the Dog lunges toward the hand
- **THEN** the Dog reaches the end of the leash, arousal rises and the lunge is counted, but the run continues

### Requirement: No-fail hand-and-leash drill
The hand-and-leash drill SHALL NOT end in failure. A lunge or reactive tier SHALL lower the Debrief score and SHALL NOT end the run, show a failure state or require a retry. The drill SHALL end once the Dog has stayed calm for the configured calm time with the hand offered, or after a maximum duration of 60 seconds, and SHALL always reach its Debrief. The drill SHALL NOT present a verbal correction, a jerk or a lift of the leash as a technique.

#### Scenario: Calm hold completes the drill
- **WHEN** the Dog stays below the alert tier for the configured calm time with the hand offered
- **THEN** the drill ends in success and the Debrief opens

#### Scenario: Lunges do not end the run
- **WHEN** the Dog lunges toward the hand during the drill
- **THEN** the run continues, the lunge lowers the Debrief score and the user can still reach calm

#### Scenario: Time limit still reaches the Debrief
- **WHEN** the maximum duration passes without a calm hold
- **THEN** the drill ends and the Debrief opens with a neutral message ("not calm yet") and one handling tip, with no failure wording, and replay is offered but not required

#### Scenario: Always rewarded
- **WHEN** the user reaches the Debrief of the drill, calm or not
- **THEN** the Node earns the normal completion reward with at least one star, and the handling score only adds stars above the first

#### Scenario: Reward after calm
- **WHEN** the user marks while the Dog is calm and then releases the leash tension
- **THEN** the Dog is rewarded with a toy or treat visual and the arousal drop of a marker hit applies

### Requirement: Gentle first-run configuration and age tailoring
The system SHALL start the hand-and-leash drill with a first-run configuration for a user who has not played a close exercise: a slow hand, a long calm window and a generous mark budget. The drill SHALL take its copy and configuration values from the Dog's age band (puppy, adolescent, adult, senior), and a Dog with no known age band SHALL get neutral copy and tuning. Age bands SHALL change only copy and configuration values, never the available controls.

#### Scenario: Puppy
- **WHEN** the Dog's age band is puppy and the drill starts
- **THEN** the primer and hint copy speak of a mouthy puppy and the reward is a toy

#### Scenario: Other age band
- **WHEN** the Dog's age band is adult
- **THEN** the same controls are offered with copy for an excited adult Dog and its own tuning

#### Scenario: Unknown age
- **WHEN** the Dog has no age band
- **THEN** neutral copy ("your dog", the generic hand-and-leash framing and a treat reward) and middle-of-the-road tuning are used

#### Scenario: Same controls for every age
- **WHEN** the drill starts for any age band
- **THEN** the controls offered are Gather, Poste and Marker, and no shielding control is shown

### Requirement: Readable and playable hand-and-leash drill
The system SHALL draw the hand-and-leash drill as design 18 ("Close-up training") of the LeadMate design system specifies: Migas on an isometric slab, only the guide's hands and sleeves in sight, thick ink outlines, segmented Emoción and Calma meters, a lesson card with step pills, a speech bubble and round Recoger, Poste and Marcar buttons. Before the run it SHALL show a "how to play" card and SHALL NOT advance the simulation until the player taps start. During the run its single instruction SHALL follow the Dog's real state and the control to use SHALL be emphasised.

#### Scenario: How-to-play card
- **WHEN** the hand drill opens
- **THEN** a card lists three steps and the simulation clock does not run until the player taps start

#### Scenario: Instruction follows the Dog
- **WHEN** the Dog is worked up by the hand and the leash is not gathered
- **THEN** the instruction says to hold Gather and the Gather button is emphasised; when the reward window opens the instruction and the Marker button say to mark now, and a ring counts the window down

#### Scenario: Progress is visible
- **WHEN** the drill is running
- **THEN** the Emoción meter shows how close the Dog is to reacting, the Calma meter fills toward the reward, and the step pills show Recoger, Calmar and Marcar as done, current or to do

#### Scenario: The Dog shows its state
- **WHEN** the Dog calms, gets worked up, is pulled in by the leash or is rewarded
- **THEN** it sits, stands and bounces, slides away from the hand along the slab, or sits with its mouth open beside the reward and sparkles

#### Scenario: Hands match the hands
- **WHEN** the close view is shown
- **THEN** the hold-to-gather control is on the right, under the right hand, and the Marker control is on the left, under the left hand, each with a text label; Poste sits above the gather control

#### Scenario: Controls are never covered
- **WHEN** the close view is shown at any phone size
- **THEN** every offered control is visible and tappable, at the positions the Coach marks point at

#### Scenario: Celebration is seen
- **WHEN** a calm mark ends the drill
- **THEN** the last frame, with the reward, stays for a moment before the Debrief
