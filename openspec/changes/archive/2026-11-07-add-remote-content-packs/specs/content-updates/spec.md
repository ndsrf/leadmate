# Spec Delta

## Purpose

Defines how the app discovers, downloads, verifies and activates the newest published Content Pack of the user's chosen channel, stays fully usable offline from a bundled baseline, and lets testers switch between stable and beta content.

## ADDED Requirements

### Requirement: Bundled baseline content
The system SHALL include the stable pack in the app as its baseline so that every screen works on first launch, with no network, and after any failed or rejected update.

#### Scenario: First launch offline
- **WHEN** the app starts for the first time with no connection
- **THEN** the full baseline trail, Lessons, Nodes and Missions are available

#### Scenario: Baseline equals current content
- **WHEN** the app resolves the baseline pack
- **THEN** its Worlds, Lessons, Nodes, Missions and text equal what the app shipped before this change

### Requirement: Content channel setting
The system SHALL offer a Content channel setting with Stable and Beta, SHALL default to Stable, SHALL keep the choice on the device only, and SHALL show a visible indicator while Beta is selected.

#### Scenario: Default channel
- **WHEN** a user has never changed the setting
- **THEN** the app follows the stable channel

#### Scenario: Beta indicator
- **WHEN** Beta is selected
- **THEN** the app shows a "Beta content" indicator on screens that show content

#### Scenario: Dev build default
- **WHEN** a development build starts with no stored choice
- **THEN** it follows beta, and a production build follows stable

### Requirement: Beta switch is hidden from ordinary users
The system SHALL show the Content channel control in a production build only after a deliberate unlock gesture on the version label in Settings, SHALL remember the unlock on the device, and SHALL always show it in development builds.

#### Scenario: Ordinary user
- **WHEN** a user opens Settings in a production build without unlocking
- **THEN** no Content channel control is shown and the app follows Stable

#### Scenario: Tester unlocks
- **WHEN** the user taps the version label seven times quickly
- **THEN** the Content channel control appears and stays available after restarting the app

#### Scenario: Hide again
- **WHEN** an unlocked tester selects Stable and uses "Hide"
- **THEN** the control disappears until unlocked again

### Requirement: Channel switch applies immediately
The system SHALL, when the user changes the channel, fetch that channel's pack and apply it immediately without restarting the app, keeping the Dog's progress.

#### Scenario: Switch to beta online
- **WHEN** the user selects Beta while online
- **THEN** the beta pack is downloaded, verified and shown right away, and the choice is remembered

#### Scenario: Switch fails
- **WHEN** the beta pack cannot be downloaded or fails validation after the user selects it
- **THEN** the app keeps its current content and channel, and tells the user it could not load beta

#### Scenario: Switch back to stable
- **WHEN** the user selects Stable and its pack is cached
- **THEN** stable content shows immediately, even offline

### Requirement: Check for new content at launch
The system SHALL check the selected channel's published pointer in the background when the app starts, without delaying the first interactive screen, and SHALL NOT poll during a session.

#### Scenario: New content published
- **WHEN** the app starts online and the channel has a newer content version
- **THEN** the app downloads the changed files in the background

#### Scenario: Nothing new
- **WHEN** the published version equals the installed one
- **THEN** no content file is downloaded

#### Scenario: Slow or unreachable host
- **WHEN** the pointer cannot be fetched within a short timeout
- **THEN** the app continues with its current content and shows no error

### Requirement: Download only what changed
The system SHALL download only files whose hash differs from the stored copy, SHALL fetch structure and all text eagerly, SHALL fetch only the Spanish and the user's language text, and SHALL fetch media per World, starting with the Dog's current World and the next one.

#### Scenario: One Lesson edited
- **WHEN** a single Lesson text file changed between versions
- **THEN** only that file and any changed images it uses are downloaded

#### Scenario: Media of a far World
- **WHEN** a World the Dog has not reached has new images
- **THEN** its images are downloaded only after the current and next World are complete, or when the user opens it

#### Scenario: Media missing when shown
- **WHEN** a screen needs an image not yet downloaded
- **THEN** it shows the themed placeholder, requests the image, and replaces the placeholder when it arrives

### Requirement: Verified, atomic activation at next launch
The system SHALL verify every downloaded file against the manifest hash and SHALL activate a new pack from a background check only as a complete set at the next app launch, never during a running session.

#### Scenario: Hash mismatch
- **WHEN** a downloaded file does not match its manifest hash
- **THEN** the file is discarded and the pack is not activated

#### Scenario: Interrupted download
- **WHEN** the app closes before all required files are stored
- **THEN** the previous pack stays active and the download resumes at a later launch

#### Scenario: Session stability
- **WHEN** a new pack finishes downloading in the background while the user is in a Lesson or Stage
- **THEN** the content on screen does not change until the next launch

### Requirement: Rejected content never breaks the app
The system SHALL run the same validation the authoring tool uses on a downloaded pack before activation and SHALL fall back to the last good pack, then the baseline, when validation fails.

#### Scenario: Invalid pack published
- **WHEN** a downloaded pack fails validation in the app
- **THEN** it is not activated, the previous pack stays in use, and the failure is recorded only in a local log

#### Scenario: Corrupt cache
- **WHEN** the stored pack cannot be read at launch
- **THEN** the app uses the baseline and fetches the pack again

### Requirement: Progress survives content changes
The system SHALL keep a Dog's completed Nodes, read Lessons and Missions valid across pack updates and channel switches, including for content that was reordered, retired or absent from the other channel.

#### Scenario: Reordered trail
- **WHEN** an update reorders Stops
- **THEN** the Dog's completed Stops stay completed and the next open Stop follows the new order

#### Scenario: Retired Node
- **WHEN** an update retires a Node the Dog had completed
- **THEN** the Dog's progress and Stars are unchanged and the Stop no longer appears on the trail

#### Scenario: Progress on beta-only content
- **WHEN** the user completes a Node that exists only in beta and switches back to stable
- **THEN** the progress is kept and ignored by stable until that Node exists there

### Requirement: Only data from allowed sources
The system SHALL fetch packs only from the configured https content base, SHALL treat pack files strictly as data (never executed), and SHALL ignore files whose path escapes the pack's folders.

#### Scenario: Foreign address in a pack
- **WHEN** a pack file references an address outside the content base
- **THEN** validation fails and the reference is never fetched

#### Scenario: No content base configured
- **WHEN** no content base is configured
- **THEN** the app uses only the baseline pack, makes no content requests, and the Beta choice reports that remote content is unavailable
