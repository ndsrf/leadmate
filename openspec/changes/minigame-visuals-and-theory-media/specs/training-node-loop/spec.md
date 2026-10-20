# Spec Delta

## MODIFIED Requirements

### Requirement: Four-step Node structure
The system SHALL structure every Node as, in order: Theory Primer, Checkpoint, Interactive Simulation, and Debrief/Real-World Transfer. The Theory Primer SHALL distinctly present both real-world canine training theory (explaining how to execute the technique with a dog in real life) and virtual dog simulation guidance (explaining how to interact with and read the virtual dog during the simulation). The Checkpoint SHALL test real-world canine handling principles and dog behavior rather than virtual game controls.

#### Scenario: Steps run in order
- **WHEN** a user starts a Node
- **THEN** the system presents the four steps in the stated order and does not skip any

#### Scenario: Dual-aspect Theory Primer presentation
- **WHEN** a user views the Theory Primer of a Node
- **THEN** the cards provide clear guidance on real-world canine application followed by virtual dog mechanics and controls before proceeding to the Checkpoint

#### Scenario: Checkpoint tests real-world canine principles
- **WHEN** the Checkpoint is presented
- **THEN** the question and options test real-world dog handling and behavioral concepts rather than virtual app buttons

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
