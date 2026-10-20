# Spec Delta

## Purpose

Makes every interaction answer back with motion, touch and sound, so the app feels alive, while keeping it quiet, comfortable and accessible when the user wants that.

## ADDED Requirements

### Requirement: Immediate press feedback
The system SHALL respond to a press on any interactive element within 100 ms with a visible state change, a light haptic tap and a short UI sound, each subject to its setting.

#### Scenario: Button press
- **WHEN** the user presses a primary button
- **THEN** the button sinks, a light haptic tap fires and a UI sound plays

#### Scenario: Unsupported haptics
- **WHEN** the device or browser has no haptics
- **THEN** the press still shows its visual state and nothing fails

### Requirement: Screen transitions
The system SHALL move between screens with a short transition of at most 350 ms that never delays the new screen from accepting input.

#### Scenario: Open a Node
- **WHEN** the user opens a Node from the map
- **THEN** the Node screen transitions in and accepts input without waiting for the transition to end

### Requirement: Feedback never blocks play
The system SHALL run all feedback without waiting for it: a sound or haptic that cannot play is silent, and no feedback delays the Stage, the Marker, a Cue or the simulation.

#### Scenario: Sound fails to load
- **WHEN** a UI sound cannot be played
- **THEN** the action it accompanies still completes and no error is shown

#### Scenario: During a Stage
- **WHEN** the user presses the Marker during a Stage
- **THEN** the Marker takes effect at once and UI feedback adds no delay to it

### Requirement: User control of sound and haptics
The system SHALL let the user turn UI sounds and haptics off separately in Settings, SHALL remember the choice, and SHALL NOT play UI sounds over the Voice Pack or Dog sounds of a running Stage.

#### Scenario: Sounds off
- **WHEN** the user turns UI sounds off
- **THEN** no UI sound plays on later presses, after restarting the app too

#### Scenario: Cue audio in progress
- **WHEN** a Cue or a Dog sound is playing
- **THEN** UI sounds do not play over it

### Requirement: Reduced motion
The system SHALL replace looping, bouncing and sliding animations with fades or a static state when the system asks for reduced motion, and SHALL show the same information either way.

#### Scenario: Reduced motion on
- **WHEN** the system setting for reduced motion is on
- **THEN** the next-up pulse, celebrations and transitions use no movement beyond a fade, and the next-up Node is still marked by a static highlight

### Requirement: No effect on the simulation
The system SHALL keep all feedback in the shell and SHALL NOT change the simulation inputs, its seeded results or its telemetry.

#### Scenario: Same seed, same Stage
- **WHEN** the same seed is played with feedback on and with feedback off
- **THEN** the telemetry payloads are identical
