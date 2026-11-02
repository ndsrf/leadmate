# dog-trigger-profile Specification

## Purpose
Defines the Dog's Trigger Profile, which makes the virtual Dog resemble the owner's real dog by setting how strongly it reacts to each kind of Distractor.

## Requirements

### Requirement: Trigger Profile levels
The system SHALL hold, for the Dog, a Trigger Profile that gives each kind of Distractor a reactivity level from 0 (none) to 3 (strong), and SHALL store it in the Dog's local record.

#### Scenario: Profile stored
- **WHEN** a Trigger Profile is saved
- **THEN** it is present after the app restarts

### Requirement: Profile scales Arousal
The system SHALL use a Distractor kind's level to set the TriggerFactor in the Arousal formula, with level 0 contributing no Arousal.

#### Scenario: Strong vs. none
- **WHEN** a Dog with level 3 for bicycles and level 0 for children meets both at the same distance and speed
- **THEN** the bicycle raises its Arousal and the child does not

### Requirement: Profile is a Stage input
The system SHALL pass the Trigger Profile to the Stage as part of the config snapshot, so the same seed, inputs and profile reproduce the same Stage.

#### Scenario: Replay
- **WHEN** a Stage is replayed with the same profile
- **THEN** it produces the same payload

### Requirement: Training lowers levels, never raises them
The system SHALL be able to lower a level after repeated calm Disengagements from that kind of Distractor, and SHALL NOT raise a level because of gameplay or absence.

#### Scenario: Repeated calm handling
- **WHEN** the user handles several encounters with one Distractor kind with a Marker hit each
- **THEN** that kind's level can drop by one

#### Scenario: Poor run
- **WHEN** the user has a Stage with repeated Rigid Pull
- **THEN** no level rises

### Requirement: Editable profile
The system SHALL let the user view and edit the Trigger Profile in settings. The questionnaire that first fills it belongs to `onboarding-and-accounts`.

#### Scenario: Edit
- **WHEN** the user changes the level for dogs from 1 to 3 in settings
- **THEN** the next Stage uses level 3 for dogs

### Requirement: Home-behaviour concerns
The Dog setup questionnaire SHALL also ask which home behaviours are a problem (biting the owner, biting other people, barking at home, destroying things, eating non-food things such as socks) as selectable chips with the same three intensities, saved as the Dog's home concerns and not in the Trigger Profile. The settings editor SHALL let the user change them, the main concern, age band and sex, and the plan SHALL be rebuilt on save.

#### Scenario: Concern saved
- **WHEN** the user selects "eats socks" at "a lot"
- **THEN** the Dog's home concerns hold level 3 for eating objects and the Trigger Profile is unchanged

#### Scenario: Edited later
- **WHEN** the user changes the main concern in settings
- **THEN** the plan is rebuilt and the World Map's next-up follows it
