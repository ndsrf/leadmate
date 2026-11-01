## ADDED Requirements

### Requirement: Taste briefing
The system SHALL show a text-only briefing screen after the Dog's name and look and before the taste Stage starts, with one primary button that starts the Stage. All its text SHALL come from the i18n catalog.

#### Scenario: Content
- **WHEN** the briefing is shown
- **THEN** it names the Dog, says the user will walk the Dog and that another dog will approach, and gives the goal as keeping the Dog calm by moving away from the other dog
- **AND** it does not mention the Marker or promise that the Dog will stay calm

#### Scenario: Briefing before the taste
- **WHEN** the user finishes the Dog's name and look
- **THEN** the briefing is shown and the taste Stage has not started

#### Scenario: Starting the taste
- **WHEN** the user presses the briefing's button
- **THEN** the taste Stage starts, with its Coach marks, from its beginning

#### Scenario: Time does not run while reading
- **WHEN** the briefing is shown for any length of time
- **THEN** the taste Stage's time limit has not started counting

#### Scenario: Closed during the briefing
- **WHEN** the app is closed during the briefing and reopened
- **THEN** the briefing is shown again before the taste Stage

#### Scenario: Shown on every entry
- **WHEN** the taste is entered again, after a progress reset or after the app is closed during the Stage
- **THEN** the briefing is shown before the Stage starts

#### Scenario: Not a recorded step
- **WHEN** the briefing is shown or dismissed
- **THEN** the Dog record is unchanged apart from the onboarding step, and no `seenHints` entry is recorded

## MODIFIED Requirements

### Requirement: Funnel order
The system SHALL show the splash first, which for a new user stays up as the welcome screen, and then present the funnel in this order: the welcome screen, the Dog's name and look, the taste briefing, the taste Stage with its payoff, Dog setup (Equipment, weights, Trigger Profile questionnaire), the Diagnostic, the diagnostic card and Walk Plan, the introductory Theory Primer and Checkpoint, the guided first Stage walk, the Debrief, the registration prompt, and the soft paywall.

#### Scenario: First run
- **WHEN** a user opens the app for the first time
- **THEN** the splash gives way to the welcome actions on the same screen and requires no email or password

#### Scenario: Play before questions
- **WHEN** a new user moves through the funnel
- **THEN** the taste briefing and Stage are shown before any Dog setup question is asked

#### Scenario: Paywall precedes the first Stage
- **WHEN** the user finishes the guided first Stage and the registration prompt
- **THEN** the soft paywall is shown, and no paywall is shown before the first Stage

#### Scenario: Registration returns to the paywall
- **WHEN** the user creates an account from the registration prompt after the first Stage
- **THEN** the user lands on the soft paywall, not the World Map

#### Scenario: After the funnel
- **WHEN** the registration prompt and the soft paywall are done or skipped
- **THEN** the user lands on the World Map
