# Spec Delta

## MODIFIED Requirements

### Requirement: Static and walking modes
The system SHALL run each Node's Interactive Simulation as a Minigame (static), a close leash exercise Stage (close 2D isometric), or a walking Stage (2.5D walking), as defined by the Node's configuration. A static Minigame SHALL render dog-centric graphical feedback (canine posture and environmental cues) tied to canine behavior, rather than solely abstract geometric timers. Both walking Stages and close leash exercise Stages emit the debrief payload and update the Dog.

#### Scenario: Static Node
- **WHEN** a Node is configured as static
- **THEN** the Interactive Simulation is a Minigame without analog walking featuring canine-centric visual state feedback

#### Scenario: Walking Node
- **WHEN** a Node is configured as walking
- **THEN** the Interactive Simulation is a joystick-driven Stage

#### Scenario: Close leash exercise Node
- **WHEN** a Node is configured as a close leash exercise
- **THEN** the Interactive Simulation runs as a close 2D isometric Stage focusing on leash handling mechanics and emits debrief telemetry
