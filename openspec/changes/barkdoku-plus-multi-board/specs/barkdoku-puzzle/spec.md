# Spec Delta

## MODIFIED Requirements

### Requirement: Daily Barkdoku practice
Only the first solve of a date's Daily Barkdoku SHALL count towards the Streak and the day's recorded Daily Solve Time. For free-tier users, reopening Barkdoku after the first solve SHALL present the same board as practice: a visible "Práctica" mark, a running clock, and a solved card with the Solve Time but no Stars, indicating the day's result is kept. Practice solves SHALL NOT change any saved data, the Activity Log, or the Streak.

#### Scenario: Practice after the first solve
- **WHEN** a free user who already solved today's Daily Barkdoku opens it again
- **THEN** the board presents the same board layout with a visible "Práctica" mark and informs the user that free users play the same board each day

#### Scenario: Faster practice changes nothing
- **WHEN** the user solves today's board in practice in 0:20
- **THEN** the solved card shows `0:20` with no Stars and says today's result is kept, and today's Daily Solve Time stays 2:10

#### Scenario: Failed first attempts
- **WHEN** the user runs out of treats on today's board and then retries and solves it
- **THEN** that solve is the first solve of the day and counts

## ADDED Requirements

### Requirement: Multi-board Barkdoku for Plus and trial members
The system SHALL allow users with active LeadMate Plus (including subscribers and users within an active 7-day trial) to play different Barkdoku boards multiple times per day. Subsequent plays after the first solve of the day SHALL deal a fresh, distinct board layout termed a Plus Board.

#### Scenario: Plus subscriber plays a second board
- **WHEN** an active Plus subscriber solves the daily board and chooses to play again that day
- **THEN** the system deals a newly generated board with a layout and solution distinct from the board solved earlier that day

#### Scenario: User on trial plays a new board
- **WHEN** a user with an active 7-day trial plays Barkdoku after having completed a board earlier that day
- **THEN** the system deals a different board and indicates that playing a new board is unlocked via LeadMate Plus

#### Scenario: Progressive challenge curve for Plus boards
- **WHEN** a Plus or trial user completes multiple Plus Boards on the same calendar day
- **THEN** the system cycles through board sizes in escalating order (5x5, 6x6, 7x7, 8x8) as the board index advances

#### Scenario: Plus board solves logged in Activity Log
- **WHEN** a Plus or trial user solves a Plus Board (board index > 0)
- **THEN** the system records the solve in the Activity Log with its Stars and duration for display in the Diary, without altering the Daily Solve Time or double-crediting the Streak

### Requirement: Barkdoku tier messaging and upgrade prompt
The system SHALL display contextual tier awareness within Barkdoku: users on trial SHALL be informed they can play new boards because they have Plus, and free users SHALL be informed they see the same board each day until the day passes or they move to Plus.

#### Scenario: Upfront practice notice for free users
- **WHEN** a free-tier user opens a Barkdoku board that was already solved today
- **THEN** the header displays a "Práctica · Tablero diario" badge and a subtitle clarifying that free tier plays the same board each day

#### Scenario: Trial member sees Plus perk explanation
- **WHEN** a user on an active trial views or completes a Barkdoku board
- **THEN** the interface displays an indicator that new boards are included with their active LeadMate Plus trial

#### Scenario: Free user sees same-board notice and upgrade option
- **WHEN** a free-tier user completes a Barkdoku replay
- **THEN** the victory card displays a notice that free tier plays the same board until tomorrow, accompanied by a button to unlock unlimited boards with LeadMate Plus

#### Scenario: Free user taps upgrade button
- **WHEN** a free user taps the upgrade button from Barkdoku
- **THEN** the system opens the paywall flow offering the 7-day free trial or subscription
