# Proposal

## Why

The current World Map renders each World as an isolated, disconnected card with only 4 Worlds and 11 total Nodes, making the app feel sparse and giving users little incentive to upgrade. Restyling the map to match the Paper Meadow design system (Board 11) with a continuous winding trail, rich node states, customized dog avatar placement (`BreedArt`), and an extended horizon of locked LeadMate Plus preview worlds communicates strong visual polish and showcases the extensive content available in the app.

## What Changes

- **Board 11 Paper Meadow Visuals**: Revamp the World Map to follow Board 11 (`11 - World map`):
  - Winding path layout where completed sections render as thick solid ink-bordered green paths, while upcoming/locked sections render as dashed dotted trails.
  - Distinct node states:
    - **Completed**: Brand green disc with checkmark (`✓`) and 1–3 stars below.
    - **Next-Up**: Amber disc (`#F2B84B`), slightly enlarged, with a `[Siguiente]` badge pill, subtle pulse ring, and the user's Dog avatar (`BreedArt` with the Dog's `breed` and `coat`) illustrated standing alongside the node, glowing with an amber aura when Rusty.
    - **Open**: Paper-light surface disc with play triangle (`▶`).
    - **Locked**: Flat disc with dashed ink outline, lock icon (`🔒`), and prerequisite note ("Se abre al terminar «...»").
  - Environment scenery: Thematic biome backgrounds, ground horizon strip, starting house landmark (`🏠`) anchoring the beginning of World 1, and decorative paper-cut scenery dots and bushes along the trail.
- **Hierarchical World Presentation**:
  - Unlocked / active worlds render full winding path arenas with progress subtitle (e.g. "3 de 5 paseos · puertas, timbre, escaleras").
  - The immediately next locked world displays an unlock requirement banner (e.g. "🔒 Termina «El poste» en el mundo 1 para abrir este mundo").
  - Subsequent locked worlds render as compact, collapsible locked headers with lock badges, preventing visual clutter while previewing the road ahead; tapping a collapsed header expands/collapses it inline.
- **Extended Content Horizon & LeadMate Plus Gating**:
  - Extend the progression curriculum beyond the initial 4 worlds to show upcoming roadmap preview worlds (Worlds 5–8: *El Parque y la Llamada*, *Terrazas y Cafeterías*, *Senderos y Naturaleza*, *Tráfico y Multitudes*).
  - Clearly designate premium worlds with a "Plus" lock badge and descriptive topic summaries.
  - Tapping a locked Plus world, its lock badge, or a preview node directly opens the Paywall screen (`PaywallScreen`) via `onPaywall`, highlighting the full scope of features and lessons unlocked with LeadMate Plus.

## Capabilities

### New Capabilities
<!-- none: the revamp enhances existing world map and progression capabilities -->

### Modified Capabilities
- `world-map-screen`: Update map presentation to support Board 11 path geometry (solid vs. dashed winding connectors), node state visuals (play glyph for open, enlarged next-up with customized `BreedArt` dog avatar and pill, star placements), starting house landmark, locked world requirement banners, compact collapsible locked world headers, and paywall navigation on locked Plus worlds.
- `world-progression`: Update world definition schema (`WorldDef`) to support chapter topic subtitles, curriculum tier designation (`free` vs. `plus`), roadmap preview designation, and extended preview worlds that showcase upcoming content.

## Impact

- `src/shell/screens/WorldMapScreen.tsx`: Component architecture updated for continuous path rendering, custom dog avatar (`BreedArt`) placement, starting house landmark, locked banners, collapsible world headers, and direct `onPaywall` callback integration.
- `src/shell/ui/mapLayout.ts`: Path calculation and connector styles updated to distinguish completed solid segments from locked dotted segments, and accommodate dog avatar offsets.
- `src/shell/world.ts` & `src/shell/mapModel.ts`: Extended world definitions with topic subtitles, tier metadata, and preview worlds.
- `src/i18n/es.ts`: Add localized strings for node helper copy, world topic descriptions, unlock banners, and Plus prompts.
- `docs/adr/0012-preview-worlds-as-roadmap-teasers.md`: Architecture record documenting roadmap preview worlds.
- Unit and snapshot tests covering map layout geometry, node visual states, and world unlock rules (`mapLayout.test.ts`, `mapModel.test.ts`, `world.test.ts`).
