# Spec Delta

## ADDED Requirements

### Requirement: Primer media from bundled Lesson art
The system SHALL let a Primer card's image reference a bundled Lesson illustration by name and SHALL draw it from the bundle, offline, without the placeholder badge.

#### Scenario: Recap card shows the Lesson's art
- **WHEN** a Primer recap card names the illustration of the Lesson it recaps
- **THEN** the card draws that illustration with its caption and no placeholder badge

#### Scenario: Offline recap
- **WHEN** the device is offline and a Primer card names bundled art
- **THEN** the illustration is drawn

#### Scenario: Unknown name
- **WHEN** a Primer card names art that is not bundled
- **THEN** the themed placeholder is shown and the Primer can still be advanced
