# Spec Delta

## MODIFIED Requirements

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
