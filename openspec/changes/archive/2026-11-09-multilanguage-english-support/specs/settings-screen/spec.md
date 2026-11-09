# Spec Delta

## MODIFIED Requirements

### Requirement: Section grouping by area
The Settings screen SHALL partition configuration sections across the three area tabs: "Perro" contains dog identity, traits, equipment, and reactivity; "Preferencias" contains checkpoint timing, interface feedback, appearance, voice cues, and language selection; "Cuenta" contains subscription, account sync, progress reset, and developer tools.

#### Scenario: Perro tab contents
- **WHEN** the "Perro" tab is active
- **THEN** the user can edit dog name, coat, equipment, concerns, and trigger levels, while appearance and account settings are not displayed

#### Scenario: Preferencias tab contents
- **WHEN** the "Preferencias" tab is active
- **THEN** the user can adjust checkpoint time, interface feedback, appearance theme, voice pack, custom cue audio, and active language

#### Scenario: Cuenta tab contents
- **WHEN** the "Cuenta" tab is active
- **THEN** the user can review subscription status, manage account sync or login, and initiate progress reset

## ADDED Requirements

### Requirement: Language selection in preferences
The Settings screen SHALL provide an "Idioma / Language" selector on the "Preferencias" tab offering Spanish and English, highlighting the active selection, and immediately switching the visible Settings interface and content pack without dismissing or reloading the screen.

#### Scenario: Switching language from settings
- **WHEN** the user selects a different language on the "Preferencias" tab
- **THEN** the application shell, settings labels, and content translations switch immediately to the chosen language

#### Scenario: Selection state indicator
- **WHEN** the "Preferencias" tab is visible
- **THEN** the currently active language is clearly shown as selected
