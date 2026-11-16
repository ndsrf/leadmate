# Spec Delta

## ADDED Requirements

### Requirement: Jackpot treat
A scenario SHALL be able to add a Jackpot button beside the Marker with its own small budget (`jackpotBudget`). A Jackpot press SHALL be judged like a Marker press, using its own budget instead of a Mark. A Jackpot hit during a hard moment (Disengagement, or a Check-in while a hot Scent Spot, food or a Distractor is within its radius) SHALL be recorded as a smart Jackpot. On any other hit it SHALL be recorded as a wasted Jackpot, and the hit still counts.

#### Scenario: Smart Jackpot
- **WHEN** the Dog checks in while standing next to food and the user presses Jackpot
- **THEN** a Check-in hit and a smart Jackpot are recorded, and one Jackpot is spent

#### Scenario: Jackpot on an easy look
- **WHEN** the Dog checks in on an empty path and the user presses Jackpot
- **THEN** a Check-in hit and a wasted Jackpot are recorded

#### Scenario: No Jackpot
- **WHEN** a scenario sets no `jackpotBudget`
- **THEN** no Jackpot button is shown
