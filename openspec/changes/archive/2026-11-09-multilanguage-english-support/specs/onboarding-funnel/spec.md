# Spec Delta

## MODIFIED Requirements

### Requirement: Funnel order
The system SHALL show the splash first, which for a new user stays up as the welcome screen, and then present the funnel in this order: the welcome screen, the language question, the Dog's name and look, the main concerns question, the taste briefing, the taste Stage with its payoff, Dog setup (Equipment, weights, age and sex, Trigger Profile and concern questionnaire), the Diagnostic, the diagnostic card and personal plan, the training method and ecosystem overview, the introductory Theory Primer and Checkpoint, the guided first Stage walk, the Debrief, the registration prompt, and the soft paywall.

#### Scenario: First run
- **WHEN** a user opens the app for the first time
- **THEN** the splash gives way to the welcome actions on the same screen and requires no email or password

#### Scenario: Language question precedes dog setup
- **WHEN** a new user advances from the welcome screen
- **THEN** the language question is displayed before the Dog's name and look screen

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

## ADDED Requirements

### Requirement: Language question in funnel
The system SHALL present a language selection screen after the welcome screen with Spanish and English options, SHALL pre-select the detected device language (or English if not Spanish), and SHALL immediately update the active application language and translations upon selection.

#### Scenario: Default pre-selection
- **WHEN** the language step is first displayed
- **THEN** the option corresponding to the device locale (or English if non-Spanish) is visually selected

#### Scenario: Language switch in funnel
- **WHEN** the user taps a different language option
- **THEN** the active application shell and subsequent funnel screens immediately switch to that language

#### Scenario: Advance to dog setup
- **WHEN** the user presses the continue button on the language step
- **THEN** the selected language is saved and the funnel advances to the Dog's name and look screen

#### Scenario: Back navigation to welcome
- **WHEN** the user triggers the back action on the language step
- **THEN** the funnel returns to the welcome screen without discarding the pre-selection
