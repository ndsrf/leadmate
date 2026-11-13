# content-updates Specification

## Purpose
Defines how the app discovers, downloads, verifies and activates the newest published Content Pack of the user's chosen channel, stays fully usable offline from a bundled baseline, and lets testers switch between stable and beta content.

## Requirements

### Requirement: Bundled baseline content
The system SHALL include the stable pack of the release in the app as its baseline, with its explicit `contentVersion` preserved from `pack.yaml` and with the hash of every file it describes, so that every screen works on first launch, with no network, after any failed or rejected update, and exposes its authentic content version to the runtime. The baseline SHALL equal the stable pack as it was when the release was built.

#### Scenario: First launch offline
- **WHEN** the app starts for the first time with no connection
- **THEN** the full baseline trail, Lessons, Nodes and Missions are available

#### Scenario: Baseline equals current content
- **WHEN** the app resolves the baseline pack
- **THEN** its Worlds, Lessons, Nodes, Missions and text equal the stable pack the release was built from

#### Scenario: Baseline reflects pack content version
- **WHEN** the app starts with no active downloaded pack and falls back to the baseline pack
- **THEN** the active runtime contentVersion matches the bundled baseline's `contentVersion`

#### Scenario: Baseline carries file hashes
- **WHEN** the updater compares a published manifest with the bundled baseline
- **THEN** it can tell, for every text and structure file the baseline holds, whether the published file is identical, without downloading it

### Requirement: Content channel setting
The system SHALL offer a Content channel setting with Stable and Beta, SHALL default to Stable in every build, development builds included, SHALL keep the choice on the device only, and SHALL show a visible indicator while Beta is selected.

#### Scenario: Default channel
- **WHEN** a user has never changed the setting
- **THEN** the app follows the stable channel

#### Scenario: Beta indicator
- **WHEN** Beta is selected
- **THEN** the app shows a "Beta content" indicator on screens that show content

#### Scenario: Dev build default
- **WHEN** a development build starts with no stored choice
- **THEN** it follows stable, like a production build, and the Content channel control lets the developer select Beta

#### Scenario: Dev build with no stored choice after upgrade
- **WHEN** a development device that never stored a choice, and followed Beta under the previous default, starts after the upgrade
- **THEN** it follows stable, and no migration or stored value is involved

#### Scenario: Only Stable has a baseline
- **WHEN** Beta is selected
- **THEN** the bundled baseline is not used as a stored copy for it

#### Scenario: Dev build remembers Beta
- **WHEN** a developer selects Beta in a development build
- **THEN** the choice is remembered on the device and later launches follow Beta until it is changed

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

### Requirement: Live content version is visible to testers
The system SHALL show, under the app version in Settings, which content is live (the channel and its content version, or that it is the copy bundled in the app), only where the Content channel control is shown.

#### Scenario: Downloaded pack is live
- **WHEN** a tester opens Settings while a downloaded beta pack of version 3 is active
- **THEN** the line reads "Beta · v3"

#### Scenario: Bundled content is live
- **WHEN** a tester opens Settings and no downloaded pack is active for the selected channel
- **THEN** the line shows the channel with "incluido en la app"

#### Scenario: Ordinary user
- **WHEN** an ordinary user opens Settings in a production build without unlocking
- **THEN** no content version line is shown

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
- **WHEN** a development build that follows Beta finds newer content at launch
- **THEN** it downloads and activates it as soon as it is complete, instead of waiting for the next launch

#### Scenario: Development build on Stable waits for next launch
- **WHEN** a development build that follows Stable finds newer content at launch
- **THEN** it downloads it and activates it at the next launch, like a production build

### Requirement: Download only what changed
The system SHALL download only files whose hash differs from the stored copy, SHALL compare against the stored copy made of the installed pack's files plus, for any file the installed pack lacks, the bundled baseline (Stable only), SHALL fetch structure and all text eagerly, SHALL fetch only the Spanish and the user's language text, and SHALL fetch media per World, starting with the Dog's current World and the next one. The system SHALL download several files at the same time, up to a fixed small limit, rather than one after another.

#### Scenario: One Lesson edited
- **WHEN** a single Lesson text file changed between versions
- **THEN** only that file and any changed images it uses are downloaded

#### Scenario: First install seeded from the baseline
- **WHEN** a newly installed app with no downloaded stable pack finds a newer published stable version
- **THEN** structure and text files whose hash equals the bundled baseline's are not downloaded, only the files that differ or that the baseline does not hold are, and the installed pack holds just those downloaded files, with the baseline supplying the rest

