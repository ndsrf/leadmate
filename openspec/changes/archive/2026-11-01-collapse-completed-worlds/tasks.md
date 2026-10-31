# Tasks

## 1. Map model

- [x] 1.1 Add `complete: boolean` to `MapWorld` in `src/shell/mapModel.ts`, set to `unlocked && isWorldComplete(world, progress)`, and verify with mapModel unit tests: an all-done World is complete; a World with one Owed Mission is not; preview and locked Worlds are not; a Completed Plus World with Plus lapsed is not.

## 2. Collapsed Completed World on the map

- [x] 2.1 Add `map.worldCompleted`, `map.showStops`, `map.hideStops` to `src/i18n/es.ts` and verify `src/i18n` tests (including catalog usage) pass once 2.2 uses them.
- [x] 2.2 Generalize `CollapsedWorldHeader` with a `completed` variant (number disc with check mark, "X de Y paradas" subtitle, topics, chevron, accessibility label with title + completed + show/hide) and verify via a `WorldMapScreen.test.tsx` render that a Completed World shows the header, its count text, and no `environmental-backdrop-<world>` / `top-landmark-<world>` / Stop markup.
- [x] 2.3 Add `expandedCompleted` and `onToggleCompleted` props to `WorldMapScreen`; render Completed Worlds collapsed unless their id is in `expandedCompleted`; make the collapsed row and the expanded World's title row pressable to call `onToggleCompleted` (Plus badge keeps its own press), with `accessibilityState.expanded`. Verify by tests: expanded Completed World renders its trail and scenery; pressing the header calls `onToggleCompleted` with the World id; the in-progress World's header is not a toggle button; a World with an Owed Mission renders expanded with the "Cerrar el mundo" panel; a Completed Plus World without Plus renders the locked row.

## 3. Session state in the shell

- [x] 3.1 In `App.tsx`, hold the expanded Completed World ids for the session next to `mapScroll` and pass them with a toggle handler to `WorldMapScreen`. Verify manually (run the app): expand a Completed World, open one of its Stops, go back — the World is still expanded at the same scroll; relaunch the app — it is collapsed again.
- [x] 3.2 Verify manually that finishing the last Stop of a World returns to the map with that World collapsed and the map scrolled to the new next-up Stop.

## 4. Integration

- [x] 4.1 Run the full test suite and typecheck (`npm test`, `npm run typecheck`) and verify all pass.
- [x] 4.2 Run `openspec validate collapse-completed-worlds --strict` and verify it passes.

## Workflow follow-up

- Archive the change after review so the new requirement merges into `openspec/specs/world-map-screen/spec.md`.
