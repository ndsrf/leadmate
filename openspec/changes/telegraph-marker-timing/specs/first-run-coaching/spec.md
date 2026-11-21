# Spec Delta

## ADDED Requirements

### Requirement: Guided first Stage meets the approach ring
The guided first Stage SHALL show the telegraph at Full assist whatever the stored assist level, so the first Fixation a new user meets comes with the open ring, the count-in ticks, the Marker highlight and the rhythm Hint. Its Marker presses SHALL count toward the assist like those of any recorded Stage, and its Coach marks SHALL be unchanged.

#### Scenario: First Fixation
- **WHEN** the Dog fixates in the guided first Stage and the user stops
- **THEN** the rhythm Hint is shown, the ring closes with three ticks, and the Marker button is highlighted when it lands

#### Scenario: Coach mark and highlight together
- **WHEN** the Marker Coach mark is still shown as the ring lands
- **THEN** both are shown, neither covers the Marker button, and a press takes effect at once

#### Scenario: Stopping wins the beat
- **WHEN** the user stops as soon as the Dog fixates in the guided first Stage and stays stopped
- **THEN** the Dog disengages before its Distractor leaves, so the ring lands

### Requirement: Rhythm Hint at the first Fixation
When the Dog first fixates in a recorded Stage at Full assist and the rhythm Hint has not been seen, the system SHALL show the rhythm Hint ("Stop and wait for the ring to close, then tap Marker.") in place of the first-Fixation Marker Hint, and SHALL record both as seen in `seenHints`. It SHALL have no short form, SHALL NOT block input, and SHALL take its text from the i18n catalog. Below Full, the Marker Hint rule SHALL apply unchanged.

#### Scenario: New user
- **WHEN** a new Dog first fixates in the guided first Stage
- **THEN** the rhythm Hint is shown instead of the Marker Hint, and both are recorded as seen

#### Scenario: Seen already
- **WHEN** the Dog first fixates in a later Stage after the rhythm Hint was seen
- **THEN** neither the rhythm Hint nor the Marker Hint is shown

#### Scenario: Existing Dog that saw the Marker Hint
- **WHEN** a Dog that saw the Marker Hint before this change first fixates in a Stage at Full assist
- **THEN** the rhythm Hint is shown once

#### Scenario: Assist below Full
- **WHEN** the Dog first fixates at Ring only and the rhythm Hint has not been seen
- **THEN** no rhythm Hint is shown

#### Scenario: Taste Stage
- **WHEN** the Dog fixates in the Taste Stage
- **THEN** no rhythm Hint is shown and nothing is recorded

#### Scenario: Progress reset
- **WHEN** the user resets progress and the Dog next fixates at Full assist
- **THEN** the rhythm Hint is shown again
