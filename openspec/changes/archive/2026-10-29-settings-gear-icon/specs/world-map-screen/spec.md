## MODIFIED Requirements

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
