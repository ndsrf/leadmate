# Design

## Context

LeadMate trains dog owners to handle leash reactivity, manage personal space, and break direct lines of sight. Currently, interactive practice consists of dynamic 2.5D walking Stages (`SimView`) and static timing minigames (`DoorbellMatView`, `PosteMinigameView`). 

While walking stages test fast reflexes under stress, users need an environment to cognitively master spatial rules—specifically the **Reactivity Threshold** (personal space bubble) and **Line of Sight** (eye-lock between dogs). 

Barkdoku ("Zona de Calma") adapts the classic Star Battle / Queens deduction puzzle ($N \times N$ grid, $N$ colored regions, 1 dog per region, 1 per row/column, no touching even diagonally) into a canine-ethology minigame, adopting the clean, pastel visual language of Meowdoku (ADR 0013).

## Goals / Non-Goals

**Goals:**
- Implement a pure, robust TypeScript puzzle engine (`src/shell/puzzle/`) supporting boards from $4 \times 4$ up to $9 \times 9$ with zero external solver dependencies.
- Support 3-state cell cycling: Empty $\to$ Visual Shield (bold rounded white `X`) $\to$ Dog avatar $\to$ Empty.
- Real-time canine conflict detection with immediate ethological visual and auditory feedback (pricked ears, barking, red line of sight).
- Mistake / life management: 3 treat lives per puzzle attempt.
- Upper zone completion tracker with dog silhouettes illuminating into full-color `BreedArt` canine faces upon zone fulfillment.
- Inline rules banner with 3 diagrammatic mini-cards demonstrating the 3 core ethological rules.
- Dual architectural integration:
  1. As a curriculum `Node` within World 3 ("Urban Navigations") and World 6 ("Terrazas y Cafeterías").
  2. As a standalone Daily Calm Zone challenge on the `WorldMapScreen` that qualifies for `Streak` credit.
- Responsive layout scaling comfortably across mobile screen widths.

**Non-Goals:**
- Real-time physics, walking avatars, or leash simulation (handled by `SimView`).
- Runtime procedural backtracking solver on device (we ship verified unique-solution board banks).
- Online multiplayer or competitive leaderboards.

## Decisions

### Decision 1: Pure TypeScript Puzzle Engine (`src/shell/puzzle/`)
- **Structure**:
  - `types.ts`: Core data structures (`BarkdokuBoard`, `CellCoord`, `CellState`, `Conflict`, `BarkdokuState`).
  - `validator.ts`: Pure functions verifying board invariants (row, col, region, 8-neighbor adjacency).
  - `boards.ts`: Curated catalog of verified unique-solution boards categorized by difficulty ($4 \times 4$, $5 \times 5$, $6 \times 6$, $7 \times 7$, $8 \times 8$, $9 \times 9$).
  - `engine.ts`: State reducer handling tap transitions, conflict evaluation, treat life deduction, and win/loss states.
- **Rationale**: Isolating logic from UI components guarantees 100% test coverage with Jest and allows clean reuse between the curriculum Node runner and the World Map Daily Challenge.

### Decision 2: Architectural Placement in LeadMate

Barkdoku fits into two distinct layers of the app:

```
┌─────────────────────────────────────────────────────────────────┐
│                        WorldMapScreen                           │
│  ┌───────────────────────────┐   ┌───────────────────────────┐  │
│  │ Daily Calm Zone Button    │   │ World 3 / World 6 Nodes   │  │
│  └─────────────┬─────────────┘   └─────────────┬─────────────┘  │
└────────────────┼───────────────────────────────┼────────────────┘
                 │                               │
                 ▼                               ▼
       ┌───────────────────┐           ┌───────────────────┐
       │   App.tsx Flow    │           │  training-node-   │
       │ { name: 'puzzle' }│           │     loop Run      │
       └─────────┬─────────┘           └─────────┬─────────┘
                 │                               │
                 └───────────────┬───────────────┘
                                 ▼
                     ┌───────────────────────┐
                     │    BarkdokuView.tsx   │
                     └───────────┬───────────┘
                                 ▼
                     ┌───────────────────────┐
                     │  src/shell/puzzle/    │
                     │  (engine & validator) │
                     └───────────────────────┘
```

