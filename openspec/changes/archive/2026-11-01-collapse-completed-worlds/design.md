# Design

## Context

`WorldMapScreen` (`src/shell/screens/WorldMapScreen.tsx`) renders each World through `WorldBlock` → `WorldArena`. A World is "active" (full header, progress bar, trail, scenery) when it is unlocked, first-locked, or manually expanded; otherwise it renders `CollapsedWorldHeader`, a lock-icon row used for later locked Worlds. Expansion lives in local state `expandedWorlds: Record<string, boolean>`.

The map unmounts while a Stop, the Diary, etc. is open. `App.tsx` keeps `mapScroll` (a ref) and passes it back as `initialScrollY`; it clears it after a Stop is finished (`if (done) mapScroll.current = undefined`), so the map then scrolls to the next-up Stop using measured block/path offsets.

`mapModel` already gives each `MapWorld` `unlocked`, `preview`, `done`, `total` and `owed`. `src/shell/world.ts` has `isWorldComplete(world, progress)`: every Stop done and none owed, never a preview. It is the rule that unlocks the next World and matches the glossary's Completed World.

## Goals / Non-Goals

**Goals:**
- Completed Worlds fold to a header row by default and toggle by tapping the header.
- The toggle survives the map unmounting during the session.

**Non-Goals:**
- Persisting the choice across app launches or devices.
- Letting the user collapse the in-progress or locked Worlds through this mechanism.
- Animating the expand/collapse.

## Decisions

1. **Collapsible means complete and unlocked, reusing `isWorldComplete`.** Add `complete: boolean` to `MapWorld`, set to `unlocked && isWorldComplete(world, progress)`. One rule decides both "the next World opens" and "this World folds", so the two can never disagree. The `unlocked` guard keeps a Completed Plus World behind its lock row after Plus lapses, leaving Plus behaviour unchanged. Alternative: a new count rule in `mapModel` (`done === total && owed.length === 0`). Rejected because it would be a second definition of complete that can drift (for example, through optional Stops).

2. **Separate state for Completed Worlds, owned by `App`.** `WorldMapScreen` gets `expandedCompleted?: ReadonlySet<string>` (or `string[]`) and `onToggleCompleted?: (worldId) => void`. `App` holds it in a `useRef`/`useState` next to `mapScroll`. Default: empty, so every Completed World is collapsed. The existing `expandedWorlds` local state for locked previews is unchanged. Alternative: keep it local in the screen. Rejected because the screen unmounts on opening a Stop, which would collapse the World and shift content under the restored `initialScrollY`. Alternative: persist in the progress record. Rejected as out of scope and it would touch sync.

3. **A World finished during the session collapses.** Because the expanded set holds explicit user choices only, a World the user just finished isn't in it, so it shows collapsed. If the user had expanded it earlier while it was incomplete, that isn't possible (only Completed Worlds toggle), so no stale entries arise. App's existing `mapScroll.current = undefined` after a finished Stop makes the map scroll to the next-up Stop using fresh offsets.

4. **Collapsed row reuses the `CollapsedWorldHeader` look.** Generalize it with a `variant: 'locked' | 'completed'`: locked shows the lock icon; completed shows the World number disc with a check mark, the subtitle `worldWalkSubtitle(entry, t)` ("8 de 8 paradas") and topics, and the ▼/▲ chevron. The expanded Completed World's normal header (`Raised` title row in `WorldArena`) becomes a `Pressable` with `accessibilityRole="button"` and `accessibilityState={{ expanded: true }}` that collapses it again; the Plus badge inside it stays its own pressable. Non-complete Worlds keep a non-pressable header.

5. **Labels.** New keys in `src/i18n/es.ts`: `map.worldCompleted` ("Mundo completado"), `map.showStops` ("Mostrar paradas"), `map.hideStops` ("Ocultar paradas"). The accessibility label is `"<title>. <Mundo completado>. <Mostrar|Ocultar paradas>"`. Existing `map.openPreview`/`map.collapsePreview` stay for locked previews.

## Risks / Trade-offs

- [Collapsing shifts layout under a restored `initialScrollY`] → state is held in `App`, so on return the layout matches what the user left; after a finished Stop the scroll is reset to the next-up Stop anyway.
- [Scroll-to-next-up uses offsets measured at layout] → the 60 ms timer already waits for layout; collapsed Worlds are just shorter blocks, and `onLayout` on each `WorldBlock` still records offsets. Verify by test that the next-up World's block still reports its layout.
- [Dog resting at a waiting Mission inside a collapsed World] → cannot happen: a waiting Mission means the World is not complete.
- [User wants to replay a finished Node] → one extra tap to expand the World; acceptable for the tidier map.
