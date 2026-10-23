## ADDED Requirements

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
