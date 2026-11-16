# walk-novelty Specification

## Purpose
Makes an unpredictable walk truly unpredictable: each kind of change the Handler makes loses its effect when repeated and recovers with time, so the Dog keeps paying attention only to a Handler who varies direction, pace and stops.

## Requirements

### Requirement: Kinds of change
In a scent Stage, the simulation SHALL classify each Handler change as one of: left turn, right turn, U-turn (more than 135°), speed up, slow down, stop. A change SHALL count only when made with the leash in Slack.

#### Scenario: U-turn
- **WHEN** the Handler reverses direction by 170° with a Slack leash
- **THEN** one U-turn is counted

#### Scenario: Taut leash
- **WHEN** the Handler turns while the leash is Taut
- **THEN** no change is counted

### Requirement: Novelty drops with repeats and recovers with time
Each kind of change SHALL have a novelty from 0 to 1, starting at 1. Making a change SHALL lower that kind's novelty by a set step, and novelty SHALL recover toward 1 at a set rate while that kind is not used. A change is fresh when its novelty is at least 0.7 and repeated when it is below 0.4.

#### Scenario: Same turn three times
- **WHEN** the Handler makes three right turns within 10 seconds
- **THEN** the third right turn has lower novelty than the first and is counted as repeated

#### Scenario: Recovery
- **WHEN** the Handler does not stop for 30 seconds
- **THEN** the novelty of a stop is back to fresh

### Requirement: Novelty shapes the Dog's response
The chance that the Dog follows a change and looks at the Handler, and how much Autopilot drops, SHALL grow with the change's Novelty. A fully fresh change SHALL use the full follow chance plus a fresh bonus; a change at Novelty 0 SHALL have half the Dog's follow chance.

#### Scenario: Fresh move
- **WHEN** the Handler makes a fresh U-turn
- **THEN** the Dog's chance to follow and look is higher than for the same U-turn repeated

### Requirement: Chain
A Chain SHALL be recorded when a change is followed by the Dog, the Marker is pressed on the Dog's look within its Check-in window, and the Handler either keeps walking with a Slack leash for 2 seconds or gives Go Sniff within 3 seconds.

#### Scenario: Turn, look, mark, sniff
- **WHEN** the Dog follows a fresh turn, the user presses the Marker on its look, and then gives Go Sniff within 3 seconds
- **THEN** one Chain is recorded
