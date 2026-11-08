# Tasks

## 1. Session State & Header Expansion Wiring

- [x] 1.1 In `App.tsx` and `WorldMapScreen.tsx`, lift Locked and Coming-soon World expansion state (`expandedWorlds: ReadonlySet<string>`) to `App` session state alongside `expandedCompleted`, and verify that opening and returning from a stop or paywall keeps the expanded choices.
- [x] 1.2 In `src/shell/screens/WorldMapScreen.tsx`, update `WorldBlock` so that the collapse chevron (`▲`) renders for all collapsible expanded worlds (`entry.complete || !entry.unlocked`), and verify that expanded Locked and Coming-soon World headers display the chevron.
- [x] 1.3 In `src/shell/screens/WorldMapScreen.tsx`, wrap the header row of expanded Locked and Coming-soon Worlds in a `Pressable` triggering `onToggleExpand` with proper accessibility role (`button`), expanded state (`{ expanded: true }`), and label (`<Title>. Cerrar adelanto`), while preserving the non-interactive header on the active In-Progress World and the child touch target on the Plus badge.

## 2. Verification & Automated Tests

- [x] 2.1 Add unit tests in `src/shell/screens/WorldMapScreen.test.tsx` verifying:
  - An expanded Locked World header renders the `▲` button and pressing it calls `onToggleExpand`.
  - An expanded Coming-soon World header renders the `▲` button and pressing it calls `onToggleExpand`.
  - The In-Progress World remains non-interactive and renders no chevron.
  - Tapping the Plus badge on a Locked/Coming-soon World header opens the paywall without toggling expansion.
  - Completed Worlds continue to toggle via `onToggleCompleted`.
- [x] 2.2 Run full test suite (`npm test`) and OpenSpec validation (`openspec validate expand-collapse-world-headers`) to verify all checks pass.
