# Spec Delta

## MODIFIED Requirements

### Requirement: Funnel order
The system SHALL show the splash first, which for a new user stays up as the welcome screen, and then present the funnel in this order: the welcome screen, the Dog's name, look and age band, the main concerns question, the taste briefing, the taste Stage with its payoff, Dog setup (Equipment, weights, sex, Trigger Profile and concern questionnaire), the Diagnostic, the diagnostic card and personal plan, the training method and ecosystem overview, the introductory Theory Primer and Checkpoint, the guided first Stage walk, the Debrief, the registration prompt, and the soft paywall.

#### Scenario: First run
- **WHEN** a user opens the app for the first time
- **THEN** the splash gives way to the welcome actions on the same screen and requires no email or password

#### Scenario: Play before questions
- **WHEN** a new user moves through the funnel
- **THEN** the taste briefing and Stage are shown before any Dog setup question other than the main concern

#### Scenario: Step sequence
- **WHEN** a new user advances through onboarding
- **THEN** the method and ecosystem overview appears immediately following the diagnostic card and Personal Plan, before the guided first Stage

#### Scenario: Paywall precedes the first Stage
- **WHEN** the user finishes the guided first Stage and the registration prompt
- **THEN** the soft paywall is shown, and no paywall is shown before the first Stage

#### Scenario: Registration returns to the paywall
- **WHEN** the user creates an account from the registration prompt after the first Stage
- **THEN** the user lands on the soft paywall, not the World Map

#### Scenario: After the funnel
- **WHEN** the registration prompt and the soft paywall are done or skipped
- **THEN** the user lands on the World Map

#### Scenario: Main concerns asked once
- **WHEN** the user picks up to three concerns on the main concerns question
- **THEN** the picks are saved in order, shown preselected in Dog setup, and not asked again

#### Scenario: Limit of three
- **WHEN** three concerns are picked
- **THEN** a fourth cannot be added until one is unpicked

### Requirement: Dog name and look
The system SHALL ask for the Dog's breed, coat, name, and age band after the welcome screen, SHALL record all four in the Dog record, SHALL require a name of 1 to 20 characters after trimming, and SHALL use the name and age band in the funnel's later text and personal plan. Breed SHALL be chosen from a grid of drawn silhouette tiles, coat from colour swatches, and age band from selectable stage chips (puppy under 6 months, adolescent 6 to 18 months, adult, senior). Breed, coat, and age band SHALL NOT be re-prompted as unentered fields in Dog setup.

#### Scenario: Name and coat recorded
- **WHEN** the user enters "Luna", picks Border collie and a coat
- **THEN** the Dog record holds the name "Luna", that breed and that coat

#### Scenario: Name, coat and age recorded
- **WHEN** the user enters "Luna", picks Border collie, a coat, and "Cachorro (< 6 meses)"
- **THEN** the Dog record holds the name "Luna", that breed, that coat, and the "puppy" age band

#### Scenario: Empty name
- **WHEN** the user tries to continue with a blank name
- **THEN** the system does not continue and asks for a name

#### Scenario: Age band skippable
- **WHEN** the user enters a name and continues without picking an age band
- **THEN** the age band remains unset (null) and the funnel continues

#### Scenario: Name used in text
- **WHEN** the payoff is shown for a Dog named "Luna"
- **THEN** its text names Luna

#### Scenario: Dog without a name
- **WHEN** text that uses the Dog's name is shown for a Dog whose name is empty
- **THEN** it uses a neutral "your Dog" and the user is not prompted for a name

#### Scenario: Editable later
- **WHEN** the user later edits the Dog's name or age in settings
- **THEN** the new value is used wherever displayed

#### Scenario: Breed is optional to think about
- **WHEN** the user continues without touching the breed grid
- **THEN** the breed is Mestizo and the funnel continues

### Requirement: Age and sex in setup
The Dog setup SHALL ask for the Dog's sex (male, female), skippable, and SHALL present the age band chosen during the initial profile step with ability to review or update it, saving changes to the Dog record.

#### Scenario: Answers recorded
- **WHEN** the user picks "adolescent" and "female"
- **THEN** the Dog record holds both

#### Scenario: Sex recorded
- **WHEN** the user picks "female" in setup
- **THEN** the Dog record records sex as female

#### Scenario: Age pre-selected from initial step
- **WHEN** the user arrives at the about part of setup having selected "puppy" in the profile step
- **THEN** "puppy" is pre-selected and can be modified or kept

#### Scenario: Skipped
- **WHEN** the user skips sex without selecting
- **THEN** setup continues and sex stays unset
