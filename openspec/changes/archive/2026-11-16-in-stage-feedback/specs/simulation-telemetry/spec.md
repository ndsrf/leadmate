# Spec Delta

## ADDED Requirements

### Requirement: Marker timing grades in the payload
The debrief payload SHALL include `markGrades` with the number of Perfect and Good Marker timing grades (over Marker hits and Check-in hits) and the number of Late Marker presses in the Stage.

#### Scenario: Grades counted
- **WHEN** a Stage ends after two Perfect Check-in hits, one Good Marker hit and one Late Marker press
- **THEN** the payload's `markGrades` is perfect 2, good 1, late 1

### Requirement: Meter results in the payload
In a Stage with meters, the debrief payload SHALL include `meters`, giving each meter's id, final value and target, and its `handlingScore` SHALL be the one computed from the meters. In a Stage without meters the payload SHALL NOT include `meters`.

#### Scenario: Stage with meters
- **WHEN** a Stage with Nose and Connection meters ends
- **THEN** the payload lists both meters with value and target, and `handlingScore` matches the meter rule

#### Scenario: Stage without meters
- **WHEN** a Stage without meters ends
- **THEN** the payload has no `meters` field and its other fields are unchanged
