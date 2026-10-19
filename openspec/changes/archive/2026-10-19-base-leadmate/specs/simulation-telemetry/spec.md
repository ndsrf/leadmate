# Spec Delta

## Purpose

Defines the data contract the simulation emits to the app shell when a Stage ends, so results can be shown, stored and mocked.

## ADDED Requirements

### Requirement: Debrief payload on completion
The system SHALL emit a `SimulationDebriefPayload` when a Stage ends, containing `durationSeconds`, `slackPercentage`, `tautPercentage`, `pullPercentage`, `markerAccuracyMs`, `markerHits`, `markerMisses`, `reactiveMarkers`, `missedOpportunities`, `checkInHits`, `marksUsed`, `markBudget` and `seed`.

#### Scenario: Payload emitted
- **WHEN** a Stage ends
- **THEN** the shell receives one payload containing all listed fields

### Requirement: Tension shares
`slackPercentage`, `tautPercentage` and `pullPercentage` SHALL be the share of Stage time spent in Slack, Taut and Rigid Pull, and SHALL sum to 100 within rounding.

#### Scenario: Percentages sum
- **WHEN** a Stage ends
- **THEN** the three percentages sum to 100 (±1)

### Requirement: Marker accuracy
`markerAccuracyMs` SHALL be the time of the Marker press minus the time of the Disengagement, in milliseconds, for a Marker hit, and SHALL be absent when there was no hit.

#### Scenario: Hit accuracy
- **WHEN** the Marker is pressed 300 ms after Disengagement
- **THEN** `markerAccuracyMs` is 300

#### Scenario: No hit
- **WHEN** the Stage has no Marker hit
- **THEN** `markerAccuracyMs` is absent

### Requirement: Reproducible Stage
The payload's `seed` SHALL identify the random seed of the Stage, so that the same seed and inputs reproduce the same Stage and payload.

#### Scenario: Replay
- **WHEN** a Stage is replayed with the same seed and the same inputs
- **THEN** it produces the same payload

### Requirement: Mockable contract
The payload SHALL have the same shape whether the simulation runs in a browser or in a mobile WebView.

#### Scenario: Browser parity
- **WHEN** the same Stage is run in a browser and on a phone with the same inputs
- **THEN** both emit payloads of the same shape
