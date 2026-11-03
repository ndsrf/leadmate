# Spec Delta

## MODIFIED Requirements

### Requirement: Basics World trail
World 1, "Un perro es un perro", SHALL hold three Stretches in this order: "Tu perro es un perro", "En casa se descansa" and "Primero, calma". Each Stretch SHALL have at least one theory Lesson Stop, one choose-the-action Node Stop and one home Mission Stop, which comes last. The first Stretch SHALL also hold the close-view "calm hands and leash" Node Stop (the Hand Drill), before its choose-the-action Node.

#### Scenario: Trail order
- **WHEN** World 1 is loaded
- **THEN** it holds the Stretches "Tu perro es un perro", "En casa se descansa" and "Primero, calma", in that order, each ending in its Mission

#### Scenario: New user starts here
- **WHEN** a new user finishes the first-run funnel and opens the World Map
- **THEN** the map opens on World 1 with its first Lesson Stop next-up

#### Scenario: Close-view Node in the first Stretch
- **WHEN** World 1 is loaded
- **THEN** the first Stretch runs its Lessons, the "calm hands and leash" Node, the choose-the-action Node and its Mission, in that order

## ADDED Requirements

### Requirement: Calm hands and leash drill
The first Basics Stretch SHALL include a close-view Node in which the user keeps the Dog calm around an offered hand using the leash, Gather, Poste and Marker. It SHALL open once the how-to-play Lesson is read, without needing the Stretch's other Lessons, and the Stretch's Mission SHALL need both Nodes. It SHALL count as complete when its Debrief is reached or the simulation is skipped, and SHALL stay replayable.

#### Scenario: Opens after how to play
- **WHEN** the user has read the how-to-play Lesson but not the Stretch's other Lessons
- **THEN** the "calm hands and leash" Node opens, the choose-the-action Node stays closed and the Mission stays closed

#### Scenario: Skipped simulation
- **WHEN** the user leaves the drill's simulation through the pause menu's skip
- **THEN** the Node is completed like a played one

#### Scenario: Mission needs both Nodes
- **WHEN** the user completes the close-view Node without the choose-the-action Node, or the reverse
- **THEN** the Stretch's Mission stays closed

#### Scenario: Completed by reaching the Debrief
- **WHEN** the user reaches the Debrief of the drill, whether the Dog stayed calm or not
- **THEN** the Node is completed and can be replayed


### Requirement: Drill copy follows the age band and never corrects
The primer, Checkpoint, Debrief and real-world exercise of the "calm hands and leash" Node SHALL follow the Dog's age band. Their text SHALL NOT suggest hitting, kicking, shoving, scruffing, jerking the leash, lifting the Dog by it or any other physical correction.

#### Scenario: Content review
- **WHEN** the Node's text is checked against the catalog
- **THEN** none of it tells the user to physically correct the Dog

#### Scenario: Puppy copy
- **WHEN** the Dog is a puppy and the user opens the Node
- **THEN** its primer and real-world exercise speak of a mouthy puppy and a toy reward

#### Scenario: No age band
- **WHEN** the Dog has no age band and the user opens the Node
- **THEN** its text says "your dog" and speaks of a treat reward, with no mention of a puppy
