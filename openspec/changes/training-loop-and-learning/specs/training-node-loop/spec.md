# Spec Delta

## Purpose

Defines the standardized four-step structure every training node follows, so lessons and practice are consistent across content.

## ADDED Requirements

### Requirement: Four-step node structure
The system SHALL structure every training node as, in order: Theory Primer, Tactical Checkpoint, Interactive Simulation, and Debrief/Real-World Transfer.

#### Scenario: Steps run in order
- **WHEN** a user starts a training node
- **THEN** the system presents the four steps in the stated order and does not skip any

### Requirement: Step timing targets
The system SHALL size the Theory Primer at 30-60 seconds, limit the Tactical Checkpoint to a 5-second timed quiz, and size the Interactive Simulation at 60-90 seconds.

#### Scenario: Checkpoint timeout
- **WHEN** the user does not answer the Tactical Checkpoint within 5 seconds
- **THEN** the system records the answer as missed and advances to the Interactive Simulation

### Requirement: Debrief with real-world transfer
The system SHALL end each node with a debrief that summarizes the user's simulation performance and gives a real-world exercise.

#### Scenario: Debrief shown
- **WHEN** the Interactive Simulation ends
- **THEN** the system shows a debrief containing performance results and a real-world transfer action

### Requirement: Static and walking simulation modes
The system SHALL run each node's Interactive Simulation in either a static mode (Tap & Hold or timing minigames) or a 2.5D walking mode, as defined by the node's configuration.

#### Scenario: Static node
- **WHEN** a node is configured as static
- **THEN** the Interactive Simulation uses a minigame without analog walking

#### Scenario: Walking node
- **WHEN** a node is configured as 2.5D walking
- **THEN** the Interactive Simulation uses the joystick-driven walking simulation

### Requirement: Practice before technique
The system SHALL teach any technique that players do not discover on their own, starting with the Poste, in a dedicated practice node before a scenario depends on it.

#### Scenario: Poste practice first
- **WHEN** a scenario requires the Poste
- **THEN** the user has already completed a practice node for the Poste
