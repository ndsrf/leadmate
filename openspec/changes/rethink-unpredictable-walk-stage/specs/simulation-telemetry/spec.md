# Spec Delta

## ADDED Requirements

### Requirement: Scent walk signals
In a scent Stage, the debrief payload SHALL include `scentWalk` with: `sniffsGranted`, `sniffsEmpty`, `scentsDraggedPast` (a pull toward an unsniffed spot that ended in Rigid Pull), `plantsWaited`, `plantsDragged`, `markingsWaited`, `markingsInterrupted`, `foodEaten`, `foodLeft`, `freshMoves`, `repeatedMoves`, `chains`, `jackpotsSmart` and `jackpotsWasted`. Outside scent Stages the payload SHALL NOT include `scentWalk`.

#### Scenario: Scent Stage ends
- **WHEN** a scent Stage ends after two granted sniffs and one dragged Plant
- **THEN** `scentWalk.sniffsGranted` is 2 and `scentWalk.plantsDragged` is 1

#### Scenario: Other Stage
- **WHEN** a Stage without Scent Spots ends
- **THEN** the payload has no `scentWalk` field

### Requirement: Walk timeline in the payload
In a scent Stage the debrief payload SHALL include `timeline`, a time-ordered list of at most 60 right and wrong moments (time, kind, polarity), so the Debrief can replay where the walk went well and badly.

#### Scenario: Timeline
- **WHEN** a scent Stage ends
- **THEN** `timeline` lists its feedback moments in time order with no more than 60 entries
