# equipment-physics Specification

## Purpose
Defines how the Dog's Equipment changes the simulation through benefits and costs, so users learn that equipment is a trade-off to choose for their goal, not a right answer.

## Requirements
### Requirement: Equipment selection
The system SHALL let the user choose a flat collar or a Y-harness for the Dog, SHALL take the initial choice from onboarding (flat collar if none was made), SHALL store it in the Dog's local record, and SHALL apply it to all Stages.

#### Scenario: Choice applied
- **WHEN** the user selects the Y-harness
- **THEN** Stages use the Y-harness profile

### Requirement: Collar carries leash signals, harness is gentler
The system SHALL model the flat collar as carrying leash signals more clearly (stronger response to Taut corrections and Cues, shorter reconnection) and the Y-harness as less responsive to leash signals, and SHALL apply these as Stage-start modifiers, never as changes to the stored Learning Attributes.

#### Scenario: Collar responds more
- **WHEN** the same Taut correction is applied with a flat collar and with a Y-harness
- **THEN** the Dog reorients more strongly with the flat collar

#### Scenario: Stored values untouched
- **WHEN** the user switches Equipment
- **THEN** the stored Learning Attributes are unchanged

### Requirement: Equipment affects Arousal during Rigid Pull
The system SHALL raise the Dog's Arousal faster during a Rigid Pull with a flat collar than with a Y-harness.

#### Scenario: Collar spikes faster
- **WHEN** the same Rigid Pull lasts 2 seconds with each Equipment
- **THEN** the Arousal increase with the flat collar is greater

### Requirement: Equipment affects the Poste stop
The system SHALL add a one-time Arousal bump when the Handler stops with the leash at its limit and the Dog moving outward, scaled by the Dog's speed at the stop and larger with a flat collar than with a Y-harness, and SHALL reduce it when the Handler slowed before stopping. The anchoring effect of the Poste SHALL be the same with both.

#### Scenario: Harsh stop
- **WHEN** the Handler stops at speed with the leash at its limit
- **THEN** the Dog's Arousal bumps more with the flat collar than with the Y-harness

#### Scenario: Smooth stop
- **WHEN** the Handler slows down before stopping
- **THEN** the bump is smaller than for an abrupt stop

### Requirement: Debrief explains the trade-off
The system SHALL mention in the Debrief when a harsh stop happened and SHALL describe Equipment as a trade-off, without calling either choice wrong.

#### Scenario: Harsh stop in the Debrief
- **WHEN** a Stage included a harsh stop
- **THEN** the Debrief says so

### Requirement: Equipment can be changed
The system SHALL let the user change Equipment after onboarding.

#### Scenario: Change equipment
- **WHEN** the user changes from collar to harness in settings
- **THEN** the next Stage uses the harness profile
