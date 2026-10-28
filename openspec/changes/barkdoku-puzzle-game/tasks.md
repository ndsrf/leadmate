# Tasks

## 1. Core Puzzle Logic Engine & Validator

- [x] 1.1 Define TypeScript types for board coordinates, cell states, colored regions, conflict markers, and puzzle outcomes in `src/shell/puzzle/types.ts` and verify with `npx tsc --noEmit`.
- [x] 1.2 Implement the ethological rule validator in `src/shell/puzzle/validator.ts` covering region uniqueness, row and column line-of-sight constraints, and 8-neighbor personal space rules; verify with comprehensive unit tests in `src/shell/puzzle/validator.test.ts`.
- [x] 1.3 Implement puzzle state transitions and engine reducer in `src/shell/puzzle/engine.ts` managing the 3-state cell toggle, treat life deduction on errors, conflict detection, and win/loss resolution; verify with unit tests in `src/shell/puzzle/engine.test.ts`.
- [x] 1.4 Create a curated catalog of verified, unique-solution puzzle boards across sizes ($4 \times 4$, $5 \times 5$, $6 \times 6$, $7 \times 7$, $8 \times 8$, $9 \times 9$) in `src/shell/puzzle/boards.ts` and verify board validity with tests in `src/shell/puzzle/boards.test.ts`.

## 2. Canine Visuals & UI Component (Meowdoku Style)

- [x] 2.1 Implement the flat pastel Paper Meadow grid, rounded region tiles, and bold rounded white `X` exclusion markers (`Visual Shield`) in `src/shell/screens/BarkdokuView.tsx`.
- [x] 2.2 Implement the upper `ZoneTracker` displaying dog head silhouettes that illuminate into full-color `BreedArt` canine faces upon zone fulfillment; verify with component snapshot tests.
- [x] 2.3 Implement the inline `RuleBanner` with 3 diagrammatic mini-cards demonstrating territory stations, line of sight, and personal space in `BarkdokuView.tsx`.
- [x] 2.4 Implement 3-state cell tap interactions, canine conflict visual indicators (pricked ears, barking, red sightline ray), and treat life counter in `BarkdokuView.tsx`; verify with Jest component tests in `src/shell/screens/BarkdokuView.test.tsx`.
- [x] 2.5 Integrate audio and haptic feedback triggers for cell taps, conflict warnings, and victory celebrations in `BarkdokuView.tsx`.

## 3. Node Curriculum Integration

- [x] 3.1 Register `'barkdoku'` in `MinigameKind` in `src/shell/nodes/node.ts` and handle its launch and completion payload inside `App.tsx`; verify with node simulation tests in `src/shell/nodes/node.test.ts`.
- [x] 3.2 Add the introductory Barkdoku node (`calm-zone-intro`) to World 3 in `src/shell/nodes/content.ts` with Theory Primer cards, Checkpoint quiz, and Debrief metrics; verify curriculum tests in `src/shell/world.test.ts`.
- [x] 3.3 Add localized Spanish strings for Barkdoku rules, primer content, debrief summaries, and HUD labels in `src/i18n/es.ts`.

## 4. Standalone Daily Challenge Hub Integration

- [x] 4.1 Add the "Zona de Calma" button to `WorldMapScreen.tsx` and wire date-seeded daily puzzle flows in `App.tsx`; verify map rendering and flow navigation in `src/shell/screens/WorldMapScreen.test.tsx`.
- [x] 4.2 Award daily streak credit in `src/shell/streak.ts` and celebratory feedback upon completing the daily Barkdoku puzzle; verify streak integration in `src/shell/streak.test.ts`.

## 5. System Verification

- [x] 5.1 Run the full test suite (`npm test`) and verify zero regressions across existing stages, nodes, and minigames.
- [x] 5.2 Validate the OpenSpec change using `openspec validate "barkdoku-puzzle-game" --strict`.
