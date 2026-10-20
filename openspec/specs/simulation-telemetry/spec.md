# simulation-telemetry Specification

## Purpose
Defines the data contract the simulation emits to the app shell when a Stage ends, so results can be shown, stored and mocked.

## Requirements
### Requirement: Debrief payload on completion
The system SHALL emit a `SimulationDebriefPayload` when a Stage ends, containing `durationSeconds`, `slackPercentage`, `tautPercentage`, `pullPercentage`, `markerAccuracyMs`, `markerHits`, `markerMisses`, `reactiveMarkers`, `missedOpportunities`, `checkInHits`, `followMarks`, `posteSuccesses`, `harshStops`, `calmEncounters`, `peakArousalScore`, `marksUsed`, `markBudget` and `seed`.

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

### Requirement: Peak Arousal score
`peakArousalScore` SHALL be the highest value, from 0 to 100, that the Dog's Arousal reached during the Stage, without extra scaling.

#### Scenario: Peak recorded
- **WHEN** the Dog's Arousal reaches 72 at its highest
- **THEN** `peakArousalScore` is 72

### Requirement: Learning signals
`followMarks` SHALL count Check-in hits on a look after the Dog followed a turn, `posteSuccesses` SHALL count stops at the leash limit during which a Fixation ended in a Disengagement, and `harshStops` SHALL count abrupt stops at the leash limit.

#### Scenario: Poste success counted
- **WHEN** the Handler stops at the leash limit and the Dog then disengages
- **THEN** `posteSuccesses` is at least 1

### Requirement: Calm encounters
`calmEncounters` SHALL count, per kind of Distractor, the Disengagements during the Stage that were followed by a Marker hit, so the Trigger Profile can lower a level from Stage data alone.

#### Scenario: Calm encounters counted
- **WHEN** the Dog disengages from three bicycles during a Stage and each is followed by a Marker hit
- **THEN** `calmEncounters` is 3 for bicycles

