# onboarding-funnel Specification

## Purpose
Defines the first-run experience: a welcome, a taste of the problem on the real simulation, then a short Diagnostic and a personalized Walk Plan, and only after the first Stage a registration prompt and the soft paywall.

## Requirements
### Requirement: Funnel order
The system SHALL show the splash first, which for a new user stays up as the welcome screen, and then present the funnel in this order: the welcome screen, the Dog's name and look, the taste Stage with its payoff, Dog setup (Equipment, weights, Trigger Profile questionnaire), the Diagnostic, the diagnostic card and Walk Plan, the introductory Theory Primer and Checkpoint, the guided first Stage walk, the Debrief, the registration prompt, and the soft paywall.

#### Scenario: First run
- **WHEN** a user opens the app for the first time
- **THEN** the splash gives way to the welcome actions on the same screen and requires no email or password

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
- **THEN** the welcome, name and look and taste screens are not shown and the funnel resumes at that step

#### Scenario: Closed during the taste
- **WHEN** the app is closed during the taste Stage
- **THEN** reopening it shows the taste Stage again from its start

### Requirement: Deferred, skippable registration
The system SHALL allow a new user to finish Dog setup and the first Stage without an account, SHALL offer email/password registration after the first Stage, and SHALL allow "Not now", leaving the app fully playable with local data only.

#### Scenario: Registration after first Stage
- **WHEN** the user completes the first Stage
- **THEN** the system offers registration

#### Scenario: Skipping registration
- **WHEN** the user chooses "Not now"
- **THEN** the system continues without an account and without limiting play

#### Scenario: Reminders
- **WHEN** an unregistered user completes their third Stage, or reaches a Streak of 3 days
- **THEN** the system shows a non-blocking registration reminder, at most once per day

### Requirement: Diagnostic
The system SHALL run the Diagnostic as a 15-second Minigame, SHALL record the user's reaction latency, and SHALL use it only to seed the Dog's starting reconnection latency once. The Diagnostic SHALL NOT be a Stage.

#### Scenario: Latency captured
- **WHEN** the user finishes the Diagnostic
- **THEN** a reaction latency value is recorded and seeds the Dog's reconnection latency

#### Scenario: No later effect
- **WHEN** the Diagnostic is replayed after onboarding
- **THEN** the Dog's Learning Attributes are unchanged

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

### Requirement: Equipment choice in setup
The Dog setup SHALL include choosing a flat collar or a Y-harness.

#### Scenario: Equipment chosen
- **WHEN** the user completes Dog setup
- **THEN** an Equipment choice has been recorded

### Requirement: Trigger Profile questionnaire
The Dog setup SHALL ask, for each Distractor kind the simulation supports, how strongly the Dog reacts, with the answers never, a little, often and a lot mapping to Trigger Profile levels 0 to 3, and SHALL save the result as the Dog's Trigger Profile. It SHALL NOT ask about kinds the simulation does not support.

#### Scenario: Answers become levels
- **WHEN** the user answers "a lot" for bicycles and "never" for children
- **THEN** the Trigger Profile holds level 3 for bicycles and level 0 for children

#### Scenario: Revisable later
- **WHEN** the user later edits the profile in settings
- **THEN** the edited levels are used by the next Stage

### Requirement: Weights in setup
The Dog setup SHALL ask for the Dog's weight and the Handler's weight in kilograms, SHALL validate them against plausible ranges (Dog 1 to 80 kg, Handler 30 to 200 kg), SHALL allow skipping, and SHALL derive the simulation's `pullStrength` as a clamped function of Handler weight divided by Dog weight, passed to Stages in the config snapshot. A skip SHALL use the default `pullStrength` of 0.8.

#### Scenario: Weights recorded
- **WHEN** the user enters both weights
- **THEN** both are recorded

#### Scenario: Heavier Dog is harder to drag
- **WHEN** the Dog's weight is higher relative to the Handler's
- **THEN** the `pullStrength` used in Stages is lower

#### Scenario: Out-of-range value
- **WHEN** the user enters a Dog weight of 200 kg
- **THEN** the system rejects it and asks again

#### Scenario: Skipped
- **WHEN** the user skips the weights
- **THEN** `pullStrength` is 0.8

