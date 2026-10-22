## MODIFIED Requirements

### Requirement: Splash on launch
The system SHALL show a branded splash on every cold start, SHALL keep it up until the Dog record and display font are loaded and for a short minimum time so it does not flash, and SHALL then show the first screen the Dog's onboarding state calls for. The splash SHALL NOT accept input while it loads and SHALL NOT delay launch by more than 2.5 seconds beyond the time loading takes. For a new user the same screen stays up once loading is done, as the welcome screen.

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

#### Scenario: New user
- **WHEN** loading is done and the Dog is at the first-run step
- **THEN** the splash's loader is replaced by the welcome actions on the same screen, with no second screen in between

### Requirement: Launch routing
After the splash the system SHALL route by the persisted onboarding step: to the onboarding funnel while the funnel is unfinished, to the guided first Stage when that is the next step, and otherwise to the World Map.

#### Scenario: First run
- **WHEN** a new user passes the splash
- **THEN** the welcome actions are shown on the splash screen itself

#### Scenario: Returning user
- **WHEN** a user who has finished the funnel passes the splash
- **THEN** the World Map is shown

#### Scenario: Killed mid-funnel
- **WHEN** the app is reopened during the funnel
- **THEN** the splash is followed by the funnel's next step
