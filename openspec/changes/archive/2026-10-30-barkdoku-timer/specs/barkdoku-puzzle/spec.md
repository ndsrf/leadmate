# Spec Delta

## ADDED Requirements

### Requirement: Solve timer
The system SHALL show a clock in `m:ss` next to the treat lives on a Barkdoku board. It SHALL read `0:00` until the first tap, then count only time the app is in the foreground, and SHALL stop when the board is solved or the treats run out.

#### Scenario: Reading the rules is free
- **WHEN** the user looks at a new board for 30 seconds without tapping
- **THEN** the clock still reads `0:00`

#### Scenario: Clock runs during play
- **WHEN** 75 seconds have passed since the user's first tap
- **THEN** the clock reads `1:15`

#### Scenario: Background pause
- **WHEN** the user sends the app to the background for 5 minutes in the middle of a board and comes back
- **THEN** the clock resumes from where it stopped and the 5 minutes are not counted

#### Scenario: Clock stops on solve
- **WHEN** the last dog is placed and the board is solved
- **THEN** the clock stops and the solved card shows the final Solve Time

#### Scenario: Reset starts over
- **WHEN** the user resets the board or retries after running out of treats
- **THEN** the clock returns to `0:00` and starts again at the next tap

#### Scenario: Screen reader
- **WHEN** a screen reader focuses the clock
- **THEN** it reads the elapsed time and, when the board has one, the Target Time, and the clock does not announce each passing second

### Requirement: Target time by difficulty
Every non-tutorial Barkdoku board SHALL have a Target Time, taken from the board when it sets one and otherwise from its size: 4×4 1:00, 5×5 2:00, 6×6 3:00, 7×7 4:00, 8×8 6:00 and 9×9 8:00. Tutorial boards SHALL have no Target Time. The board SHALL show the Target Time under the clock when it has one.

#### Scenario: Default target from size
- **WHEN** a 6×6 board without its own target opens
- **THEN** the board shows a target of `3:00`

#### Scenario: Board's own target
- **WHEN** a board sets its own target of 2:30
- **THEN** the board shows a target of `2:30` regardless of its size

#### Scenario: Tutorial board
- **WHEN** a tutorial board opens
- **THEN** the clock is shown and no target is shown

#### Scenario: Past the target
- **WHEN** the clock passes the Target Time
- **THEN** the clock changes tone to show the target was missed, play continues and no treat is lost

### Requirement: Time in the star rating
A solved board with a Target Time SHALL earn 3 Stars only when solved with no mistakes within it, and 2 Stars when solved with no mistakes over it. A solve with 1 mistake SHALL earn 2 Stars and with 2 or more mistakes 1 Star, whatever the time. A board without a Target Time SHALL be rated by mistakes only. A Barkdoku Node SHALL earn the same Stars as its board's rating.

#### Scenario: Clean and fast
- **WHEN** a 5×5 board is solved with 0 mistakes in 1:40
- **THEN** it earns 3 Stars

#### Scenario: Clean but slow
- **WHEN** a 5×5 board is solved with 0 mistakes in 2:30
- **THEN** it earns 2 Stars

#### Scenario: Mistakes outweigh time
- **WHEN** a board is solved with 2 mistakes within its target
- **THEN** it earns 1 Star

#### Scenario: Tutorial Node
- **WHEN** the World 3 Barkdoku Node's tutorial board is solved with 0 mistakes in 2:00
- **THEN** the Node's Debrief awards 3 Stars

### Requirement: Solved card shows time against target
The solved card SHALL show the final Solve Time and the Stars earned, and, on a board with a Target Time, the Target Time and whether it was met.

#### Scenario: Target met
- **WHEN** a board is solved within its target
- **THEN** the solved card shows the Solve Time, the target and a "target met" mark

#### Scenario: Target missed
- **WHEN** a board is solved over its target
- **THEN** the solved card shows the Solve Time and the target without the "target met" mark, worded encouragingly

### Requirement: Daily Barkdoku practice
Only the first solve of a date's Daily Barkdoku SHALL count. Once it is solved, opening that board again SHALL show it as practice: a visible "Práctica" mark, a running clock, and a solved card with the Solve Time but no Stars and no target-met mark, saying the day's result is kept. A practice solve SHALL NOT change any saved data, the Activity Log or the Streak.

#### Scenario: Practice after the first solve
- **WHEN** the user solved today's Daily Barkdoku in 2:10 and opens it again
- **THEN** the board shows the "Práctica" mark

#### Scenario: Faster practice changes nothing
- **WHEN** the user solves today's board in practice in 0:20
- **THEN** the solved card shows `0:20` with no Stars and says today's result is kept, and today's Daily Solve Time stays 2:10

#### Scenario: Failed first attempts
- **WHEN** the user runs out of treats on today's board and then retries and solves it
- **THEN** that solve is the first solve of the day and counts

### Requirement: Spanish name
Spanish users SHALL see Barkdoku named "Guaudoku" wherever the game is named: the board title, the map chip, the World 3 Stop title, the solved title and the intro card. "Zona de Calma" SHALL NOT appear in the app.

#### Scenario: Board title
- **WHEN** a Spanish user opens a Barkdoku board
- **THEN** its title reads "Guaudoku"

#### Scenario: Region conflict wording
- **WHEN** two dogs are placed in the same region
- **THEN** the conflict message refers to "la misma zona", not to "zona de calma"
