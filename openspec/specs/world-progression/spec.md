# world-progression Specification

## Purpose
Defines the four-world progression map, environment boundary collision, multi-cue pedagogical ramp, and World-specific mechanic unlocks.

## Requirements
### Requirement: World 1 — Home & Thresholds
World 1 SHALL take place in narrow indoor environments (apartment hallways, doorways, elevators) using static minigames (Tap & Hold and timing exercises) focused on impulse control, including the Harness Ritual and Doorbell Mat, with no analog walking.

#### Scenario: Static indoor minigame
- **WHEN** the user plays a World 1 Node
- **THEN** the simulation runs as a static minigame within an indoor boundary set without analog joystick walking

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
The system SHALL organize Nodes into sequential Worlds (`WorldDef`), unlocking each World only when all required Nodes of the preceding World have been completed.

#### Scenario: Locked World
- **WHEN** the user has not completed all required Nodes in World 1
- **THEN** World 2 remains locked

### Requirement: Scenery set and minimum density
Every scenario SHALL declare its scenery set matching its environment theme, and SHALL satisfy an automated density check of at least 1 prop per 5 meters of route distance (with a minimum of 8 props per walking scenario).

#### Scenario: Scenery density enforced
- **WHEN** a scenario configuration is validated
- **THEN** it contains at least 1 prop per 5 meters of corridor length and no fewer than 8 total props
