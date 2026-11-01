# Spec Delta

## Purpose

Provides a close-up 2D isometric simulation view with high-detail canine and handler graphics, fine-grained leash management mechanics (gathering, tension anchoring, slack release), handler shielding positioning, and narrow-passage approaching distractor encounters.

## ADDED Requirements

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
