# Spec Delta

## MODIFIED Requirements

### Requirement: User control of sound and haptics
The system SHALL let the user turn UI sounds and haptics off separately in Settings, SHALL remember the choice, and SHALL NOT play UI sounds over the Voice Pack or Dog sounds of a running Stage, except Stage feedback sounds, which SHALL play at once but lowered in volume while a Cue or Dog sound is playing, so the Cue or Dog sound stays clearly heard.

#### Scenario: Sounds off
- **WHEN** the user turns UI sounds off
- **THEN** no UI sound plays on later presses, after restarting the app too, and no Stage feedback sound plays

#### Scenario: Cue audio in progress
- **WHEN** a Cue or a Dog sound is playing
- **THEN** UI sounds do not play over it

#### Scenario: Feedback sound during a Cue
- **WHEN** a Stage feedback sound is due while a Cue or Dog sound is playing
- **THEN** the feedback sound plays at once at a lowered volume and the Cue or Dog sound is not cut or delayed
