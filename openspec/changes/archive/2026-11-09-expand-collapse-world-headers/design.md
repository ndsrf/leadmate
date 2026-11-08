# Design

## Context

See [proposal.md](file:///mnt/c/Users/jgm/orca/leadmate/openspec/changes/expand-collapse-world-headers/proposal.md) for motivation.

The World Map renders a sequence of worlds via [`WorldBlock`](file:///mnt/c/Users/jgm/orca/leadmate/src/shell/screens/WorldMapScreen.tsx#L880-L1060) in [`WorldMapScreen.tsx`](file:///mnt/c/Users/jgm/orca/leadmate/src/shell/screens/WorldMapScreen.tsx).
Currently:
- **Completed Worlds** (`entry.complete`): Fold to [`CollapsedWorldHeader`](file:///mnt/c/Users/jgm/orca/leadmate/src/shell/screens/WorldMapScreen.tsx#L667-L732) (`variant="completed"`) with a `▼` expand button. When expanded (`completedOpen`), their header row displays an upward chevron `▲` and is wrapped in a `Pressable` connected to `onToggleCompleted`. Their expansion state is stored in `App.tsx` (`expandedCompleted: ReadonlySet<string>`), so it survives visiting Stops and returning to the map.
- **In-Progress World** (`entry.unlocked && !entry.complete`): Remains expanded at all times. Its header is non-interactive with no chevron.
- **Locked & Coming-soon Worlds** (`!entry.unlocked`): Start collapsed via [`CollapsedWorldHeader`](file:///mnt/c/Users/jgm/orca/leadmate/src/shell/screens/WorldMapScreen.tsx#L667-L732) with a `▼` expand button that toggles `expandedWorlds[worldId]`. However:
  1. Once expanded, [`WorldBlock`](file:///mnt/c/Users/jgm/orca/leadmate/src/shell/screens/WorldMapScreen.tsx#L917-L979) only renders `▲` and wraps `titleRow` in a `Pressable` if `entry.complete` is true. Because `entry.complete` is false for locked/Coming-soon worlds, the expanded header has no chevron button, is not pressable, and cannot be collapsed back.
  2. `expandedWorlds` is local component state in `WorldMapScreen`, so navigating to the Paywall, Settings, or another screen collapses them again.

## Goals / Non-Goals

**Goals:**
- Render an upward chevron (`▲`) on expanded Locked and Coming-soon World headers.
- Wrap the expanded header of Locked and Coming-soon Worlds in an interactive `Pressable` that triggers `onToggleExpand`, collapsing them back to compact headers.
- Provide proper accessibility labels and state (`accessibilityRole="button"`, `accessibilityState={{ expanded: true }}`) announcing `<Title>. Cerrar adelanto` on expanded locked/Coming-soon headers.
- Lift Locked and Coming-soon World expansion state to `App.tsx` session state alongside `expandedCompleted`, preserving expanded choices when opening Stops, the Paywall, or Settings.
- Retain the non-interactive, always-expanded behavior of the current In-Progress World.
- Retain dedicated touch target priority on the "Plus" badge in the header so tapping it opens the Paywall directly without toggling expansion.

**Non-Goals:**
- Making the In-Progress World collapsible (remains always open to keep the next-up action visible).
- Changing the initial collapsed state of locked worlds or completed worlds upon cold launch.
- Altering the visual styling or layout of the compact [`CollapsedWorldHeader`](file:///mnt/c/Users/jgm/orca/leadmate/src/shell/screens/WorldMapScreen.tsx#L667-L732).

## Decisions

### Decision: Identify Collapsible Worlds in `WorldBlock`
- Define `isCollapsible = entry.complete || !entry.unlocked`.
  - For Completed Worlds (`entry.complete`): `isCollapsible` is `true`. Tapping toggles `onToggleCompleted`.
  - For Locked and Coming-soon Worlds (`!entry.unlocked`): `isCollapsible` is `true`. Tapping toggles `onToggleExpand`.
  - For the active In-Progress World (`entry.unlocked && !entry.complete`): `isCollapsible` is `false`. It renders no chevron and no wrapper `Pressable`.

### Decision: Lift Locked/Coming-soon World Expansion State to App
- In `App.tsx`, maintain `expandedWorlds: ReadonlySet<string>` (or pass `expandedLocked` alongside `expandedCompleted`) with a toggle handler, passed into `WorldMapScreen`.
- This ensures that when a user expands a Locked World or Coming-soon World, visits a Stop, the Paywall, or Settings, and returns to the World Map, their expanded/collapsed state persists for the session.

### Decision: Header Pressable and Accessibility Wiring
When `isCollapsible` is true in an expanded [`WorldBlock`](file:///mnt/c/Users/jgm/orca/leadmate/src/shell/screens/WorldMapScreen.tsx#L880-L1060):
- Display `▲` at the right end of the header row.
- Wrap `titleRow` in a `Pressable` that invokes:
  - `onToggleCompleted` if `entry.complete`
  - `onToggleExpand` if `!entry.unlocked`
- Set `accessibilityRole="button"`, `accessibilityState={{ expanded: true }}`, and descriptive label:
  - `completedWorldLabel(entry, t, true)` for Completed Worlds
  - `${worldTitle(entry.world, t)}. ${t('map.collapsePreview')}` for Locked and Coming-soon Worlds

### Decision: Plus Badge Child Pressable Isolation
- The Plus badge in `titleRow` is rendered inside an inner `Pressable` with its own `onPress`.
- When tapped, `handlePress(onPressPaywall)` triggers the paywall without propagating to the outer header toggle pressable.

## Risks / Trade-offs

- **[Risk]** Resetting expansion on app relaunch:
  → *Mitigation*: Session state in `App.tsx` initializes as empty set on every launch, ensuring worlds start collapsed in a fresh session as specified.
