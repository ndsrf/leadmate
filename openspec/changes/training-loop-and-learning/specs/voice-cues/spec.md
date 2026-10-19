# Spec Delta

## Purpose

Defines the proactive Cue used to reorient the dog before it fixates, and the audio options for the Cue.

## ADDED Requirements

### Requirement: Proactive Cue
The system SHALL provide a Cue button that, when pressed while the dog has not yet fixated on a distractor, plays a cue and reorients the dog toward the handler.

#### Scenario: Reorient before fixation
- **WHEN** the user presses the Cue button while the dog is not fixated
- **THEN** the system plays the selected cue and the dog turns toward the handler

#### Scenario: Voice after fixation
- **WHEN** the user presses the Cue button while the dog is already fixated on a distractor
- **THEN** the dog's response is reduced compared with a press before fixation

### Requirement: Voice packs
The system SHALL let the user select a Voice Pack that defines the spoken cues (such as "Let's go" and "Aquí") for each supported language.

#### Scenario: Selecting a pack
- **WHEN** the user selects a different Voice Pack
- **THEN** subsequent Voice presses play that pack's cue

### Requirement: Custom voice cues
The system SHALL let the user record their own cue, with microphone permission, and use it in place of a pack cue.

#### Scenario: Recording a cue
- **WHEN** the user records a cue and saves it
- **THEN** the Cue button plays the recorded cue

#### Scenario: Permission denied
- **WHEN** the user denies microphone permission
- **THEN** the system keeps the current Voice Pack and shows an explanation

### Requirement: Cues per language
The system SHALL provide the Cues of each Voice Pack in every language the app supports, and SHALL play the Cue in the active language.

#### Scenario: Active language
- **WHEN** the app language is Spanish and the user presses the Cue button
- **THEN** the Spanish cue of the selected Voice Pack plays

### Requirement: Cue before a turn raises the follow chance
The system SHALL raise the dog's follow chance for a turn when a Cue is given shortly before it.

#### Scenario: Cue then turn
- **WHEN** the user gives a Cue and then turns on Slack
- **THEN** the dog's follow chance for that turn is higher than without the Cue
