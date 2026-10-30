# Spec Delta

## Purpose

Provides a spatial deduction puzzle game (Barkdoku) that models canine territory, personal space, and line-of-sight reactivity management on an N x N partitioned grid.

## ADDED Requirements

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
