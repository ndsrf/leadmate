# Spec Delta

## MODIFIED Requirements

### Requirement: Theory Library
The system SHALL provide a Theory Library listing every Lesson in a fixed order, each entry showing its title, its kind, its suggested day (or, for a trail Lesson, its World and Stretch), an estimated reading time and whether it has been read.

#### Scenario: Library listed
- **WHEN** the user opens the Theory Library
- **THEN** every Lesson appears in order with title, kind, suggested day or trail place, estimated minutes and a read or unread state that does not rely on colour alone

#### Scenario: Library offline
- **WHEN** the device is offline
- **THEN** the Library and the text and bundled-image parts of every Lesson remain fully readable

#### Scenario: Trail Lesson entry
- **WHEN** a Lesson is the second Stop of World 2's first Stretch
- **THEN** its Library entry shows "Mundo 2 · Tramo 1" instead of a suggested day

## ADDED Requirements

### Requirement: Lesson kinds
Every Lesson SHALL be of kind `theory` (how to train the real dog) or `how-to-play` (how to use the simulator's controls and read the virtual Dog). A how-to-play Lesson SHALL show each control it covers with an annotated image or clip of the actual control.

#### Scenario: How-to-play Lesson
- **WHEN** the user opens the how-to-play Lesson before the first walking Stage
- **THEN** it shows the joystick, how the leash goes slack or taut, the Poste and Go Sniff, each with an annotated image or clip

#### Scenario: Kind label
- **WHEN** a Lesson is shown in the Library or at the top of the Lesson screen
- **THEN** its kind is named in text ("Teoría" or "Cómo se juega")

### Requirement: Trail Lessons
A Lesson MAY be placed on a World's trail as a Lesson Stop. Such a Lesson SHALL have no suggested day and SHALL never be marked "for today". It SHALL stay openable from the Library at any time. Reading it from the Library or from the trail SHALL complete its Stop.

#### Scenario: Read from the Library first
- **WHEN** the user reads a trail Lesson from the Library before reaching its Stop
- **THEN** that Lesson Stop shows as completed when the trail reaches it, and the Stop after it becomes available

#### Scenario: Not for today
- **WHEN** it is day 3 and an unread trail Lesson exists
- **THEN** the "for today" choice considers only Lessons with a suggested day

#### Scenario: Reading ahead does not pass a Mission
- **WHEN** the user reads, from the Library, a trail Lesson that comes after a waiting Mission
- **THEN** the Lesson is marked read and the Stops after the Mission stay locked

### Requirement: Fixes kept in the Library
The Theory Library SHALL include a "Tus ajustes" section listing every Fix the user has been shown, most recent first, each naming its Mission and problem. A Fix SHALL be readable from there at any time and offline. The section SHALL be hidden while empty.

#### Scenario: Fix kept
- **WHEN** the user has been shown the Fix for "Se excita al ver el arnés"
- **THEN** the Library's "Tus ajustes" section lists it with the harness Mission's name and opens the same Fix page

#### Scenario: No Fixes yet
- **WHEN** the user has never been shown a Fix
- **THEN** the Library shows no "Tus ajustes" section

#### Scenario: Fixes across devices and reset
- **WHEN** two devices have seen different Fixes, or the user confirms Reset Progress
- **THEN** after sync the section lists the union, and after a reset it is empty
