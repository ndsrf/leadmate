# Spec Delta

## MODIFIED Requirements

### Requirement: Step timing targets
The system SHALL size the Theory Primer at one or two short tappable cards for a Node on the trail, and at 30-60 seconds as 3-5 short tappable cards for the introductory Node. Each Checkpoint question SHALL be limited to a timed quiz of 15 seconds by default, and the Interactive Simulation SHALL be sized at 60-90 seconds.

#### Scenario: Checkpoint timeout
- **WHEN** the user does not answer a Checkpoint question within the time limit
- **THEN** the system records that question as missed and shows the next question, or advances to the Interactive Simulation after the last one

#### Scenario: Trail Primer length
- **WHEN** a Node on the trail is validated
- **THEN** its Theory Primer has one or two cards

#### Scenario: Timer restarts per question
- **WHEN** the user answers the first Checkpoint question with 1 second left
- **THEN** the second question starts with the full time limit

### Requirement: Checkpoint accessibility
The system SHALL let the user configure the Checkpoint limit to 20 seconds, 15 seconds, 10 seconds, or turn the timer off in settings, and SHALL use the Checkpoint answer only as feedback in the Debrief, never to block the Interactive Simulation or change the Dog.

#### Scenario: Timer off
- **WHEN** the user has turned the timer off
- **THEN** every Checkpoint question waits for an answer without a time limit

#### Scenario: Configured timer duration
- **WHEN** the user has selected a duration of 20 seconds, 15 seconds, or 10 seconds in settings
- **THEN** each Checkpoint question counts down from the selected number of seconds

#### Scenario: Wrong answer
- **WHEN** the user answers any or all Checkpoint questions wrongly
- **THEN** the Interactive Simulation still starts and the Learning Attributes are not affected
