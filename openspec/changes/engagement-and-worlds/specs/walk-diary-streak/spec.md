# Spec Delta

## Purpose

Closes the loop between simulation and real life by logging real-world walk outcomes and tracking a daily streak.

## ADDED Requirements

### Requirement: Walk Diary check-in
The system SHALL let the user log the outcome of the debrief's real-world task with a single tap.

#### Scenario: One-tap log
- **WHEN** the user taps an outcome option in the Walk Diary
- **THEN** the system stores the entry with its date and the node it relates to

### Requirement: Daily streak
The system SHALL maintain a daily streak that increases by one for each calendar day on which the user completes a qualifying activity (a node, a Walk Diary check-in, or the daily walk).

#### Scenario: Streak increments
- **WHEN** the user completes a qualifying activity on a day following a streak day
- **THEN** the streak increases by one

#### Scenario: Streak resets
- **WHEN** a full calendar day passes without a qualifying activity
- **THEN** the streak resets to zero on the next day

### Requirement: Streak does not penalize the dog
Streak loss SHALL NOT change the dog's learning attributes.

#### Scenario: Reset leaves dog intact
- **WHEN** the streak resets
- **THEN** the dog's attributes are unchanged

### Requirement: Debrief closes with Walk Diary
The Debrief step SHALL offer a Walk Diary check-in for the node's real-world task.

#### Scenario: Check-in offered
- **WHEN** the debrief is shown
- **THEN** a one-tap Walk Diary check-in is available
