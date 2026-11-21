# Spec Delta

## MODIFIED Requirements

### Requirement: Section grouping by area
The Settings screen SHALL partition configuration sections across the three area tabs: "Perro" contains dog identity, traits, equipment, and reactivity; "Preferencias" contains checkpoint timing, interface feedback, appearance, voice cues, language selection, and usage analytics; "Cuenta" contains subscription, account sync, progress reset, and developer tools.

#### Scenario: Perro tab contents
- **WHEN** the "Perro" tab is active
- **THEN** the user can edit dog name, coat, equipment, concerns, and trigger levels, while appearance and account settings are not displayed

#### Scenario: Preferencias tab contents
- **WHEN** the "Preferencias" tab is active
- **THEN** the user can adjust checkpoint time, interface feedback, appearance theme, voice pack, custom cue audio, active language, and the usage analytics switch

#### Scenario: Cuenta tab contents
- **WHEN** the "Cuenta" tab is active
- **THEN** the user can review subscription status, manage account sync or login, and initiate progress reset

## ADDED Requirements

### Requirement: Usage analytics switch
The "Preferencias" tab SHALL show a usage analytics section with an on/off switch and a short line saying the data is anonymous, never includes the Dog's name or email, and helps improve the game. The switch SHALL show the current choice, SHALL apply as soon as it is pressed without closing Settings, and its text SHALL come from the i18n catalog.

#### Scenario: Default state
- **WHEN** a new user opens the "Preferencias" tab
- **THEN** the usage analytics switch is shown on

#### Scenario: Turning it off
- **WHEN** the user turns the switch off
- **THEN** the switch shows off at once and no further analytics event is sent

#### Scenario: Choice kept
- **WHEN** the user turned the switch off, closes Settings and restarts the app
- **THEN** the switch still shows off

#### Scenario: Available without an account
- **WHEN** a signed-out user opens the "Preferencias" tab
- **THEN** the switch is shown and can be changed

#### Scenario: Accessible switch
- **WHEN** an assistive technology inspects the switch
- **THEN** it announces its label and whether it is on or off

#### Scenario: Localized
- **WHEN** the app language is Spanish
- **THEN** the section title, switch label and explanation are in Spanish
