# Spec Delta

## MODIFIED Requirements

### Requirement: Persistent status chips
The system SHALL keep the Streak, the Daily Stage and the Settings entry visible at the top of the World Map while the map scrolls. The Map Header SHALL show its entries as a single row that wraps, in this order: the Streak chip, the Library entry, the Settings entry, the Daily Stage chip, the Daily Barkdoku chip. The Settings entry SHALL be a compact, icon-only gear button. It SHALL keep at least the minimum touch target and SHALL expose the localized Settings name to screen readers.

#### Scenario: Scrolled map
- **WHEN** the user has scrolled down the map
- **THEN** the Streak chip, the Daily Stage chip and Settings remain visible

#### Scenario: Daily Stage chip
- **WHEN** today's Daily Stage has not been played
- **THEN** its chip shows a highlighted "new" state, and after it is played shows the day's best score

#### Scenario: Header order
- **WHEN** the World Map header is shown
- **THEN** its entries appear in reading order as Streak ("X días seguidos"), Biblioteca, the Settings gear, El Paseo del Día, Guaudoku, and no other entry sits between them

#### Scenario: Settings as a gear
- **WHEN** the World Map header is shown
- **THEN** the Settings entry shows a gear icon with no visible text, between the Library entry and the Daily Stage chip, with a face no taller than the Status Chips

#### Scenario: Gear stays put when chips wrap
- **WHEN** the header entries do not fit on one line
- **THEN** they wrap onto further lines in the same order, the gear keeping its place after the Library entry and before the Daily Stage chip, with nothing clipped

#### Scenario: Settings gear is accessible
- **WHEN** a screen reader focuses the gear
- **THEN** it is announced as a button named with the localized Settings label, and activating it opens Settings

### Requirement: Diary entry
The Streak chip at the top of the World Map SHALL open the Diary. The system SHALL NOT show a separate Diary chip or any other "Diario" button in the Map Header. The Streak chip's accessible label SHALL say that it opens the Diary.

#### Scenario: Open from the Streak chip
- **WHEN** the user taps the Streak chip, whether or not a Streak is running
- **THEN** the Diary opens over the map

#### Scenario: No Diario chip
- **WHEN** the World Map header is shown
- **THEN** no chip labelled "Diario" is present, and the Streak chip is the only header entry that opens the Diary

#### Scenario: Entry visible while scrolled
- **WHEN** the user has scrolled down the map
- **THEN** the Streak chip remains visible and still opens the Diary

#### Scenario: Screen reader
- **WHEN** a screen reader focuses the Streak chip
- **THEN** it announces the Streak and the Diary
