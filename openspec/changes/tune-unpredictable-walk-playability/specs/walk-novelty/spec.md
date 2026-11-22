# Spec Delta

## MODIFIED Requirements

### Requirement: Kinds of change
In a scent Stage, the simulation SHALL classify each Handler change as one of: left turn, right turn, U-turn (more than 135°), speed up, slow down, stop. A change SHALL count only when made with the leash in Slack. Consecutive turns of the same kind SHALL count at most once per 1.5 seconds so continuous steering around a corner counts as one change.

#### Scenario: U-turn
- **WHEN** the Handler reverses direction by 170° with a Slack leash
- **THEN** one U-turn is counted

#### Scenario: Taut leash
- **WHEN** the Handler turns while the leash is Taut
- **THEN** no change is counted

#### Scenario: Continuous corner turn
- **WHEN** the Handler turns 90° to the right over 0.8 seconds on a Slack leash
- **THEN** exactly one right turn is counted

### Requirement: Novelty drops with repeats and recovers with time
Each kind of change SHALL have a novelty from 0 to 1, starting at 1. Making a change SHALL lower that kind's novelty by a step of 0.25, and novelty SHALL recover toward 1 at 0.06 per second while that kind is not used. A stop SHALL restore 0.15 novelty to all turn kinds. A left turn SHALL restore 0.15 novelty to right turns, and a right turn SHALL restore 0.15 novelty to left turns. A change is fresh at or above 0.7 novelty and repeated below 0.4.

#### Scenario: Same turn three times
- **WHEN** the Handler makes three right turns within 6 seconds
- **THEN** the third right turn has lower novelty than the first and remains above the repeated threshold

#### Scenario: Recovery
- **WHEN** the Handler does not stop for 12 seconds
- **THEN** the novelty of a stop is back to fresh

#### Scenario: Reciprocal recovery from stop
- **WHEN** right turn novelty is at 0.3 and the Handler stops on Slack
- **THEN** right turn novelty immediately increases by 0.15

#### Scenario: Reciprocal recovery from opposite turn
- **WHEN** right turn novelty is at 0.3 and the Handler makes a left turn on Slack
- **THEN** right turn novelty immediately increases by 0.15
