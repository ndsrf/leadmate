# Spec Delta

## MODIFIED Requirements

### Requirement: Results and replay
When a Stage ends, the system SHALL show the results and offer to play again, with no pass or fail in this phase. When the Stage is an Encounter attempt, its result SHALL instead be a result card with 1 to 3 Paws, an instant Retry of the same seed and a Next action, as defined by `walk-encounters`; 1 Paw is not a fail and never blocks Next.

#### Scenario: Results shown
- **WHEN** the Stage ends
- **THEN** the results screen shows the telemetry numbers, including Check-in hits and Marks used out of the budget, and a Play again action

#### Scenario: Play again
- **WHEN** the user chooses Play again
- **THEN** a new Stage starts with a new random seed

#### Scenario: Encounter result
- **WHEN** an Encounter attempt ends
- **THEN** the system shows its Paws with Retry and Next instead of the results screen

#### Scenario: Encounter retry keeps the seed
- **WHEN** the user chooses Retry on an Encounter result card
- **THEN** the same Encounter starts again with the same seed, without a loading screen, the Primer or the Checkpoint
