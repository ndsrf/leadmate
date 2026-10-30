# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
