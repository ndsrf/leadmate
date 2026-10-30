# Tasks

## 1. Top Landmark Components

- [x] 1.1 Implement standardized 48px Top Landmark components for active worlds in `src/shell/ui/WorldSceneryBackground.tsx`:
  - World 1: Residential house facade with gable roof, chimney, and doorway arch (absorbs `HouseLandmark`).
  - World 2: Suburban garden fence entrance with brick pillar and street sign.
  - World 3: City skyline silhouette with metro/transit shelter arch.
  - World 4: Open park entrance with a wooden pergola arbor and trail signpost.
  Verify with theme tokens in unit rendering.

## 2. Margin Scenery & Preview Silhouettes

- [x] 2.1 Implement paper-cut margin scenery motifs for active worlds in `src/shell/ui/WorldSceneryBackground.tsx`:
  - World 1: Hallway lines, window frames, and doormat floorboard accents.
  - World 2: Garden fences, hedges, and sidewalk street lamps with soft glow discs.
  - World 3: Building facades, storefront awnings, and crosswalk street elements.
  - World 4: Park trees, wooden benches, and rolling meadow contours.
- [x] 2.2 Implement subtle backdrop silhouettes for expanded preview worlds (5–8) in `src/shell/ui/WorldSceneryBackground.tsx` (Recall meadow, Cafe terrace, Hiking ridge, Crowds plaza).
- [x] 2.3 Implement middle-row gutter anchor cadence (`index % 2 === 1`) positioning margin props outside the central zig-zag corridor.

## 3. WorldSceneryBackground Assembly & Unit Tests

- [x] 3.1 Assemble `WorldSceneryBackground` to dispatch Top Landmarks, margin scenery, and preview silhouettes based on `worldId`/`worldNumber`, `palette`, and `stopCount`, enforcing `pointerEvents="none"`, `aria-hidden={true}`, and `importantForAccessibility="no-hide-descendants"`.
- [x] 3.2 Create unit tests in `src/shell/ui/WorldSceneryBackground.test.tsx` verifying:
  - Top Landmark rendering and 48px height across worlds 1–4.
  - Middle-row margin scenery placement.
  - Preview world silhouettes for worlds 5–8.
  - Accessibility and `pointerEvents` attributes.
  Verify that `npm test src/shell/ui/WorldSceneryBackground.test.tsx` passes.

## 4. WorldMapScreen Integration

- [x] 4.1 Integrate `WorldSceneryBackground` into `WorldBlock` in `src/shell/screens/WorldMapScreen.tsx`, replacing generic `SceneryBushes` dots and inline `HouseLandmark` while providing a backward-compatible re-export for `HouseLandmark`.
- [x] 4.2 Verify collapsed world headers omit Trail Scenery and expanded preview worlds render their backdrop silhouettes behind the teaser card.
- [x] 4.3 Update `src/shell/screens/WorldMapScreen.test.tsx` to verify Trail Scenery presence and confirm node row interaction, accessibility, and dog avatar positioning remain unaffected.

## 5. Initial End-to-End Verification

- [x] 5.1 Run type-check (`npm run typecheck` or equivalent `tsc --noEmit`) and the full test suite (`npm test`) to confirm zero regressions across the codebase.

## 6. Full-Height Backdrops & Enriched Graphical Decorations

- [x] 6.1 Implement full-height environmental backdrops in `src/shell/ui/WorldSceneryBackground.tsx`:
  - World 1: Wainscoting wallpaper pattern & hardwood floorboards.
  - World 2: Paved sidewalk curb line, garden horizon, and paper-cut clouds.
  - World 3: Layered cityscape skyline silhouette & street grid textures.
  - World 4: Rolling meadow hills & park treeline backdrop.
- [x] 6.2 Enrich graphical decoration props across active world margins with detailed vector craft motifs.
- [x] 6.3 Update unit tests in `src/shell/ui/WorldSceneryBackground.test.tsx` and `src/shell/screens/WorldMapScreen.test.tsx` verifying full-height backdrops.
- [x] 6.4 Run full verification (`npm run typecheck` and `npm test`).
