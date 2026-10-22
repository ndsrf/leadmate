## ADDED Requirements

### Requirement: Reset progress action
The Settings screen SHALL offer a Reset progress action only while no account is signed in, and SHALL NOT show it, or any disabled placeholder for it, while an account is signed in. After the user confirms, the action replaces the Dog with a brand-new one and returns the user to Dog setup as on first run. The action SHALL be in its own last section, visually separated from other options, and SHALL NOT run on a single press.

#### Scenario: Reset
- **WHEN** a signed-out user confirms Reset progress
- **THEN** Dog setup is shown with no earlier answers

#### Scenario: Cancel
- **WHEN** the user opens the confirmation and cancels
- **THEN** nothing is changed

#### Scenario: Signed in
- **WHEN** an account is signed in
- **THEN** Settings shows no Reset progress section

#### Scenario: Signing in hides it
- **WHEN** the user signs in while Settings is open
- **THEN** the Reset progress section disappears

### Requirement: Explicit confirmation
The confirmation SHALL name what is lost (Dog, Learning Attributes, Streak, Stars, Walk Diary and Daily Stage scores), state that it cannot be undone, and require a deliberate second action (a distinct destructive button, with Cancel as the default). It SHALL NOT require typing.

#### Scenario: Warning text
- **WHEN** the confirmation opens
- **THEN** it lists what will be erased and says it cannot be undone

### Requirement: What reset clears and keeps
Reset SHALL return the Dog record to its first-run state, including onboarding step, `seenHints`, `trialStartedAt`, Walk Diary, Streak, Daily Stage scores, completed Nodes and Stars, custom voice cues (and delete their recordings), and the registration reminder state. It SHALL also clear the device's sync pairing so that no later sync merges the old progress back. It SHALL keep device settings (UI sounds and haptics) and cached level configs.

#### Scenario: Progress gone
- **WHEN** a user with completed Nodes and a Streak resets
- **THEN** the World Map after setup shows no completed Nodes and a Streak of zero

#### Scenario: Device settings kept
- **WHEN** the user had turned UI sounds off and resets
- **THEN** UI sounds remain off

#### Scenario: Logging in after a reset
- **WHEN** a user who reset while signed out later logs in to an account that already has a Dog
- **THEN** the system asks which Dog to keep, shows both with a summary, and does not merge them

#### Scenario: Old progress not resurrected
- **WHEN** a user who reset then registers a new account
- **THEN** the new account receives the reset Dog only

### Requirement: Reset survives restart
The reset SHALL be persisted before the user is returned to setup, so closing the app straight after reset does not bring the old progress back.

#### Scenario: Killed after reset
- **WHEN** the app is closed right after a reset and reopened
- **THEN** the splash is followed by Dog setup
