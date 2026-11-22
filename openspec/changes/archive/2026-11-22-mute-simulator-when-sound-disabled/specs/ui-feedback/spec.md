# Spec Delta

## MODIFIED Requirements

### Requirement: User control of sound and haptics
The system SHALL let the user turn sounds and haptics off separately in Settings, SHALL remember the choice, and SHALL silence all application audio—including UI sounds, Stage feedback sounds, and running Stage noises—when sound is turned off. When sounds are enabled, the system SHALL NOT play UI sounds over the Voice Pack or Dog sounds of a running Stage, except Stage feedback sounds, which SHALL play at once but lowered in volume while a Cue or Dog sound is playing.

#### Scenario: Sounds off
- **WHEN** the user turns sounds off in Settings
- **THEN** no UI sounds, Stage feedback sounds, or simulator sounds play, even after restarting the app

#### Scenario: Cue audio in progress
- **WHEN** sound is enabled and a Cue or a Dog sound is playing
- **THEN** UI sounds do not play over it

#### Scenario: Feedback sound during a Cue
- **WHEN** sound is enabled and a Stage feedback sound is due while a Cue or Dog sound is playing
- **THEN** the feedback sound plays at once at a lowered volume and the Cue or Dog sound is not cut or delayed
