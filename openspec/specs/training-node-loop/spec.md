# training-node-loop Specification

## Purpose
Defines the standardized four-step structure every Node follows, and the data that describes a Node, so lessons and practice are consistent across content.

## Requirements
### Requirement: Four-step Node structure
The system SHALL structure every Node as, in order: Theory Primer, Checkpoint, Interactive Simulation, and Debrief/Real-World Transfer.

#### Scenario: Steps run in order
- **WHEN** a user starts a Node
- **THEN** the system presents the four steps in the stated order and does not skip any

### Requirement: Step timing targets
The system SHALL size the Theory Primer at 30-60 seconds as 3-5 short tappable cards, limit the Checkpoint to a timed quiz of 5 seconds by default, and size the Interactive Simulation at 60-90 seconds.

#### Scenario: Checkpoint timeout
- **WHEN** the user does not answer the Checkpoint within the time limit
- **THEN** the system records the answer as missed and advances to the Interactive Simulation

### Requirement: Checkpoint accessibility
The system SHALL let the user extend the Checkpoint limit to 10 seconds or turn the timer off in settings, and SHALL use the Checkpoint answer only as feedback in the Debrief, never to block the Interactive Simulation or change the Dog.

#### Scenario: Timer off
- **WHEN** the user has turned the timer off
- **THEN** the Checkpoint waits for an answer without a time limit

#### Scenario: Wrong answer
- **WHEN** the user answers the Checkpoint wrongly
- **THEN** the Interactive Simulation still starts and the Learning Attributes are not affected

### Requirement: Debrief with real-world transfer
The system SHALL end each Node with a Debrief that shows the performance results and exactly one real-world exercise, chosen from the Node's configured list by the user's weakest metric.

#### Scenario: Debrief shown
- **WHEN** the Interactive Simulation ends
- **THEN** the system shows performance results and one real-world exercise

#### Scenario: Weakest metric
- **WHEN** the Rigid Pull share is the user's weakest metric
- **THEN** the exercise offered is the one configured for leash tension

### Requirement: Static and walking modes
The system SHALL run each Node's Interactive Simulation as a Minigame (static) or as a Stage (2.5D walking), as defined by the Node's configuration. Only a Stage emits the debrief payload and updates the Dog.

#### Scenario: Static Node
- **WHEN** a Node is configured as static
- **THEN** the Interactive Simulation is a Minigame without analog walking

#### Scenario: Walking Node
- **WHEN** a Node is configured as walking
- **THEN** the Interactive Simulation is a joystick-driven Stage

### Requirement: Node data
The system SHALL describe each Node as plain data: mode, Primer cards, Checkpoint question, simulation config including Distractors, real-world exercises, and a list of prerequisite Nodes. The unlock interface and world progression belong to `engagement-and-worlds`.

#### Scenario: Prerequisite check
- **WHEN** a Node lists a prerequisite that the user has not completed
- **THEN** the system reports the Node as not available

### Requirement: Practice before technique
The system SHALL teach any technique that players do not discover on their own, starting with the Poste, in a dedicated practice Node listed as a prerequisite of any scenario that depends on it. A Node counts as completed when its Debrief is reached, even if the technique failed. A practice Node SHALL stay replayable.

#### Scenario: Poste practice first
- **WHEN** a scenario requires the Poste
- **THEN** the user has already reached the Debrief of the Poste practice Node

#### Scenario: Hint after failures
- **WHEN** the user fails the Poste in a scenario twice
- **THEN** the system shows a link back to the Poste practice Node

### Requirement: Initial content
The system SHALL ship Primer and exercise content from the localization catalog for the Poste practice Node and one walking Node, and SHALL leave further Nodes for later.

#### Scenario: Catalog text
- **WHEN** a Node is shown in the active language
- **THEN** its Primer, Checkpoint and exercises come from that language's catalog
