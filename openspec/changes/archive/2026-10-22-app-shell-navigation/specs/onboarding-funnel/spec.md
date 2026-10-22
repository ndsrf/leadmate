## MODIFIED Requirements

### Requirement: Funnel order
The system SHALL show the splash first, and then present the funnel in this order: Dog setup (Equipment, weights, Trigger Profile questionnaire), the Diagnostic, the diagnostic card and Walk Plan, the soft paywall, the guided first Stage, and the registration prompt.

#### Scenario: First run
- **WHEN** a user opens the app for the first time
- **THEN** the splash is followed by Dog setup and requires no email or password

#### Scenario: Paywall precedes the first Stage
- **WHEN** the user leaves the paywall screen by either button
- **THEN** the guided first Stage starts

#### Scenario: After the funnel
- **WHEN** the first Stage and the registration prompt are done or skipped
- **THEN** the user lands on the World Map

### Requirement: Resumable funnel
The system SHALL persist the current onboarding step and the answers entered so far after each step, SHALL resume at the last completed step after the app is closed, and SHALL mark the funnel complete once the paywall screen has been passed. A progress reset SHALL restore the first-run step so the funnel runs again from Dog setup.

#### Scenario: App killed mid-setup
- **WHEN** the app is closed after the weights step and reopened
- **THEN** the funnel resumes at the next step with earlier answers kept

#### Scenario: Returning user
- **WHEN** a user who passed the paywall screen reopens the app
- **THEN** the system does not show setup again

#### Scenario: After a reset
- **WHEN** the user resets progress
- **THEN** the funnel starts again at Dog setup with no earlier answers
