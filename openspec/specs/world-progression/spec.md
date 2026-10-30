# world-progression Specification

## Purpose
Defines the four-world progression map, environment boundary collision, multi-cue pedagogical ramp, and World-specific mechanic unlocks.

## Requirements

### Requirement: World 1 — Home & Thresholds
World 1 SHALL take place in narrow indoor environments (apartment hallways, doorways, elevators) using static minigames focused on impulse control: the Harness Ritual and Doorbell Mat, where the user reads the Dog and picks an action, and the Poste practice, a Tap & Hold exercise. World 1 SHALL have no analog walking.

#### Scenario: Static indoor minigame
- **WHEN** the user plays a World 1 Node
- **THEN** the simulation runs as a static minigame within an indoor boundary set without analog joystick walking

#### Scenario: First Minigames are decisions
- **WHEN** the user plays the Harness Ritual or the Doorbell Mat
- **THEN** they choose between several action buttons according to what the Dog shows, instead of pressing one button at a timed moment or holding one button

### Requirement: World 2 — The Quiet Sidewalk
World 2 SHALL introduce 2.5D isometric walking along outdoor suburban sidewalks, maintaining the leash in a Slack "U" shape, blind corners, the Poste technique, and the contextual Go Sniff reward.

#### Scenario: Analog walking introduced
- **WHEN** the user starts World 2
- **THEN** the interactive simulation step uses 2.5D joystick walking, Poste stops, and contextual Go Sniff

### Requirement: World 3 — Urban Navigations & Multi-Cue Progression
World 3 SHALL introduce fast-moving distractors (scooters at 4.5 m/s), parked cars as visual shields to break line of sight, and ground food temptations requiring the "Leave It" cue.
1. The introductory food Node SHALL isolate the "Leave It" Cue button on the HUD.
2. Subsequent mixed-distractor Nodes SHALL display both "Let's Go" and "Leave It" Cue buttons with distinct icons, requiring the user to choose the matching cue for the distractor type.

#### Scenario: Visual shield breaks line of sight
- **WHEN** the Handler positions a parked car or wall between the Dog and a Distractor
- **THEN** the line of sight is broken, halting Distractor Arousal accumulation

#### Scenario: Cue matching on ground food
- **WHEN** the Dog fixates on ground food in World 3 and the user presses "Leave It"
- **THEN** the Dog disengages cleanly and Arousal drops

### Requirement: World 4 — Fast Wheels & High Arousal
World 4 SHALL take place in open parks with sudden velocity triggers (e.g. running joggers) and a 3-meter leash with its own physics and Slack margins.

#### Scenario: 3-meter leash
- **WHEN** a World 4 Stage begins
- **THEN** the maximum leash length is set to 3.0 meters and tension ratios adapt accordingly

### Requirement: Waypoint corridors and solid boundary walls
Scenarios SHALL define routes using ordered waypoint corridors (`waypoints: Vec2[]`) and solid boundary walls (`walls: Wall[]`) that constrain movement, support indoor partitions and outdoor streetscapes, and occlude line of sight.

#### Scenario: Wall prevents movement
- **WHEN** the Handler or Dog attempts to move into a boundary wall
- **THEN** movement is blocked along the wall surface normal

#### Scenario: Leash wraps around wall corners
- **WHEN** a wall corner vertex intersects the direct line between Handler and Dog
- **THEN** the leash wraps around the corner vertex to determine effective tension and pathing

### Requirement: Sequential World unlocking
The system SHALL organize Stops into sequential Worlds (`WorldDef`), unlocking each World only when all required Stops of the preceding World have been completed (every Lesson Stop read, every Node Stop completed and every Mission Stop passed), and distinguishing free progression worlds from premium LeadMate Plus worlds.

#### Scenario: Locked World
- **WHEN** the user has not completed all required Stops in World 1
- **THEN** World 2 remains locked

#### Scenario: Last Mission opens the next World
- **WHEN** the user has completed every Lesson and Node Stop of World 1 but its last Mission is still waiting
- **THEN** World 2 remains locked until that Mission is passed

