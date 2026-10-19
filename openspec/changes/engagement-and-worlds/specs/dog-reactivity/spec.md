# Spec Delta

## Purpose

Makes the dog's arousal visible and audible, so a Distractor produces a real reaction (not only an exclamation mark) and the user can read how close the dog is to losing control.

## ADDED Requirements

### Requirement: Reaction stages
The system SHALL express the dog's arousal in stages (calm, alert, reactive), each with its own visible behavior and sound, driven by the arousal meter and the dog's reactivity threshold.

#### Scenario: Rising arousal
- **WHEN** arousal rises past a stage threshold during a Fixation
- **THEN** the dog's behavior and sound change to that stage

#### Scenario: Falling arousal
- **WHEN** arousal falls below a stage threshold after Disengagement
- **THEN** the dog returns to the previous stage

### Requirement: Barking and lunging
In the reactive stage the system SHALL make the dog bark and lunge toward the Distractor, with extra pull on the leash, and SHALL NOT allow a Marker to score a hit while the dog is reactive.

#### Scenario: Dog goes reactive
- **WHEN** arousal reaches the reactive stage
- **THEN** the dog barks, lunges toward the Distractor and pulls harder on the leash

#### Scenario: Marker while reactive
- **WHEN** the user presses the Marker while the dog is reactive
- **THEN** it is counted as a reactive Marker, not a hit

### Requirement: Recovery
The system SHALL let the dog come back from reactive to calm only after the Distractor is out of sight or far enough away, with distance, line of sight and a calm Handler shortening the recovery.

#### Scenario: Distractor leaves
- **WHEN** the Distractor leaves the dog's line of sight
- **THEN** arousal falls and the dog recovers to calm

### Requirement: Reactivity is configurable and optional by world
The system SHALL read the stage thresholds and the sound set from configuration, and SHALL show reaction stages only from the world that enables them.

#### Scenario: Early world
- **WHEN** the user plays a world that does not enable reactivity
- **THEN** the dog only shows the Fixation indicator
