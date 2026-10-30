# barkdoku-puzzle Specification

## Purpose
Provides a spatial deduction puzzle game (Barkdoku) that models canine territory, personal space, and line-of-sight reactivity management on an N x N partitioned grid.

## Requirements

### Requirement: N x N partitioned board structure
The system SHALL represent Barkdoku as an N x N grid partitioned into exactly N contiguous regions, supporting board dimensions from 4x4 up to 9x9 where each region corresponds to a distinct ground cover zone (such as lawn, shade, terrace, or sand).

#### Scenario: Grid initialization
- **WHEN** a Barkdoku puzzle opens
- **THEN** the system renders an N x N grid divided into N irregularly bounded, contiguous colored zones

#### Scenario: Board scalability
- **WHEN** a puzzle of dimension between 4x4 and 9x9 loads
- **THEN** cell sizes scale dynamically to fit mobile viewport width while preserving comfortable touch targets

#### Scenario: Visual theme rendering
- **WHEN** the board displays in the Paper Meadow theme
- **THEN** each contiguous zone is rendered in a distinct palette tint with subtle borders separating neighboring regions

### Requirement: Fresh unique-solution board per play
The system SHALL deal a newly generated board every time a Barkdoku puzzle opens, so that reopening the puzzle or replaying its Node never repeats the previous layout. Every generated board SHALL have exactly one valid solution, and the dealt board SHALL stay fixed for the whole attempt, including resets.

#### Scenario: Opening the Zona de Calma from the map
- **WHEN** the user opens the "Zona de Calma" puzzle from the World Map
- **THEN** the system generates a new board between 5x5 and 8x8 instead of reusing a date-pinned or fixed board

#### Scenario: Replaying the World 3 Node
- **WHEN** the user plays or replays the `calm-zone-intro` Node simulation
- **THEN** the system generates a new 4x4 board for that attempt

#### Scenario: Unique solution guarantee
- **WHEN** a board is generated
- **THEN** a solver confirms it has exactly one solution before it is dealt, and if none can be produced the system falls back to a curated board of the same size

#### Scenario: Resetting keeps the board
- **WHEN** the user resets the puzzle mid-attempt
- **THEN** the grid clears but the same board layout remains

### Requirement: Ethological rule validation
The system SHALL validate dog placements against three canine ethology rules: exactly 1 dog per colored region, exactly 1 dog per row and column (breaking line of sight), and no two dogs touching orthogonally or diagonally (respecting reactivity bubbles).

#### Scenario: Valid dog placement
- **WHEN** a dog is placed in an unoccupied region, row, column, and without any neighboring dogs within its 8 surrounding cells
- **THEN** the placement is marked valid and no conflict is flagged

#### Scenario: Line of sight conflict
- **WHEN** a dog is placed in a row or column that already contains a dog
- **THEN** the system immediately flags a line-of-sight fixation conflict between both dogs

#### Scenario: Personal space conflict
- **WHEN** a dog is placed within the 8 adjacent cells (including diagonals) of another dog
- **THEN** the system flags an invasion of the reactivity threshold between both dogs

#### Scenario: Exclusive region conflict
- **WHEN** a dog is placed in a colored region that already contains a dog
- **THEN** the system flags a territorial station conflict in that region

### Requirement: Three-state cell toggle controls
The system SHALL cycle each grid cell through three sequential states on successive user taps: from empty to visual shield (rendered as a bold rounded white X on the colored tile), from visual shield to placed dog, and from placed dog back to empty.

#### Scenario: Single tap places visual shield
- **WHEN** the user taps an empty cell
- **THEN** the cell transitions to the visual shield state displaying a white rounded X, marking it as excluded

#### Scenario: Double tap places dog
- **WHEN** the user taps a cell currently containing a visual shield
- **THEN** the cell transitions to the placed dog state displaying the dog avatar

#### Scenario: Triple tap clears cell
- **WHEN** the user taps a cell currently containing a placed dog
- **THEN** the cell returns to the empty state

### Requirement: Treat life counter and mistake penalties
The system SHALL give the user 3 treat lives per puzzle attempt, deducting 1 treat whenever a placed dog violates a rule, and presenting an encouraging retry prompt when treats reach 0.

#### Scenario: Rule violation deducts treat
- **WHEN** a user places a dog that violates a region, line-of-sight, or adjacency rule
- **THEN** the system deducts 1 treat life, triggers an alert sound and vibration, and highlights the conflicting dogs

#### Scenario: Depletion of treats
- **WHEN** the user makes a third mistake and treat lives drop to 0
- **THEN** the system prevents further placement and displays an option to retry or restart the puzzle

### Requirement: Upper zone completion tracker
The system SHALL display an upper horizontal tracker containing dog head silhouettes matching each colored region of the board, illuminating each silhouette into a full-color dog face when a dog is placed in that region.

#### Scenario: Zone unoccupied
- **WHEN** a colored region contains no placed dog
- **THEN** the tracker displays a monochromatic silhouette of a dog head in that region's tint

#### Scenario: Zone satisfied
- **WHEN** a dog is placed within a colored region without rule violations
- **THEN** the corresponding silhouette in the tracker illuminates into a full-color dog face matching the user's breed and coat

### Requirement: Inline ethological rules banner
The system SHALL display a compact rules banner above the board featuring three diagrammatic mini-cards representing territory stations, line-of-sight corridor occlusion, and the eight-neighbor reactivity threshold.

#### Scenario: Rules banner visibility
- **WHEN** a Barkdoku puzzle view is active
- **THEN** the top area displays three cards illustrating 1 dog per color, 1 dog per row and column, and no adjacent contact

### Requirement: Puzzle completion and calm resolution
The system SHALL detect when all N dogs are placed with zero rule violations, immediately locking input, settling all dogs into calm postures, and presenting debrief metrics.

#### Scenario: Board successfully solved
- **WHEN** the N-th dog is placed such that all rows, columns, and regions have exactly 1 dog with no adjacent neighbors
- **THEN** the system locks the board, plays a success chime, renders all dogs in a relaxed posture, and records completion

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
