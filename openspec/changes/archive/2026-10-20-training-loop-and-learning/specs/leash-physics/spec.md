# Spec Delta

## MODIFIED Requirements

### Requirement: HUD control split
The HUD SHALL place the movement joystick under the left thumb and the Marker button and the Cue button under the right thumb. On a desktop browser, the system SHALL also accept keyboard input for movement, the Marker and the Cue, for debugging.

#### Scenario: Touch layout
- **WHEN** the Stage is shown on a phone
- **THEN** the joystick is on the left and the Marker and Cue buttons are on the right

#### Scenario: Desktop keyboard
- **WHEN** the Stage runs in a desktop browser
- **THEN** W, A, S, D move the Handler at walk speed, the 2 key replaces W for quick forward movement, one key triggers the Marker and another key triggers the Cue

## ADDED Requirements

### Requirement: Abrupt stop measure
The system SHALL measure, when the Handler's strength reaches 0 with the Tension Ratio at least 1.0, the Dog's outward speed at that moment and whether the Handler slowed beforehand, so Equipment can scale the Arousal bump.

#### Scenario: Abrupt stop
- **WHEN** the Handler goes from quick strength to 0 in one step at the leash limit
- **THEN** the stop is reported as abrupt with the Dog's outward speed

#### Scenario: Smooth stop
- **WHEN** the Handler slows to walk strength before reaching 0
- **THEN** the stop is reported as smooth
