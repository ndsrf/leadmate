# Spec Delta

## MODIFIED Requirements

### Requirement: Restructured playable Worlds
Worlds 2 to 5 SHALL be built as trails of Stretches, one Stretch per technique, so each World has at least two Stretches. World 6 MAY hold a single Stretch until its remaining Stretches ship. World 1 SHALL be built as a trail of Stretches from the start. Each Stretch SHALL take about 10 to 15 minutes in the app.

#### Scenario: World 1 trail
- **WHEN** World 1 is loaded
- **THEN** it holds three Stretches, "Tu perro es un perro", "En casa se descansa" and "Primero, calma", in that order, each ending in a Mission

#### Scenario: World 2 trail
- **WHEN** World 2 is loaded
- **THEN** it holds three Stretches, for the harness ritual, the doorbell mat and the Poste, in that order, each ending in a Mission

#### Scenario: World 3 trail
- **WHEN** World 3 is loaded
- **THEN** the walk with distractions, the blind corner and the slack "U" leash each have their own Stretch and Mission

#### Scenario: World 6 trail
- **WHEN** World 6 is loaded
- **THEN** it holds the unpredictable walks Stretch, ending in a Mission, and further Stretches are added in later content updates

#### Scenario: Preview Worlds untouched
- **WHEN** Preview Worlds 7 to 9 are loaded
- **THEN** they keep their planned Stop count and stay unplayable

## ADDED Requirements

### Requirement: A World can grow after it is completed
When Stretches are added to a World that a user has already completed, the World SHALL reopen for the new Stretches, keep the progress already made, and leave the World it unlocked unlocked.

#### Scenario: New Stretch ships
- **WHEN** a user completed World 6 with one Stretch and a later content update adds a second
- **THEN** World 6 shows the new Stretch as open, the done Stops stay done, and World 7 does not lock again

#### Scenario: Not yet completed
- **WHEN** a user is part-way through World 6 when a Stretch is added
- **THEN** their position is kept and the new Stretch comes after the existing ones
