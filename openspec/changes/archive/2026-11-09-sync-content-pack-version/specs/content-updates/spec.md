# Spec Delta: content-updates

## MODIFIED Requirements

### Requirement: Bundled baseline content
The system SHALL include the stable pack in the app as its baseline with its explicit `contentVersion` preserved from `pack.yaml`, so that every screen works on first launch, with no network, after any failed or rejected update, and exposes its authentic content version to the runtime.

#### Scenario: First launch offline
- **WHEN** the app starts for the first time with no connection
- **THEN** the full baseline trail, Lessons, Nodes and Missions are available

#### Scenario: Baseline equals current content
- **WHEN** the app resolves the baseline pack
- **THEN** its Worlds, Lessons, Nodes, Missions and text equal what the app shipped before this change

#### Scenario: Baseline reflects pack content version
- **WHEN** the app starts with no active downloaded pack and falls back to the baseline pack
- **THEN** the active runtime contentVersion matches the bundled baseline's `contentVersion`

### Requirement: Check for new content at launch
The system SHALL check the selected channel's published pointer in the background when the app starts, without delaying the first interactive screen, SHALL compare the remote version against the highest of the installed pack version and the bundled baseline pack version, and SHALL NOT poll during a session.

#### Scenario: New content published
- **WHEN** the app starts online and the channel has a newer content version
- **THEN** the app downloads the changed files in the background

#### Scenario: Nothing new
- **WHEN** the published version equals the installed one
- **THEN** no content file is downloaded

#### Scenario: Bundled baseline already matches remote version
- **WHEN** a newly installed app or updated binary starts with no cached pack, and the published remote content version is less than or equal to the bundled baseline pack version
- **THEN** the updater reports up-to-date and downloads no files

#### Scenario: Slow or unreachable host
- **WHEN** the pointer cannot be fetched within a short timeout
- **THEN** the app continues with its current content and shows no error

#### Scenario: Pointer is never read from a cache
- **WHEN** the app reads the channel's published pointer
- **THEN** it asks for a fresh copy (no cache on the way may answer), so a newly published version is seen at the next launch

#### Scenario: Development build applies at once
- **WHEN** a development build finds newer content at launch
- **THEN** it downloads and activates it as soon as it is complete, instead of waiting for the next launch
