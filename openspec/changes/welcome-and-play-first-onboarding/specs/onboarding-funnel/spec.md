## MODIFIED Requirements

### Requirement: Funnel order
The system SHALL show the splash first, and then present the funnel in this order: the welcome screen, the Dog's name and look, the taste Stage, the payoff screen, Dog setup (Equipment, weights, Trigger Profile questionnaire), the Diagnostic, the diagnostic card and Walk Plan, the guided first Stage, the registration prompt, and the soft paywall.

#### Scenario: First run
- **WHEN** a user opens the app for the first time
- **THEN** the splash is followed by the welcome screen and requires no email or password

#### Scenario: Play before questions
- **WHEN** a new user moves through the funnel
- **THEN** the taste Stage is played before any Dog setup question is asked

#### Scenario: Paywall precedes the first Stage
- **WHEN** the user finishes the guided first Stage and the registration prompt
- **THEN** the soft paywall is shown, and no paywall is shown before the first Stage

#### Scenario: Registration returns to the paywall
- **WHEN** the user creates an account from the registration prompt after the first Stage
- **THEN** the user lands on the soft paywall, not the World Map

#### Scenario: After the funnel
- **WHEN** the registration prompt and the soft paywall are done or skipped
- **THEN** the user lands on the World Map

### Requirement: Resumable funnel
The system SHALL persist the current onboarding step and the answers entered so far after each step, SHALL resume at the last completed step after the app is closed, and SHALL mark the funnel complete once the paywall step has been passed, and SHALL persist the paywall step before the registration prompt opens. A progress reset SHALL restore the first-run step and clear the Dog's name and coat so the funnel runs again from the welcome screen.

#### Scenario: App killed mid-setup
- **WHEN** the app is closed after the weights step and reopened
- **THEN** the funnel resumes at the next step with earlier answers kept

#### Scenario: Returning user
- **WHEN** a user who passed the paywall screen reopens the app
- **THEN** the system does not show setup again

#### Scenario: After a reset
- **WHEN** the user resets progress
- **THEN** the funnel starts again at the welcome screen with no earlier answers, and the Dog's name and coat are cleared

#### Scenario: User already in the old funnel
- **WHEN** a user who was at Dog setup or any later funnel step before the update reopens the app
- **THEN** the welcome, name and look, taste and payoff screens are not shown and the funnel resumes at that step

#### Scenario: Closed during the taste
- **WHEN** the app is closed during the taste Stage
- **THEN** reopening it shows the taste Stage again from its start

### Requirement: Diagnostic card and Walk Plan
The system SHALL display a diagnostic card based on the recorded reaction latency and SHALL generate a Walk Plan before the guided first Stage.

#### Scenario: Card and plan before paywall
- **WHEN** the user finishes the Diagnostic
- **THEN** the system shows the diagnostic card and Walk Plan
- **AND** only then the guided first Stage, with the soft paywall coming after it

### Requirement: Soft paywall stub
The system SHALL present a 7-day trial soft paywall after the guided first Stage and the registration prompt with a "Start trial" and a "Maybe later" button, SHALL let both continue to the World Map, SHALL record only a local `trialStartedAt` on "Start trial", and SHALL NOT check any entitlement or gate any content.

#### Scenario: Either button continues
- **WHEN** the user presses "Maybe later"
- **THEN** the user lands on the World Map and no content is locked

#### Scenario: Trial start recorded
- **WHEN** the user presses "Start trial"
- **THEN** `trialStartedAt` is recorded and the user lands on the World Map

## ADDED Requirements

### Requirement: Welcome screen
The system SHALL show a welcome screen to a new user after the splash, with a single primary button that continues the funnel and a secondary "I already have an account" link to login, and SHALL NOT ask for any input on it. A user who already has a Dog record past the first funnel steps SHALL NOT see it.

#### Scenario: One action
- **WHEN** a new user reaches the welcome screen
- **THEN** one primary button is offered and no form field is shown

#### Scenario: Existing account
- **WHEN** the user follows "I already have an account" and logs in, and a cloud Dog is found
- **THEN** that Dog replaces the first-run record and the funnel resumes at that Dog's own step

#### Scenario: Returning user
- **WHEN** a user who has finished the funnel opens the app
- **THEN** the welcome screen is not shown

### Requirement: Dog name and look
The system SHALL ask for the Dog's name and coat after the welcome screen, SHALL record both in the Dog record, SHALL require a name of 1 to 20 characters after trimming, and SHALL use the name in the funnel's later text. Coat SHALL NOT be asked again in Dog setup.

#### Scenario: Name and coat recorded
- **WHEN** the user enters "Luna" and picks a coat
- **THEN** the Dog record holds the name "Luna" and that coat

#### Scenario: Empty name
- **WHEN** the user tries to continue with a blank name
- **THEN** the system does not continue and asks for a name

#### Scenario: Name used in text
- **WHEN** the payoff screen is shown for a Dog named "Luna"
- **THEN** its text names Luna

#### Scenario: Dog without a name
- **WHEN** text that uses the Dog's name is shown for a Dog whose name is empty
- **THEN** it uses a neutral "your Dog" and the user is not prompted for a name

#### Scenario: Editable later
- **WHEN** the user later edits the Dog's name in settings
- **THEN** the new name is used wherever the name is shown

### Requirement: Taste Stage
The system SHALL run a taste Stage on the simulation after the Dog's name and look: a Stage whose scenario brings a strong trigger (another Dog with its owner) toward a Dog with no Cue skill, tuned so that it ends with the Dog Reactive for nearly any play. It SHALL end as soon as the Dog goes Reactive or after a time limit, SHALL show no Hints but one fixed control line that is not stored and goes away at the first input, and SHALL NOT change the Dog record: no Learning Attribute, Star, Streak, Diary entry, `seenHints` entry or node progress is recorded from it.

#### Scenario: The Dog reacts
- **WHEN** a new user plays the taste Stage
- **THEN** a trigger approaches, the Dog reacts, and the Stage ends on the Dog's reaction

#### Scenario: Control line, not a Hint
- **WHEN** the taste Stage starts
- **THEN** one fixed control line is shown and it disappears at the first input
- **AND** no `seenHints` entry is recorded

#### Scenario: Nothing is learned
- **WHEN** the taste Stage ends
- **THEN** the Dog record is unchanged apart from the onboarding step

#### Scenario: Succeeding anyway
- **WHEN** a user holds the Dog until the time limit
- **THEN** the Stage ends at the limit and the payoff screen is shown as for any other result

#### Scenario: Replayable only in the funnel
- **WHEN** the funnel is complete
- **THEN** the taste Stage is not offered again unless progress is reset

### Requirement: Payoff screen
The system SHALL show a payoff screen after the taste Stage that names the Dog, says the game will be tuned to it, and has one primary button that continues to Dog setup.

#### Scenario: Continues to setup
- **WHEN** the user presses the payoff screen's button
- **THEN** Dog setup is shown

#### Scenario: Whatever the result
- **WHEN** the taste Stage ended by reaction or by time limit
- **THEN** the same payoff screen is shown
