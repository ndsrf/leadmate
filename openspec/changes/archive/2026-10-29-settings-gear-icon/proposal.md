# Proposal

## Why

The World Map's Map Header packs six Status Chips (Streak, Daily Stage, Zona de Calma, Biblioteca, Diario, Ajustes) into a wrapping row. On phone widths they spill onto extra lines, so the fixed header takes vertical space that belongs to the trail. "Ajustes" is the least-used entry and the easiest to shrink: a gear is a widely understood settings symbol.

## What Changes

- Replace the "Ajustes" Status Chip with a small, icon-only Settings gear.
- Pin the gear to the top-right corner of the Map Header, on the first line beside the Streak chip. The other Status Chips wrap across the full width below, so the gear never takes width from them and stays in the same place at every width.
- The gear is a round raised button with the same face height as the Status Chips and an icon of about 20px, drawn in the game style (ink outline, surface fill) with `react-native-svg`. No icon library is added.
- It keeps the 44px minimum touch target, a screen-reader label from the i18n catalog ("Ajustes" / "Settings"), the focus ring and press feedback.
- Tapping it opens Settings exactly as today. Navigation, scroll restoration and the Settings screen do not change.

Success: the Map Header has fewer lines than before at 360px (4 → 3) and no more lines at 390px (3). Getting 390px down further needs shorter Status Chips (e.g. a shorter "Zona de Calma" label), which is a separate change.

Out of scope: restyling the other Status Chips, any screen other than the World Map, and the Settings screen title.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `world-map-screen`: the "Persistent status chips" requirement now states that the Settings entry is a compact gear button pinned to the top-right of the Map Header, with an accessible name, rather than a text chip.

## Impact

- `src/shell/screens/WorldMapScreen.tsx`: the header's first line holds the Streak chip and the gear; the other Status Chips wrap on the lines below.
- `src/shell/ui/components.tsx`: a new icon-only `IconChip` reusing `Raised`, `touchTarget`, `useFocus` and `handlePress`, plus a small gear glyph.
- Tests: a render/accessibility check that the map exposes a button labelled with `map.settings`, with no visible "Ajustes" text, and that pressing it calls `onSettings`.
- No i18n key changes (`map.settings` stays as the accessibility label), no new dependencies, no data changes.
