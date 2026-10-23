# Spec Delta

## MODIFIED Requirements

### Requirement: Taste Stage
The system SHALL run an unrecorded taste Stage on the simulation after the Dog's name and look, using a scenario tuned to end in a Reactive tier. On reaction or time limit, the system SHALL zoom in on the Handler and Dog, show the payoff over the Stage, and proceed to Dog setup without modifying the Dog record. The taste Stage SHALL show the Coach marks and the approaching-dog warning of `first-run-coaching`.

#### Scenario: The Dog reacts
- **WHEN** a new user plays the taste Stage
- **THEN** a trigger approaches, the Dog reacts, and the camera zooms in on the Handler and the Dog

#### Scenario: Control line, not a Hint
- **WHEN** the taste Stage starts
- **THEN** the drawn Coach marks are shown and each disappears when its control is first used
- **AND** no `seenHints` entry for a Hint is recorded; the only record is which controls the user has used

#### Scenario: Warning in the taste
- **WHEN** the taste Stage's trigger dog approaches
- **THEN** the approaching-dog warning is shown with the Dog's name
- **AND** it is not recorded as seen

#### Scenario: Nothing is learned
- **WHEN** the taste Stage ends
- **THEN** the Dog record is unchanged apart from the onboarding step

#### Scenario: Succeeding anyway
- **WHEN** a user holds the Dog until the time limit
- **THEN** the Stage ends at the limit and the payoff is shown over the Stage as for any other result

#### Scenario: Replayable only in the funnel
- **WHEN** the funnel is complete
- **THEN** the taste Stage is not offered again unless progress is reset

### Requirement: Guided first Stage
The system SHALL present the first Stage as an introductory learning loop comprising Theory Primer cards, a Checkpoint question, a guided walk simulation with event-triggered hints, and a Debrief. The Primer SHALL teach leash slack ("the smile"), movement controls, tension levels (green/yellow/red), the Poste anchor, and marking check-ins. The Checkpoint SHALL test the core stopping technique. The simulation SHALL show Coach marks for controls not yet used and one-shot, non-blocking event hints (leash color, marker, poste, approaching dog) and persist seen hints. The Debrief SHALL report handling feedback and conclude the first Stage before registration.

#### Scenario: Primer and Checkpoint precede the simulation
- **WHEN** the user continues from the Walk Plan
- **THEN** the Theory Primer cards and Checkpoint question are shown before the simulation begins

#### Scenario: Leash colors explained
- **WHEN** a new user's leash first becomes Taut in the first Stage
- **THEN** the meaning of the green, yellow and red leash is explained

#### Scenario: Marker explained
- **WHEN** a new user plays the first Stage
- **THEN** the Marker's purpose is explained before the first Reward Window

#### Scenario: Poste shown
- **WHEN** the leash first reaches its limit in the first Stage
- **THEN** the Poste is shown

#### Scenario: Coach marks
- **WHEN** a first guided Stage starts and the user did not use a control in the taste Stage
- **THEN** that control's Coach mark is shown and recorded as seen

#### Scenario: Approaching dog
- **WHEN** a dog first approaches in the first guided Stage and the warning has not been seen
- **THEN** the approaching-dog warning is shown and recorded as seen

#### Scenario: Replay
- **WHEN** the user replays the first Stage
- **THEN** hints already seen are not shown again

#### Scenario: Debrief before registration
- **WHEN** the first Stage walk finishes
- **THEN** the Debrief is shown with handling feedback before the registration prompt opens
