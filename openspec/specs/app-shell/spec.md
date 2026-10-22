# app-shell Specification

## Purpose
Defines how the app starts and moves between screens: the branded Splash, routing by onboarding state, the World Map as the main screen, and one place that decides which screen shows.

## Requirements

### Requirement: Splash on launch
The system SHALL show a branded splash on every cold start, SHALL keep it up until the Dog record and display font are loaded and for a short minimum time so it does not flash, and SHALL then show the first screen the Dog's onboarding state calls for. The splash SHALL NOT accept input and SHALL NOT delay launch by more than 2 seconds beyond the time loading takes.

#### Scenario: Cold start
- **WHEN** the user opens the app
- **THEN** the splash is shown until loading is done and then gives way to the next screen

#### Scenario: Slow storage
- **WHEN** loading the Dog record takes longer than the minimum splash time
- **THEN** the splash stays until it finishes and no blank or text-only loading screen appears

#### Scenario: Back from background
- **WHEN** the app returns from the background without having been closed
- **THEN** no splash is shown

#### Scenario: Reduced motion
- **WHEN** the device prefers reduced motion
- **THEN** the splash uses a plain fade and no looping animation

### Requirement: Launch routing
After the splash the system SHALL route by the persisted onboarding step: to the onboarding funnel while the funnel is unfinished, to the guided first Stage when that is the next step, and otherwise to the World Map.

#### Scenario: First run
- **WHEN** a new user passes the splash
- **THEN** Dog setup is shown

#### Scenario: Returning user
- **WHEN** a user who has finished the funnel passes the splash
- **THEN** the World Map is shown

#### Scenario: Killed mid-funnel
- **WHEN** the app is reopened during the funnel
- **THEN** the splash is followed by the funnel's next step

### Requirement: World Map is the main screen
The World Map SHALL be the main screen, SHALL be reached from Settings, Node flows, the Daily Stage, warm-up and registration by finishing or leaving them, and SHALL NOT be accompanied by a persistent tab bar. Settings SHALL remain reachable from the World Map's Settings chip.

#### Scenario: Leaving a flow
- **WHEN** the user finishes or exits a Node, the Daily Stage or the warm-up
- **THEN** the World Map is shown

#### Scenario: Settings round trip
- **WHEN** the user opens Settings from the map and closes it
- **THEN** the World Map is shown with its scroll position kept

#### Scenario: Auth from Settings
- **WHEN** the user opens log in from Settings and finishes or goes back
- **THEN** Settings is shown again

### Requirement: Single place for navigation decisions
The decision of which screen to show SHALL depend only on the loaded state, the onboarding step and the active flow, so that no combination of them shows two screens or none.

#### Scenario: Funnel wins over the map
- **WHEN** the onboarding step is inside the funnel
- **THEN** no map or Settings screen is shown, even if a flow was left active

### Requirement: Localized shell text
All splash text added by the shell SHALL come from the i18n catalog.

#### Scenario: Spanish
- **WHEN** the device language is Spanish
- **THEN** the splash tagline appears in Spanish
