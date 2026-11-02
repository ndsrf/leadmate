## MODIFIED Requirements

### Requirement: Funnel order
The system SHALL show the splash first, which for a new user stays up as the welcome screen, and then present the funnel in this order: the welcome screen, the Dog's name and look, the main concerns question, the taste Stage with its payoff, Dog setup (Equipment, weights, age and sex, Trigger Profile and concern questionnaire), the Diagnostic, the diagnostic card and personal plan, the introductory Theory Primer and Checkpoint, the guided first Stage walk, the Debrief, the registration prompt, and the soft paywall.

#### Scenario: First run
- **WHEN** a user opens the app for the first time
- **THEN** the splash gives way to the welcome actions on the same screen and requires no email or password

#### Scenario: Play before questions
- **WHEN** a new user moves through the funnel
- **THEN** the taste Stage is played before any Dog setup question other than the main concern

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

### Requirement: Diagnostic card and Walk Plan
The system SHALL display a diagnostic card based on the recorded reaction latency and SHALL generate the personal plan before the guided first Stage, using the concern profile, age band and the latency band.

#### Scenario: Card and plan before paywall
- **WHEN** the user finishes the Diagnostic
- **THEN** the system shows the diagnostic card and the personal plan with a reason per item
- **AND** only then the guided first Stage, with the soft paywall coming after it

#### Scenario: Plan follows answers
- **WHEN** the user finishes setup with biting the owner as main concern
- **THEN** the first plan item is an at-home Stretch

## ADDED Requirements

### Requirement: Taste matched to the Main Concern
The Taste Stage SHALL remain a leash Stage for every user and SHALL use the Distractor kind of the first outdoor Main Concern when there is one (dog, child, bicycle, skateboard, food). When every Main Concern is a Home Behaviour, or none is set, it SHALL use the approaching dog. The Payoff Screen SHALL name the Dog and, for a Home Behaviour, say that the Dog's Concerns will be tuned in the Personal Plan. The result SHALL be discarded.

#### Scenario: Bicycle concern
- **WHEN** the Main Concern is reacting to bicycles
- **THEN** the Taste Stage approaches the Dog with a bicycle, not a dog

#### Scenario: Biting concern
- **WHEN** the Main Concern is biting the owner
- **THEN** the Taste Stage is the approaching-dog Stage and its Payoff Screen says the Concerns will be tuned in the plan

#### Scenario: Skipped concern
- **WHEN** the user skips the Main Concern question
- **THEN** the Taste Stage is the approaching-dog Stage

### Requirement: Age and sex in setup
The Dog setup SHALL ask for the Dog's age as a band (puppy under 6 months, adolescent 6 to 18 months, adult, senior) and the Dog's sex (male, female), each skippable, and SHALL save them to the Dog record.

#### Scenario: Answers recorded
- **WHEN** the user picks "adolescent" and "female"
- **THEN** the Dog record holds both

#### Scenario: Skipped
- **WHEN** the user skips age and sex
- **THEN** setup continues and both stay unset
