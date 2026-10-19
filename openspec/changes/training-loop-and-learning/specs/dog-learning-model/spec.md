# Spec Delta

## Purpose

Defines how the virtual dog's learning attributes and arousal persist and evolve from the user's handling, without punishing absence.

## ADDED Requirements

### Requirement: Persistent learning attributes
The system SHALL maintain per-dog learning attributes, including reconnection latency and reactivity threshold, and SHALL persist them across sessions.

#### Scenario: Attributes survive restart
- **WHEN** the user closes and reopens the app
- **THEN** the dog's learning attributes have the same values as before closing

### Requirement: Attribute updates from performance
The system SHALL update the learning attributes after each simulation based on the user's mechanical successes and failures, with gains from good handling and only bounded, run-level setbacks from poor handling.

#### Scenario: Success improves attributes
- **WHEN** the user completes a simulation with a successful Poste and perfect marker timing
- **THEN** the dog's reconnection latency decreases or reactivity threshold increases

#### Scenario: Poor run does not erase progress
- **WHEN** the user has a run with repeated Rigid Pull states
- **THEN** attributes change by at most a bounded amount and never fall below the user's earlier best milestone

### Requirement: Arousal formula
The system SHALL compute arousal change in real time as ΔArousal = (v_distractor / d(Dog, Distractor)) × ReactivityMultiplier, where the ReactivityMultiplier derives from the dog's reactivity threshold.

#### Scenario: Closer distractor raises arousal faster
- **WHEN** a distractor at the same speed is at half the distance
- **THEN** ΔArousal doubles

### Requirement: No punitive regression for absence
The system SHALL NOT reduce the dog's attributes because the user missed days.

#### Scenario: Return after a gap
- **WHEN** the user returns after several days away
- **THEN** the dog's stored attributes are unchanged

### Requirement: Rusty Dog warm-up
On return after a gap, the system SHALL offer a 30-45 second easy warm-up walk that, once completed, restores the dog to 100% of its stored capacity for that session.

#### Scenario: Warm-up recalibrates
- **WHEN** the user completes the warm-up after a gap
- **THEN** the dog performs at full capacity in the next simulation

### Requirement: Visual dog evolution
The system SHALL render the dog's posture from its learning attributes: hunched with a stiff tail and forward-facing ears at the start, progressing to a relaxed tail, neutral ears and spontaneous eye contact as the attributes improve.

#### Scenario: Posture progresses
- **WHEN** the dog's attributes cross an improvement milestone
- **THEN** its animation set changes to the more relaxed posture

### Requirement: Attributes affect simulation behavior
The system SHALL use the dog's current learning attributes to drive its behavior in subsequent simulations.

#### Scenario: Behavior reflects history
- **WHEN** a dog has a lower reactivity threshold than before
- **THEN** it reacts to distractors at a greater distance in the next simulation

### Requirement: Follow chance and check-ins evolve with marks
The system SHALL raise the dog's follow chance after a turn and its check-in frequency when the user marks follow and check-in moments, and SHALL use the persisted values in place of the fixed values from the base simulation.

#### Scenario: Marked follows make following likelier
- **WHEN** the user marks the dog's look after it followed a turn across several simulations
- **THEN** the dog's follow chance in the next simulation is higher than before

#### Scenario: Gains are not lost by absence
- **WHEN** the user returns after a gap
- **THEN** the stored follow chance and check-in frequency are unchanged
