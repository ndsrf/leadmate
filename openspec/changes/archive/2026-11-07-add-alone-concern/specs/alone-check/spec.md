# Spec Delta

## Purpose

Asks the owner once, inside the app, how the Dog copes with being left alone, and turns the answer into a Concern level so the course on solitude and safe spaces is offered only to those who need it. Answering is never counted as progress.

## ADDED Requirements

### Requirement: Being alone is a Home Behaviour Concern
Being left alone (`alone`) SHALL be a Home Behaviour Concern with level 1 to 3 like the other five, with its own Home Stretch. Onboarding SHALL NOT ask about it and the limit of three Main Concerns SHALL NOT change.

#### Scenario: Not in onboarding
- **WHEN** a user goes through onboarding
- **THEN** being alone is not offered among the concerns, and the Main Concerns still allow at most three

#### Scenario: Set later
- **WHEN** the user makes being alone a Concern from Other Home Behaviours at level 2
- **THEN** its Home Stretch joins World 2 like any other Home Behaviour and the question card is not shown again

### Requirement: One-time question card
World 2 SHALL show once a card, inside its frame above its path asking "¿Cómo lleva {name} quedarse solo en casa?" with four answers: "Muy bien", "A veces llora o se inquieta", "Mal: llora, rompe cosas, ladra" and "Aún no lo sé". The card SHALL show only while the Dog has no recorded answer, SHALL be available even when World 2 has no Home Stretch of the Dog, and SHALL NOT block the Map or any Stop.

#### Scenario: Card shown
- **WHEN** a Dog with no recorded answer opens the Map with World 2 unlocked
- **THEN** the card is shown inside World 2 with the Dog's name and the four answers

#### Scenario: Card ignored
- **WHEN** the user leaves the card unanswered
- **THEN** every Stop stays as it was and the card shows again next time

### Requirement: Answer sets the Concern level
Each answer SHALL be translated into a Concern level for being alone: "Muy bien" creates no Concern; "A veces llora o se inquieta" sets level 2; "Mal: llora, rompe cosas, ladra" sets level 3; "Aún no lo sé" creates no Concern and leaves the Home Stretch available in Other Home Behaviours. A level set this way SHALL be changeable later like any other Concern level.

#### Scenario: Sometimes
- **WHEN** the user answers "A veces llora o se inquieta"
- **THEN** being alone becomes a Concern at level 2 and its Home Stretch joins World 2

#### Scenario: Bad
- **WHEN** the user answers "Mal: llora, rompe cosas, ladra"
- **THEN** being alone becomes a Concern at level 3 and its Home Stretch joins World 2

#### Scenario: Very well
- **WHEN** the user answers "Muy bien"
- **THEN** no Concern is created and the Home Stretch stays in Other Home Behaviours, where it can still be activated

#### Scenario: Not known yet
- **WHEN** the user answers "Aún no lo sé"
- **THEN** no Concern is created, the card is not shown again, and the Home Stretch is available in Other Home Behaviours

### Requirement: Question is asked once
The system SHALL record that the question was answered and SHALL NOT show the card again. Making being alone a Concern by any other route SHALL also count as answered. The record SHALL keep the answer so a second device does not ask again.

#### Scenario: Not repeated
- **WHEN** the user answered the card and later reopens the Map
- **THEN** the card is not shown

#### Scenario: Activated elsewhere first
- **WHEN** the user made being alone a Concern from Other Home Behaviours before seeing the card
- **THEN** the card is not shown

#### Scenario: Old record
- **WHEN** a record saved before the question existed is read
- **THEN** it has no answer, its other data is unchanged and the card can be shown

### Requirement: Answering is not progress
Answering the card SHALL NOT award stars, advance or start the Streak, add an entry to the Walk Diary or the Activity Log, or count in any World total.

#### Scenario: No progress
- **WHEN** the user answers the card on a day with no other activity
- **THEN** the Streak, stars, Walk Diary and Activity Log are unchanged and the day is not an Active Day
