# Spec Delta

## MODIFIED Requirements

### Requirement: Map of Worlds and Nodes
The system SHALL show the World Map as a continuous winding trail traversing titled World regions, rendering active worlds with visible Stops along the path, the immediately next locked world with an unlock requirement banner, and subsequent locked worlds as compact collapsible headers.

#### Scenario: Worlds listed
- **WHEN** the World Map is shown
- **THEN** every World appears in order with its title, its completed-over-total Stop count ("X de Y paradas"), and its thematic topic summary

#### Scenario: Locked World
- **WHEN** a World is not yet unlocked
- **THEN** it appears with its unlock requirement and its Stops are not openable

#### Scenario: Active World path connectors
- **WHEN** an active or unlocked World is displayed
- **THEN** completed Stop segments connect via solid ink-outlined paths and upcoming or locked segments connect via dashed dotted trails

#### Scenario: Next locked World banner
- **WHEN** a World is the first locked World in sequence
- **THEN** it displays an unlock requirement banner above its path naming the preceding World and its final missing Stop

#### Scenario: Subsequent locked Worlds collapsed
- **WHEN** a World follows an already-locked World
- **THEN** it is displayed as a compact collapsible header row with a lock icon, and tapping the header toggles inline expansion of its trail

#### Scenario: Long World
- **WHEN** a World holds twelve or more Stops
- **THEN** every Stop is drawn on the trail without overlap and the map scrolls vertically only

### Requirement: Node states
The system SHALL show each Stop as exactly one of locked, open, next-up, waiting or completed. A completed Node Stop SHALL show its star rating. Only a Mission Stop can be waiting.

#### Scenario: Next-up Node
- **WHEN** at least one open Stop is not completed
- **THEN** the first such Stop in World order is marked next-up with amber fill, a soft looping attention animation, and a "Siguiente" badge pill, and the map scrolls it into view on opening the World Map

#### Scenario: Open Node
- **WHEN** a Stop is unlocked and ready but is not the primary next-up Stop
- **THEN** it renders with a light paper surface disc and the glyph of its kind

#### Scenario: Completed Node
- **WHEN** a Node Stop is completed with 2 stars
- **THEN** it shows two filled stars and one empty star below the Stop

#### Scenario: Completed Lesson or Mission Stop
- **WHEN** a Lesson Stop is read or a Mission Stop is passed
- **THEN** it shows the completed disc with a checkmark and no stars, and a Mission passed with "keep practising" also shows that mark

#### Scenario: Waiting Mission
- **WHEN** a Mission has been started or checked in today
- **THEN** its Stop shows a waiting state (a moon glyph and a label saying when the check-in opens: "Mañana", or "A las 07:50" when the 8-hour minimum ends after midnight) instead of next-up, and is not counted as next-up

#### Scenario: Check-in due
- **WHEN** a Mission's check-in is open
- **THEN** its Stop is next-up with the badge "¿Cómo fue?"

#### Scenario: Locked Node reason
- **WHEN** the user presses a locked Stop
- **THEN** the system names what is still missing (the earlier Stops of its Stretch, or the Mission that must be passed first) and does not open the Stop

### Requirement: Dog on the map
The system SHALL show the user's customized Dog avatar (`BreedArt` using the Dog's `breed` and `coat`) on the map at the next-up Stop, or at the waiting Mission when there is no next-up Stop, standing on the open side of the path, and SHALL show an amber aura and Rusty Dog status while the Dog is Rusty.

#### Scenario: Dog follows progress
- **WHEN** the user completes a Stop and the next-up Stop advances
- **THEN** the customized Dog avatar is positioned beside the new next-up Stop

#### Scenario: Dog waits at a Mission
- **WHEN** every available Stop is done and a Mission is waiting
- **THEN** the Dog avatar is placed beside that Mission in a resting pose

#### Scenario: Dog reflects breed and coat
- **WHEN** the user has selected a breed and coat in onboarding or settings
- **THEN** the Dog marker on the World Map displays the matching breed silhouette and coat colors

#### Scenario: Rusty Dog on map
- **WHEN** the Dog is in the Rusty Dog state
- **THEN** the Dog marker displays an amber attention aura and announces the Rusty state in its accessibility label

## ADDED Requirements

### Requirement: Stop kinds are distinguishable
Each Stop SHALL show a glyph for its kind (a book for a theory Lesson, a controller for a how-to-play Lesson, a paw for a Node, a flag for a Mission). Its accessibility label SHALL name the kind and title, so kind is never shown by icon or colour alone.

#### Scenario: Screen reader on a Stop
- **WHEN** a screen reader focuses a Mission Stop
- **THEN** it announces "Misión" with the Mission title and its state

### Requirement: Stretch boundaries
The trail SHALL mark the end of each Stretch at its Mission Stop with a flag and a "Tramo N" label. A user SHALL be able to tell how much of the current Stretch is left.

#### Scenario: Current Stretch
- **WHEN** the user is in the second Stretch of a World
- **THEN** the map shows "Tramo 2" at its Mission and the Stops of that Stretch between the previous flag and this one

### Requirement: Opening a Stop
Pressing an available Stop SHALL open it by kind: a Lesson Stop opens the Lesson screen, a Node Stop starts the Node, and a Mission Stop opens its brief or check-in. Finishing it SHALL return to the World Map at the same scroll position.

#### Scenario: Lesson Stop
- **WHEN** the user presses an open Lesson Stop and reaches "Done"
- **THEN** the Lesson is marked read, the user returns to the World Map and the next Stop becomes next-up
