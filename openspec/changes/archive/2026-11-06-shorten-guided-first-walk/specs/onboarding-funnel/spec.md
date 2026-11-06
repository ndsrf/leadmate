# Spec Delta

## ADDED Requirements

### Requirement: Guided first walk is short
The guided first Stage's walk SHALL use a route short enough to complete in under 25 seconds of play at the Handler's top walking speed, and its Distractor SHALL appear around the middle of the route and cross before the end waypoint. Its scenery SHALL be denser than the default Stage's.

#### Scenario: Short route
- **WHEN** the guided first walk starts
- **THEN** the end waypoint is no more than 40 m from the Handler's start

#### Scenario: Completed in time
- **WHEN** a player walks straight to the end at top speed, stopping once for the Distractor
- **THEN** the Stage ends in under 25 seconds

#### Scenario: Distractor in the middle
- **WHEN** the Handler has walked about half of the route
- **THEN** the Distractor appears, and it crosses before the Handler reaches the end waypoint

#### Scenario: Distractor still appears
- **WHEN** the Handler walks the shortened route
- **THEN** the Distractor activates and crosses before the Handler reaches the end waypoint

#### Scenario: Denser scenery
- **WHEN** the guided first walk is loaded
- **THEN** its props per meter of route exceed the default scenario's and the scenario passes geometry validation

#### Scenario: Other Stages unchanged
- **WHEN** the taste Stage, the daily walk, the warm-up walk or the walk-with-distractions Node starts
- **THEN** each keeps its own route
