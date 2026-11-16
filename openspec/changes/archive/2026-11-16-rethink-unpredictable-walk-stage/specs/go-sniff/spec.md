# Spec Delta

## MODIFIED Requirements

### Requirement: Contextual Go Sniff availability
From World 3 (The Quiet Sidewalk) onward, the system SHALL display a contextual "Go Sniff" button on the HUD for 3.0 seconds following a successful Disengagement from an encounter that reached the Alert or Reactive tier, provided the leash is currently in Slack and the 1.0–1.2 second Marker Reward Window has closed (or the Marker has already been pressed). In a scenario with Scent Spots, the Go Sniff button SHALL instead be available at any time the leash is Slack and no Go Sniff is running.

#### Scenario: Go Sniff offered after tense encounter
- **WHEN** the Dog disengages from an Alert or Reactive Distractor encounter, the Marker Reward Window has concluded or hit, and leash tension is Slack
- **THEN** the contextual Go Sniff button is displayed on the HUD for 3.0 seconds

#### Scenario: World 1 restriction
- **WHEN** the user plays a Node in World 1 or World 2
- **THEN** the Go Sniff button is never displayed

#### Scenario: Scent Stage
- **WHEN** a scent Stage is running, the leash is Slack and no Go Sniff is running
- **THEN** the Go Sniff button is available without a prior Disengagement

### Requirement: Early termination on leash tension or zero Arousal
The system SHALL immediately terminate the Go Sniff state and resume the Dog's standard walking drive if leash Tension Ratio reaches or exceeds 0.85 (Taut or Rigid Pull), or if Arousal reaches 0. In a scenario with Scent Spots, Arousal reaching 0 SHALL NOT end Go Sniff; it SHALL end at its duration or on tension.

#### Scenario: Handler pulls leash past Slack
- **WHEN** Go Sniff is active and the leash Tension Ratio reaches 0.85 or higher
- **THEN** Go Sniff terminates immediately and the Dog returns to its standard walking drive

#### Scenario: Arousal fully dissipated
- **WHEN** Go Sniff is active and Arousal drops to 0
- **THEN** Go Sniff completes successfully and the Dog resumes standard walking

#### Scenario: Calm Dog in a scent Stage
- **WHEN** Go Sniff starts in a scent Stage while Arousal is already 0
- **THEN** the Dog sniffs for the full Go Sniff duration unless the leash reaches 0.85

## ADDED Requirements

### Requirement: Go Sniff at a Scent Spot
In a scent Stage, a Go Sniff started while an unsniffed Scent Spot is within the Dog's nose radius SHALL take the Dog to that spot, use it up, and be recorded as a granted sniff; one started with no spot in range SHALL be recorded as a sniff with nothing to sniff.

#### Scenario: Sniff granted
- **WHEN** the Dog is pulling toward a lamp post with a Scent Spot and the Handler presses Go Sniff
- **THEN** the Dog sniffs at the lamp post, the spot is used up and a granted sniff is recorded
