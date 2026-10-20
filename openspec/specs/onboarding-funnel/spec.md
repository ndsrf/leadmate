# onboarding-funnel Specification

## Purpose
Defines the first-run experience that hooks new users with a short Diagnostic and a personalized Walk Plan before asking for payment or registration.

## Requirements
### Requirement: Funnel order
The system SHALL present the funnel in this order: Dog setup (Equipment, weights, Trigger Profile questionnaire), the Diagnostic, the diagnostic card and Walk Plan, the soft paywall, the guided first Stage, and the registration prompt.

#### Scenario: First run
- **WHEN** a user opens the app for the first time
- **THEN** the system starts at Dog setup and requires no email or password

#### Scenario: Paywall precedes the first Stage
- **WHEN** the user leaves the paywall screen by either button
- **THEN** the guided first Stage starts

### Requirement: Resumable funnel
The system SHALL persist the current onboarding step and the answers entered so far after each step, SHALL resume at the last completed step after the app is closed, and SHALL mark the funnel complete once the paywall screen has been passed.

#### Scenario: App killed mid-setup
- **WHEN** the app is closed after the weights step and reopened
- **THEN** the funnel resumes at the next step with earlier answers kept

#### Scenario: Returning user
- **WHEN** a user who passed the paywall screen reopens the app
- **THEN** the system does not show setup again

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
The system SHALL display a diagnostic card based on the recorded reaction latency and SHALL generate a Walk Plan before showing the soft paywall.

#### Scenario: Card and plan before paywall
- **WHEN** the user finishes the Diagnostic
- **THEN** the system shows the diagnostic card and Walk Plan
- **AND** only then the soft paywall

### Requirement: Soft paywall stub
The system SHALL present a 7-day trial soft paywall after the Walk Plan with a "Start trial" and a "Maybe later" button, SHALL let both continue the funnel, SHALL record only a local `trialStartedAt` on "Start trial", and SHALL NOT check any entitlement or gate any content.

#### Scenario: Either button continues
- **WHEN** the user presses "Maybe later"
- **THEN** the funnel continues to the first Stage and no content is locked

#### Scenario: Trial start recorded
- **WHEN** the user presses "Start trial"
- **THEN** `trialStartedAt` is recorded and the funnel continues

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
The first Stage SHALL show one-shot, non-blocking hints, triggered by simulation events and not timers, explaining the leash colors when the leash first becomes Taut, the Marker before the first Reward Window, and the Poste when the leash first reaches its limit. The system SHALL persist which hints were seen and SHALL NOT repeat a seen hint when the Stage is replayed.

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

### Requirement: Localized funnel
All onboarding, questionnaire, hint, paywall and auth text SHALL come from the i18n catalog in every supported language, defaulting to the device language.

#### Scenario: Spanish device
- **WHEN** the device language is Spanish
- **THEN** the funnel text appears in Spanish
