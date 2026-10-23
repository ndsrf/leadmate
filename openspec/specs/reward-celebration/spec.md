# reward-celebration Specification

## Purpose
Rewards good handling with stars and short celebrations at the moments that matter, while keeping rewards tied to handling quality and never to time spent, taps or fear of loss.

## Requirements
### Requirement: Star rating from handling quality
The system SHALL give a finished Node 1 to 3 stars from its handling score: 1 star for completing it, 2 stars at a score of 650 or more and 3 stars at 850 or more, out of 1000. An action Minigame SHALL report a handling score of 1000 minus the share of failed Action beats, so a run with no failed beat earns 3 stars and a run with one failed beat out of four or five earns 2 stars.

#### Scenario: Completed with a low score
- **WHEN** a Node is completed with a handling score of 400
- **THEN** it earns 1 star

#### Scenario: Excellent handling
- **WHEN** a Node is completed with a handling score of 870
- **THEN** it earns 3 stars

#### Scenario: Node without a Stage score
- **WHEN** a Node has no handling score, such as the Poste practice
- **THEN** its completion earns 1 star and the result explains that

#### Scenario: Action Minigame with no failed beat
- **WHEN** the Harness Ritual or the Doorbell Mat is finished with every Action beat correct
- **THEN** the Node earns 3 stars

#### Scenario: Action Minigame with one failed beat
- **WHEN** the Harness Ritual or the Doorbell Mat is finished with one failed Action beat
- **THEN** the Node earns 2 stars

#### Scenario: Action Minigame with many failed beats
- **WHEN** the Harness Ritual or the Doorbell Mat is finished with two or more failed Action beats
- **THEN** the Node earns 1 star

### Requirement: Best stars are kept
The system SHALL keep the highest star rating earned for each Node on the Dog's record, SHALL NOT lower it on a worse replay, and SHALL NOT change the Dog's Learning Attributes or Trigger Profile because of stars.

#### Scenario: Worse replay
- **WHEN** a Node with 3 stars is replayed and scores 1 star
- **THEN** the Node keeps 3 stars

#### Scenario: Better replay
- **WHEN** a Node with 1 star is replayed and scores 3 stars
- **THEN** the Node shows 3 stars and the result says it is a new best

### Requirement: Animated result
The system SHALL reveal a Node result step by step: the score counts up, then the stars appear one by one with a sound and haptic each, then the telemetry rows are shown, and the user SHALL be able to skip the reveal with one press.

#### Scenario: Reveal sequence
- **WHEN** a Node result opens with a score of 870
- **THEN** the score counts up to 870 and then three stars appear in turn

#### Scenario: Skip
- **WHEN** the user presses during the reveal
- **THEN** the final score, stars and rows are shown at once

### Requirement: Moments worth celebrating
The system SHALL show a short celebration when a Node is completed for the first time, when a World or Node is newly unlocked, when the Streak grows to a new day, and when a Daily Stage beats the day's best, each at most once for that event.

#### Scenario: New unlock
- **WHEN** completing a Node unlocks the next World
- **THEN** the result shows an unlock celebration naming the World, once

#### Scenario: Streak day
- **WHEN** the first activity of a day credits the Streak
- **THEN** a celebration shows the new Streak count, and no celebration shows for further activity that day

#### Scenario: Daily new best
- **WHEN** a Daily Stage scores above the day's best
- **THEN** the Daily result shows a new-best celebration

### Requirement: Rewards without pressure
The system SHALL NOT reward time spent, session length or number of taps, SHALL NOT remove stars or progress, and SHALL NOT show warnings or messages that shame the user for a missed day.

#### Scenario: Missed day
- **WHEN** the user returns after missing a day
- **THEN** the World Map shows a neutral invitation to start a new Streak and no penalty message

#### Scenario: Idle Node
- **WHEN** the user spends a long time on a Node without finishing it
- **THEN** no bonus or reward is granted for the time
