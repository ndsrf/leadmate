# reward-timing Specification

## Purpose
Defines how a Fixation ends, the Reward Window that opens afterwards, and how the Marker is recorded.

## Requirements

### Requirement: Disengagement through calm handling
The system SHALL end the Dog's Fixation on a Distractor, producing a Disengagement, when the Handler has been stopped and the leash has not been in Rigid Pull for a continuous calm period.

#### Scenario: Calm period completes
- **WHEN** the Dog is fixated and the Handler stays stopped without Rigid Pull for the full calm period
- **THEN** the Dog disengages from the Distractor

#### Scenario: Calm period broken
- **WHEN** the Handler moves or the leash enters Rigid Pull before the calm period ends
- **THEN** the calm period restarts

### Requirement: Missed opportunity
If the Distractor leaves before the calm period completes, the system SHALL end the Fixation without opening a Reward Window and SHALL record a missed opportunity.

#### Scenario: Distractor passes
- **WHEN** the Distractor leaves while the calm period is still incomplete
- **THEN** no Reward Window opens and one missed opportunity is recorded

### Requirement: Reward Window on Disengagement
The system SHALL open a Reward Window lasting between 1.0 and 1.2 seconds when the Dog disengages.

#### Scenario: Window opens
- **WHEN** the Dog disengages from a Distractor such as a skateboarder
- **THEN** the system opens a Reward Window of 1.0 to 1.2 seconds

### Requirement: Marker hit
The system SHALL record a Marker hit when the user presses the Marker while the Reward Window is open, and the Dog SHALL then return to the Handler's side so the Stage continues.

#### Scenario: Capturing the Disengagement
- **WHEN** the Handler has stopped and the user presses the Marker within the open Reward Window
- **THEN** the system records a Marker hit and its accuracy
- **AND** the Dog returns to the Handler's side

### Requirement: Marker miss
The system SHALL record a Marker miss if the Reward Window closes without a press.

#### Scenario: Window expires
- **WHEN** the Reward Window closes with no Marker press
- **THEN** the system records a Marker miss

### Requirement: Reactive Marker
The system SHALL count a reactive Marker when the user presses the Marker while the Dog is pulling or fixated on a Distractor, because this rewards a reactive state, and SHALL NOT record it as a hit.

#### Scenario: Marking a fixated Dog
- **WHEN** the user presses the Marker while the Dog is fixated on a Distractor
- **THEN** the press is counted as a reactive Marker and not as a hit

### Requirement: Check-in hit
The system SHALL record a Check-in hit when the user presses the Marker while the Dog is looking at the Handler (a Check-in glance or a look after following a turn), counted separately from Marker hits on a Disengagement.

#### Scenario: Marking eye contact
- **WHEN** the Dog looks at the Handler and the user presses the Marker within the Check-in window
- **THEN** the system records a Check-in hit

### Requirement: Mark budget
The system SHALL give each Stage a fixed number of Marks (`markBudget`, default 5), spend one for every Marker press whether it is a hit, a miss, reactive or outside any window, show the remaining Marks on the Marker button, and ignore presses once none remain.

#### Scenario: Budget spent
- **WHEN** the user has pressed the Marker `markBudget` times
- **THEN** the Marker button is disabled and further presses record nothing

#### Scenario: Wasted press
- **WHEN** the user presses the Marker with no Reward Window or Check-in window open and the Dog neither fixated nor in Rigid Pull
- **THEN** one Mark is spent and no hit is recorded

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
