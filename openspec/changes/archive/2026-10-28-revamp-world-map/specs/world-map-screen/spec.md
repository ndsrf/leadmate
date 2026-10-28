# Spec Delta

## MODIFIED Requirements

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
