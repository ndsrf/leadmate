# Spec Delta

## ADDED Requirements

### Requirement: Diary entry
The Streak chip at the top of the World Map SHALL open the Diary. The system SHALL NOT show a separate Diary chip. The Streak chip's accessible label SHALL say that it opens the Diary.

#### Scenario: Open from the Streak chip
- **WHEN** the user taps the Streak chip, whether or not a Streak is running
- **THEN** the Diary opens over the map

#### Scenario: Entry visible while scrolled
- **WHEN** the user has scrolled down the map
- **THEN** the Streak chip remains visible and still opens the Diary

#### Scenario: Screen reader
- **WHEN** a screen reader focuses the Streak chip
- **THEN** it announces the Streak and the Diary
