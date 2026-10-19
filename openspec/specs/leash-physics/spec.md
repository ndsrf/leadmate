# leash-physics Specification

## Purpose
Defines how the leash behaves and is shown in the simulation, including tension measurement, visual states, Handler movement control, and the Poste technique.

## Requirements
### Requirement: Dynamic leash curve
The system SHALL render the leash between Handler and Dog as a quadratic Bézier curve that updates as either moves.

#### Scenario: Curve follows movement
- **WHEN** the Handler or Dog moves in the Stage
- **THEN** the rendered leash curve updates to connect them in the same frame

### Requirement: Tension Ratio
The system SHALL compute Tension Ratio as Distance(Handler, Dog) divided by the maximum leash length, continuously during the Stage.

#### Scenario: Ratio computed
- **WHEN** the Handler-Dog distance is 1.5 m and the maximum leash length is 2.0 m
- **THEN** the Tension Ratio is 0.75

### Requirement: Tension state classification
The system SHALL classify tension as Slack when the ratio is below 0.85, Taut from 0.85 to 1.0, and Rigid Pull above 1.0, and SHALL render Slack as a green "U"-curve, Taut with a yellow warning, and Rigid Pull with a red alarm.

#### Scenario: Slack leash
- **WHEN** the Tension Ratio stays below 0.85
- **THEN** the system renders the leash as a relaxed green "U"-curve

#### Scenario: Taut warning
- **WHEN** the Tension Ratio is 0.9
- **THEN** the system shows the yellow warning state

#### Scenario: Rigid Pull alarm
- **WHEN** the Tension Ratio exceeds 1.0
- **THEN** the system shows the red alarm state

### Requirement: Pulling the Dog
Rigid Pull SHALL turn the leash red and be counted in the Stage results, and it SHALL NOT hurt the Handler or the Dog. While the Handler moves in Rigid Pull, the Dog SHALL be drawn toward the Handler at a configured pull strength (a stand-in for the Handler-to-Dog weight ratio); a pull strength of 0 leaves the Dog unmoved.

#### Scenario: Dragging the Dog
- **WHEN** the Handler keeps moving away in Rigid Pull with a non-zero pull strength
- **THEN** the leash is red, the time in Rigid Pull is counted, and the Dog moves toward the Handler

#### Scenario: Pull strength zero
- **WHEN** the pull strength is 0
- **THEN** Rigid Pull has no effect on the Dog's position

### Requirement: Slack lets the Handler steer
While the leash is Slack, the Handler SHALL be able to change direction without moving the Dog, giving the Dog the chance to follow the turn by itself.

#### Scenario: Turning on Slack
- **WHEN** the Handler turns while the Tension Ratio is below 0.85
- **THEN** the Dog is not moved by the leash and its response is decided by the Dog's own behavior

### Requirement: Leash length limits the Handler
The system SHALL stop the Handler from moving farther from the Dog than the maximum leash length plus a small tolerance.

#### Scenario: Handler cannot overshoot
- **WHEN** the user moves the Handler away from a stationary Dog at full speed
- **THEN** the Handler stops at the leash limit plus tolerance

### Requirement: Analog movement strength
The system SHALL take movement input as a direction plus a strength from 0 to 1, and SHALL set the Handler's speed in proportion to the strength, up to a top speed. At least two distinct speeds (walk and quick) SHALL be reachable.

#### Scenario: Walk and quick speeds
- **WHEN** the user moves with strength 0.6 and then with strength 1.0
- **THEN** the Handler moves at a walking speed and then at the top speed

#### Scenario: Zero strength
- **WHEN** the strength is 0
- **THEN** the Handler does not move

### Requirement: Poste technique
The system SHALL halt the Handler immediately and anchor the leash origin when the movement strength becomes 0, and SHALL prevent the Dog from advancing farther in its current direction while the leash is at its limit.

#### Scenario: Executing the Poste
- **WHEN** the Tension Ratio is at least 1.0 and the user provides zero movement input
- **THEN** the system locks the Handler's position
- **AND** blocks the Dog from advancing farther in its current direction

### Requirement: HUD control split
The HUD SHALL place the movement joystick under the left thumb and the Marker button under the right thumb. On a desktop browser, the system SHALL also accept keyboard input for movement and the Marker, for debugging.

#### Scenario: Touch layout
- **WHEN** the Stage is shown on a phone
- **THEN** the joystick is on the left and the Marker button is on the right

#### Scenario: Desktop keyboard
- **WHEN** the Stage runs in a desktop browser
- **THEN** W, A, S, D move the Handler at walk speed, the 2 key replaces W for quick forward movement, and a key press triggers the Marker

### Requirement: Camera zoom follows the action
The system SHALL adjust the camera zoom automatically so the Handler and the Dog stay in view, zooming in when they are close and out as they separate, within configured limits and with smoothing.

#### Scenario: Close together
- **WHEN** the Handler and the Dog are close together
- **THEN** the camera is zoomed in more than when they are at the leash limit

#### Scenario: Both in view
- **WHEN** the leash is at its limit
- **THEN** both the Handler and the Dog are inside the visible area

### Requirement: Leash state hint
The system SHALL show a short hint, from the text catalog, the first time in a Stage that the leash becomes Taut and the first time it becomes Rigid Pull, and SHALL NOT repeat a hint within the same Stage.

#### Scenario: First Taut
- **WHEN** the leash becomes Taut for the first time in a Stage
- **THEN** the Taut hint is shown once

#### Scenario: No repeat
- **WHEN** the leash becomes Taut again in the same Stage
- **THEN** no hint is shown
