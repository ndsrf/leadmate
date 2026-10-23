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
The system SHALL run the Diagnostic as a 15-second Minigame played on a scene of the Dog, SHALL show the Dog turning to look at the user as the signal and a Marker button as the input, SHALL show progress as a row of paws and the time left, SHALL record the user's reaction latency, and SHALL use it only to seed the Dog's starting reconnection latency once. The Diagnostic SHALL NOT be a Stage.

#### Scenario: Latency captured
- **WHEN** the user finishes the Diagnostic
- **THEN** a reaction latency value is recorded and seeds the Dog's reconnection latency

#### Scenario: No later effect
- **WHEN** the Diagnostic is replayed after onboarding
- **THEN** the Dog's Learning Attributes are unchanged

#### Scenario: Signal is the Dog's look
- **WHEN** the Diagnostic signal fires
- **THEN** the Dog on the scene shows ears up and a fixed gaze and the caption names it, and the Marker button accepts the tap

#### Scenario: Tapping before the signal
- **WHEN** the user presses the Marker button while the Dog is not looking
- **THEN** no latency is recorded for that press and the Dog stays as it was

### Requirement: Diagnostic card and Walk Plan
The system SHALL display a diagnostic card based on the recorded reaction latency and SHALL generate a Walk Plan before the guided first Stage.

#### Scenario: Card and plan before paywall
- **WHEN** the user finishes the Diagnostic
- **THEN** the system shows the diagnostic card and Walk Plan
- **AND** only then the guided first Stage, with the soft paywall coming after it

### Requirement: Soft paywall stub
The system SHALL present a 7-day trial soft paywall after the guided first Stage and the registration prompt, with a close control, the mascot, a "7 days free" pill, three benefit rows, a line saying the basics stay free, a "Start trial" button and a "Maybe later" button. It SHALL let both buttons and the close control continue to the World Map, SHALL record only a local `trialStartedAt` on "Start trial", and SHALL NOT check any entitlement or gate any content. The benefit rows SHALL NOT promise anything the app does not have, and the screen SHALL NOT show a price or billing terms until billing exists.

#### Scenario: Either button continues
- **WHEN** the user presses "Maybe later"
- **THEN** the user lands on the World Map and no content is locked

#### Scenario: Close continues like "Maybe later"
- **WHEN** the user presses the close control
- **THEN** the user lands on the World Map, `trialStartedAt` is not recorded and no content is locked

#### Scenario: Trial start recorded
- **WHEN** the user presses "Start trial"
- **THEN** `trialStartedAt` is recorded and the user lands on the World Map

#### Scenario: Reads on a small screen
- **WHEN** the paywall is shown on a 360 by 640 point screen with large text
- **THEN** the buttons stay reachable by scrolling and no text is clipped

### Requirement: Equipment choice in setup
The Dog setup SHALL include choosing a flat collar or a Y-harness, shown as two illustrated cards each with a one-line note on how the pull is felt, the selected card marked with a check.

#### Scenario: Equipment chosen
- **WHEN** the user completes Dog setup
- **THEN** an Equipment choice has been recorded

#### Scenario: Selection is not colour only
- **WHEN** one card is selected
- **THEN** it shows a check mark and a changed fill, not a colour change alone

### Requirement: Trigger Profile questionnaire
The Dog setup SHALL ask which of the Distractor kinds the simulation supports make the Dog react, as selectable chips, and SHALL ask for each selected kind how strongly the Dog reacts with three steps (a little, often, a lot) mapping to Trigger Profile levels 1 to 3. A kind left unselected SHALL map to level 0. It SHALL save the result as the Dog's Trigger Profile and SHALL NOT ask about kinds the simulation does not support.

#### Scenario: Answers become levels
- **WHEN** the user selects bicycles and sets "a lot", and leaves children unselected
- **THEN** the Trigger Profile holds level 3 for bicycles and level 0 for children

#### Scenario: Default intensity
- **WHEN** the user selects a chip without touching its intensity
- **THEN** that kind is saved at level 2 ("often")

#### Scenario: Deselecting resets
- **WHEN** the user deselects a selected chip
- **THEN** that kind returns to level 0

#### Scenario: Revisable later
- **WHEN** the user later edits the profile in settings
- **THEN** the edited levels are used by the next Stage

#### Scenario: Existing profile shown
- **WHEN** the questionnaire opens for a Dog whose profile already has levels above 0
- **THEN** those kinds show as selected at their saved intensity

### Requirement: Weights in setup
The Dog setup SHALL ask for the Dog's weight and the Handler's weight in kilograms with a slider that shows its value, SHALL also accept a typed value, SHALL validate them against plausible ranges (Dog 1 to 80 kg, Handler 30 to 200 kg), SHALL allow skipping, and SHALL derive the simulation's `pullStrength` as a clamped function of Handler weight divided by Dog weight, passed to Stages in the config snapshot. A skip SHALL use the default `pullStrength` of 0.8. The Dog weight control SHALL show the chosen breed's typical range as a hint.

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

#### Scenario: Slider and typing agree
- **WHEN** the user types 12 kg for the Dog
- **THEN** the slider thumb sits at 12 kg and the bubble reads 12 kg

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
The system SHALL ask for the Dog's breed, coat and name after the welcome screen, SHALL record all three in the Dog record, SHALL require a name of 1 to 20 characters after trimming, and SHALL use the name in the funnel's later text. Breed SHALL be chosen from a grid of drawn silhouette tiles and coat from colour swatches that also show their names, with a live preview of the Dog in the chosen breed and coat. Breed and coat SHALL NOT be asked again in Dog setup.

#### Scenario: Name and coat recorded
- **WHEN** the user enters "Luna", picks Border collie and a coat
- **THEN** the Dog record holds the name "Luna", that breed and that coat

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

#### Scenario: Breed is optional to think about
- **WHEN** the user continues without touching the breed grid
- **THEN** the breed is Mestizo and the funnel continues

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
