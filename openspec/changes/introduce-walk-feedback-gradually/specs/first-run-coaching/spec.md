# Spec Delta

## MODIFIED Requirements

### Requirement: Control Coach marks
The system SHALL, from the start of a Stage in which the controls have not been learned, draw a Coach mark on the movement control labelled "drag to move" and a Coach mark on the Marker button labelled "tap to reward", positioned on the real controls for the screen size. A Coach mark SHALL be drawn only for a control whose actions are Introduced in that Stage. Coach marks SHALL NOT block or delay any input. The movement mark SHALL disappear at the first movement input. The Marker mark SHALL stay until the first Marker press or 20 seconds, whichever is first, and SHALL NOT cover the button.

#### Scenario: First time on the Stage
- **WHEN** a new user's first Stage starts
- **THEN** a Coach mark points at the movement control and another at the Marker button, each with its label

#### Scenario: User moves
- **WHEN** the user moves while both marks are shown
- **THEN** the movement takes effect at once, the movement mark disappears and the Marker mark stays

#### Scenario: User marks
- **WHEN** the user presses the Marker while its mark is shown
- **THEN** the press takes effect at once and the mark disappears

#### Scenario: User never marks
- **WHEN** 20 seconds pass without a Marker press
- **THEN** the Marker mark disappears

#### Scenario: Paused
- **WHEN** the Stage is paused while a mark is shown
- **THEN** the mark is hidden until the Stage resumes

#### Scenario: Control not yet Introduced
- **WHEN** a Stage offers a control whose actions are not Introduced in that Stage
- **THEN** no Coach mark is drawn on that control

### Requirement: Close-view control Coach marks
The system SHALL, from the start of a close exercise in which the close-view controls have not been learned, draw a Coach mark on each control the exercise offers (Gather, Poste, Marker) whose actions are Introduced at that Node, positioned on the real controls for the screen size. Coach marks SHALL NOT block or delay any input. Each mark SHALL disappear at the first press of its control or after 20 seconds, whichever is first, SHALL NOT cover its control, and SHALL be hidden while the exercise is paused.

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
