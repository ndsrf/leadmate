# sync-combo Specification

## Purpose
Defines the "Sintonía" sync combo that rewards smooth, curved Slack-leash handling with arcade-style game feel and Debrief telemetry.

## Requirements
### Requirement: Sintonía activation criteria
The system SHALL activate the Sintonía combo when all of the following conditions hold continuously for at least 2.0 consecutive seconds:
1. Leash Tension Ratio remains strictly below 0.85 (Slack).
2. Handler forward speed exceeds $0.4\text{ m/s}$.
3. Handler heading maintains a continuous turning angular rate within $|\omega| \in [0.2, 1.8]\text{ rad/s}$ without sharp reversals ($> 90^\circ$ direction change within 0.5s).

#### Scenario: Continuous smooth Slack arc
- **WHEN** the Handler moves forward while smoothly turning in Slack for 2.0 continuous seconds
- **THEN** Sintonía becomes active

### Requirement: Sintonía audiovisual feedback
While Sintonía is active, the system SHALL display a subtle green visual glow around the Dog and Handler, animate the Dog with an energetic, rhythmic trotting gait, and emit continuous positive flow telemetry.

#### Scenario: Visual and gait feedback
- **WHEN** Sintonía is active
- **THEN** the green flow glow is rendered and the Dog maintains a rhythmic trotting gait

### Requirement: Sintonía interruption
The system SHALL instantly terminate Sintonía whenever the leash Tension Ratio reaches or exceeds 0.85, the Handler stops moving (speed $\le 0.4\text{ m/s}$), or an abrupt heading reversal occurs.

#### Scenario: Leash leaves Slack
- **WHEN** Sintonía is active and the Tension Ratio reaches 0.85 (Taut)
- **THEN** Sintonía terminates immediately and the green glow and trotting gait stop

### Requirement: Debrief telemetry tracking
The system SHALL record cumulative Sintonía duration (`sintoniaTimeSeconds`) in the Stage debrief payload, contributing to the Daily Stage composite score without distorting pure simulation leash physics or mutating Dog Learning Attributes.

#### Scenario: Telemetry recorded
- **WHEN** a Stage concludes
- **THEN** the debrief payload contains the total seconds spent in active Sintonía
