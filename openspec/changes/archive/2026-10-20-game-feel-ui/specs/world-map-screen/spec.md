# Spec Delta

## Purpose

Presents progression as a World Map the user travels along, so the next lesson is obvious, the path ahead is visible and each completed Node feels like progress.

## ADDED Requirements

### Requirement: Map of Worlds and Nodes
The system SHALL show the World Map as a map in which each World is a titled region and each of its Nodes is a point on a path, in the order the World defines.

#### Scenario: Worlds listed
- **WHEN** the World Map is shown
- **THEN** every World appears in order with its title and its completed-over-total Node count

#### Scenario: Locked World
- **WHEN** a World is not yet unlocked
- **THEN** it appears dimmed with its unlock requirement and its Nodes are not openable

### Requirement: Node states
The system SHALL show each Node as exactly one of locked, open, next-up or completed, and a completed Node SHALL show its star rating.

#### Scenario: Next-up Node
- **WHEN** at least one open Node is not completed
- **THEN** the first such Node in World order is marked next-up with a looping attention animation, and the map scrolls it into view on opening the World Map

#### Scenario: Completed Node
- **WHEN** a Node is completed with 2 stars
- **THEN** it shows two filled stars and one empty star

#### Scenario: Locked Node reason
- **WHEN** the user presses a locked Node
- **THEN** the system names the prerequisite Nodes still missing and does not start the Node

### Requirement: Persistent status chips
The system SHALL keep the Streak, the Daily Stage and the Settings entry visible at the top of the World Map while the map scrolls.

#### Scenario: Scrolled map
- **WHEN** the user has scrolled down the map
- **THEN** the Streak chip, the Daily Stage chip and Settings remain visible

#### Scenario: Daily Stage chip
- **WHEN** today's Daily Stage has not been played
- **THEN** its chip shows a highlighted "new" state, and after it is played shows the day's best score

### Requirement: Dog on the map
The system SHALL show the Dog on the map at the next-up Node, with an idle pose, and SHALL show a Rusty Dog state while the Dog is Rusty. The marker MAY reuse existing Dog sprite frames; matching the image to the user's Dog breed is out of scope for this change.

#### Scenario: Dog follows progress
- **WHEN** the user completes a Node and returns to the World Map
- **THEN** the Dog moves along the path to the new next-up Node

### Requirement: Existing prompts keep their place
The system SHALL keep the Rusty warm-up prompt, the skipped-warm-up note and the account banner on the World Map, shown above the map and never covering a Node.

#### Scenario: Rusty prompt
- **WHEN** the Dog is Rusty and the user has not chosen yet
- **THEN** the warm-up prompt with Warm-up and Skip actions is shown above the map

#### Scenario: Account banner
- **WHEN** a non-blocking account banner exists
- **THEN** it is shown above the map without hiding the chips
