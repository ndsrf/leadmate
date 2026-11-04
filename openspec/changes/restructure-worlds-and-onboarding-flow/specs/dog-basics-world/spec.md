# Spec Delta

## MODIFIED Requirements

### Requirement: Basics World trail
World 1, "Un perro es un perro", SHALL hold strictly three universal Stretches in this order: "Tu perro es un perro", "En casa se descansa" and "Primero, calma". Each Stretch SHALL have at least one theory Lesson Stop, one choose-the-action Node Stop and one home Mission Stop, which comes last. The first Stretch SHALL also hold the close-view "calm hands and leash" Node Stop (the Hand Drill), before its choose-the-action Node. World 1 SHALL NOT interleave dynamic Home Concern Stretches.

#### Scenario: Trail order
- **WHEN** World 1 is loaded
- **THEN** it holds strictly the Stretches "Tu perro es un perro", "En casa se descansa" and "Primero, calma", in that order, each ending in its Mission, without dynamic concern insertions

#### Scenario: New user starts here
- **WHEN** a new user finishes the first-run funnel and opens the World Map
- **THEN** the map opens on World 1 with its first Lesson Stop next-up

#### Scenario: Close-view Node in the first Stretch
- **WHEN** World 1 is loaded
- **THEN** the first Stretch runs its Lessons, the "calm hands and leash" Node, the choose-the-action Node and its Mission, in that order
