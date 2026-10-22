## MODIFIED Requirements

### Requirement: Local-first operation
The system SHALL keep the Dog, its name, Equipment, weights, Trigger Profile, Learning Attributes, Streak, Walk Diary, `seenHints` and `trialStartedAt` in local storage as the source of truth, SHALL work fully offline, and SHALL replicate them to the account when online. The simulation SHALL NOT read or write storage or the network.

#### Scenario: Offline play
- **WHEN** a registered user plays with no connection
- **THEN** the Stage and its updates are saved locally and replicated at the next sync

#### Scenario: Name replicated
- **WHEN** a registered user renames the Dog and later syncs
- **THEN** the account holds the new name, and a second device shows it after its next sync

#### Scenario: Record from before names
- **WHEN** a Dog record without a name is synced
- **THEN** it is accepted and the name is empty, the text shows a neutral "your Dog", and the user can set a name in settings

### Requirement: Existing Dog on the account
When the user registers or logs in on a device and the account already has a Dog, the system SHALL show both with a one-line summary each (name, Streak, Node progress) and SHALL ask which to keep. It SHALL NOT merge or overwrite silently, and SHALL keep the discarded side as a local backup for 30 days. A device still at the welcome screen that was never paired holds nothing, so the account's Dog replaces it without asking.

#### Scenario: Choose the cloud Dog
- **WHEN** the user chooses "Keep the cloud Dog"
- **THEN** the cloud Dog replaces the local one and the local one is backed up for 30 days

#### Scenario: First-run device
- **WHEN** a user logs in from the welcome screen of a device that was never paired and the account has a Dog
- **THEN** the account's Dog replaces the empty one without a prompt and resumes at its own onboarding step

