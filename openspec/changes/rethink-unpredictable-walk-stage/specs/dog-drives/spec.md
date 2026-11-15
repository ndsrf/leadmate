# Spec Delta

## MODIFIED Requirements

### Requirement: Goal Drive
The system SHALL move the Dog toward the current waypoint at a configured speed, with some random Wander mixed in, so its path is not a straight line. In a scenario with Scent Spots, the Goal Drive SHALL instead move the Dog along the Handler's current heading, ahead of the Handler, so the Dog does not know the Handler's route and is blended with the scent pull.

#### Scenario: Dog heads to the waypoint
- **WHEN** a Stage starts with the Goal Drive
- **THEN** the Dog moves toward the waypoint and arrives within the Stage if the Handler keeps up

#### Scenario: Scent Stage
- **WHEN** a Stage with Scent Spots runs and the Handler turns away from the next waypoint
- **THEN** the Dog's Goal Drive follows the Handler's new heading, not the waypoint

### Requirement: Follow after a turn
When the Handler changes direction by more than a set angle while the leash is Slack, the system SHALL give the Dog a short follow window. With a seeded chance (`followChance`) the Dog turns with the Handler and looks at the Handler; otherwise it keeps its heading and, if the leash reaches Taut, a small correction turns it toward the Handler without Rigid Pull. In a scenario with Scent Spots, the chance SHALL be scaled by the change's Novelty and lowered by Autopilot, and a pace change or a stop SHALL also open a follow window.

#### Scenario: Dog follows the turn
- **WHEN** the Handler turns on Slack and the seeded draw is below `followChance`
- **THEN** the Dog turns with the Handler and looks at the Handler

#### Scenario: Dog does not follow
- **WHEN** the Handler turns on Slack and the seeded draw is at or above `followChance`
- **THEN** the Dog keeps its heading until a Taut correction turns it toward the Handler

#### Scenario: Same seed
- **WHEN** two Stages use the same seed and inputs
- **THEN** the Dog follows the same turns

#### Scenario: Stop in a scent Stage
- **WHEN** the Handler stops suddenly with a Slack leash in a scent Stage
- **THEN** the Dog gets a follow window and, on a successful draw, stops and looks at the Handler
