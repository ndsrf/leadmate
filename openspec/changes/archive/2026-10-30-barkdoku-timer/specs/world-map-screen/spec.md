# Spec Delta

## ADDED Requirements

### Requirement: Daily Barkdoku chip
The World Map top bar SHALL offer a Daily Barkdoku chip, labelled "Guaudoku" in Spanish, that opens today's date-seeded, timed board. Before today's first solve the chip SHALL show a highlighted "new" state; after, it SHALL show today's Daily Solve Time and the Target Time, marked when the Daily Solve Time is within the target.

#### Scenario: Not yet solved today
- **WHEN** the user has not solved today's Daily Barkdoku
- **THEN** the chip shows a highlighted "new" state

#### Scenario: Solved within target
- **WHEN** today's Daily Solve Time is 1:42 on a board with a 2:00 target
- **THEN** the chip shows `1:42 / 2:00` with a "target met" mark

#### Scenario: Practice leaves the chip alone
- **WHEN** the user solves today's board again in practice, faster than the first solve
- **THEN** the chip still shows the first solve's time

#### Scenario: New day
- **WHEN** the date changes after a solved day
- **THEN** the chip returns to the "new" state for the new day's board
