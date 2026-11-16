# Spec Delta

## ADDED Requirements

### Requirement: Feedback effects are bounded
During a Stage, feedback effects SHALL draw at most 40 particles at once, SHALL last at most 1.5 s each, SHALL respect the 30 frames-per-second cap, and SHALL stop drawing entirely once no effect is active, so a Stage with no recent action draws no effect work. Feedback sounds SHALL be played by the shell, not by an audio engine in the Stage bundle.

#### Scenario: Busy moment
- **WHEN** several actions happen in quick succession
- **THEN** no more than 40 effect particles are drawn at any time

#### Scenario: Quiet walk
- **WHEN** no action has been reported for 2 s
- **THEN** no feedback effect is drawn and the HUD redraws only on other visible changes

#### Scenario: No audio in the bundle
- **WHEN** a feedback sound plays during a Stage
- **THEN** it is played by the shell and no web audio context exists in the Stage bundle
