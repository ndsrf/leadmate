## MODIFIED Requirements

### Requirement: Fast local iteration
The system SHALL rebuild the beta pack when its files change during development and SHALL make a dev build of the app that follows Beta load it immediately. A dev build that follows Stable SHALL keep using the stable pack.

#### Scenario: Edit and reload
- **WHEN** an author saves an edit to a beta Lesson while the dev app runs and follows Beta
- **THEN** reloading the app shows the edited Lesson without publishing

#### Scenario: Dev build on Stable
- **WHEN** an author saves an edit to a beta Lesson while the dev app follows Stable
- **THEN** the app keeps showing stable content until the author selects Beta

## ADDED Requirements

### Requirement: Release baseline is regenerated from stable
The system SHALL regenerate the bundled baseline from `content/stable` as part of building a release, so that a release never ships a baseline that was produced earlier and left unchanged, whether or not a promotion happened since. The baseline SHALL include each file's hash. Regeneration and the release check SHALL run in one release step used by both the EAS build and local release builds, in that order.

#### Scenario: Stable edited without a promotion
- **WHEN** `content/stable` was changed after the baseline was last generated and a release is built
- **THEN** the release contains a baseline generated from the current `content/stable`

#### Scenario: Deterministic baseline
- **WHEN** the baseline is generated twice from the same `content/stable`
- **THEN** the results are identical

#### Scenario: One release step
- **WHEN** a release is prepared by the EAS build or locally
- **THEN** the baseline is regenerated first and the release check runs second, and the release stops if either fails

### Requirement: Release check against the published stable pack
The system SHALL provide a release check that compares the baseline's content version and file hashes with the stable channel's published pointer and manifest, SHALL fail with an actionable message when they differ, and SHALL pass when they are identical.

#### Scenario: Baseline older than published stable
- **WHEN** the published stable content version is higher than the baseline's
- **THEN** the check fails, reports both versions, and says to rebuild the baseline from the published stable pack

#### Scenario: Baseline newer than published stable
- **WHEN** the baseline's content version is higher than the published stable version
- **THEN** the check fails, reports both versions, and says to publish stable before releasing

#### Scenario: Same version, different content
- **WHEN** the versions are equal but a file's hash differs between the baseline and the published manifest
- **THEN** the check fails, names the differing files, and says to bump `contentVersion` and publish

#### Scenario: Baseline matches
- **WHEN** the baseline's version and every file hash equal the published stable pack's
- **THEN** the check passes, so a first install finds nothing to download

#### Scenario: Host unreachable
- **WHEN** the published pointer cannot be fetched
- **THEN** the check fails with a message that it could not verify the release, rather than passing silently

#### Scenario: Explicit offline override
- **WHEN** the check is run with the explicit `--allow-offline` option and the published pointer cannot be fetched
- **THEN** it prints a warning that the release was not verified and does not fail, and the EAS build never passes this option

#### Scenario: Images are not compared
- **WHEN** the published manifest lists images the baseline does not hold
- **THEN** the check compares only the text and structure files the baseline holds, and the images do not make it fail
