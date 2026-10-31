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
- **WHEN** a Lesson is the second Stop of World 3's first Stretch
- **THEN** its Library entry shows "Mundo 3 · Tramo 1" instead of a suggested day

#### Scenario: Basics Lesson entry
- **WHEN** a Lesson is the first Stop of World 1's first Stretch
- **THEN** its Library entry shows "Mundo 1 · Tramo 1"
