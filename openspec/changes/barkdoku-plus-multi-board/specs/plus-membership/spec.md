# Spec Delta

## MODIFIED Requirements

### Requirement: One membership for every Plus feature
Every LeadMate Plus feature, including Day Skips, Plus Worlds, and multi-board Daily Barkdoku, SHALL check Plus membership and nothing else. Everything that reads whether a Plus World is open (the World Map, opening its Stops and the World unlock celebration) or whether a new Barkdoku board can be played on the same day SHALL use the same membership at the same moment. When the trial ends while the World Map or Barkdoku is open, the system SHALL reflect the expiration without the user leaving the screen.

#### Scenario: Plus World during the trial
- **WHEN** a user with an active trial has completed the World before a playable Plus World
- **THEN** that Plus World is unlocked

#### Scenario: Plus World after the trial
- **WHEN** the trial is over
- **THEN** a Plus World stays locked and shows that it needs LeadMate Plus

#### Scenario: Plus World unlock celebrated during the trial
- **WHEN** a user with an active trial completes the World before a Plus World
- **THEN** the World unlock celebration names that Plus World

#### Scenario: Trial ends with the map open
- **WHEN** the World Map is on screen at the moment the trial ends
- **THEN** the Plus Worlds are shown locked from that moment

#### Scenario: Multi-board Barkdoku during trial
- **WHEN** a user with an active trial requests a new Barkdoku board after solving today's board
- **THEN** the system grants a fresh board as part of their Plus trial

## ADDED Requirements

### Requirement: Barkdoku multi-board entitlement
The system SHALL gate the generation of new Daily Barkdoku boards on the same calendar day behind active LeadMate Plus membership.

#### Scenario: Active subscriber plays new board
- **WHEN** an active subscriber solves today's board and requests another
- **THEN** the system generates a distinct board immediately

#### Scenario: Free user requests new board
- **WHEN** a free user solves today's board and taps the button to unlock a new board
- **THEN** the system presents the paywall and registers a pending action to start a fresh board upon subscription or trial start

#### Scenario: Immediate deal upon conversion
- **WHEN** a free user taps the unlock button from Barkdoku and activates the trial or subscription on the paywall
- **THEN** the system returns the user directly to Barkdoku and immediately deals a fresh Plus Board
