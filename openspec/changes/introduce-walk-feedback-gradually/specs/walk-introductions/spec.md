# Spec Delta

## Purpose

Decides which kinds of handled action a walking Stage answers, so that each walk focuses on what the trail has taught so far and new feedback and points arrive with the Node that teaches them.

## ADDED Requirements

### Requirement: Starting set of Introduced actions
The system SHALL treat these action kinds as Introduced in every walking Stage: a Marker hit, a Check-in hit, a Disengagement, a Marker miss, a Late Marker press, a reactive Marker, a wasted Marker, a missed opportunity, and Rigid Pull starting. No other kind SHALL be Introduced unless a Node Introduces it.

#### Scenario: First walk answers the Marker
- **WHEN** the user marks a Check-in in the guided first Stage
- **THEN** a right Feedback Message is shown for it

#### Scenario: First walk ignores a followed turn
- **WHEN** the Dog follows a turn in the guided first Stage
- **THEN** nothing is shown for the followed turn

### Requirement: Nodes Introduce action kinds
A Node SHALL be able to list in its content the action kinds it Introduces. Each action kind outside the starting set SHALL be Introduced by at most one Node in a channel.

#### Scenario: Node Introduces a followed turn
- **WHEN** the `park-unpredictable` Node lists the followed turn among the kinds it Introduces
- **THEN** its Stage answers a followed turn

### Requirement: Introduced actions follow the trail
A Node's Stage SHALL answer the starting set plus every kind Introduced by that Node or by any Node placed before it on the trail, in World order and then Stop order. The player's own history SHALL NOT change this set.

#### Scenario: Earlier Node replayed
- **WHEN** a player who has completed World 6 replays `walk-distraction` in World 3
- **THEN** a followed turn shows nothing there

#### Scenario: Later Node
- **WHEN** a player plays `park-keep-fresh`, which follows `park-unpredictable` on the trail
- **THEN** a followed turn is answered

### Requirement: Taste Stage and guided first Stage use the starting set
The Taste Stage and the guided first Stage SHALL answer only the starting set, whatever the player has completed.

#### Scenario: Taste Stage after a reset
- **WHEN** the Taste Stage is played
- **THEN** only kinds of the starting set can show a Feedback Message

### Requirement: Daily Stage uses completed Nodes
The Daily Stage SHALL answer the starting set plus every kind Introduced by a Node the player has completed.

#### Scenario: New player's Daily Stage
- **WHEN** a player who has completed no Node that Introduces Go Sniff plays the Daily Stage and the Dog starts a Go Sniff
- **THEN** nothing is shown for the Go Sniff

#### Scenario: Experienced player's Daily Stage
- **WHEN** a player who has completed `walk-distraction` plays the Daily Stage and the Dog starts a Go Sniff
- **THEN** the Go Sniff Feedback Message is shown

### Requirement: Introductions never change the Stage
Which kinds are Introduced SHALL change only what is shown. The simulation, its seeded payload, Stage Meter values, the handling score and the Stars SHALL be the same whatever kinds are Introduced.

#### Scenario: Same seed, different Introduced sets
- **WHEN** the same seeded Stage is played with the same inputs once with only the starting set and once with every kind Introduced
- **THEN** both debrief payloads are identical

### Requirement: Debrief timeline shows only Introduced actions
The Debrief's walk timeline SHALL list only moments whose kind was Introduced in that Stage. The payload's `timeline` SHALL stay unchanged.

#### Scenario: Followed turn before it is taught
- **WHEN** the Dog followed a turn in `park-nose-on`, which comes before `park-unpredictable` on the trail
- **THEN** the Debrief timeline does not show that moment, and the payload's `timeline` still contains it

### Requirement: Introductions are validated
Content validation SHALL fail when a Node Introduces an unknown kind, a kind of the starting set, or a kind another Node already Introduces, naming the Node and kind. It SHALL warn, without failing, about each kind no Node in the channel Introduces.

#### Scenario: Introduced twice
- **WHEN** two Nodes both list the followed turn
- **THEN** validation fails and names both Nodes and the kind

#### Scenario: Never Introduced
- **WHEN** no Node in the stable channel Introduces the smart Jackpot
- **THEN** validation passes with a warning naming the smart Jackpot
