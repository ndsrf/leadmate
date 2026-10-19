# Spec Delta

## Purpose

Defines how the dog's equipment choice changes simulation difficulty and arousal, teaching why equipment matters.

## ADDED Requirements

### Requirement: Equipment selection
The system SHALL let the user choose a flat collar or a Y-harness for the dog and SHALL apply that choice to all simulations.

#### Scenario: Choice applied
- **WHEN** the user selects the Y-harness
- **THEN** simulations use the Y-harness equipment profile

### Requirement: Equipment affects arousal during Rigid Pull
The system SHALL raise the dog's arousal meter faster during a Rigid Pull with a flat collar than with a Y-harness.

#### Scenario: Collar spikes faster
- **WHEN** the same Rigid Pull lasts 2 seconds with a flat collar and with a Y-harness
- **THEN** the arousal increase with the flat collar is greater than with the Y-harness

### Requirement: Equipment can be changed
The system SHALL let the user change equipment after onboarding.

#### Scenario: Change equipment
- **WHEN** the user changes from collar to harness in settings
- **THEN** the next simulation uses the harness profile
