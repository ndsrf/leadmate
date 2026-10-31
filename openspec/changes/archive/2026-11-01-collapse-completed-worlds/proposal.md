# Proposal

## Why

As the user advances, every finished World keeps its full trail, scenery and Stops on the World Map, so the map grows long and the user scrolls past finished content to reach where they are. Finished Worlds should fold away so the map stays tidy and the current World stands out.

## What Changes

- An unlocked **Completed World** (every Stop done, none owed) is shown on the World Map as a compact header row instead of its full trail: World number with a completed mark, title, "Y de Y paradas", topic summary and an expand chevron. No Trail Scenery, no Stops.
- Tapping the header (the World name row) of a Completed World expands its full trail inline; tapping the header again collapses it.
- Completed Worlds start collapsed whenever the World Map opens in a fresh app session. An expand/collapse choice holds for the rest of the session, including after opening a Stop and coming back to the map.
- A World that becomes complete during the session collapses the next time the map is shown.
- In-progress, first-locked and later-locked Worlds keep their current behaviour (later-locked Worlds already collapse to a header row).

Assumptions recorded (minor, not asked):
- Only Completed Worlds become collapsible by tapping their name. The in-progress World stays expanded; it holds the next-up Stop and the Dog.
- The collapse choice is not saved across app restarts.
- A World with an Owed Mission is not a Completed World and stays expanded, so its "Cerrar el mundo" panel stays visible.
- A Completed Plus World whose Plus membership has lapsed is locked again and keeps the existing locked row.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `world-map-screen`: adds a requirement that Completed Worlds collapse to a header row, toggle on tapping their name, and keep that state for the session.

## Impact

- `src/shell/screens/WorldMapScreen.tsx`: collapsed rendering and a pressable header for Completed Worlds; expanded-state handling.
- `App.tsx`: keeps the session's expanded Completed Worlds next to the existing map scroll position, so the state survives the map unmounting while a Stop is open.
- `src/shell/mapModel.ts`: exposes a `complete` flag per World, taken from the existing `isWorldComplete` in `src/shell/world.ts`.
- `src/i18n/es.ts`: accessibility labels for expanding/collapsing a Completed World.
- `src/shell/screens/WorldMapScreen.test.tsx` and `src/shell/mapModel` tests.
- No data model, sync or dependency changes.
