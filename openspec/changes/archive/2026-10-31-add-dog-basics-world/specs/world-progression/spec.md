# Spec Delta

## ADDED Requirements

### Requirement: World 1 — Dog Basics
World 1 SHALL take place indoors at home and teach how to live with a dog as a dog, using theory Lessons, static choose-the-action Minigames and home Missions. World 1 SHALL have no analog walking and no leash simulation. It SHALL be free and SHALL always be unlocked.

#### Scenario: Static home Minigame
- **WHEN** the user plays a World 1 Node
- **THEN** it runs as a static choose-the-action Minigame in an indoor home scene, without joystick walking

#### Scenario: Always open
- **WHEN** a new user opens the World Map
- **THEN** World 1 is unlocked and every later World is locked

## RENAMED Requirements

- FROM: `### Requirement: World 4 — Fast Wheels & High Arousal`
- TO: `### Requirement: World 5 — Fast Wheels & High Arousal`

- FROM: `### Requirement: World 3 — Urban Navigations & Multi-Cue Progression`
- TO: `### Requirement: World 4 — Urban Navigations & Multi-Cue Progression`

- FROM: `### Requirement: World 2 — The Quiet Sidewalk`
- TO: `### Requirement: World 3 — The Quiet Sidewalk`

- FROM: `### Requirement: World 1 — Home & Thresholds`
- TO: `### Requirement: World 2 — Home & Thresholds`

## MODIFIED Requirements

### Requirement: World 2 — Home & Thresholds
World 2 SHALL take place in narrow indoor environments (apartment hallways, doorways, elevators) using static minigames focused on impulse control: the Harness Ritual and Doorbell Mat, where the user reads the Dog and picks an action, and the Poste practice, a Tap & Hold exercise. World 2 SHALL have no analog walking. World 2 SHALL be unlocked by completing World 1.

#### Scenario: Static indoor minigame
- **WHEN** the user plays a World 2 Node
- **THEN** the simulation runs as a static minigame within an indoor boundary set without analog joystick walking

#### Scenario: First Minigames are decisions
- **WHEN** the user plays the Harness Ritual or the Doorbell Mat
- **THEN** they choose between several action buttons according to what the Dog shows, instead of pressing one button at a timed moment or holding one button

#### Scenario: Unlocked by the Basics World
- **WHEN** World 1 is not complete
- **THEN** World 2 is locked

### Requirement: World 3 — The Quiet Sidewalk
World 3 SHALL introduce 2.5D isometric walking along outdoor suburban sidewalks, maintaining the leash in a Slack "U" shape, blind corners, the Poste technique, and the contextual Go Sniff reward.

#### Scenario: Analog walking introduced
- **WHEN** the user starts World 3
- **THEN** the interactive simulation step uses 2.5D joystick walking, Poste stops, and contextual Go Sniff

### Requirement: World 4 — Urban Navigations & Multi-Cue Progression
World 4 SHALL introduce fast-moving distractors (scooters at 4.5 m/s), parked cars as visual shields to break line of sight, and ground food temptations requiring the "Leave It" cue.
1. The introductory food Node SHALL isolate the "Leave It" Cue button on the HUD.
2. Subsequent mixed-distractor Nodes SHALL display both "Let's Go" and "Leave It" Cue buttons with distinct icons, requiring the user to choose the matching cue for the distractor type.

#### Scenario: Visual shield breaks line of sight
- **WHEN** the Handler positions a parked car or wall between the Dog and a Distractor
- **THEN** the line of sight is broken, halting Distractor Arousal accumulation

#### Scenario: Cue matching on ground food
- **WHEN** the Dog fixates on ground food in World 4 and the user presses "Leave It"
- **THEN** the Dog disengages cleanly and Arousal drops

### Requirement: World 5 — Fast Wheels & High Arousal
World 5 SHALL take place in open parks with sudden velocity triggers (e.g. running joggers) and a 3-meter leash with its own physics and Slack margins.

#### Scenario: 3-meter leash
- **WHEN** a World 5 Stage begins
- **THEN** the maximum leash length is set to 3.0 meters and tension ratios adapt accordingly

### Requirement: Sequential World unlocking
The system SHALL organize Stops into sequential Worlds (`WorldDef`), unlocking each World only when all required Stops of the preceding World have been completed (every Lesson Stop read, every Node Stop completed and every Mission Stop passed), and distinguishing free progression worlds from premium LeadMate Plus worlds.

#### Scenario: Locked World
- **WHEN** the user has not completed all required Stops in World 1
- **THEN** World 2 remains locked

#### Scenario: Last Mission opens the next World
- **WHEN** the user has completed every Lesson and Node Stop of World 2 but its last Mission is still waiting
- **THEN** World 3 remains locked until that Mission is passed

#### Scenario: Plus World gating
- **WHEN** a World is designated as a LeadMate Plus world and the user has not unlocked Plus
- **THEN** the World remains locked and indicates it requires a LeadMate Plus membership

### Requirement: Theory and how-to-play precede the Node that uses them
Each Node Stop that trains a new technique SHALL follow a theory Lesson Stop for that technique in the same Stretch. The first Node Stop that uses a simulator control not used before on the trail SHALL also follow a how-to-play Lesson Stop for that control.

#### Scenario: First walking Node
- **WHEN** the trail reaches the first Stage of World 3
- **THEN** it is preceded, in order, by a theory Lesson Stop and a how-to-play Lesson Stop that covers the joystick, the leash and the Poste

#### Scenario: First action buttons
- **WHEN** the trail reaches the first Node Stop of World 1
- **THEN** it is preceded by a how-to-play Lesson Stop that covers tapping an action button according to what the Dog shows

#### Scenario: Known controls
- **WHEN** a later Stage uses only controls already covered
- **THEN** no how-to-play Lesson Stop is required before it

### Requirement: Restructured playable Worlds
Worlds 2 to 5 SHALL be rebuilt as trails of Stretches around their existing Nodes, one Stretch per technique, so each World has at least two Stretches. World 1 SHALL be built as a trail of Stretches from the start. Each Stretch SHALL take about 10 to 15 minutes in the app.

#### Scenario: World 1 trail
- **WHEN** World 1 is loaded
- **THEN** it holds three Stretches, "Tu perro es un perro", "En casa se descansa" and "Primero, calma", in that order, each ending in a Mission

#### Scenario: World 2 trail
- **WHEN** World 2 is loaded
- **THEN** it holds three Stretches, for the harness ritual, the doorbell mat and the Poste, in that order, each ending in a Mission

#### Scenario: World 3 trail
- **WHEN** World 3 is loaded
- **THEN** the walk with distractions, the blind corner and the slack "U" leash each have their own Stretch and Mission

#### Scenario: Preview Worlds untouched
- **WHEN** Preview Worlds 6 to 9 are loaded
- **THEN** they keep their planned Stop count and stay unplayable
