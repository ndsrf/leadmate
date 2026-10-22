## MODIFIED Requirements

### Requirement: Reset progress action
The Settings screen SHALL offer a Reset progress action only for a Dog that has no cloud copy: while no account is signed in and the device is not paired with an account's Dog. It SHALL NOT show it, or any disabled placeholder for it, otherwise. After the user confirms, the action replaces the Dog with a brand-new one and returns the user to the welcome screen as on first run. The action SHALL be in its own last section, visually separated from other options, and SHALL NOT run on a single press.

#### Scenario: Reset
- **WHEN** a signed-out user with no cloud Dog confirms Reset progress
- **THEN** the welcome screen is shown with no earlier answers

#### Scenario: Cancel
- **WHEN** the user opens the confirmation and cancels
- **THEN** nothing is changed

#### Scenario: Signed in
- **WHEN** an account is signed in
- **THEN** Settings shows no Reset progress section

#### Scenario: Paired with a cloud Dog
- **WHEN** no account is signed in but the device is still paired with an account's Dog
- **THEN** Settings shows no Reset progress section

#### Scenario: Signing in hides it
- **WHEN** the user signs in while Settings is open
- **THEN** the Reset progress section disappears

### Requirement: What reset clears and keeps
Reset SHALL return the Dog record to its first-run state, including onboarding step, the Dog's name and coat, `seenHints`, `trialStartedAt`, Walk Diary, Streak, Daily Stage scores, completed Nodes and Stars, custom voice cues (and delete their recordings), and the registration reminder state. It SHALL also clear the device's sync pairing so that no later sync merges the old progress back. It SHALL keep device settings (UI sounds and haptics) and cached level configs.

#### Scenario: Progress gone
- **WHEN** a user with completed Nodes and a Streak resets
- **THEN** the World Map after the funnel shows no completed Nodes and a Streak of zero

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

### Requirement: Reset survives restart
The reset SHALL be persisted before the user is returned to the welcome screen, so closing the app straight after reset does not bring the old progress back.

#### Scenario: Killed after reset
- **WHEN** the app is closed right after a reset and reopened
- **THEN** the splash is followed by the welcome screen
