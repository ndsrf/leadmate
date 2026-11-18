# Spec Delta

## ADDED Requirements

### Requirement: Peak Reaction Tier in the payload
The debrief payload of every walking Stage SHALL include `peakReactionTier`, the highest Reaction Tier (`calm`, `alert` or `reactive`) the Dog reached during the Stage, computed in the seeded simulation so the same seed, inputs and snapshot give the same value. Close exercise Stages and the baseline payload of a skipped Stage SHALL NOT include it, and no handling score rule SHALL read it outside an Encounter.

#### Scenario: Dog reached Reactive
- **WHEN** the Dog reaches the Reactive tier once during a Stage and then calms down
- **THEN** the payload's `peakReactionTier` is `reactive`

#### Scenario: Calm Stage
- **WHEN** the Dog stays in the Calm tier for a whole Stage
- **THEN** the payload's `peakReactionTier` is `calm`

#### Scenario: Daily Stage score unchanged
- **WHEN** the Daily Stage ends with the same seed and inputs as before this field existed
- **THEN** its handling score is the same as before

### Requirement: Encounter payloads keep the Stage shape
Each Encounter attempt SHALL emit the same debrief payload as any walking Stage when it ends, with its own seed, so an attempt can be shown, scored and replayed from its payload alone.

#### Scenario: Attempt payload
- **WHEN** an Encounter attempt ends
- **THEN** the shell receives one payload with all the fields of a walking Stage payload, including `peakReactionTier`, and that attempt's seed

### Requirement: Encounter Series results in the Node's payload
For a Node played as an Encounter Series, the debrief payload the Node's Debrief receives SHALL include `encounters`: one entry per Encounter of the Series in order, with its id, its kept Paws (0 if not played), its number of finished attempts and the seed of its kept attempt (absent if not played). Outside an Encounter Series the payload SHALL NOT include `encounters`.

#### Scenario: Series finished
- **WHEN** a four-Encounter Series ends after the second Encounter was retried twice
- **THEN** `encounters` has four entries in Series order and the second shows 3 attempts

#### Scenario: Single walking Stage
- **WHEN** a Node played as one walking Stage ends
- **THEN** the payload has no `encounters` field and its other fields are unchanged

### Requirement: Combined payload of an Encounter Series
The Node's payload for an Encounter Series SHALL combine the kept attempts: durations, counts, Marks and mark grades summed; tension shares weighted by duration and summing to 100; `peakArousalScore` and `peakReactionTier` the highest; `markerAccuracyMs` the rounded mean of the present values, absent if none; and `handlingScore` from the Series score rule of `walk-encounters`.

#### Scenario: Shares weighted by time
- **WHEN** a kept 10-second attempt had 0% Rigid Pull and a kept 20-second attempt had 30%
- **THEN** the combined `pullPercentage` is 20 and the three shares sum to 100

#### Scenario: Counts summed
- **WHEN** two kept attempts had one Check-in hit each
- **THEN** the combined `checkInHits` is 2

#### Scenario: Score from Paws
- **WHEN** a four-Encounter Series keeps 3, 3, 3 and 2 Paws
- **THEN** the combined `handlingScore` is 917

### Requirement: Skipped Encounter Series payload
When an Encounter Series is skipped, the Node's result SHALL be marked skipped and its payload's `handlingScore` SHALL be the skipped-Stage baseline of 500; its counts SHALL combine the kept attempts, or be those of the skipped-Stage baseline payload when no Encounter has a kept attempt.

#### Scenario: Skipped Series
- **WHEN** a four-Encounter Series is left by Exit after one Encounter kept 3 Paws
- **THEN** the combined `handlingScore` is 500 and the result is marked skipped
