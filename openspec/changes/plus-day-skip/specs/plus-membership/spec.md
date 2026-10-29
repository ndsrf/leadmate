# Spec Delta

## Purpose

Decides whether the user currently has LeadMate Plus, so features reserved for Plus can ask one place and the paywall can grant it.

## ADDED Requirements

### Requirement: Active free trial counts as Plus
The system SHALL treat the user as a LeadMate Plus member from the moment they start the free trial until 7 days after it, measured from the recorded trial start. Before a trial start, and after the 7 days, the user SHALL be a free user. There is no paid subscription yet.

#### Scenario: Trial started today
- **WHEN** the user tapped "Empezar prueba" today
- **THEN** the user is Plus

#### Scenario: Trial over
- **WHEN** the trial started 8 days ago
- **THEN** the user is a free user

#### Scenario: Never started
- **WHEN** the user chose "Quizá más tarde" and never started the trial
- **THEN** the user is a free user

#### Scenario: Clock earlier than the trial start
- **WHEN** the device time is earlier than the recorded trial start
- **THEN** the user is a free user

### Requirement: One trial per Dog
The free trial SHALL start at most once per Dog record. Starting it again from the paywall SHALL NOT move the recorded start.

#### Scenario: Paywall after the trial ended
- **WHEN** a user whose trial is over taps "Empezar prueba" again
- **THEN** the trial start is unchanged and the user stays free

### Requirement: One membership for every Plus feature
Every LeadMate Plus feature, Day Skips and Plus Worlds included, SHALL check Plus membership and nothing else. Everything that reads whether a Plus World is open (the World Map, opening its Stops and the World unlock celebration) SHALL use the same membership at the same moment. When the trial ends while the World Map is open, the map SHALL show the Plus Worlds locked without the user leaving it.

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

### Requirement: Paywall reachable from Plus features
A Plus-only action used by a free user SHALL open the paywall. If the user starts the trial there, the action SHALL complete. If they close the paywall or choose "Quizá más tarde", nothing SHALL change. If their trial is already over, "Empezar prueba" SHALL NOT do the action, and the user SHALL return to where they were. Returning to where they were SHALL show the screen as it stands at that moment, not as it was when they left.

#### Scenario: Start trial from a Plus action
- **WHEN** a free user taps a Plus-only action and then "Empezar prueba"
- **THEN** the trial starts, the user returns to where they were and the action is done

#### Scenario: Decline
- **WHEN** a free user taps a Plus-only action and then "Quizá más tarde"
- **THEN** the user returns to where they were and the action is not done

#### Scenario: Start trial after the trial is over
- **WHEN** a user whose trial is over taps a Plus-only action and then "Empezar prueba"
- **THEN** the user returns to where they were, the trial start is unchanged and the action is not done
