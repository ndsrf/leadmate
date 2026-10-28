# Barkdoku Spatial Deduction Minigame

To train canine reactivity thresholds and line-of-sight management without the reflex pressure of walking stages, we introduce Barkdoku ("Zona de Calma"), a static spatial deduction minigame adapting Star Battle / Queens mechanics to canine ethology. Placing dogs across color-partitioned $N \times N$ zones enforces territory stations (1 dog per region), breaks direct corridor eye-lock (1 per row and column), and preserves safety bubbles (no dogs touching across all 8 neighbor cells). The visual interface adopts clean, flat-color tiles with rounded white exclusion marks, an active zone completion tracker with dog silhouettes, and an inline ethological rules card. Solving a daily Barkdoku counts alongside Nodes, Daily Stages, and Walk Diaries as a qualifying activity for the Streak.

## Considered Options

- **Simulated Leash Stage only**: Walking simulations test real-time timing and reflexes, but users frequently struggle because they lack a clear mental model of how personal space buffers and sightline occlusion function. A dedicated static deduction puzzle bridges the gap before dynamic street walking.
- **Abstract puzzle without ethological theming**: Treating the puzzle as a generic chess-queens minigame misses the educational mission of LeadMate. Direct mapping to territory stations, eye-lock fixation, and personal space bubbles reinforces core curriculum principles.

## Consequences

- The `MinigameKind` type and node execution loop support spatial grid deduction alongside timing minigames.
- `StreakRecord` and streak qualification logic support daily Barkdoku completions.
- The visual design incorporates a responsive $N \times N$ board supporting sizes from $4 \times 4$ up to $9 \times 9$, an upper zone silhouette tracker, and three-state cell cycling (Empty $\to$ Visual Shield $\to$ Dog $\to$ Empty).
