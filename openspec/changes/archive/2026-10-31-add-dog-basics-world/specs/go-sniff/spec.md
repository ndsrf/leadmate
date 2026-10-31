# Spec Delta

## MODIFIED Requirements

### Requirement: Contextual Go Sniff availability
From World 3 (The Quiet Sidewalk) onward, the system SHALL display a contextual "Go Sniff" button on the HUD for 3.0 seconds following a successful Disengagement from an encounter that reached the Alert or Reactive tier, provided the leash is currently in Slack and the 1.0–1.2 second Marker Reward Window has closed (or the Marker has already been pressed).

#### Scenario: Go Sniff offered after tense encounter
- **WHEN** the Dog disengages from an Alert or Reactive Distractor encounter, the Marker Reward Window has concluded or hit, and leash tension is Slack
- **THEN** the contextual Go Sniff button is displayed on the HUD for 3.0 seconds

#### Scenario: World 1 restriction
- **WHEN** the user plays a Node in World 1 or World 2
- **THEN** the Go Sniff button is never displayed
