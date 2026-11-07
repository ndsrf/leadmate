# Spec Delta

## ADDED Requirements

### Requirement: Training method and ecosystem overview
The system SHALL display an ecosystem overview screen after the Personal Plan, presenting the three core pillars of the app: the 3-step World trail loop (Theory lesson, Simulation node, Real-world mission), the Daily Walk (streak tracking, real-time composure and harmony scoring), and Barkdoku (spatial deduction mental challenge).

#### Scenario: Overview displayed
- **WHEN** the user advances past the diagnostic card and Personal Plan
- **THEN** the system displays the method overview explaining the 3-step World trail loop, the Daily Walk, and Barkdoku

#### Scenario: Proceed to guided stage
- **WHEN** the user taps the continue action on the method overview
- **THEN** the funnel proceeds to the introductory Theory Primer and Checkpoint of the first guided Stage

### Requirement: Personal plan reassurance note
The system SHALL display a reassurance note in the onboarding flow when the Dog has declared Concerns, explicitly informing the user that their specific concerns are addressed in World 2 ("Casa y umbrales") while World 1 provides the three foundational calm and communication basics required for training.

#### Scenario: Reassurance for declared concerns
- **WHEN** the user has declared at least one Home Concern
- **THEN** the reassurance note names their goal, states that World 2 tackles their concerns directly, and clarifies that World 1 establishes the necessary foundations

#### Scenario: Only scheduled Concerns are named
- **WHEN** a declared Home Concern has no Home Stretch in World 2 for this Dog (no Lesson yet, or left out of World 2)
- **THEN** the reassurance note does not name it, and a note with no Concern left is the standard welcome

#### Scenario: Dog without a name
- **WHEN** the Dog's name is blank
- **THEN** the reassurance title omits the name instead of inserting a placeholder phrase

#### Scenario: System back from the overview
- **WHEN** the user presses the system back on the method overview
- **THEN** the funnel returns to the Personal Plan

#### Scenario: No declared concerns
- **WHEN** the user has skipped or declared no Concerns
- **THEN** the reassurance note presents a standard welcome to the foundational curriculum

## MODIFIED Requirements

### Requirement: Funnel order
The system SHALL show the splash first, which for a new user stays up as the welcome screen, and then present the funnel in this order: the welcome screen, the Dog's name and look, the main concerns question, the taste briefing, the taste Stage with its payoff, Dog setup (Equipment, weights, age and sex, Trigger Profile and concern questionnaire), the Diagnostic, the diagnostic card and personal plan, the training method and ecosystem overview, the introductory Theory Primer and Checkpoint, the guided first Stage walk, the Debrief, the registration prompt, and the soft paywall.

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
