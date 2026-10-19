# Spec Delta

## Purpose

Defines how a Stage starts, ends and is controlled, and how its results are shown.

## ADDED Requirements

### Requirement: Stage end conditions
A scenario SHALL end its Stage either when the Handler reaches a final waypoint or when a time limit expires, as set by the scenario.

#### Scenario: Waypoint end
- **WHEN** a waypoint-ended scenario's Handler reaches the final waypoint
- **THEN** the Stage ends

#### Scenario: Time-limit end
- **WHEN** a time-limited scenario reaches its time limit
- **THEN** the Stage ends

### Requirement: Results and replay
When a Stage ends, the system SHALL show the results and offer to play again, with no pass or fail in this phase.

#### Scenario: Results shown
- **WHEN** the Stage ends
- **THEN** the results screen shows the telemetry numbers, including Check-in hits and Marks used out of the budget, and a Play again action

#### Scenario: Play again
- **WHEN** the user chooses Play again
- **THEN** a new Stage starts with a new random seed

### Requirement: Pause when unfocused
The system SHALL pause the Stage when the app or browser tab loses focus, and SHALL resume it only when the user chooses Resume. No Stage time elapses while paused.

#### Scenario: Tab hidden
- **WHEN** the browser tab is hidden during a Stage
- **THEN** the Stage pauses and shows a Resume action

### Requirement: No saved Stage
The system SHALL NOT save or resume a Stage that was left before it ended.

#### Scenario: App closed
- **WHEN** the user closes the app mid-Stage and reopens it
- **THEN** no Stage is resumed
