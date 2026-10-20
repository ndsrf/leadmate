# account-sync Specification

## Purpose
Defines accounts and the local-first replication of the user's profile data to Supabase. Local storage stays the source of truth ([ADR 0006](../../../docs/adr/0006-local-first-sync.md)).

## Requirements
### Requirement: Email and password auth
The system SHALL support sign-up, login, logout and password reset with email and password, SHALL persist the session across restarts, and SHALL NOT offer social login.

#### Scenario: Session persists
- **WHEN** a logged-in user restarts the app
- **THEN** they are still logged in

### Requirement: Email verification
The system SHALL let an unverified account sync for 7 days after sign-up and SHALL pause syncing after that until the email is verified, without limiting local play.

#### Scenario: Unverified after a week
- **WHEN** 8 days have passed since sign-up and the email is unverified
- **THEN** syncing pauses and the user is asked to verify, and play continues locally

### Requirement: Local-first operation
The system SHALL keep the Dog, Equipment, weights, Trigger Profile, Learning Attributes, Streak, Walk Diary, `seenHints` and `trialStartedAt` in local storage as the source of truth, SHALL work fully offline, and SHALL replicate them to the account when online. The simulation SHALL NOT read or write storage or the network.

#### Scenario: Offline play
- **WHEN** a registered user plays with no connection
- **THEN** the Stage and its updates are saved locally and replicated at the next sync

### Requirement: Migration on registration
The system SHALL upload the existing local data to a brand-new account without prompting.

#### Scenario: New account
- **WHEN** a user registers an account that has no Dog
- **THEN** the local Dog and progress are uploaded

### Requirement: Existing Dog on the account
When the user registers or logs in on a device and the account already has a Dog, the system SHALL show both with a one-line summary each (name, Streak, Node progress) and SHALL ask which to keep. It SHALL NOT merge or overwrite silently, and SHALL keep the discarded side as a local backup for 30 days.

#### Scenario: Choose the cloud Dog
- **WHEN** the user chooses "Keep the cloud Dog"
- **THEN** the cloud Dog replaces the local one and the local one is backed up for 30 days

### Requirement: Conflict resolution
The system SHALL resolve conflicting edits per record by last-write-wins on `updatedAt`, SHALL union Walk Diary entries by date and Node, SHALL keep the best Daily Stage score per date, SHALL keep the longer Streak (the later `lastActiveDate` for the current run, the maximum for the best), and SHALL NOT blend Learning Attributes field by field.

#### Scenario: Two devices edit
- **WHEN** two devices change the Learning Attributes offline
- **THEN** the record with the later `updatedAt` wins whole

#### Scenario: Diary entries from both devices
- **WHEN** each device logged a different day
- **THEN** both days are present after sync

### Requirement: One Dog per account
The system SHALL support one Dog per account, and the stored rows SHALL be keyed by `user_id` and `dog_id`, protected by row-level security so a user can only access their own rows.

#### Scenario: Other user's rows
- **WHEN** a user queries another user's Dog
- **THEN** no rows are returned

### Requirement: Remote level configs
The system SHALL fetch remote level configs, validate them against the same schema as bundled configs, cache them, record the `configVersion` in the Stage payload, and fall back silently to bundled configs when a remote config is invalid or unreachable. Daily Stages SHALL always use the bundled generator.

#### Scenario: Unreachable
- **WHEN** the device is offline
- **THEN** the bundled config is used and no error is shown

#### Scenario: Invalid config
- **WHEN** a remote config fails validation
- **THEN** the bundled config is used

### Requirement: Account deletion
The system SHALL let the user delete their account in the app, which SHALL delete all their rows in the cloud and sign them out, keeping local data unless they also clear it.

#### Scenario: Delete
- **WHEN** the user confirms account deletion
- **THEN** all their cloud rows are removed and they are logged out
