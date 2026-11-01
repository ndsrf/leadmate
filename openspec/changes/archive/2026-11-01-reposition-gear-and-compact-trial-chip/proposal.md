# Proposal

## Why

The Settings gear icon currently sits inline inside the flow of header chips between the Plus chip and Daily Stage chip, causing it to shift position or wrap awkwardly onto new rows depending on screen width and Plus state. Additionally, the unstarted trial chip displaying "7 días gratis" is excessively wide, crowding the header and forcing premature row wraps.

## What Changes

- Move the Settings gear icon to the top right of Row 1 alongside Streak and Library chips.
- Compact the unstarted trial chip text on the header to "Gratis" (with "Plus" label).
- Compact the Daily Stage chip label from "El Paseo del Día" to "Paseo" (mirroring "Guaudoku").
- Structure the header into two dedicated rows: Row 1 holds Streak, Library, and the pinned Settings gear; Row 2 holds Plus, Daily Paseo, and Guaudoku Barkdoku chips, ensuring all chips fit comfortably without pushing Guaudoku into an unwanted third row.
- Preserve accessibility: ensure the gear maintains the minimum 44pt touch target and accessible name, and the Plus and Daily chips announce their full descriptive names to screen readers.

## Capabilities

### New Capabilities

*(None)*

### Modified Capabilities

- `world-map-screen`: Modifies `Persistent status chips` to position the Settings gear at the top right of Row 1 and organize status chips across two rows, and modifies `Plus chip lifecycle states` to use the compact "Gratis" display for unstarted trials and `daily.chip` ("Paseo") for the daily stage.

## Impact

- UI screen: `src/shell/screens/WorldMapScreen.tsx` (header layout and `PlusChip`).
- Tests: `src/shell/screens/WorldMapScreen.test.tsx` (order and content expectations).
- Translations: `src/i18n/es.ts` and `src/i18n/en.ts` (new trial chip label).
