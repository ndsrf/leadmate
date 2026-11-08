# settings-screen Specification

## Purpose

Enables users to navigate and configure dog profile attributes, app preferences, and account management through organized area tabs in the Settings screen.

## Requirements

### Requirement: Area tab navigation
The Settings screen SHALL provide an area selector at the top featuring three distinct tabs: "Perro" (Dog), "Preferencias" (Preferences), and "Cuenta" (Account). The "Perro" tab SHALL be active by default upon opening Settings. Selecting a tab SHALL switch the visible settings content immediately without reloading or closing the screen. Returning to Settings from authentication SHALL reopen on the "Cuenta" tab.

#### Scenario: Initial display defaults to Perro tab
- **WHEN** the user opens Settings from the World Map
- **THEN** the "Perro" tab is highlighted as selected and its corresponding settings sections are visible

#### Scenario: Switching between area tabs
- **WHEN** the user presses the "Preferencias" tab
- **THEN** the "Preferencias" tab becomes selected, preference sections become visible, and the "Perro" and "Cuenta" sections are hidden

#### Scenario: Return from authentication
- **WHEN** the user returns to Settings from the account login flow
- **THEN** Settings reopens with the "Cuenta" tab active

### Requirement: Pinned header navigation
The Settings screen SHALL render the screen title and area selector tabs within the pinned header, keeping them visible while the active area's content scrolls underneath.

#### Scenario: Scrolling within an area
- **WHEN** the user scrolls down within any Settings area
- **THEN** the screen title and area tabs remain pinned at the top of the viewport

### Requirement: Section grouping by area
The Settings screen SHALL partition configuration sections across the three area tabs: "Perro" contains dog identity, traits, equipment, and reactivity; "Preferencias" contains checkpoint timing, interface feedback, appearance, and voice cues; "Cuenta" contains subscription, account sync, progress reset, and developer tools.

#### Scenario: Perro tab contents
- **WHEN** the "Perro" tab is active
- **THEN** the user can edit dog name, coat, equipment, concerns, and trigger levels, while appearance and account settings are not displayed

#### Scenario: Preferencias tab contents
- **WHEN** the "Preferencias" tab is active
- **THEN** the user can adjust checkpoint time, interface feedback, appearance theme, voice pack, and custom cue audio

#### Scenario: Cuenta tab contents
- **WHEN** the "Cuenta" tab is active
- **THEN** the user can review subscription status, manage account sync or login, and initiate progress reset

### Requirement: Persistent close action
The Settings screen SHALL keep the close action ("Cerrar") accessible across all area tabs so the user can dismiss Settings at any time.

#### Scenario: Dismissing Settings from any tab
- **WHEN** the user presses the close button on any active tab
- **THEN** the Settings screen closes and returns to the World Map

### Requirement: Developer tools and unlock interaction
The Settings screen SHALL display the app version label on the "Cuenta" tab. Tapping the version label repeatedly (7 taps within 3 seconds) SHALL unlock the beta content channel selector and test tools within the "Cuenta" tab, matching the behavior in development builds.

#### Scenario: Version display and beta unlock on Cuenta tab
- **WHEN** the user navigates to the "Cuenta" tab in a production build and taps the version label 7 times within 3 seconds
- **THEN** the Content Channel and Test Tools sections appear on the "Cuenta" tab

### Requirement: Tab accessibility
The area selector tabs SHALL be accessible to screen readers and assistive technology, announcing their accessible role, label, and current selection state.

#### Scenario: Tab accessibility state
- **WHEN** an assistive technology inspects the area tabs
- **THEN** each tab declares its accessible name and whether it is currently selected
