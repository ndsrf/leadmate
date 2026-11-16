# stage-meters Specification

## Purpose
Lets a scenario declare Stage Meters that fill with Meter Points from handled actions during a Stage, shows the Meter Points flying into them, and computes that Stage's handling score from them, so the Stars at the end match what the user saw while playing.

## Requirements

### Requirement: Scenarios may declare Stage Meters
A scenario SHALL be able to declare up to two Stage Meters, each with an id, a label and an icon from the catalog, a target number of Meter Points, and the Meter Points each kind of action adds to it. A scenario that declares none SHALL behave exactly as before.

#### Scenario: Stage without meters
- **WHEN** a Stage runs whose scenario declares no meters
- **THEN** no meter is shown, no Meter Points are shown, and its handling score is computed as before

#### Scenario: Invalid meter
- **WHEN** content declares a meter with no target, a target of zero or less, or an action kind the simulation does not report
- **THEN** content validation fails and names the meter and field

### Requirement: Stage Meters fill from simulation events
The simulation SHALL add a Stage Meter's Meter Points for an action on the tick the action is reported, cap each meter at its target, and keep meter values in the seeded state, so the same seed and inputs give the same meter values.

#### Scenario: Meter Points added
- **WHEN** a meter gives 10 Meter Points per Check-in hit and the user marks a Check-in
- **THEN** that meter rises by 10 on that tick, up to its target

#### Scenario: Repeatable
- **WHEN** two Stages with meters use the same seed and inputs
- **THEN** their meter values are identical at every tick and at the end

### Requirement: Meter Points fly into their Stage Meter
In a Stage with meters, each right action that adds Meter Points SHALL show them as a number that flies from the Dog into the meter it feeds, with the action's icon, and the meter SHALL visibly fill when it arrives. A meter that reaches its target SHALL show that it is full.

#### Scenario: Check-in into Connection
- **WHEN** a Check-in hit adds 10 Meter Points to a meter labelled Connection
- **THEN** "+10" with the eye icon flies from the Dog into the Connection meter and the meter fills by that amount

#### Scenario: Meter full
- **WHEN** a meter reaches its target
- **THEN** the meter shows a full state with a medium-tier effect, once

### Requirement: Handling score from meters
In a Stage with meters, the handling score SHALL be 1000 times the mean of each meter's value divided by its target, rounded, so filling every meter gives 1000 and the star thresholds of `reward-celebration` apply unchanged.

#### Scenario: Both meters full
- **WHEN** a Stage with two meters ends with both at their targets
- **THEN** the handling score is 1000 and the Node earns 3 stars

#### Scenario: One meter half full
- **WHEN** a Stage with two meters ends with one full and the other at half its target
- **THEN** the handling score is 750 and the Node earns 2 stars

#### Scenario: Daily Stage
- **WHEN** a Daily Stage ends
- **THEN** its handling score is computed by the Daily Stage rule, because the Daily Stage declares no meters
