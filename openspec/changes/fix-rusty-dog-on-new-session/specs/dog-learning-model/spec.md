# Spec Delta

## ADDED Requirements

### Requirement: Rusty Dog is decided for each App Session
The system SHALL decide whether the Dog is Rusty from the stored last-Stage date each time an App Session starts: at launch and on a return to the foreground after at least 30 minutes away. The decision and the warm-up outcome SHALL hold until the next App Session starts or progress is reset.

#### Scenario: Gap reached while the app is in the background
- **WHEN** the app returns to the foreground after at least 30 minutes away and the last Stage is now 3 or more days old
- **THEN** the Dog is Rusty and the warm-up is offered

#### Scenario: Short absence
- **WHEN** the app returns to the foreground after less than 30 minutes away
- **THEN** the Rusty state and the warm-up outcome are unchanged

#### Scenario: New session after a graded Stage
- **WHEN** a Rusty Dog has finished a graded Stage and a new App Session starts less than 3 days later
- **THEN** the Dog is not Rusty

#### Scenario: New session forgets the warm-up outcome
- **WHEN** the warm-up was completed or skipped, no graded Stage has been finished since the gap, and a new App Session starts
- **THEN** the Dog is Rusty, the warm-up is offered again and no skip penalty applies until the user skips again

#### Scenario: Progress reset
- **WHEN** the user resets progress while the Dog is Rusty
- **THEN** the Dog is not Rusty and no warm-up outcome is kept

### Requirement: Warm-up countdown
During the warm-up walk the system SHALL show the whole seconds left of the walk, counting from its length of 40 seconds down toward 0, following the time the walk has run. It SHALL NOT show the countdown once no time is left, nor in any other Stage.

#### Scenario: Walk begins
- **WHEN** the warm-up walk starts
- **THEN** the countdown shows 40 s in the active language

#### Scenario: Time passes
- **WHEN** the walk has run for 10 seconds
- **THEN** the countdown shows 30 s

#### Scenario: Paused
- **WHEN** the walk is paused
- **THEN** the countdown keeps its value until the walk resumes

#### Scenario: Time is up
- **WHEN** the countdown reaches 0
- **THEN** it disappears and the walk ends

#### Scenario: Another Stage
- **WHEN** a Stage other than the warm-up walk runs
- **THEN** no countdown is shown
