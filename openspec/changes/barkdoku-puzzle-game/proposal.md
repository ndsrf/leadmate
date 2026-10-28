# Proposal

## Why

In LeadMate, dog owners learn key canine ethology principles—specifically personal space, reactivity thresholds (the distance buffer before a dog reacts), and breaking direct lines of sight (preventing visual fixation that triggers barking and lunging). While dynamic walking Stages train real-time reflexes, users also need a stress-free, spatial deduction environment to internalize how visual barriers, distance management, and spatial distribution work before facing fast-moving triggers on the street. 

Adapting the classic "Star Battle" / "Queens" logic puzzle into **Barkdoku** ("Zona de Calma") transforms an abstract math puzzle into a playful, highly educational tool that models canine territory, line of sight, and personal space with zero random chance and immediate behavioral feedback.

## What Changes

- **Barkdoku Puzzle Engine (`src/shell/puzzle/`)**:
  - Implement a pure TypeScript deduction engine for $N \times N$ partitioned grid boards (regions/zones representing park/terrace sectors such as lawn, terrace, shade, sand, patio, flowers).
  - Enforce the 3 core ethological rules:
    1. **Territory / Region Rule**: Exactly 1 dog per colored zone (exclusive sniffing/resting station).
    2. **Line of Sight Rule**: Exactly 1 dog per row and per column (breaking eye-lock; no two dogs facing each other down the same uninterrupted corridor).
    3. **Personal Space / Reactivity Bubble**: Dogs cannot occupy adjacent cells, including diagonals (8-cell exclusion radius around each dog).
  - Validation engine with real-time conflict detection highlighting violating dogs and rows/columns/regions.
  - Deterministic board solver and level configuration bank supporting boards from $4 \times 4$ (intro/tutorial) through $5 \times 5$ / $6 \times 6$ (standard curriculum) up to $8 \times 8$ and $9 \times 9$ (advanced daily challenges).
- **Controls & Interaction**:
  - 3-state cell cycle: Single tap places an exclusion marker / **Visual Shield** (bold rounded white `X` on colored tile); second tap places a calm dog (`🐶`); third tap clears the cell.
  - Life & Mistake System: 3 dog treats. Placing a dog in direct violation of a rule triggers an immediate canine agitation alert (barks, stiff ears) and deducts 1 treat. Reaching 0 treats triggers an encouraging retry screen.
  - Victory state: When all $N$ dogs are placed legally, the board locks in a celebration state where all dogs settle down calmly.
- **Visuals & Canine Feedback (Meowdoku-inspired Paper Meadow Aesthetic)**:
  - Clean, flat pastel colored region tiles with rounded corners and uniform spacing.
  - Upper **Zone Completion Tracker**: Horizontal row of dog head silhouettes matching each region's color; placing a dog in a zone illuminates its silhouette into a full-color dog face matching the user's `breed` and `coat`.
  - Inline **Rule Diagram Banner**: Top card displaying 3 visual mini-diagrams illustrating the 3 ethological rules (1 per station, break line of sight, preserve personal space).
  - Canine vector sprites (`CaninePosture` / `BreedArt`) displaying calm postures when satisfied, and alert/barking postures with sightline conflict rays when in violation.
- **Architectural Integration**:
  - Register `'barkdoku'` as a supported `MinigameKind` in the training node loop (`src/shell/nodes/node.ts` and `App.tsx`).
  - Introduce training node content for World 3 ("Urban Navigations") and World 6 ("Terrazas y Cafeterías"), preceded by a dual-aspect Theory Primer and Checkpoint quiz on reactivity thresholds and visual barriers.
  - Provide a standalone daily mental challenge ("Zona de Calma") from `WorldMapScreen`, qualifying as a valid activity to maintain the user's `Streak` (`src/shell/streak.ts`).

## Capabilities

### New Capabilities
- `barkdoku-puzzle`: Core logic puzzle engine, ethological rule validator, 3-state tap interaction, treat lives system, canine posture conflict feedback, upper zone completion tracker, rule diagram banner, and level configurations for Barkdoku ("Zona de Calma") from $4 \times 4$ to $9 \times 9$.

### Modified Capabilities
- `canine-minigames`: Expand static minigames to support spatial deduction board interfaces with canine posture conflict animations alongside existing reaction/timing scenes.

## Impact

- `src/shell/puzzle/`: New domain module containing board definitions, rule validation, solver algorithms, and curated levels ($4 \times 4$ through $9 \times 9$).
- `src/shell/screens/BarkdokuView.tsx`: New full-screen React Native interactive grid component with SVG boards, upper zone silhouette tracker, rule diagram banner, cell controls, and treat HUD.
- `src/shell/nodes/node.ts`: Add `'barkdoku'` to `MinigameKind` and handle node completion scoring metrics (mistakes, time, accuracy).
- `src/shell/nodes/content.ts`: Add Barkdoku node definitions to World 3 / World 6 curriculum with Theory Primer cards and Checkpoints.
- `src/shell/streak.ts`: Update streak qualification to include daily Barkdoku completions.
- `src/shell/screens/WorldMapScreen.tsx` & `App.tsx`: Route minigame launches from node runs and provide an entry point for daily mental warmups.
- `src/i18n/es.ts`: Add Spanish copy for Barkdoku rules, primers, cell feedback, and debrief messages.
- Unit tests for board generator, rule validator, streak qualification, and component interactions.
