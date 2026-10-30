# Spec Delta

## ADDED Requirements

### Requirement: Daily Barkdoku solves logged
The system SHALL log one dated entry in the Activity Log for the first solve of each date's Daily Barkdoku, keeping the board's size and difficulty, the Solve Time, the Target Time, the mistakes and the Stars earned. Practice solves, unsolved boards and boards lost by running out of treats SHALL NOT be logged.

#### Scenario: First solve logged
- **WHEN** the user solves today's Daily Barkdoku for the first time in 1:42 with 1 mistake
- **THEN** an entry with the date, time of day, board size, 1:42, the Target Time, 1 mistake and 2 Stars is added to the log

#### Scenario: Practice solve not logged
- **WHEN** the user solves today's Daily Barkdoku again in practice
- **THEN** nothing is added to the log

#### Scenario: Abandoned board
- **WHEN** the user leaves the board before solving it
- **THEN** nothing is added to the log

### Requirement: Barkdoku Node time kept
A Node entry for a Barkdoku Node SHALL also keep the Solve Time and, when the board has one, the Target Time.

#### Scenario: Node entry with time
- **WHEN** the World 3 Barkdoku Node reaches its Debrief after a 3:10 solve
- **THEN** its entry holds the Minigame metrics, the Stars and 3:10

### Requirement: Daily Solve Time on its day
The Diary SHALL show each date's Daily Solve Time against its Target Time on that day, read from the saved Daily Solve Time rather than the log, so it remains after the log entry is trimmed.

#### Scenario: Trimmed log
- **WHEN** a day's Daily Barkdoku log entry has been dropped from the log but its Daily Solve Time of 1:42 against 2:00 is saved
- **THEN** the day still shows the Daily Barkdoku at `1:42 / 2:00` with a "target met" mark

#### Scenario: Solves from two devices
- **WHEN** two devices each logged a first solve of the same date before syncing, at 09:00 in 2:10 and at 20:00 in 1:50
- **THEN** the day lists both entries and shows 2:10 as its Daily Solve Time

### Requirement: Daily Barkdoku in the Diary
The Diary SHALL show Daily Barkdoku solves as their own kind of activity, named "Guaudoku" in Spanish: a calendar mark and legend entry, a day-card entry with the time of day, board size, Solve Time against Target Time, mistakes and Stars, and a total of Daily Barkdoku solves. A Barkdoku Node entry SHALL show its Solve Time.

#### Scenario: Calendar mark
- **WHEN** a day holds a Daily Barkdoku solve
- **THEN** the day shows a Daily Barkdoku mark, named in the legend and read by the screen reader

#### Scenario: Day card entry
- **WHEN** the user opens a day with a Daily Barkdoku solve of 1:42 against a 2:00 target
- **THEN** the card shows the entry's time of day, the board size, `1:42 / 2:00` with a "target met" mark, the mistakes and the Stars

#### Scenario: Totals
- **WHEN** the user has solved the Daily Barkdoku on three dates
- **THEN** the totals show 3 Daily Barkdoku solves

#### Scenario: Active Day
- **WHEN** the only activity of a day is a Daily Barkdoku solve
- **THEN** the day counts as an Active Day, since the solve credits the Streak
