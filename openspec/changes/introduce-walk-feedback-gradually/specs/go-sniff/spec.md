# Spec Delta

## MODIFIED Requirements

### Requirement: Contextual Go Sniff availability
In a Stage where Go Sniff is an Introduced action, the system SHALL display a contextual "Go Sniff" button on the HUD for 3.0 seconds following a successful Disengagement from an encounter that reached the Alert or Reactive tier, provided the leash is currently in Slack and the 1.0–1.2 second Marker Reward Window has closed (or the Marker has already been pressed). In a scenario with Scent Spots, the Go Sniff button SHALL instead be available at any time the leash is Slack and no Go Sniff is running. In a Stage where Go Sniff is not Introduced, the system SHALL never display the Go Sniff button or its prompt and SHALL ignore the Go Sniff keyboard shortcut.

#### Scenario: Go Sniff offered after tense encounter
- **WHEN** Go Sniff is Introduced in the Stage, the Dog disengages from an Alert or Reactive Distractor encounter, the Marker Reward Window has concluded or hit, and leash tension is Slack
- **THEN** the contextual Go Sniff button is displayed on the HUD for 3.0 seconds

#### Scenario: World 1 restriction
- **WHEN** the user plays a Node in World 1 or World 2, which come before the Node that Introduces Go Sniff on the trail
- **THEN** the Go Sniff button is never displayed

#### Scenario: New player's Daily Stage
- **WHEN** a player who has completed no Node that Introduces Go Sniff plays the Daily Stage
- **THEN** the Go Sniff button is never displayed

#### Scenario: Scent Stage
- **WHEN** a scent Stage in which Go Sniff is Introduced is running, the leash is Slack and no Go Sniff is running
- **THEN** the Go Sniff button is available without a prior Disengagement
