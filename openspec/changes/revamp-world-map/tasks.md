# Tasks

## 1. Progression Data and Localization

- [x] 1.1 Extend `WorldDef` in `src/shell/world.ts` to support `topics: TextKey`, `tier?: 'free' | 'plus'`, `preview?: boolean`, and `nodeCount?: number`; define extended preview worlds 5–8 (*El Parque y la Llamada*, *Terrazas y Cafeterías*, *Senderos y Naturaleza*, *Tráfico y Multitudes*), and verify with `npm test src/shell/world.test.ts`
- [x] 1.2 Add localized strings to `src/i18n/es.ts` for world topic subtitles, unlock prerequisite banners ("Termina «...» en el mundo X para abrir este mundo"), locked node helper copy, and Plus prompts, and verify with `npm test src/i18n/catalog-usage.test.ts`
- [x] 1.3 Update `src/shell/mapModel.ts` to include topic strings, node counts, tier indicators, and preview flags in `MapWorld`, and verify with `npm test src/shell/mapModel.test.ts`

## 2. Layout Geometry and Node Components (Board 11)

- [x] 2.1 Update `src/shell/ui/mapLayout.ts` with geometry helpers for solid ink-bordered completed paths vs. dashed locked connectors, and verify with `npm test src/shell/ui/mapLayout.test.ts`
- [x] 2.2 Implement customized Dog avatar marker using `BreedArt` (with `breed` and `coat` from `DogRecord`) and `[Siguiente]` badge pill for next-up node placement with static position fallback under reduced motion and amber aura when Rusty, and verify with unit tests
- [x] 2.3 Update node visual states in `src/shell/ui/mapLayout.ts` and `src/shell/screens/WorldMapScreen.tsx` (brand checkmark with stars below, paper play triangle `▶`, amber next-up with pulse, dashed locked disc), and verify with `npm test src/shell/ui/mapLayout.test.ts`

## 3. World Map Screen Hierarchy and Paywall Integration

- [x] 3.1 Update `WorldBlock` in `src/shell/screens/WorldMapScreen.tsx` to render the continuous path arena, ground strip, starting house landmark (`🏠`), decorative scenery dots/bushes, and the dynamic unlock requirement banner for the immediately next locked world, and verify with render tests
- [x] 3.2 Implement compact collapsible world headers for subsequent locked worlds with lock/Plus indicator and tap-to-expand preview, and verify with render tests
- [x] 3.3 Connect direct `onPaywall` callback in `WorldMapScreen.tsx` triggered when tapping locked Plus worlds, Plus badges, or preview nodes, navigating directly to `PaywallScreen`, and verify callback behavior in unit tests

## 4. Verification and Polish

- [x] 4.1 Run full unit test suite (`npm test`) and type-check (`npm run type-check`) to verify zero regressions across the codebase
- [x] 4.2 Verify contrast ratios (≥ 4.5:1), 44 pt minimum touch targets on all interactive map elements, and static display under reduced motion
- [x] 4.3 Validate the change with `openspec validate revamp-world-map`
