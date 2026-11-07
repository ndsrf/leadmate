# Spec Delta

## Purpose

Defines the Content Pack, a plain-file description of the app's Worlds, Lessons, Nodes, Missions, text in every language and media, organised in beta and stable channels, that authors and AI agents can create, reorder, validate, promote and publish without touching application code.

## ADDED Requirements

### Requirement: Content described as a pack of plain files
The system SHALL describe all trail content (Worlds and their ordered Stretches, Lessons, Nodes, Missions, their text and their media) as a Content Pack of YAML and Markdown files and media files, with no executable code.

#### Scenario: Add a Lesson with files only
- **WHEN** an author adds a Lesson folder and lists its id in a World's Stretch
- **THEN** the pack validates and the built app content shows that Lesson on the trail without any code change

#### Scenario: Reorder content
- **WHEN** an author changes the order of Stops in a Stretch or of Stretches in a World
- **THEN** the trail shows them in the new order and no id changes

### Requirement: All content of an item stays together
The system SHALL keep everything that belongs to one Lesson, Node or Mission in a single folder: its structure file, one text file per language, and its images, animation key and video links.

#### Scenario: Open one Lesson folder
- **WHEN** an author opens the folder of a Lesson
- **THEN** its structure, every language's text, its images and its video references are all in or below that folder

#### Scenario: Move or delete an item
- **WHEN** an author deletes or renames an item folder
- **THEN** nothing of that item remains elsewhere in the pack, apart from its id in a World's Stretch and in `retired` if it was published

### Requirement: Text per language with Spanish fallback
The system SHALL hold each item's sentences in one text file per language beside the item, SHALL show the Spanish text when the user's language file is missing or lacks a section, and SHALL never show a raw key.

#### Scenario: Add a language
- **WHEN** an author adds an English text file to a Lesson folder
- **THEN** users whose language is English see that Lesson in English and others are unchanged

#### Scenario: Partial translation
- **WHEN** a language file lacks a section that Spanish has
- **THEN** that section appears in Spanish and validation reports a warning naming the file and section

#### Scenario: Spanish required
- **WHEN** an item has no Spanish text file
- **THEN** validation fails

### Requirement: Nodes can define their own Stage
The system SHALL let a Node either name a supported scenario or embed a complete scenario as data, and SHALL validate an embedded scenario with the same rules as a built-in one.

#### Scenario: New Stage without a release
- **WHEN** an author adds a Node whose structure file embeds a valid scenario
- **THEN** the Node plays that Stage in an app built before the Node existed

#### Scenario: Invalid embedded scenario
- **WHEN** an embedded scenario fails scenario validation
- **THEN** pack validation fails with the scenario's own error messages

### Requirement: World tier and unlock order are content
The system SHALL take each World's tier, preview state, planned Node count and the World that unlocks it from the pack, and SHALL leave the decision of who may enter a Plus World to the app's membership check.

#### Scenario: Preview World becomes playable
- **WHEN** an author gives a Preview World stretches and clears its preview flag in the pack
- **THEN** the World is playable after the update once its unlock condition is met, with no app release

#### Scenario: Pack cannot grant access
- **WHEN** a pack marks a World as Plus
- **THEN** users without Plus membership still meet the paywall

### Requirement: Interface text stays in the app
The system SHALL keep app interface strings (buttons, Settings, HUD, paywall) in the app and SHALL NOT take them from a pack.

#### Scenario: Pack cannot change the interface
- **WHEN** a pack contains a file that names an interface string
- **THEN** validation reports it as unknown and the app ignores it

### Requirement: Format guide for AI agents and authors
The system SHALL ship a format guide beside the content that specifies every file kind, field, allowed value, id rule, where media and video links go, how to add a language, how to reorder, retire and promote content, with a worked example.

#### Scenario: Agent follows the guide
- **WHEN** an agent writes a new Lesson and Mission following only the guide
- **THEN** `content:validate` passes without errors

#### Scenario: Guide drift is caught
- **WHEN** the set of supported fields, block kinds or Stop kinds in the app differs from the guide
- **THEN** the repository tests fail until the guide is updated

### Requirement: Media and video references
The system SHALL let an item reference images by relative path inside its folder, a hosted Lesson Animation by key, and YouTube videos by video id per language, and SHALL reject any other kind of address.

