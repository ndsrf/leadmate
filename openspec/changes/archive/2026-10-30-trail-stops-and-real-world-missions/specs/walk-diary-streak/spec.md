# Spec Delta

## MODIFIED Requirements

### Requirement: Walk Diary one-tap check-in
The system SHALL provide a one-tap check-in on a Mission Stop, opening only on a calendar day after the Mission was assigned, offering three discrete outcome options:
- `'completed'` ("¡Conseguido!")
- `'struggled'` ("Costó un poco")
- `'skipped'` ("Hoy no pudimos")

#### Scenario: One-tap check-in logged
- **WHEN** the user selects an outcome option on an open Mission check-in
- **THEN** the entry is stored in the Dog record with its date, Mission ID, chosen outcome and, for a struggle, the chosen problem

#### Scenario: No check-in on the Debrief
- **WHEN** a Node Debrief is shown
- **THEN** no Walk Diary answer can be chosen on it

#### Scenario: Earlier entries kept
- **WHEN** a Dog record holds Walk Diary entries logged on Debriefs before this change
- **THEN** they are kept and shown in the history with their Node, and still count for past Streak days
