# world-map-screen Specification

## Purpose
Presents progression as a World Map the user travels along, so the next lesson is obvious, the path ahead is visible and each completed Node feels like progress.

## Requirements

### Requirement: Map of Worlds and Nodes
The system SHALL show the World Map as a continuous winding trail traversing titled World regions, rendering active worlds with visible nodes along the path, the immediately next locked world with an unlock requirement banner, and subsequent locked worlds as compact collapsible headers.

#### Scenario: Worlds listed
- **WHEN** the World Map is shown
- **THEN** every World appears in order with its title, its completed-over-total Node count ("X de Y paseos"), and its thematic topic summary

#### Scenario: Locked World
- **WHEN** a World is not yet unlocked
- **THEN** it appears with its unlock requirement and its Nodes are not openable

#### Scenario: Active World path connectors
- **WHEN** an active or unlocked World is displayed
- **THEN** completed node segments connect via solid ink-outlined paths and upcoming or locked segments connect via dashed dotted trails

#### Scenario: Next locked World banner
- **WHEN** a World is the first locked World in sequence
- **THEN** it displays an unlock requirement banner above its path naming the preceding World and its final prerequisite Node

#### Scenario: Subsequent locked Worlds collapsed
- **WHEN** a World follows an already-locked World
- **THEN** it is displayed as a compact collapsible header row with a lock icon, and tapping the header toggles inline expansion of its trail

### Requirement: Node states
The system SHALL show each Node as exactly one of locked, open, next-up or completed, and a completed Node SHALL show its star rating.

#### Scenario: Next-up Node
- **WHEN** at least one open Node is not completed
- **THEN** the first such Node in World order is marked next-up with amber fill, a soft looping attention animation, and a "Siguiente" badge pill, and the map scrolls it into view on opening the World Map

#### Scenario: Open Node
- **WHEN** a Node is unlocked and ready to play but is not the primary next-up Node
- **THEN** it renders with a light paper surface disc and a play triangle glyph

#### Scenario: Completed Node
- **WHEN** a Node is completed with 2 stars
- **THEN** it shows two filled stars and one empty star below the node

#### Scenario: Locked Node reason
- **WHEN** the user presses a locked Node
- **THEN** the system names the prerequisite Nodes still missing and does not start the Node

### Requirement: Persistent status chips
The system SHALL keep the Streak, the Daily Stage and the Settings entry visible at the top of the World Map while the map scrolls. The Settings entry SHALL be a compact, icon-only gear button pinned to the top-right corner of the Map Header, on the first line beside the Streak chip, with the other Status Chips wrapping across the full width below. It SHALL keep at least the minimum touch target and SHALL expose the localized Settings name to screen readers.

#### Scenario: Scrolled map
- **WHEN** the user has scrolled down the map
- **THEN** the Streak chip, the Daily Stage chip and Settings remain visible

#### Scenario: Daily Stage chip
- **WHEN** today's Daily Stage has not been played
- **THEN** its chip shows a highlighted "new" state, and after it is played shows the day's best score

#### Scenario: Settings as a gear
- **WHEN** the World Map header is shown
- **THEN** the Settings entry shows a gear icon with no visible text, at the top-right corner of the header, with a face no taller than the Status Chips

#### Scenario: Gear stays put when chips wrap
- **WHEN** the Status Chips do not fit on one line
- **THEN** they wrap across the full width below the Streak chip and the gear, and the gear stays at the top-right corner

#### Scenario: Settings gear is accessible
- **WHEN** a screen reader focuses the gear
- **THEN** it is announced as a button named with the localized Settings label, and activating it opens Settings

### Requirement: Dog on the map
The system SHALL show the user's customized Dog avatar (`BreedArt` using the Dog's `breed` and `coat`) on the map at the next-up Node, standing on the open side of the path, and SHALL show an amber aura and Rusty Dog status while the Dog is Rusty.

#### Scenario: Dog follows progress
- **WHEN** the user completes a Node and the next-up Node advances
- **THEN** the customized Dog avatar is positioned beside the new next-up Node

#### Scenario: Dog reflects breed and coat
- **WHEN** the user has selected a breed and coat in onboarding or settings
- **THEN** the Dog marker on the World Map displays the matching breed silhouette and coat colors

#### Scenario: Rusty Dog on map
- **WHEN** the Dog is in the Rusty Dog state
- **THEN** the Dog marker displays an amber attention aura and announces the Rusty state in its accessibility label

### Requirement: Existing prompts keep their place
The system SHALL keep the Rusty warm-up prompt, the skipped-warm-up note and the account banner on the World Map, shown above the map and never covering a Node.

#### Scenario: Rusty prompt
- **WHEN** the Dog is Rusty and the user has not chosen yet
- **THEN** the warm-up prompt with Warm-up and Skip actions is shown above the map

#### Scenario: Account banner
- **WHEN** a non-blocking account banner exists
- **THEN** it is shown above the map without hiding the chips

### Requirement: Theory Library entry
The system SHALL keep a Library entry visible with the other status chips at the top of the World Map. It SHALL open the Theory Library and SHALL show an indicator while a Lesson is marked "for today".

#### Scenario: Entry visible while scrolled
- **WHEN** the user has scrolled down the map
- **THEN** the Library entry remains visible

#### Scenario: Indicator
- **WHEN** a Lesson is marked "for today"
- **THEN** the entry shows a dot and a text label, not colour alone

#### Scenario: Narrow screen
- **WHEN** the status chips do not fit on one line
- **THEN** they wrap onto a further line with nothing clipped and the Library entry still visible

#### Scenario: Back to the map
- **WHEN** the user leaves the Theory Library
- **THEN** the World Map is shown at its previous scroll position
