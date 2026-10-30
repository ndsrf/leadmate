# Spec Delta

## MODIFIED Requirements

### Requirement: What reset clears and keeps
Reset SHALL return the Dog record to its first-run state, including onboarding step, the Dog's name and coat, `seenHints`, `trialStartedAt`, Walk Diary, Streak, Daily Stage scores, completed Nodes and Stars, read Lessons, Mission state, seen Fixes, custom voice cues (and delete their recordings), and the registration reminder state. It SHALL also clear the device's sync pairing so that no later sync merges the old progress back. It SHALL keep device settings (UI sounds and haptics) and cached level configs.

#### Scenario: Progress gone
- **WHEN** a user with completed Nodes and a Streak resets
- **THEN** the World Map after the funnel shows no completed Nodes and a Streak of zero

#### Scenario: Missions gone
- **WHEN** a user with a waiting Mission and passed Missions resets
- **THEN** the World Map after the funnel shows no Mission started or passed

#### Scenario: Device settings kept
- **WHEN** the user had turned UI sounds off and resets
- **THEN** UI sounds remain off

#### Scenario: Logging in after a reset
- **WHEN** a user who reset, and has not yet left the welcome screen, logs in to an account that already has a Dog
- **THEN** that Dog replaces the reset one and resumes at its own step, with no prompt and no merge

#### Scenario: Logging in after starting over
- **WHEN** a user who reset and then went past the welcome screen logs in to an account that already has a Dog
- **THEN** the system asks which Dog to keep, shows both with a summary, and does not merge them

#### Scenario: Old progress not resurrected
- **WHEN** a user who reset then registers a new account
- **THEN** the new account receives the reset Dog only
