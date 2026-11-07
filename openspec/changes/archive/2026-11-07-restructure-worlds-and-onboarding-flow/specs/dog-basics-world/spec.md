# Spec Delta

## ADDED Requirements

### Requirement: World 1 Mission Check
An unstarted World 1 Mission SHALL open on a dedicated check screen ("¿Ya haces esto con {name}?") rather than the standard Mission brief, both when selected from the World Map and when transitioning immediately from the Stretch's last Node debrief. The check screen SHALL ask whether the handler and dog already practice the habit at home and offer two choices: confirming that they already do ("Sí, ya lo hacemos") and choosing to test it ("Aún no, quiero ponerlo a prueba"). Confirming it SHALL immediately pass the Mission for today without any waiting period, advance the streak, trigger the passed celebration, and unlock the next Stretch. Choosing to test it SHALL open the standard Mission brief where the user can start the Mission with its real-world practice and check-in waiting rules.

#### Scenario: Habit already practiced at home
- **WHEN** an unstarted World 1 Mission is opened and the user taps "Sí, ya lo hacemos"
- **THEN** the Mission is marked passed on today's date, the Streak day is marked active, the celebration view opens, and the next Stretch unlocks without waiting

#### Scenario: Habit not yet practiced or needs testing
- **WHEN** an unstarted World 1 Mission is opened and the user taps "Aún no, quiero ponerlo a prueba"
- **THEN** the standard Mission brief opens with its target, focus, and "Comenzar misión" action

#### Scenario: Reached from last Node debrief
- **WHEN** the user completes the final Node debrief of a World 1 Stretch
- **THEN** the flow transitions directly to the World 1 check screen for the Stretch's Mission

#### Scenario: Started or passed World 1 Mission
- **WHEN** a World 1 Mission has already been started or passed
- **THEN** it does not open on the check screen and follows normal Mission entry (waiting, check-in, or passed screen)

## MODIFIED Requirements

### Requirement: Basics World trail
World 1, "Un perro es un perro", SHALL hold strictly three universal Stretches in this order: "Tu perro es un perro", "En casa se descansa" and "Primero, calma". Each Stretch SHALL have at least one theory Lesson Stop, one choose-the-action Node Stop and one home Mission Stop, which comes last. The first Stretch SHALL run "Tiene nombre", "Tu perro es un perro", "Cómo se juega", the choose-the-action Node "Tu perro es un perro", and its Mission. World 1 SHALL NOT interleave dynamic Home Concern Stretches and SHALL NOT hold the "calm hands and leash" drill.

#### Scenario: Trail order
- **WHEN** World 1 is loaded
- **THEN** it holds strictly the Stretches "Tu perro es un perro", "En casa se descansa" and "Primero, calma", in that order, each ending in its Mission, without dynamic concern insertions

#### Scenario: First Stretch Stop order
- **WHEN** the first Stretch of World 1 is loaded
- **THEN** it runs "Tiene nombre", "Tu perro es un perro", "Cómo se juega", the choose-the-action Node and its Mission, in that order, without the "calm hands and leash" Node

#### Scenario: New user starts here
- **WHEN** a new user finishes the first-run funnel and opens the World Map
- **THEN** the map opens on World 1 with its first Lesson Stop next-up
