# Spec Delta

## ADDED Requirements

### Requirement: Guided first Stage overview card
The Primer of the guided first Stage SHALL include an overview card, after the card on movement controls and before the Checkpoint, that shows a capture of the real Stage with labels on the controls on screen and on the signs shown over or around the Dog, each with a short explanation in the localized text. It SHALL name the Dog only where needed, SHALL NOT start any Stage time, and SHALL appear on every entry to the Primer. The Taste Stage and its briefing SHALL be unchanged.

#### Scenario: Card in the Primer
- **WHEN** the user continues from the Walk Plan to the Primer
- **THEN** the overview card is shown with the labelled capture before the Checkpoint

#### Scenario: Time does not run
- **WHEN** the overview card is shown for any length of time
- **THEN** no Stage time has started

#### Scenario: Taste unchanged
- **WHEN** the Taste Stage starts
- **THEN** it has no overview card and its briefing is unchanged

#### Scenario: Every sign listed
- **WHEN** the Stage's sign list is checked
- **THEN** every sign that has an overview line appears in the card's labels

### Requirement: Dog signs in the walking How-to-play Lesson
The walking How-to-play Lesson SHALL include a control, "Las señales del perro", that shows the Dog signs the guided first Stage can reach, using the same capture and the same localized text as the overview card and the Hints.

#### Scenario: Looking the signs up
- **WHEN** the user opens the walking How-to-play Lesson after the first Stage
- **THEN** the Dog signs control is shown with the capture and the same text as the Hints

#### Scenario: Same text
- **WHEN** a Dog sign's explanation is changed in the catalog
- **THEN** the Hint, the overview label and the Lesson show the change