#### Scenario: Plus World gating
- **WHEN** a World is designated as a LeadMate Plus world and the user has not unlocked Plus
- **THEN** the World remains locked and indicates it requires a LeadMate Plus membership

### Requirement: Scenery set and minimum density
Every scenario SHALL declare its scenery set matching its environment theme, and SHALL satisfy an automated density check of at least 1 prop per 5 meters of route distance (with a minimum of 8 props per walking scenario).

#### Scenario: Scenery density enforced
- **WHEN** a scenario configuration is validated
- **THEN** it contains at least 1 prop per 5 meters of corridor length and no fewer than 8 total props

### Requirement: Extended Curriculum and World Topics
The system SHALL support extended curriculum worlds with topic metadata and node counts to preview advanced canine training stages, including park recall, cafe manners, hiking trails, urban crowds, and cooperative care.

#### Scenario: Extended worlds defined
- **WHEN** the progression system loads world definitions
- **THEN** it includes preview worlds beyond the core initial worlds, each with a title, world number, topic summary, tier, preview flag, and planned node count

#### Scenario: World topic metadata available
- **WHEN** a World is queried for map presentation
- **THEN** it provides a localized topic summary describing the skills trained in that World (e.g. "puertas, timbre, escaleras")

### Requirement: Worlds are trails of Stops
A playable World SHALL be an ordered list of Stretches. Each Stretch SHALL train exactly one technique and SHALL be an ordered list of Stops ending with exactly one Mission Stop. A Stop is a Lesson Stop (one Lesson), a Node Stop (one Node) or a Mission Stop (one Mission). A Lesson or Node SHALL appear at most once across all trails.

#### Scenario: Stretch ends in a Mission
- **WHEN** World definitions are validated
- **THEN** every Stretch has exactly one Mission Stop and it is the Stretch's last Stop

#### Scenario: One technique per Stretch
- **WHEN** World definitions are validated
- **THEN** every Node Stop in a Stretch trains the same technique as that Stretch's Mission

#### Scenario: Unique placement
- **WHEN** a Lesson or Node is referenced by two Stops
- **THEN** validation fails

### Requirement: Theory and how-to-play precede the Node that uses them
Each Node Stop that trains a new technique SHALL follow a theory Lesson Stop for that technique in the same Stretch. The first Node Stop that uses a simulator control not used before on the trail SHALL also follow a how-to-play Lesson Stop for that control.

#### Scenario: First walking Node
- **WHEN** the trail reaches the first Stage of World 2
- **THEN** it is preceded, in order, by a theory Lesson Stop and a how-to-play Lesson Stop that covers the joystick, the leash and the Poste

#### Scenario: Known controls
- **WHEN** a later Stage uses only controls already covered
- **THEN** no how-to-play Lesson Stop is required before it

### Requirement: Stop availability
Within an unlocked World, a Stop SHALL be available when every Stop before it in its Stretch is done and every earlier Mission in the World is passed. A Node Stop SHALL also need its Node's own prerequisites. A completed Stop SHALL stay replayable.

#### Scenario: In order within a Stretch
- **WHEN** the theory Lesson that opens a Stretch is unread
- **THEN** the Node Stop after it is locked and names that Lesson as missing

#### Scenario: Replay
- **WHEN** a Node Stop is completed
- **THEN** it can be played again at any time, and replaying it does not change Mission state

### Requirement: Restructured playable Worlds
Worlds 1 to 4 SHALL be rebuilt as trails of Stretches around their existing Nodes, one Stretch per technique, so each World has at least two Stretches. Each Stretch SHALL take about 10 to 15 minutes in the app.

#### Scenario: World 1 trail
- **WHEN** World 1 is loaded
- **THEN** it holds three Stretches, for the harness ritual, the doorbell mat and the Poste, in that order, each ending in a Mission

#### Scenario: World 2 trail
- **WHEN** World 2 is loaded
- **THEN** the walk with distractions, the blind corner and the slack "U" leash each have their own Stretch and Mission

#### Scenario: Preview Worlds untouched
- **WHEN** Preview Worlds 5 to 8 are loaded
- **THEN** they keep their planned Stop count and stay unplayable
