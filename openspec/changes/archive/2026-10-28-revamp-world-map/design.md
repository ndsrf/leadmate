# Design

## Context

The World Map currently uses NativeWind and React Native views inside `src/shell/screens/WorldMapScreen.tsx`. Layout math is isolated into pure helper functions in `src/shell/ui/mapLayout.ts`, which drives node center coordinates (`nodeCenterX`), label positions (`labelOnRight`, `labelWidth`), and row connectors (`connector`). The current design renders each World as an isolated container card with vertical margins, and the curriculum in `src/shell/world.ts` only defines 4 Worlds (11 Nodes).

Board 11 from the Paper Meadow design system (`11 - World map`) specifies a cohesive map experience:
1. Active Worlds display a continuous winding path with solid green trails for completed sections and dashed/dotted trails for locked sections.
2. The next-up Node is accented in amber (`#F2B84B`), slightly larger, accompanied by a `[Siguiente]` badge pill and the user's customized Dog avatar (`BreedArt` with `breed` and `coat` from `DogRecord`) standing beside it, with an amber aura when Rusty.
3. Node states: completed (green disc with check and 1–3 stars below), open (paper disc with play glyph `▶`), next-up (amber with badge and pulse), and locked (dashed outline with lock icon).
4. World 1 starts with a cut-paper starting house landmark (`🏠`) anchoring the path start, and active worlds feature decorative cut-paper flora.
5. The immediate next locked World displays an unlock requirement banner (`🔒 Termina «...» en el mundo X para abrir este mundo`).
6. Subsequent locked Worlds appear as clean, collapsible World headers with lock badges, preventing clutter while allowing inline expansion on tap.
7. The user needs to see that the app offers deep, extensive content if they subscribe to LeadMate Plus, previewed via Worlds 5–8 (documented in ADR-0012).

## Goals / Non-Goals

**Goals:**
- Implement the Board 11 visual layout: solid vs. dashed winding connectors, 4 distinct node states, user's customized Dog avatar standing by the next-up Node with a `[Siguiente]` pill, start house landmark (`🏠`), and decorative scenery accents.
- Implement hierarchical World presentation: full winding arena for active and immediate next locked World; compact, collapsible headers for subsequent locked Worlds that expand/collapse inline on tap.
- Add dynamic unlock requirement banner above the first locked World, naming the final prerequisite Node when close to completion.
- Expand `world.ts` to include roadmap preview worlds (Worlds 5–8: *El Parque y la Llamada*, *Terrazas y Cafeterías*, *Senderos y Naturaleza*, *Tráfico y Multitudes*) with topic summaries and `tier: 'plus'`, `preview: true`.
- Navigate directly to `PaywallScreen` via `onPaywall` when users tap locked Plus Worlds, Plus badges, or preview nodes.
- Maintain contrast (≥ 4.5:1), 44 pt touch targets, and reduced-motion compliance.

**Non-Goals:**
- Building interactive 3D/canvas physics simulations for preview worlds 5–8 (these are curriculum roadmap previews with planned node counts, ADR-0012).
- Altering the core navigation stack or replacing existing splash / onboarding funnels.
- Redrawing minigame scene art or changing the underlying dog learning engine.

## Decisions

### 1. Connector Path Geometry: Solid Completed vs. Dashed Locked Trails
- **Approach**: In `mapLayout.ts`, enhance `connector` and `NodeRow` to distinguish completed segments from upcoming/locked segments.
  - A segment between two completed nodes renders as a solid ink-bordered path with brand green interior (`#6FAF73`).
  - A segment leading to or between locked nodes renders as a dashed / dotted line using ink-muted dots matching Board 11.
- **Alternatives Considered**: Using react-native-svg `<Path>` with Bézier splines. While smooth, linear angled segments already match the cut-paper aesthetic of Paper Meadow and maintain 100% testability with zero extra native dependencies.

### 2. Dog Avatar Placement and Next-Up Node Staging
- **Approach**: Position the user's Dog avatar (`BreedArt` using `breed` and `coat` from `DogRecord`) beside the next-up Node, facing forward.
  - `labelOnRight` determines which side has open space; the Dog stands on the side with room alongside the Node.
  - A `[Siguiente]` pill badge renders directly below or beside the next-up Node.
  - When the Dog is Rusty, an amber aura ring and status indicator accompany the Dog marker.
  - Under `useMotion().reduceMotion`, the Dog and the next-up attention ring remain static (no continuous scale pulse).
- **Alternatives Considered**: Reusing fixed-color Migas mascot art. Discarded because `BreedArt` is now available across the codebase following the onboarding revamp, allowing personalized dog visualization on the main progression screen.

### 3. World Hierarchy: Active Arenas vs. Collapsible Locked Headers
- **Approach**: In `WorldMapScreen.tsx`:
  - Worlds with completion or the active next-up Node render with the full winding path arena and progress subtitle ("X de Y paseos · topics").
  - The immediately next locked World renders with the requirement banner ("🔒 Termina «...» en el mundo X para abrir este mundo") and its locked path preview.
  - Subsequent locked Worlds render as compact, collapsible headers displaying World Number, Title, Topic summary, and a Lock / Plus badge. Tapping a collapsed header toggles inline expansion so the user can inspect upcoming nodes.
- **Alternatives Considered**: Rendering all worlds permanently expanded. Discarded because scrolling through 8+ fully expanded worlds with locked nodes would create excessive vertical scrolling and visual monotony.

### 4. Extended Curriculum and Direct Paywall Integration (ADR-0012)
- **Approach**:
  - In `src/shell/world.ts`, define extended worlds (World 5 *El Parque y la Llamada*, World 6 *Terrazas y Cafeterías*, World 7 *Senderos y Naturaleza*, World 8 *Tráfico y Multitudes*) with `tier: 'plus'`, `preview: true`, and topic strings.
  - In `src/shell/mapModel.ts`, map these worlds into progression state with node counts.
  - Tapping on a locked Plus World, its badge, or preview node directly navigates to `PaywallScreen` via `onPaywall()`.
  - Sequential progression remains strictly required: Plus Worlds unlock in pedagogical sequence after preceding Worlds are completed.
- **Alternatives Considered**: Hiding Plus content until World 4 is completed. Discarded because the user explicitly wants users to see that the app has deep content from day one.

## Risks / Trade-offs

- **[Risk] Screen width constraints on small devices (e.g., 320 pt iPhone SE)**:
  - *Mitigation*: Node diameter (`NODE_SIZE = 56`), dog avatar dimensions, and label widths are calculated dynamically from viewport width in `mapLayout.ts`.
- **[Risk] Confusion between playable nodes and preview worlds**:
  - *Mitigation*: Unlocked nodes have full interactive handlers (`onStartNode`); locked core nodes display prerequisite requirement notes; locked Plus worlds and nodes display the clear LeadMate Plus paywall prompt.
- **[Risk] State regression on existing progress / storage**:
  - *Mitigation*: Core world IDs (`home`, `sidewalk`, `urban`, `park`) and existing node IDs remain completely unchanged. Extended worlds only add new definitions that do not alter the completion calculation of existing users.
