# Spec Delta

## ADDED Requirements

### Requirement: Always show timing help option
The "Preferencias" tab SHALL offer an "always show timing help" switch in its interface feedback section, off by default, with a one-line explanation from the i18n catalog. It SHALL be stored on the device with the UI sound and haptic settings, SHALL take effect from the next Stage (a change made while a Stage is paused does not change that Stage), SHALL NOT sync with the account, and SHALL be kept when progress is reset.

#### Scenario: Turning it on
- **WHEN** the user turns on "always show timing help"
- **THEN** the next walking Stage shows the telegraph at Full assist

#### Scenario: Default
- **WHEN** a user opens the "Preferencias" tab for the first time
- **THEN** the switch is off

#### Scenario: Progress reset
- **WHEN** the user turns the switch on and then resets progress
- **THEN** the switch is still on

#### Scenario: Accessible switch
- **WHEN** an assistive technology inspects the switch
- **THEN** it announces its label and whether it is on

## MODIFIED Requirements

### Requirement: Section grouping by area
The Settings screen SHALL partition configuration sections across the three area tabs: "Perro" contains dog identity, traits, equipment, and reactivity; "Preferencias" contains checkpoint timing, interface feedback (including the "always show timing help" switch), appearance, voice cues, and language selection; "Cuenta" contains subscription, account sync, progress reset, and developer tools.

#### Scenario: Perro tab contents
- **WHEN** the "Perro" tab is active
- **THEN** the user can edit dog name, coat, equipment, concerns, and trigger levels, while appearance and account settings are not displayed

#### Scenario: Preferencias tab contents
- **WHEN** the "Preferencias" tab is active
- **THEN** the user can adjust checkpoint time, interface feedback, the "always show timing help" switch, appearance theme, voice pack, custom cue audio, and active language

#### Scenario: Cuenta tab contents
- **WHEN** the "Cuenta" tab is active
- **THEN** the user can review subscription status, manage account sync or login, and initiate progress reset
