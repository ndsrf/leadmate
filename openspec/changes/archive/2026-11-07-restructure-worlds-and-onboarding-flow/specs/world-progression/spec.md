# Spec Delta

## MODIFIED Requirements

### Requirement: World 1 — Dog Basics
World 1 SHALL take place indoors at home and teach how to live with a dog as a dog through three universal foundational Stretches, using theory Lessons, static choose-the-action Minigames and home Missions. World 1 SHALL have no analog walking and no leash simulation. It SHALL be free and SHALL always be unlocked.

#### Scenario: Static home Minigame
- **WHEN** the user plays a World 1 Node
- **THEN** it runs as a static choose-the-action Minigame in an indoor home scene, without joystick walking

#### Scenario: Always open
- **WHEN** a new user opens the World Map
- **THEN** World 1 is unlocked and every later World is locked

#### Scenario: Lightweight foundation
- **WHEN** World 1 is completed
- **THEN** it completes after its three core Stretches regardless of the Dog's declared Concerns, unlocking World 2

### Requirement: World 2 — Home & Thresholds
World 2 SHALL take place in the home and threshold environment (hallways, doorways, elevators). For Dogs with declared Home Concerns, World 2 SHALL open with those personalized Home Stretches, followed by threshold impulse control Stretches: the Harness Ritual, Doorbell Mat, and Poste practice. World 2 SHALL have no analog walking, SHALL remain free-tier, and SHALL be unlocked by completing World 1.

#### Scenario: Static indoor minigame
- **WHEN** the user plays a World 2 Node
- **THEN** the simulation runs as a static minigame within an indoor boundary set without analog joystick walking

#### Scenario: First Minigames are decisions
- **WHEN** the user plays the Harness Ritual or the Doorbell Mat
- **THEN** they choose between several action buttons according to what the Dog shows, instead of pressing one button at a timed moment or holding one button

#### Scenario: Plan orders the threshold Stretches
- **WHEN** the Personal Plan names the Poste practice before the Harness Ritual
- **THEN** after the Dog's Home Stretches World 2 runs the Poste practice before the Harness Ritual; Stretches the plan does not name follow in trail order

#### Scenario: Unlocked by the Basics World
- **WHEN** World 1 is not complete
- **THEN** World 2 is locked

#### Scenario: Free tier access
- **WHEN** a user without a LeadMate Plus subscription completes World 1
- **THEN** World 2 unlocks without requiring a paid subscription
