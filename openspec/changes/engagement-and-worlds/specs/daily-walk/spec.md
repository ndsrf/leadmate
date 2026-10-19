# Spec Delta

## Purpose

Provides a short, fresh daily level ("El Paseo del Día") that acts as a cognitive warm-up and protects the streak without advancing the campaign.

## ADDED Requirements

### Requirement: Daily procedurally generated level
The system SHALL offer a quick procedurally generated level that changes every 24 hours and is the same for all users on a given day.

#### Scenario: Same level within a day
- **WHEN** a user opens the daily walk twice on the same day
- **THEN** both runs use the same level layout

#### Scenario: New level next day
- **WHEN** the day changes
- **THEN** the daily walk uses a different layout

### Requirement: Streak protection without campaign progress
Completing the daily walk SHALL count toward the streak and SHALL NOT advance the main campaign.

#### Scenario: Streak counted
- **WHEN** the user completes the daily walk
- **THEN** the streak is credited for the day and campaign progress is unchanged