#### Scenario: Update after a partial first install
- **WHEN** a later stable version is published after a first-install pack that held only downloaded files
- **THEN** the diff compares against the installed manifest plus the baseline's hashes for the files the pack lacks, and the new pack is staged as a complete set with files copied from the installed pack and the baseline

#### Scenario: Beta has no baseline
- **WHEN** the user selects Beta and no beta pack is installed
- **THEN** every file the selected languages need is downloaded, because the baseline holds only stable content

#### Scenario: Concurrent downloads
- **WHEN** several files must be downloaded
- **THEN** up to a fixed small number of them are in flight at once, structure and text are requested before media, and the current and next World's media before the rest

#### Scenario: Cancelling in-flight downloads
- **WHEN** a download of the pack fails
- **THEN** no new requests start, in-flight requests are cancelled where the platform allows, and the results of any that still finish are never stored

#### Scenario: Media of a far World
- **WHEN** a World the Dog has not reached has new images
- **THEN** its images are downloaded only after the current and next World are complete, or when the user opens it

#### Scenario: Media missing when shown
- **WHEN** a screen needs an image not yet downloaded
- **THEN** it shows the themed placeholder, requests the image, and replaces the placeholder when it arrives

### Requirement: Download progress is shown
The system SHALL show a progress banner across the top of the app, with Migas and a bar that fills per file, while a Content Pack downloads, whether from a channel switch or from an update found at launch. It SHALL appear only once files are being downloaded, disappear when the download succeeds, fails or is abandoned, and never take touches. The bar SHALL count completed files out of the total and SHALL never move backwards, even when several files download at once. Migas SHALL stay still under the OS reduced-motion setting.

#### Scenario: Channel switch downloads a pack
- **WHEN** the user selects Beta and its pack is not cached
- **THEN** the banner shows "Actualizando contenido…" with the bar advancing per file until the pack is applied or the switch fails

#### Scenario: Update found at launch
- **WHEN** the app starts online and the channel has newer content that must be downloaded
- **THEN** the banner shows while the files download, and the user can keep using the app

#### Scenario: Nothing to download
- **WHEN** the published version equals the installed one, or the host cannot be reached
- **THEN** no banner is shown

#### Scenario: Download fails
- **WHEN** a download fails or the pack is rejected
- **THEN** the banner disappears and the failure is reported as for any failed update

#### Scenario: Reduced motion
- **WHEN** the OS reduced-motion setting is on
- **THEN** the banner still shows the bar advancing, with Migas still

#### Scenario: Progress under concurrency
- **WHEN** files finish in a different order from the one they were requested
- **THEN** the bar shows the number of files finished and never decreases

### Requirement: One content update at a time
The system SHALL run content downloads and channel switches one after another, never at the same time, so that the start-up check and a channel switch (or two switches) cannot share and corrupt one staging folder. A later request SHALL wait for the earlier one and then act on the result it left.

#### Scenario: Switch while the start-up check is downloading
- **WHEN** the user selects Beta while the start-up check is still downloading the beta pack
- **THEN** the switch waits for that download, finds the pack already installed, and applies it without downloading the files again

#### Scenario: Switch back during a download
- **WHEN** the user selects Stable while a Beta switch is still downloading
- **THEN** the Stable switch runs after the Beta one finishes, and the app ends on Stable

### Requirement: Verified, atomic activation at next launch
The system SHALL verify every downloaded file against the manifest hash and SHALL activate a new pack from a background check only as a complete set at the next app launch, never during a running session, where files held by the bundled baseline count as present and the set is validated as merged with the baseline. When one download fails or fails verification, the system SHALL stop the remaining downloads of that pack and SHALL NOT activate it.

#### Scenario: Hash mismatch
- **WHEN** a downloaded file does not match its manifest hash
- **THEN** the file is discarded and the pack is not activated

#### Scenario: One of several concurrent downloads fails
- **WHEN** a file fails while others of the same pack are still downloading
- **THEN** the remaining downloads are abandoned, the partial pack is discarded, and the previous pack stays active

#### Scenario: Merged pack fails validation
- **WHEN** a pack that relies on the baseline for some files fails validation once merged with it
- **THEN** it is not activated and the previous content stays active

#### Scenario: Interrupted download
- **WHEN** the app closes before all required files are stored
- **THEN** the previous pack stays active and the download resumes at a later launch

#### Scenario: Activation fails
- **WHEN** a verified pack cannot be put in place (for example a storage error)
- **THEN** the previous pack stays active and the failure is reported as a failed update, never as an uncaught error

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
