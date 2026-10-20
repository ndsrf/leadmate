# voice-cues Specification

## Purpose
Defines the proactive Cue used to reorient the Dog before it fixates, and the audio options for the Cue.

## Requirements
### Requirement: Proactive Cue
The system SHALL provide a Cue button that, when pressed while the Dog has not yet fixated on a Distractor, plays a Cue and reorients the Dog toward the Handler. The effect on the Dog SHALL be decided in the simulation at the time of the press and SHALL NOT depend on when the audio plays.

#### Scenario: Reorient before Fixation
- **WHEN** the user presses the Cue button while the Dog is not fixated
- **THEN** the system plays the selected Cue and the Dog turns toward the Handler

#### Scenario: Cue after Fixation
- **WHEN** the user presses the Cue button while the Dog is already in Fixation
- **THEN** the Dog's response is reduced to about 30% of the response before Fixation

#### Scenario: Slow audio
- **WHEN** the audio starts late
- **THEN** the Stage outcome is the same as with instant audio

#### Scenario: Cue calms
- **WHEN** a Cue lands
- **THEN** the Dog's Arousal drops in proportion to the Cue's effect strength, which is already reduced after Fixation, on repeats and by Equipment

### Requirement: Cue limits
The system SHALL apply a cooldown of about 3 seconds between Cues and a diminishing effect to repeated Cues while the Dog is already looking at the Handler, and SHALL NOT limit Cues with a budget.

#### Scenario: Cooldown
- **WHEN** the user presses the Cue button again within the cooldown
- **THEN** no new Cue plays and no effect is applied

#### Scenario: Repeat while looking
- **WHEN** the Dog is already looking at the Handler and the user presses the Cue button
- **THEN** the effect is smaller than for the first Cue

### Requirement: Equipment affects the Cue
The system SHALL scale the Cue's effect on the Dog by the Equipment's leash-signal response.

#### Scenario: Collar vs. harness
- **WHEN** the same Cue is given with a flat collar and with a Y-harness
- **THEN** the Dog's response is stronger with the flat collar

### Requirement: Voice Packs
The system SHALL let the user select a Voice Pack that defines the spoken Cues (such as "Let's go" and "Aquí") for each supported language.

#### Scenario: Selecting a pack
- **WHEN** the user selects a different Voice Pack
- **THEN** subsequent Cue presses play that pack's Cue

### Requirement: Custom Cues
The system SHALL let the user record their own Cue of up to 2 seconds, with microphone permission, store it only on the device, and use it in place of the Voice Pack's Cue in the language it was recorded in, falling back to the pack's Cue in other languages.

#### Scenario: Recording a Cue
- **WHEN** the user records a Cue and saves it
- **THEN** the Cue button plays the recorded Cue in that language

#### Scenario: Other language
- **WHEN** the app language differs from the language of the recording
- **THEN** the Cue button plays the Voice Pack's Cue

#### Scenario: Permission denied
- **WHEN** the user denies microphone permission
- **THEN** the system keeps the current Voice Pack and shows an explanation

### Requirement: Cues per language
The system SHALL provide the Cues of each Voice Pack in every language the app supports, and SHALL play the Cue in the active language.

#### Scenario: Active language
- **WHEN** the app language is Spanish and the user presses the Cue button
- **THEN** the Spanish Cue of the selected Voice Pack plays

### Requirement: Audio outside the bundle
The system SHALL play Cue audio from the app shell: the bundle sends a play message and the shell picks the file by Voice Pack, custom recording and active language.

#### Scenario: Bundle requests audio
- **WHEN** the Cue button is pressed in the bundle
- **THEN** the shell receives a play message and plays the matching file

### Requirement: Cue before a turn raises the follow chance
The system SHALL add a fixed boost to the Dog's `followChance` for a turn the Handler makes within 2 seconds after a Cue, SHALL cap the result at about 0.95, and SHALL use the same seeded draw as the base follow.

#### Scenario: Cue then turn
- **WHEN** the user gives a Cue and then turns on Slack within 2 seconds
- **THEN** the Dog's follow chance for that turn is higher than without the Cue

#### Scenario: Too late
- **WHEN** the user turns more than 2 seconds after the Cue
- **THEN** the follow chance is not boosted