### Requirement: Guided first Stage
The system SHALL present the first Stage as an introductory learning loop comprising Theory Primer cards, a Checkpoint question, a guided walk simulation with event-triggered hints, and a Debrief. The Primer SHALL teach leash slack ("the smile"), movement controls, tension levels (green/yellow/red), the Poste anchor, and marking check-ins. The Checkpoint SHALL test the core stopping technique. The simulation SHALL show one-shot, non-blocking event hints (leash color, marker, poste) and persist seen hints. The Debrief SHALL report handling feedback and conclude the first Stage before registration.

#### Scenario: Primer and Checkpoint precede the simulation
- **WHEN** the user continues from the Walk Plan
- **THEN** the Theory Primer cards and Checkpoint question are shown before the simulation begins

#### Scenario: Leash colors explained
- **WHEN** a new user's leash first becomes Taut in the first Stage
- **THEN** the meaning of the green, yellow and red leash is explained

#### Scenario: Marker explained
- **WHEN** a new user plays the first Stage
- **THEN** the Marker's purpose is explained before the first Reward Window

#### Scenario: Poste shown
- **WHEN** the leash first reaches its limit in the first Stage
- **THEN** the Poste is shown

#### Scenario: Replay
- **WHEN** the user replays the first Stage
- **THEN** hints already seen are not shown again

#### Scenario: Debrief before registration
- **WHEN** the first Stage walk finishes
- **THEN** the Debrief is shown with handling feedback before the registration prompt opens

### Requirement: Localized funnel
All onboarding, questionnaire, hint, paywall and auth text SHALL come from the i18n catalog in every supported language, defaulting to the device language.

#### Scenario: Spanish device
- **WHEN** the device language is Spanish
- **THEN** the funnel text appears in Spanish

### Requirement: Welcome screen
The system SHALL show the welcome actions to a new user on the splash screen itself once loading is done, not on a separate screen, with a single primary button that continues the funnel and a secondary "I already have an account" link to login, and SHALL NOT ask for any input on it. A user who already has a Dog record past the first funnel steps SHALL NOT see it.

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
- **WHEN** the payoff is shown for a Dog named "Luna"
- **THEN** its text names Luna

#### Scenario: Dog without a name
- **WHEN** text that uses the Dog's name is shown for a Dog whose name is empty
- **THEN** it uses a neutral "your Dog" and the user is not prompted for a name

#### Scenario: Editable later
- **WHEN** the user later edits the Dog's name in settings
- **THEN** the new name is used wherever the name is shown

### Requirement: Taste Stage
The system SHALL run an unrecorded taste Stage on the simulation after the Dog's name and look, using a scenario tuned to end in a Reactive tier. On reaction or time limit, the system SHALL zoom in on the Handler and Dog, show the payoff over the Stage, and proceed to Dog setup without modifying the Dog record.

#### Scenario: The Dog reacts
- **WHEN** a new user plays the taste Stage
- **THEN** a trigger approaches, the Dog reacts, and the camera zooms in on the Handler and the Dog

#### Scenario: Control line, not a Hint
- **WHEN** the taste Stage starts
- **THEN** one fixed control line is shown and it disappears at the first input
- **AND** no `seenHints` entry is recorded

#### Scenario: Nothing is learned
- **WHEN** the taste Stage ends
- **THEN** the Dog record is unchanged apart from the onboarding step

#### Scenario: Succeeding anyway
- **WHEN** a user holds the Dog until the time limit
- **THEN** the Stage ends at the limit and the payoff is shown over the Stage as for any other result

#### Scenario: Replayable only in the funnel
- **WHEN** the funnel is complete
- **THEN** the taste Stage is not offered again unless progress is reset

### Requirement: Payoff screen
The system SHALL show the payoff over the taste Stage once the camera has zoomed in on the Handler and the Dog, with no screen of its own in between: it names the Dog, says the Dog has reacted, that the game can improve it and will be tuned to the Dog, and has one primary button that continues to Dog setup.

#### Scenario: Continues to setup
- **WHEN** the user presses the payoff's button
- **THEN** Dog setup is shown

#### Scenario: Whatever the result
- **WHEN** the taste Stage ended by reaction or by time limit
- **THEN** the same payoff is shown
