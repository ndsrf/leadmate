# daily-walk Specification

## Purpose
Provides a short, fresh daily Stage ("El Paseo del Día") that acts as a cognitive warm-up, protects the streak, and establishes standardized scoring for future leaderboards without advancing campaign nodes or altering the Dog's persistent Learning Attributes.

## Requirements
### Requirement: Daily procedurally generated Stage
The system SHALL offer a procedurally generated Daily Stage that updates every 24 hours based on the player's local calendar date (`YYYY-MM-DD`).

#### Scenario: Same challenge within a date
- **WHEN** a user opens the Daily Stage multiple times on the same calendar date
- **THEN** all runs generate the identical pathway corridor, boundary walls, and Distractor schedule (types, spawn timestamps, velocities, and approach trajectories)

#### Scenario: New challenge on date turnover
- **WHEN** the calendar date advances to a new day
- **THEN** the Daily Stage generates a new layout and Distractor schedule derived from the new date seed

### Requirement: Leaderboard-ready standardized handling score
The system SHALL compute a normalized handling score from 0 to 1,000 points in the Daily Stage debrief payload, determined by leash composure ($100 - \text{peakArousalScore}$, up to 400 pts), Slack time percentage (up to 300 pts), Marker timing accuracy on Disengagements (up to 200 pts), and Sintonía duration (up to 100 pts).

#### Scenario: Score calculation
- **WHEN** the user completes a Daily Stage
- **THEN** the debrief payload contains the normalized 0–1,000 score computed from handling quality metrics

#### Scenario: Replays for high score
- **WHEN** a user replays the Daily Stage on the same date
- **THEN** the user can achieve a higher personal score, and the best score for that date is recorded

### Requirement: Streak protection and Rusty Dog warm-up without campaign progress
Completing the Daily Stage SHALL credit the daily streak on its first completion of that date, SHALL clear the Rusty Dog capacity penalty for the session, and SHALL NOT advance campaign Node progress or mutate the Dog's persistent Learning Attributes.

#### Scenario: Streak credited and Rusty Dog cleared
- **WHEN** the user completes the Daily Stage for the first time on that date
- **THEN** the daily streak is credited, any Rusty Dog capacity penalty is restored for the session, and the Dog's persistent Learning Attributes and completed campaign Nodes remain untouched

#### Scenario: Subsequent replays do not re-increment streak
- **WHEN** the user replays and completes the Daily Stage a second time on the same date
- **THEN** the streak remains at its credited value and is not incremented again
