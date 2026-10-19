# Spec Delta

## Purpose

Defines the first-run experience that hooks new users with a short diagnostic simulation and a personalized plan before asking for registration or payment.

## ADDED Requirements

### Requirement: Deferred account registration
The system SHALL allow a new user to complete dog identity setup and the first stage without creating an account, and SHALL request email/password registration only after the first stage is completed.

#### Scenario: Registration is not shown up front
- **WHEN** a user opens the app for the first time
- **THEN** the system presents dog identity setup without requiring email or password

#### Scenario: Registration after first stage
- **WHEN** the user completes the first stage
- **THEN** the system prompts for email/password registration

### Requirement: Diagnostic mini-playtest
The system SHALL run a 15-second mini-playtest simulation during onboarding and SHALL capture the user's reaction latency.

#### Scenario: Latency captured
- **WHEN** the user finishes the 15-second diagnostic simulation
- **THEN** the system records a reaction latency value for that user

### Requirement: Personalized diagnostic card and walk plan
The system SHALL display a diagnostic card based on the captured reaction latency and SHALL generate a custom walk plan before showing the soft paywall.

#### Scenario: First-time onboarding and hook
- **WHEN** the user completes dog identity setup and the 15-second diagnostic
- **THEN** the system displays a personalized diagnostic card
- **AND** generates a custom walk plan before displaying the 7-day trial soft paywall

### Requirement: Soft paywall
The system SHALL present a 7-day trial soft paywall after the walk plan, and SHALL NOT present it before the diagnostic card and walk plan are shown.

#### Scenario: Paywall ordering
- **WHEN** the onboarding flow progresses past the walk plan
- **THEN** the system shows the 7-day trial soft paywall

### Requirement: Equipment choice in setup
The dog identity setup SHALL include choosing a flat collar or a Y-harness.

#### Scenario: Equipment chosen
- **WHEN** the user completes dog identity setup
- **THEN** an equipment choice has been recorded

### Requirement: Weights in setup
The dog identity setup SHALL ask for the dog's weight and the Handler's weight, and the system SHALL derive the simulation's pull strength from their ratio.

#### Scenario: Weights recorded
- **WHEN** the user completes dog identity setup
- **THEN** both weights are recorded

#### Scenario: Heavier dog is harder to drag
- **WHEN** the dog's weight is higher relative to the Handler's
- **THEN** the pull strength used in simulations is lower

### Requirement: Guided first stage
The first stage SHALL explain what the leash colors mean and what the Marker does, and SHALL show the Poste when the leash first reaches its limit, so a new user is not left to discover them.

#### Scenario: Leash colors explained
- **WHEN** a new user plays the first stage
- **THEN** the meaning of the green, yellow and red leash is explained before or as it first appears

#### Scenario: Marker explained
- **WHEN** a new user plays the first stage
- **THEN** the Marker's purpose is explained before the first Reward Window