#### Scenario: Video per language
- **WHEN** a Lesson lists a YouTube id for Spanish only
- **THEN** Spanish users see that video and other languages see no YouTube block

#### Scenario: Image outside the folder
- **WHEN** a Lesson references an image path that leaves its folder or an absolute address
- **THEN** validation fails

### Requirement: Beta and stable channels
The system SHALL keep two complete packs, `beta` and `stable`, as separate folders, each building and publishing independently with its own content version.

#### Scenario: Edit beta only
- **WHEN** an author edits a Lesson under beta and publishes beta
- **THEN** stable content, its manifest and its users are unchanged

#### Scenario: Promote beta to stable
- **WHEN** an author promotes beta
- **THEN** the stable folder becomes a copy of beta after beta validates, and nothing is published until stable is published

### Requirement: Every command takes a channel
The system SHALL accept a channel parameter on validate, build, watch, promote and publish, SHALL default publishing to beta, and SHALL publish stable only when asked explicitly and confirmed.

#### Scenario: Publish without a channel
- **WHEN** publish is run without a channel
- **THEN** it publishes beta

#### Scenario: Publish stable
- **WHEN** publish is run with channel stable
- **THEN** it asks for confirmation naming the channel and version before uploading, unless run with an explicit non-interactive confirmation flag

### Requirement: Validation with actionable errors
The system SHALL provide a validation command that checks a channel's pack and reports every problem with file, field and a fix hint, and SHALL exit non-zero on any error.

#### Scenario: Dangling reference
- **WHEN** a Stretch lists a Lesson or Node id that no folder defines
- **THEN** validation reports the file, the missing id and the ids that exist

#### Scenario: Missing text or image
- **WHEN** a Lesson refers to a section or image file that is not in its folder
- **THEN** validation fails and names the missing item

#### Scenario: Unknown behaviour
- **WHEN** a Node names a Minigame or Stage scenario the app does not support
- **THEN** validation fails and lists the supported values

#### Scenario: Unreachable or duplicate content
- **WHEN** two folders share an id, or a Lesson, Node or Mission is not placed in any World and is not marked as a library or home item
- **THEN** validation reports the duplicate or the orphan

### Requirement: Stable identifiers protect progress
The system SHALL treat content ids as permanent per channel: an id MUST NOT be reused for different content, and validation against that channel's previously published manifest SHALL fail if a published id disappears without being declared as retired.

#### Scenario: Retire content
- **WHEN** an author removes a Node from the trail and lists its id as retired
- **THEN** validation passes and a Dog that already completed that Node keeps its progress

#### Scenario: Silent removal
- **WHEN** a published id is missing from the new pack and is not retired
- **THEN** validation fails

### Requirement: Versioned and compatibility-checked manifest
The system SHALL build a pack into a manifest with a channel, a content version, a format version and a minimum app version, listing every file with its size and SHA-256 hash.

#### Scenario: Deterministic build
- **WHEN** the same pack is built twice
- **THEN** the manifests are identical except for the build timestamp

#### Scenario: Pack needs a newer app
- **WHEN** a pack uses a format or feature that requires a newer app version than the one running
- **THEN** that app ignores the pack and keeps its current content

### Requirement: Publish to hosted storage per channel
The system SHALL upload a validated pack's files and then its manifest pointer to the channel's own location in the configured storage, publishing the pointer last so a partial upload never exposes an incomplete pack.

#### Scenario: Interrupted publish
- **WHEN** an upload fails after some files were sent
- **THEN** the live pointer is unchanged and apps keep using the previous pack

#### Scenario: Unvalidated pack
- **WHEN** publish is run on a pack that fails validation
- **THEN** nothing is uploaded

#### Scenario: Roll back
- **WHEN** an author republishes a previous content version of a channel
- **THEN** the channel's pointer returns to it without affecting the other channel

### Requirement: Fast local iteration
The system SHALL rebuild the beta pack when its files change during development and SHALL make a dev build of the app load it immediately.

#### Scenario: Edit and reload
- **WHEN** an author saves an edit to a beta Lesson while the dev app runs
- **THEN** reloading the app shows the edited Lesson without publishing
