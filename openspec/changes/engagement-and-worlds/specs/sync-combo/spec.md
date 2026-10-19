# Spec Delta

## Purpose

Defines the "Sintonía" sync combo that rewards smooth, slack-leash handling with arcade-style game feel.

## ADDED Requirements

### Requirement: Sintonía activation
The system SHALL activate the Sintonía combo when the leash stays in the Slack state while the handler performs smooth arcs for a sustained period.

#### Scenario: Combo starts
- **WHEN** the leash remains in Slack through smooth arc movement for the required duration
- **THEN** Sintonía becomes active

### Requirement: Sintonía feedback
While Sintonía is active, the system SHALL show a subtle green visual glow and animate the dog with a rhythmic trot.

#### Scenario: Feedback visible
- **WHEN** Sintonía is active
- **THEN** the green glow is shown and the dog trots rhythmically

### Requirement: Sintonía break
The system SHALL end Sintonía when the leash leaves the Slack state.

#### Scenario: Combo ends
- **WHEN** the Tension Ratio reaches 0.85 or more
- **THEN** Sintonía ends and the glow and trot stop
