# Spec Delta

## Purpose

Defines how the Dog's Arousal works during a Stage and how its Learning Attributes persist and evolve from the user's handling, without punishing absence.

## ADDED Requirements

### Requirement: Persistent Learning Attributes
The system SHALL maintain, for the Dog, the Learning Attributes `reconnectionLatency`, `reactivityThreshold`, `followChance` and `checkInFrequency` as continuous values, SHALL store them in one versioned local record, and SHALL persist them across sessions.

#### Scenario: Attributes survive restart
- **WHEN** the user closes and reopens the app
- **THEN** the Dog's Learning Attributes have the same values as before closing

### Requirement: Learning snapshot as simulation input
The system SHALL pass the Learning Attributes, Trigger Profile, Equipment and session modifiers to a Stage as a read-only snapshot in its config, and SHALL compute the new Learning Attributes after the Stage with a pure function of the old attributes and the debrief payload. The simulation SHALL NOT read or write storage.

#### Scenario: Replay with a snapshot
- **WHEN** a Stage is replayed with the same seed, inputs and snapshot
- **THEN** it produces the same payload

#### Scenario: Pure update
- **WHEN** the update function receives the same attributes and payload twice
- **THEN** it returns the same new attributes

### Requirement: Arousal meter
The system SHALL keep an Arousal meter from 0 to 100 for the Dog during a Stage, starting at 0, SHALL raise it near Distractors and during Rigid Pull, SHALL lower it slowly when no Distractor is near, and SHALL NOT persist it between Stages.

#### Scenario: Starts calm
- **WHEN** a Stage starts
- **THEN** the Dog's Arousal is 0

#### Scenario: Decays when calm
- **WHEN** no Distractor is within range and no Rigid Pull is happening
- **THEN** the Dog's Arousal decreases over time, down to 0

### Requirement: Arousal formula
The system SHALL compute the Arousal change from a Distractor in real time as ΔArousal = (v_distractor / d(Dog, Distractor)) × TriggerFactor, where TriggerFactor comes from the Dog's Trigger Profile level for that kind of Distractor, and SHALL clamp Arousal to 0-100.

#### Scenario: Closer Distractor raises Arousal faster
- **WHEN** a Distractor at the same speed is at half the distance
- **THEN** ΔArousal doubles

### Requirement: Arousal during Fixation and reward
The system SHALL keep raising Arousal while the Dog is fixated, SHALL lower it at Disengagement, and SHALL lower it by an extra fixed amount on a Marker hit.

#### Scenario: Fixation keeps rising
- **WHEN** the Dog stays fixated near a fast Distractor
- **THEN** its Arousal keeps rising

#### Scenario: Marker hit calms
- **WHEN** the user records a Marker hit
- **THEN** the Dog's Arousal drops by the reward amount

### Requirement: Attribute updates from performance
The system SHALL update the Learning Attributes after each Stage from the debrief payload, with gains from good handling and only bounded, run-level setbacks from poor handling, and SHALL give a lower `peakArousalScore` at the same difficulty a larger gain.

#### Scenario: Success improves attributes
- **WHEN** the user completes a Stage with a successful Poste and perfect Marker timing
- **THEN** the Dog's `reconnectionLatency` decreases or its `reactivityThreshold` increases

#### Scenario: Poor run does not erase progress
- **WHEN** the user has a Stage with repeated Rigid Pull
- **THEN** each attribute changes by at most the per-run setback cap and never falls below its earlier milestone floor

#### Scenario: Minigames do not change the Dog
- **WHEN** the user completes a Minigame
- **THEN** the Learning Attributes are unchanged

### Requirement: No punitive regression for absence
The system SHALL NOT reduce the Dog's Learning Attributes, Trigger Profile levels or visual milestone because the user missed days.

#### Scenario: Return after a gap
- **WHEN** the user returns after several days away
- **THEN** the Dog's stored values are unchanged

### Requirement: Rusty Dog warm-up
After a gap of 3 or more days since the last Stage, the system SHALL offer an optional, easy warm-up walk of 30-45 seconds that, once completed, restores the Dog to 100% of its stored capacity for that session. If the user skips it, the system SHALL apply a session-only capacity multiplier below 100% and SHALL NOT change stored values. The warm-up SHALL NOT change any Learning Attribute.

#### Scenario: Warm-up recalibrates
- **WHEN** the user completes the warm-up after a gap
- **THEN** the Dog performs at full capacity in the next Stage

#### Scenario: Warm-up skipped
- **WHEN** the user skips the warm-up after a gap
- **THEN** the Dog performs below full capacity in this session and the stored attributes are unchanged

### Requirement: Visual Dog evolution
The system SHALL render the Dog's posture in three stages (hunched with a stiff tail and forward ears, neutral, relaxed with spontaneous eye contact) from the average progress of its Learning Attributes, SHALL change stage when that average crosses 33% and 66%, and SHALL NOT regress to an earlier stage once reached. Posture SHALL be visual only.

#### Scenario: Posture progresses
- **WHEN** the average progress of the Learning Attributes crosses a milestone
- **THEN** the Dog's animation set changes to the more relaxed posture

### Requirement: Attributes affect simulation behavior
The system SHALL use the Learning Attributes in the snapshot to drive the Dog's behavior in the Stage.

#### Scenario: Behavior reflects history
- **WHEN** the Dog has a lower `reactivityThreshold` than before
- **THEN** it reacts to Distractors from a greater distance in the next Stage

### Requirement: Follow chance and check-ins evolve with marks
The system SHALL raise `followChance` and `checkInFrequency` when the user marks follow and Check-in moments, and SHALL use the persisted values in place of the fixed values from the base simulation.

#### Scenario: Marked follows make following likelier
- **WHEN** the user marks the Dog's look after it followed a turn across several Stages
- **THEN** the Dog's `followChance` in the next Stage is higher than before

#### Scenario: Gains are not lost by absence
- **WHEN** the user returns after a gap
- **THEN** the stored `followChance` and `checkInFrequency` are unchanged
