# localization Specification

## Purpose
Ensures all user-visible text can be provided in any language by adding a text catalog, so new languages cost little effort later.

## Requirements
### Requirement: Text from a catalog
The system SHALL display all user-visible text from a per-language text catalog and SHALL NOT embed text in code or images.

#### Scenario: Spanish shipped
- **WHEN** the app runs in the first release
- **THEN** all text is shown in Spanish from the Spanish catalog

### Requirement: Fallback to Spanish
The system SHALL show the Spanish text when the chosen language lacks a key, and SHALL NOT show a raw key.

#### Scenario: Missing key
- **WHEN** a key is absent in the selected language
- **THEN** the Spanish text for that key is shown

### Requirement: Catalog shared with the simulation
The app shell SHALL own the active language and supply the text the simulation needs, and the standalone simulation page in a desktop browser SHALL default to Spanish.

#### Scenario: Simulation text
- **WHEN** a Stage starts in the app
- **THEN** the simulation's labels use the shell's active language

#### Scenario: Desktop debug page
- **WHEN** the simulation page is opened on its own in Chrome
- **THEN** its labels appear in Spanish

### Requirement: Layout tolerates longer text
The system SHALL lay out text so that strings 40% longer than the Spanish text do not overflow or overlap controls, and SHALL use icons for the Marker button.

#### Scenario: Long string
- **WHEN** a label is replaced with a string 40% longer
- **THEN** it displays without overlapping other controls