1. **Curriculum Node (`training-node-loop`)**:
   - `MinigameKind` in `src/shell/nodes/node.ts` is extended with `'barkdoku'`.
   - Node `calm-zone-intro` is added to World 3 ("Urban Navigations") in `src/shell/nodes/content.ts`.
   - Follows the standard 4-step loop:
     1. **Dual-Aspect Primer**: Real-world cards explain the canine reactivity threshold and line of sight; simulation cards explain Barkdoku rules.
     2. **Checkpoint Quiz**: Quick question on how visual shields break eye-lock between dogs.
     3. **Interactive Simulation**: `BarkdokuView` opens with a tutorial $4 \times 4$ or $5 \times 5$ board.
     4. **Debrief & Real-World Transfer**: Scoring metrics (mistakes, time, accuracy) and real-world homework (e.g., spot 3 visual barriers on today's walk).
2. **Standalone / Daily Brain Teaser Mode (`App.tsx` & `WorldMapScreen.tsx`)**:
   - Add a "Zona de Calma" chip/button in the World Map header.
   - Launches a date-seeded daily board (`dateSeed(todayString())`), providing a low-arousal mental exercise that awards daily streak credit (`StreakRecord`) without requiring a walking stage.

### Decision 3: Visual Design & Meowdoku Benchmark

Following the user reference from Meowdoku (ADR 0013):

1. **Board Aesthetics**:
   - Flat pastel Paper Meadow region palette (meadow green `#82B57B`, terrace terracotta `#DE8668`, shade slate `#8FA8B8`, sand gravel `#EAD5A0`, wood porch `#C8A27A`, sidewalk grey `#B0B4B8`, flower pink `#E5A1BA`, park lilac `#A594D0`, orchard gold `#E2BA5D`).
   - Rounded corner tiles (`borderRadius: 6-8`) separated by clean, narrow 2-3px gaps.
2. **Exclusion Marker (Visual Shield)**:
   - Single tap places a bold, rounded white `X` centered on the colored tile. This maintains visual simplicity and maximum readability on small mobile screens compared to detailed prop silhouettes.
3. **Upper Zone Completion Tracker**:
   - A horizontal header row displaying dog head silhouettes corresponding to each board zone tint.
   - When a dog is placed legally in a zone, the silhouette transforms into a full-color dog face matching the user's `breed` and `coat` (`BreedArt`).
4. **Inline Rules Card**:
   - Compact banner with 3 mini-diagrams illustrating:
     - 1 dog per color zone (station).
     - 1 dog per row and column (break line of sight).
     - No adjacent touching including diagonals (reactivity threshold).
5. **Treat Lives HUD**:
   - 3 biscuit/treat icons in the top bar. Placing a dog with a conflict triggers alert barks, sightline flash, and decrements 1 treat.

### Decision 4: Responsive UI & Canvas Rendering
- Dynamic cell sizing computes as `(screenWidth - horizontalPadding) / gridSize`.
- Touch target sizes remain accessible across all supported dimensions:
  - $4 \times 4$ to $6 \times 6$: $50\text{--}70\text{pt}$ cell size.
  - $7 \times 7$ to $9 \times 9$: $38\text{--}46\text{pt}$ cell size on standard mobile screens (~390pt).

## Risks / Trade-offs

- **[Risk] Smaller screen touch targets on larger boards ($8 \times 8$, $9 \times 9$)**
  - *Mitigation*: Introductory curriculum nodes use $4 \times 4$ and $5 \times 5$ boards. $8 \times 8$ and $9 \times 9$ boards are used in advanced daily challenges with auto-padded cell layouts and high-contrast border outlines.
- **[Risk] Accidental taps triggering mistake penalties**
  - *Mitigation*: The 3-state tap cycle ensures an accidental single tap only places a Visual Shield (`X`), which never incurs a penalty. Penalties only evaluate when placing a dog.
- **[Risk] Puzzle unsolvability or ambiguity**
  - *Mitigation*: All bundled boards are verified with an offline solver to ensure exactly one unique solution.
