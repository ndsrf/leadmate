# Spec Delta

## ADDED Requirements

### Requirement: Diagnostic played as Read the Dog
The system SHALL run the Diagnostic as one round of the Read the Dog Minigame, played on a scene of the Dog in its breed and coat, SHALL record the reaction latency of the first round the user finishes, and SHALL use it only to seed the Dog's starting reconnection latency once. The round result SHALL offer Continue to the diagnostic card and an instant replay; replays SHALL NOT change the recorded latency. The Diagnostic SHALL NOT be a Stage.

#### Scenario: Fresh first round
- **WHEN** the Diagnostic opens
- **THEN** its first round starts at the lowest level with no carried level or signal chances

#### Scenario: Latency captured
- **WHEN** the user finishes the Diagnostic
- **THEN** a reaction latency value is recorded and seeds the Dog's reconnection latency

#### Scenario: No later effect
- **WHEN** the Diagnostic is replayed after onboarding
- **THEN** the Dog's Learning Attributes are unchanged

#### Scenario: Read the Dog in place of the reflex test
- **WHEN** the funnel reaches the Diagnostic
- **THEN** the user plays a Read the Dog round, classifying the Dog's body-language signals as Calm, Alert or About to react, and no Marker button is shown

#### Scenario: Replay in the funnel
- **WHEN** the user finishes the round, taps replay and finishes a second round much faster
- **THEN** the recorded latency and the seeded reconnection latency stay those of the first round

#### Scenario: Continue to the card
- **WHEN** the user taps Continue on the round result
- **THEN** the diagnostic card and personal plan are shown

#### Scenario: Closed during the round
- **WHEN** the app is closed during the Diagnostic, before the user taps Continue on a round result, and reopened
- **THEN** the Diagnostic starts again with a new round and no latency has been recorded

#### Scenario: Left with System Back
- **WHEN** the user leaves the Diagnostic with System Back during a round or on a round result, before Continue
- **THEN** no latency is recorded, and the Diagnostic starts again with a new round the next time the funnel reaches it

#### Scenario: Progress reset
- **WHEN** the user resets progress after finishing onboarding and goes through the funnel again
- **THEN** the Diagnostic is a Read the Dog round again, and its first finished round's latency is recorded and seeds the reconnection latency once

#### Scenario: User already past the Diagnostic
- **WHEN** a user whose latency was recorded by the earlier reflex test reaches the diagnostic card
- **THEN** that latency is kept and used, and the Read the Dog round is not shown to record it again

## REMOVED Requirements

### Requirement: Diagnostic
**Reason**: The 15-second "tap Marker when the Dog looks at you" reflex test is replaced by a Read the Dog round, which teaches body language while still measuring reaction latency.
**Migration**: See "Diagnostic played as Read the Dog". The step id, the stored latency, the exactly-once seeding of reconnection latency, the diagnostic card and the Personal Plan are unchanged; a latency already recorded by the reflex test is kept.
