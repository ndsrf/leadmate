# Spec Delta

## MODIFIED Requirements

### Requirement: Debrief payload on completion
The system SHALL emit a `SimulationDebriefPayload` when a Stage ends, containing `durationSeconds`, `slackPercentage`, `tautPercentage`, `pullPercentage`, `markerAccuracyMs`, `markerHits`, `markerMisses`, `reactiveMarkers`, `missedOpportunities`, `checkInHits`, `followMarks`, `posteSuccesses`, `harshStops`, `peakArousalScore`, `marksUsed`, `markBudget` and `seed`.

#### Scenario: Payload emitted
- **WHEN** a Stage ends
- **THEN** the shell receives one payload containing all listed fields

## ADDED Requirements

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
