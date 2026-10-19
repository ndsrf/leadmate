# Spec Delta

## Purpose

Defines the four-world progression map and the mechanics each world introduces.

## ADDED Requirements

### Requirement: World 1 — Home & Thresholds
World 1 SHALL use static mechanics (Tap & Hold and timing minigames) set in narrow spaces such as hallways and elevators, focused on impulse control, including the Harness Ritual and the Doorbell Mat.

#### Scenario: Static node
- **WHEN** the user plays the Doorbell Mat node
- **THEN** the interactive step is a static minigame with no analog walking

### Requirement: World 2 — The Quiet Sidewalk
World 2 SHALL introduce 2.5D isometric walking, keeping the leash in a "U" shape, blind corners, the Poste technique, and the contextual Go Sniff button.

#### Scenario: Walking introduced
- **WHEN** the user starts the first World 2 node
- **THEN** the interactive step is 2.5D walking with the joystick

### Requirement: World 3 — Urban Navigations
World 3 SHALL introduce fast-moving distractors (such as scooters at 4.5 m/s), food on the ground requiring "Leave it", and parked cars usable as visual shields to break the dog's line of sight.

#### Scenario: Visual shield
- **WHEN** the handler places a parked car between the dog and a distractor
- **THEN** the dog's line of sight is broken and its arousal stops increasing from that distractor

### Requirement: World 4 — Fast Wheels & High Arousal
World 4 SHALL use open parks, sudden velocity changes such as joggers, and a 3-meter leash with its own physics and slack margins.

#### Scenario: Longer leash
- **WHEN** a World 4 node starts
- **THEN** MaxLeashLength is 3 meters

### Requirement: Sequential unlock
The system SHALL unlock worlds in order.

#### Scenario: Locked world
- **WHEN** the user has not completed World 1
- **THEN** World 2 is locked

### Requirement: Scenery per scenario
Every scenario SHALL define its own scenery set with a configured minimum density of visual items, so no scenario is a bare route.

#### Scenario: Scenery present
- **WHEN** a scenario starts
- **THEN** it shows its scenery set at no less than the configured minimum density
