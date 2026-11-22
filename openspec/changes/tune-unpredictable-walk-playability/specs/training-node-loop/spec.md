# Spec Delta

## MODIFIED Requirements

### Requirement: Four-step Node structure
The system SHALL structure every Node as, in order: Theory Primer, Checkpoint, Interactive Simulation, and Debrief/Real-World Transfer. For a Node on a World's trail, the Theory Primer SHALL recap the theory and how-to-play Lessons that precede it on the trail. In Unpredictable Walk stages, the primer card SHALL recap watching the Dog portrait and the drifting cloud sign for Autopilot. For the introductory Node of the guided first Stage, which has no preceding Lessons, the Theory Primer SHALL present both real-world canine training theory and virtual dog simulation guidance. The Checkpoint SHALL test real-world canine handling principles and dog behavior rather than virtual game controls; on the trail, it SHALL test the theory taught by the preceding theory Lesson.

#### Scenario: Steps run in order
- **WHEN** a user starts a Node
- **THEN** the system presents the four steps in the stated order and does not skip any

#### Scenario: Recap Primer on the trail
- **WHEN** a user starts a Node Stop that follows a theory Lesson and a how-to-play Lesson
- **THEN** the Theory Primer shows one or two cards recapping those Lessons before the Checkpoint

#### Scenario: Scent Walk trail primer
- **WHEN** the user views the primer card for an Unpredictable Walk node
- **THEN** the primer card reminds the user to watch the Dog portrait and drifting cloud sign for Autopilot and vary movement to keep moves fresh

#### Scenario: Dual-aspect Theory Primer presentation
- **WHEN** a user views the Theory Primer of the introductory Node in the guided first Stage
- **THEN** the cards provide clear guidance on real-world canine application followed by virtual dog mechanics and controls before proceeding to the Checkpoint

#### Scenario: Checkpoint tests real-world canine principles
- **WHEN** the Checkpoint is presented
- **THEN** the question and options test real-world dog handling and behavioral concepts rather than virtual app buttons
