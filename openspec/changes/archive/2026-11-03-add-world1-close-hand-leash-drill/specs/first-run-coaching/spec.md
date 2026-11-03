# Spec Delta

## ADDED Requirements

### Requirement: Close-view control Coach marks
The system SHALL, from the start of a close exercise in which the close-view controls have not been learned, draw a Coach mark on each control the exercise offers (Gather, Poste, Marker), positioned on the real controls for the screen size. Coach marks SHALL NOT block or delay any input. Each mark SHALL disappear at the first press of its control or after 20 seconds, whichever is first, SHALL NOT cover its control, and SHALL be hidden while the exercise is paused.

#### Scenario: First close exercise
- **WHEN** a user who has not used the close-view controls starts a close exercise
- **THEN** a Coach mark with its label points at the Gather control, the Poste control and the Marker button

#### Scenario: User presses a control
- **WHEN** the user presses the Gather control while its mark is shown
- **THEN** the press takes effect at once and that mark disappears while the others stay

#### Scenario: Never pressed
- **WHEN** 20 seconds pass without a press of a control
- **THEN** that control's mark disappears

#### Scenario: Learned already
- **WHEN** the user has used a control in an earlier close exercise
- **THEN** that control's mark is not shown again

#### Scenario: Walking Marker mark does not count
- **WHEN** the user pressed the Marker only in a walking Stage
- **THEN** the close-view Marker mark is still shown the first time

### Requirement: Close-view help is remembered
The system SHALL record each close-view Coach mark as seen in the Dog record's `seenHints`, SHALL show it at most once, SHALL take all its text from the i18n catalog, and SHALL show it again after progress is reset.

#### Scenario: Replay
- **WHEN** the user replays a close exercise after seeing its marks
- **THEN** no mark is shown

#### Scenario: Progress reset
- **WHEN** the user resets progress and starts the close exercise
- **THEN** the Coach marks are shown again
