# Proposal

## Why

Currently on the World Map, Completed Worlds can be collapsed and expanded freely, but Locked Worlds and Coming-soon Worlds that have been expanded lack a collapse button in their expanded header and cannot be collapsed back. Furthermore, expansion of Locked and Coming-soon Worlds is kept in transient component state, causing them to re-collapse whenever the user visits a Stop, the Paywall, or Settings. Ensuring all collapsible world headers display the appropriate toggle button (▼ to expand, ▲ to collapse), collapse on tap, and persist their session expansion state alongside Completed Worlds in `App` restores consistent navigation across the map trail, while keeping the active In-Progress World always open.

## What Changes

- Add a collapse button (`▲`) to the expanded header row of Locked Worlds and Coming-soon Worlds.
- Make the header row of expanded Locked and Coming-soon Worlds pressable so that tapping toggles the world back to its compact collapsed state (`onToggleExpand`).
- Update accessibility roles and labels for expanded Locked and Coming-soon World headers to announce their toggle state and action (`<Title>. Cerrar adelanto` with `accessibilityRole="button"` and `accessibilityState={{ expanded: true }}`).
- Preserve the dedicated touch target for the "Plus" badge on Plus-tier world headers so tapping the badge opens the Paywall directly, while tapping the rest of the header row toggles expand/collapse.
- Lift Locked and Coming-soon World expansion state to `App` session state alongside `expandedCompleted`, so returning to the World Map from a Stop, the Paywall, or Settings preserves the user's expanded worlds during that app session.
- Maintain existing functionality for the In-Progress World: it remains permanently expanded and non-collapsible without a collapse button.
- Maintain existing functionality for the first Locked World: it starts collapsed as a compact header row, expanding on tap to reveal its unlock requirement banner and trail preview.
- Retain existing functionality for Completed Worlds (starts collapsed, folds/unfolds with `▲`/`▼` toggle, persists across stops in the session).

## Capabilities

### New Capabilities
*(None)*

### Modified Capabilities
- `world-map-screen`: Update world header behavior so that expanded Locked and Coming-soon Worlds show a collapse button (`▲`), collapse on tap, announce their state to screen readers, and persist session expansion state, while the active In-Progress World remains permanently expanded and non-collapsible.

## Impact

- `App.tsx`: Manage session expansion state for Locked and Coming-soon Worlds alongside `expandedCompleted`.
- `src/shell/screens/WorldMapScreen.tsx`: `WorldBlock` header rendering (`titleRow`), pressable wrapper, chevron display, and prop wiring for lifted session state.
- `src/shell/screens/WorldMapScreen.test.tsx`: Unit tests verifying that expanding and tapping the header of Locked and Coming-soon Worlds collapses them back, displays `▲`, announces properly, and retains choices across screen navigations.
