# Spec Delta

## ADDED Requirements

### Requirement: Diary entry
The system SHALL keep a Diary entry visible with the other status chips at the top of the World Map. It SHALL open the Diary.

#### Scenario: Entry visible while scrolled
- **WHEN** the user has scrolled down the map
- **THEN** the Diary entry remains visible

#### Scenario: Narrow screen
- **WHEN** the status chips do not fit on one line
- **THEN** they wrap onto a further line with nothing clipped and the Diary entry still visible
