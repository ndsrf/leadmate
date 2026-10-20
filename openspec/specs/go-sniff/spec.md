# go-sniff Specification

## Purpose
Provides a functional decompression reward ("Go Sniff") from World 2 onward that lets the Handler relieve the Dog's accumulated Arousal after navigating high-tension encounters.

## Requirements
### Requirement: Contextual Go Sniff availability
From World 2 onward, the system SHALL display a contextual "Go Sniff" button on the HUD for 3.0 seconds following a successful Disengagement from an encounter that reached the Alert or Reactive tier, provided the leash is currently in Slack and the 1.0–1.2 second Marker Reward Window has closed (or the Marker has already been pressed).

#### Scenario: Go Sniff offered after tense encounter
- **WHEN** the Dog disengages from an Alert or Reactive Distractor encounter, the Marker Reward Window has concluded or hit, and leash tension is Slack
- **THEN** the contextual Go Sniff button is displayed on the HUD for 3.0 seconds

#### Scenario: World 1 restriction
- **WHEN** the user plays a Node in World 1
- **THEN** the Go Sniff button is never displayed

### Requirement: Sniffing drive and rapid Arousal decay
When the Handler activates Go Sniff, the system SHALL temporarily shift the Dog's drive to an ambient sniffing drive for up to 4.0 seconds, moving slowly ($0.4\text{ m/s}$) with its head lowered, while Arousal decays at three times the standard decay rate ($3\times \text{decayPerSecond}$).

#### Scenario: Go Sniff activated
- **WHEN** the user presses Go Sniff
- **THEN** the Dog switches to a sniffing drive, gait slows to $0.4\text{ m/s}$, and Arousal rapidly decays at 3x rate

### Requirement: Early termination on leash tension or zero Arousal
The system SHALL immediately terminate the Go Sniff state and resume the Dog's standard walking drive if leash Tension Ratio reaches or exceeds 0.85 (Taut or Rigid Pull), or if Arousal reaches 0.

#### Scenario: Handler pulls leash past Slack
- **WHEN** Go Sniff is active and the leash Tension Ratio reaches 0.85 or higher
- **THEN** Go Sniff terminates immediately and the Dog returns to its standard walking drive

#### Scenario: Arousal fully dissipated
- **WHEN** Go Sniff is active and Arousal drops to 0
- **THEN** Go Sniff completes successfully and the Dog resumes standard walking
