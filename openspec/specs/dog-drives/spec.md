# dog-drives Specification

## Purpose
Defines how the Dog decides where to go, through replaceable Drives, so different scenarios can make it behave differently while staying repeatable.

## Requirements
### Requirement: Goal Drive
The system SHALL move the Dog toward the current waypoint at a configured speed, with some random Wander mixed in, so its path is not a straight line.

#### Scenario: Dog heads to the waypoint
- **WHEN** a Stage starts with the Goal Drive
- **THEN** the Dog moves toward the waypoint and arrives within the Stage if the Handler keeps up

### Requirement: Replaceable Drives
The system SHALL keep the Dog's Drive separate from the leash behavior so a scenario can use a different Drive, or a blend of Drives, without changing leash behavior.

#### Scenario: Different Drive
- **WHEN** a scenario selects another Drive
- **THEN** the Dog follows it while tension and the Poste behave the same

### Requirement: Repeatable randomness
All randomness in the Stage SHALL come from a seed, so the same seed and inputs produce the same Dog movement.

#### Scenario: Same seed
- **WHEN** two Stages use the same seed and inputs
- **THEN** the Dog's path is identical

### Requirement: Fixation on Distractors
The system SHALL make the Dog fixate on a Distractor when the Dog's Arousal reaches its reactivity threshold because of that Distractor. A Distractor SHALL affect Arousal only within its trigger radius.

#### Scenario: Fixation starts
- **WHEN** the Dog's Arousal due to a Distractor reaches its reactivity threshold
- **THEN** the Dog stops following its Drive and fixates on the Distractor

#### Scenario: Outside the radius
- **WHEN** a Distractor is outside its trigger radius
- **THEN** it does not raise the Dog's Arousal

#### Scenario: Lower threshold reacts earlier
- **WHEN** the Dog's reactivity threshold is lower
- **THEN** it fixates from a greater distance for the same Distractor

### Requirement: Follow after a turn
When the Handler changes direction by more than a set angle while the leash is Slack, the system SHALL give the Dog a short follow window. With a seeded chance (`followChance`) the Dog turns with the Handler and looks at the Handler; otherwise it keeps its heading and, if the leash reaches Taut, a small correction turns it toward the Handler without Rigid Pull.

#### Scenario: Dog follows the turn
- **WHEN** the Handler turns on Slack and the seeded draw is below `followChance`
- **THEN** the Dog turns with the Handler and looks at the Handler

#### Scenario: Dog does not follow
- **WHEN** the Handler turns on Slack and the seeded draw is at or above `followChance`
- **THEN** the Dog keeps its heading until a Taut correction turns it toward the Handler

#### Scenario: Same seed
- **WHEN** two Stages use the same seed and inputs
- **THEN** the Dog follows the same turns

### Requirement: Check-in glance
The system SHALL make the Dog glance at the Handler at seeded random moments while it follows its Drive, as a visible look that opens a short Check-in window.

#### Scenario: Glance
- **WHEN** a Check-in moment occurs
- **THEN** the Dog visibly looks at the Handler for the length of the Check-in window
