# Spec Delta

## Purpose

Closes the habit loop between virtual simulation and real-world dog walking by logging homework exercise outcomes in a Walk Diary and tracking a daily activity streak.

## ADDED Requirements

### Requirement: Walk Diary one-tap check-in
The system SHALL provide a one-tap check-in on the Debrief screen for the assigned real-world exercise, offering three discrete outcome options:
- `'completed'` ("¡Conseguido!")
- `'struggled'` ("Costó un poco")
- `'skipped'` ("Hoy no pudimos")

#### Scenario: One-tap check-in logged
- **WHEN** the user selects an outcome option in the Debrief Walk Diary
- **THEN** the entry is stored in the Dog record with its date, Node ID, and chosen outcome

### Requirement: Daily streak calculation
The system SHALL maintain a daily streak tracking consecutive active local calendar dates (`YYYY-MM-DD`). Completing any qualifying activity (a Node Debrief, any Walk Diary check-in, or the Daily Stage) on date $D$ marks $D$ as active.
- If $D = D_{\text{last}}$, the current streak remains unchanged.
- If $D = D_{\text{last}} + 1\text{ calendar day}$, the streak increments by 1.
- If $D > D_{\text{last}} + 1\text{ calendar day}$, the streak resets to 1.

#### Scenario: Streak increments on consecutive day
- **WHEN** the user completes a qualifying activity on the calendar day immediately following the last active date
- **THEN** the streak increments by one

#### Scenario: Streak resets after missed day
- **WHEN** a full calendar day passes with no qualifying activity
- **THEN** the streak resets to 1 upon the next qualifying activity

### Requirement: Strict streak isolation from Dog Learning Attributes
A broken streak or missed calendar day SHALL NOT degrade or modify the Dog's persistent Learning Attributes or Trigger Profile.

#### Scenario: Streak reset leaves Dog intact
- **WHEN** the streak counter resets to 1 after an inactive gap
- **THEN** the Dog's Learning Attributes, posture, and Trigger Profile remain completely untouched
