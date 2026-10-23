## MODIFIED Requirements

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
