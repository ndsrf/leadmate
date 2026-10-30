# training-node-loop Specification

## Purpose
Defines the standardized four-step structure every Node follows, and the data that describes a Node, so lessons and practice are consistent across content.

## Requirements

### Requirement: Four-step Node structure
The system SHALL structure every Node as, in order: Theory Primer, Checkpoint, Interactive Simulation, and Debrief/Real-World Transfer. For a Node on a World's trail, the Theory Primer SHALL recap the theory and how-to-play Lessons that precede it on the trail. For the introductory Node of the guided first Stage, which has no preceding Lessons, the Theory Primer SHALL present both real-world canine training theory and virtual dog simulation guidance. The Checkpoint SHALL test real-world canine handling principles and dog behavior rather than virtual game controls; on the trail, it SHALL test the theory taught by the preceding theory Lesson.

#### Scenario: Steps run in order
- **WHEN** a user starts a Node
- **THEN** the system presents the four steps in the stated order and does not skip any

#### Scenario: Recap Primer on the trail
- **WHEN** a user starts a Node Stop that follows a theory Lesson and a how-to-play Lesson
- **THEN** the Theory Primer shows one or two cards recapping those Lessons before the Checkpoint

#### Scenario: Dual-aspect Theory Primer presentation
- **WHEN** a user views the Theory Primer of the introductory Node in the guided first Stage
- **THEN** the cards provide clear guidance on real-world canine application followed by virtual dog mechanics and controls before proceeding to the Checkpoint

#### Scenario: Checkpoint tests real-world canine principles
- **WHEN** the Checkpoint is presented
- **THEN** the question and options test real-world dog handling and behavioral concepts rather than virtual app buttons

### Requirement: Step timing targets
The system SHALL size the Theory Primer at one or two short tappable cards for a Node on the trail, and at 30-60 seconds as 3-5 short tappable cards for the introductory Node. The Checkpoint SHALL be limited to a timed quiz of 5 seconds by default, and the Interactive Simulation SHALL be sized at 60-90 seconds.

#### Scenario: Checkpoint timeout
- **WHEN** the user does not answer the Checkpoint within the time limit
- **THEN** the system records the answer as missed and advances to the Interactive Simulation

#### Scenario: Trail Primer length
- **WHEN** a Node on the trail is validated
- **THEN** its Theory Primer has one or two cards

### Requirement: Checkpoint accessibility
The system SHALL let the user extend the Checkpoint limit to 10 seconds or turn the timer off in settings, and SHALL use the Checkpoint answer only as feedback in the Debrief, never to block the Interactive Simulation or change the Dog.

#### Scenario: Timer off
- **WHEN** the user has turned the timer off
- **THEN** the Checkpoint waits for an answer without a time limit

#### Scenario: Wrong answer
- **WHEN** the user answers the Checkpoint wrongly
- **THEN** the Interactive Simulation still starts and the Learning Attributes are not affected

### Requirement: Debrief with real-world transfer
The system SHALL end each Node with a Debrief that shows the performance results and exactly one real-world exercise, chosen from the Node's configured list by the user's weakest metric. The exercise SHALL become "Tu foco" on the brief of the Mission that ends the Node's Stretch, and the Debrief SHALL NOT ask how the real-world exercise went.

#### Scenario: Debrief shown
- **WHEN** the Interactive Simulation ends
- **THEN** the system shows performance results and one real-world exercise

#### Scenario: Weakest metric
- **WHEN** the Rigid Pull share is the user's weakest metric
- **THEN** the exercise offered is the one configured for leash tension

#### Scenario: Linked to the Mission
- **WHEN** the Node's Stretch ends in a Mission
- **THEN** the Debrief names that Mission, offers no check-in answers itself, and the Mission brief shows the exercise as "Tu foco"

### Requirement: Static and walking modes
The system SHALL run each Node's Interactive Simulation as a Minigame (static) or as a Stage (2.5D walking), as defined by the Node's configuration. A static Minigame SHALL render dog-centric graphical feedback (canine posture and environmental cues) tied to canine behavior, rather than solely abstract geometric timers. Only a Stage emits the debrief payload and updates the Dog.

#### Scenario: Static Node
- **WHEN** a Node is configured as static
- **THEN** the Interactive Simulation is a Minigame without analog walking featuring canine-centric visual state feedback

#### Scenario: Walking Node
- **WHEN** a Node is configured as walking
- **THEN** the Interactive Simulation is a joystick-driven Stage

### Requirement: Node data
The system SHALL describe each Node as plain data: mode, Primer cards categorized into real-world dog theory and virtual dog simulation instructions, optional media references, Checkpoint question, simulation config including Distractors, real-world exercises, and a list of prerequisite Nodes. The unlock interface and world progression belong to `engagement-and-worlds`.

#### Scenario: Prerequisite check
- **WHEN** a Node lists a prerequisite that the user has not completed
- **THEN** the system reports the Node as not available

#### Scenario: Structured Primer data with media references
- **WHEN** a Node specifies real-world theory cards, virtual dog mechanic cards, and media attachment references
- **THEN** the Node data schema preserves these fields as pure serializable data structures

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
