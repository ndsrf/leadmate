# Spec Delta

## MODIFIED Requirements

### Requirement: Audio outside the bundle
The system SHALL play Cue audio from the app shell: the bundle sends a play message and the shell picks the file by Voice Pack, custom recording and active language, playing the audio only when the user's sound preference is enabled.

#### Scenario: Bundle requests audio
- **WHEN** the Cue button is pressed in the bundle and sound is enabled in preferences
- **THEN** the shell receives a play message and plays the matching file

#### Scenario: Cue pressed with sound disabled
- **WHEN** the Cue button is pressed in the bundle and sound is disabled in preferences
- **THEN** the shell receives a play message, the simulation effect applies normally, and no audio file is played
