# Spec Delta

## MODIFIED Requirements

### Requirement: Debrief payload on completion
The system SHALL emit a `SimulationDebriefPayload` when a Stage ends, containing `durationSeconds`, `slackPercentage`, `tautPercentage`, `pullPercentage`, `markerAccuracyMs`, `markerHits`, `markerMisses`, `reactiveMarkers`, `missedOpportunities`, `checkInHits`, `followMarks`, `posteSuccesses`, `harshStops`, `calmEncounters`, `peakArousalScore`, `marksUsed`, `markBudget` and `seed`.

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

### Requirement: Calm encounters
`calmEncounters` SHALL count, per kind of Distractor, the Disengagements during the Stage that were followed by a Marker hit, so the Trigger Profile can lower a level from Stage data alone.

#### Scenario: Calm encounters counted
- **WHEN** the Dog disengages from three bicycles during a Stage and each is followed by a Marker hit
- **THEN** `calmEncounters` is 3 for bicycles
