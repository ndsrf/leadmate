# Spec Delta: content-packs

## MODIFIED Requirements

### Requirement: Versioned and compatibility-checked manifest
The system SHALL require `contentVersion` as a positive integer in `pack.yaml`, and SHALL build a pack into a manifest with a channel, that content version, a format version and a minimum app version, listing every file with its size and SHA-256 hash.

#### Scenario: Deterministic build
- **WHEN** the same pack is built twice
- **THEN** the manifests are identical except for the build timestamp

#### Scenario: Pack needs a newer app
- **WHEN** a pack uses a format or feature that requires a newer app version than the one running
- **THEN** that app ignores the pack and keeps its current content

#### Scenario: Pack specifies content version in Git
- **WHEN** pack.yaml defines a positive integer `contentVersion`
- **THEN** pack validation succeeds and the built manifest records that content version

#### Scenario: Missing or invalid content version in pack
- **WHEN** pack.yaml omits `contentVersion` or defines a non-integer or value less than 1
- **THEN** pack validation fails with a descriptive error and fix hint

### Requirement: Publish to hosted storage per channel
The system SHALL upload a validated pack's files and then its manifest pointer to the channel's own location in the configured storage, publishing the pointer last so a partial upload never exposes an incomplete pack, and SHALL reject publishing when the pack's content version does not advance beyond the channel's currently published pointer unless performing an explicit rollback.

#### Scenario: Interrupted publish
- **WHEN** an upload fails after some files were sent
- **THEN** the live pointer is unchanged and apps keep using the previous pack

#### Scenario: Unvalidated pack
- **WHEN** publish is run on a pack that fails validation
- **THEN** nothing is uploaded

#### Scenario: Roll back
- **WHEN** an author republishes a previous content version of a channel
- **THEN** the channel's pointer returns to it without affecting the other channel

#### Scenario: Guard against publishing drifted or outdated version
- **WHEN** an author attempts to publish a pack whose `contentVersion` is less than or equal to the remote channel's active `latest.json` pointer
- **THEN** publishing halts with an actionable error indicating the remote version and requiring a version bump in `pack.yaml`
