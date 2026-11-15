# Spec Delta

## ADDED Requirements

### Requirement: Marker timing grade
The system SHALL grade every Marker hit and Check-in hit by the time from the start of its window (the Disengagement, or the start of the Dog's look) to the press: Perfect within 0.3 s, Good later within the window, and SHALL report the grade with the hit.

#### Scenario: Perfect
- **WHEN** the user presses the Marker 0.2 s after the Dog starts to look at the Handler
- **THEN** a Check-in hit is recorded with the grade Perfect

#### Scenario: Good
- **WHEN** the user presses the Marker 0.8 s after a Disengagement, inside the Reward Window
- **THEN** a Marker hit is recorded with the grade Good

### Requirement: Late Marker press
A Marker press within 1.0 s after a Check-in window or a Reward Window closed, with no other window open and the Dog neither fixated nor in Rigid Pull, SHALL be recorded as a Late Marker press instead of a wasted press. It spends a Mark and records no hit.

#### Scenario: Just after the look
- **WHEN** the Dog's Check-in window closed 0.4 s ago and the user presses the Marker
- **THEN** a Late Marker press is recorded, one Mark is spent and no Check-in hit is recorded

#### Scenario: Long after
- **WHEN** no window has closed in the last 1.0 s and the user presses the Marker with nothing to mark
- **THEN** the press is recorded as wasted, as before
