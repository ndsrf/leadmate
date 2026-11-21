# Spec Delta

## MODIFIED Requirements

### Requirement: Step timing targets
The system SHALL size the Theory Primer at one or two short tappable cards for a Node on the trail, and at 30-60 seconds as 3-5 short tappable cards for the introductory Node. Each Checkpoint question SHALL be limited to a timed quiz of 15 seconds by default. An Interactive Simulation played as one walking Stage SHALL be sized at 60-90 seconds; one played as an Encounter Series SHALL hold 3 to 5 Encounters of about 10 to 20 seconds each.

#### Scenario: Checkpoint timeout
- **WHEN** the user does not answer a Checkpoint question within the time limit
- **THEN** the system records that question as missed and shows the next question, or advances to the Interactive Simulation after the last one

#### Scenario: Trail Primer length
- **WHEN** a Node on the trail is validated
- **THEN** its Theory Primer has one or two cards

#### Scenario: Timer restarts per question
- **WHEN** the user answers the first Checkpoint question with 1 second left
- **THEN** the second question starts with the full time limit

#### Scenario: Encounter Series size
- **WHEN** a Node whose Interactive Simulation is an Encounter Series is validated
- **THEN** it holds 3 to 5 Encounters and each time-limited Encounter lasts 10 to 20 seconds

### Requirement: Static and walking modes
The system SHALL run each Node's Interactive Simulation as a Minigame (static), a close leash exercise Stage (close 2D isometric), or a walking Stage (2.5D walking), as defined by the Node's configuration. A walking Node's Interactive Simulation SHALL be either one walking Stage or an Encounter Series. A static Minigame SHALL render dog-centric graphical feedback (canine posture and environmental cues) tied to canine behavior, rather than solely abstract geometric timers. Both walking Stages and close leash exercise Stages emit the debrief payload and update the Dog; a Node played as an Encounter Series updates the Dog once, from the combined payload of its kept attempts, and not when the Series was skipped.

#### Scenario: Static Node
- **WHEN** a Node is configured as static
- **THEN** the Interactive Simulation is a Minigame without analog walking featuring canine-centric visual state feedback

#### Scenario: Walking Node
- **WHEN** a Node is configured as walking
- **THEN** the Interactive Simulation is a joystick-driven Stage

#### Scenario: Walking Node with an Encounter Series
- **WHEN** a walking Node is configured with an Encounter Series
- **THEN** the Interactive Simulation plays its Encounters in order as joystick-driven Stages, and the Dog is updated once from the kept attempts when the Debrief is reached after the last Encounter

#### Scenario: Close leash exercise Node
- **WHEN** a Node is configured as a close leash exercise
- **THEN** the Interactive Simulation runs as a close 2D isometric Stage focusing on leash handling mechanics and emits debrief telemetry

### Requirement: Node data
The system SHALL describe each Node as plain data: mode, Primer cards categorized into real-world dog theory and virtual dog simulation instructions, optional media references, Checkpoint question, simulation config including Distractors, real-world exercises, and a list of prerequisite Nodes. A walking Node's simulation config MAY instead be an Encounter Series: an ordered list of Encounters, each with an id, an Aim and a scenario, with its title in the Node's text. The unlock interface and world progression belong to `engagement-and-worlds`.

#### Scenario: Prerequisite check
- **WHEN** a Node lists a prerequisite that the user has not completed
- **THEN** the system reports the Node as not available

#### Scenario: Structured Primer data with media references
- **WHEN** a Node specifies real-world theory cards, virtual dog mechanic cards, and media attachment references
- **THEN** the Node data schema preserves these fields as pure serializable data structures

#### Scenario: Encounter Series as data
- **WHEN** a walking Node lists four Encounters with ids, Aims and scenarios
- **THEN** the Node data keeps them as pure serializable data in the listed order
