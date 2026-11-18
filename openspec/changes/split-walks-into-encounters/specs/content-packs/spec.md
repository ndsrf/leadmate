# Spec Delta

## ADDED Requirements

### Requirement: Nodes can define an Encounter Series
The system SHALL let a walking Node's structure file define an Encounter Series instead of one scenario: 3 to 5 Encounters, each with a unique kebab-case id, an Aim, and a scenario validated with the same rules as an embedded scenario. Each Encounter's title SHALL come from the Node's text files in every language, with Spanish fallback.

#### Scenario: Valid Series
- **WHEN** an author lists four Encounters with ids, Aims and valid scenarios in a walking Node and adds their titles to the Node's Spanish text
- **THEN** pack validation passes and the Node plays the Series

#### Scenario: Missing title
- **WHEN** an Encounter has no title in the Node's Spanish text
- **THEN** validation fails and names the Node and the Encounter id

#### Scenario: English title falls back
- **WHEN** an Encounter has a Spanish title and no English title and the app runs in English
- **THEN** the Spanish title is shown

### Requirement: Encounter Series validation
Pack validation SHALL fail, naming the Node, Encounter and field, when a Series has fewer than 3 or more than 5 Encounters, duplicate Encounter ids, an unknown Aim, a time limit outside 10 to 20 seconds, a `keep-slack` or `stay-calm` Encounter that is not waypoint-ended, a Series on a Node that is not a walking Node, or a Node that sets both a Series and a single scenario. Validation SHALL NOT enforce authoring guidance that playtest tunes, such as route length or the number of Distractors.

#### Scenario: Too long
- **WHEN** an Encounter sets a 40-second time limit
- **THEN** validation fails, names the Encounter and says the limit must be 10 to 20 seconds

#### Scenario: Unknown Aim
- **WHEN** an Encounter's Aim is not one of the supported Aims
- **THEN** validation fails and lists the supported Aims

#### Scenario: Series too short
- **WHEN** a Node lists two Encounters
- **THEN** validation fails and says a Series holds 3 to 5 Encounters

#### Scenario: Long route allowed
- **WHEN** a waypoint-ended Encounter has a 40 m route and otherwise follows the rules
- **THEN** validation passes, and the format guide's route guidance is left to review and playtest

### Requirement: Encounters exclude meters, scents and Jackpots
Pack validation SHALL fail, naming the Node, Encounter and field, when an Encounter scenario declares Stage Meters, Scent Spots (including those carried by scenery items) or Jackpots.

#### Scenario: Scenery scent rejected
- **WHEN** an Encounter's scenario places a scenery item that carries a Scent Spot
- **THEN** validation fails and names the Encounter and the field

### Requirement: Encounter Series need a recent app
A pack whose Nodes use an Encounter Series SHALL declare a `minAppVersion` at least the first app version that plays Encounter Series, and validation SHALL fail otherwise, so older apps keep the content they already have.

#### Scenario: Old minimum version
- **WHEN** a pack with an Encounter Series declares a `minAppVersion` older than the first version that plays Series
- **THEN** validation fails and names the version to set

### Requirement: Format guide covers Encounter Series
The format guide SHALL document the Encounter Series fields, the supported Aims, the size and time-limit rules, where Encounter titles go in the Node's text, and the authoring guidance that is not validated (each Encounter introduces one new thing, one situation with at most one Distractor, waypoint routes of about 20 to 28 m, and a Distractor that activates past the route end for an Encounter with no Distractor), with a worked example.

#### Scenario: Agent writes a Series from the guide
- **WHEN** an agent adds an Encounter Series to a walking Node following only the guide
- **THEN** `content:validate` passes without errors
