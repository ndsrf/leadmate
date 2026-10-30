# Proposal

## Why

Currently, while Top Landmarks and small margin icons exist, the World Map container still displays a mostly flat pastel card (`palette.sky`), lacking an immersive full-height environmental background and rich graphical decoration. The World Map represents a dog handler's journey across distinct canine training environments—from home thresholds to suburban sidewalks, bustling city streets, and open parks. Introducing continuous, full-height environmental backdrops (wallpaper, suburban horizons, cityscape silhouettes, and meadow contours) combined with enriched paper-cut vector decorations significantly elevates the visual presentation and communicates the environment and context of each training tier.

## What Changes

- Introduce canonical **Trail Scenery** components for each world on the World Map screen:
  - **Full-Height Environmental Backdrops**:
    - **World 1 (Home & Thresholds)**: Interior wainscoting wallpaper pattern, warm ambient lighting motifs, and hardwood floorboard base.
    - **World 2 (The Quiet Sidewalk)**: Continuous paved sidewalk curb strip, suburban picket horizon, and soft paper-cut cloud layers.
    - **World 3 (Urban Navigations)**: Multi-layered cityscape skyline silhouette across the upper background, architectural grid, and crosswalk street elements.
    - **World 4 (Fast Wheels & High Arousal)**: Layered rolling park meadow hills and treeline landscape backdrop spanning across the card, with sun and cloud accents.
  - **Standardized Top Landmarks (48px height)**:
    - **World 1**: Residential House facade with gable roof, chimney, and doorway arch.
    - **World 2**: Suburban garden fence entrance with brick pillar and street sign.
    - **World 3**: City skyline silhouette with metro / transit shelter arch.
    - **World 4**: Open park entrance with a wooden pergola arbor and trail signpost.
  - **Thematic Margin Motifs & Enriched Vector Craft**:
    - **World 1**: Hallway partitions, warm window frames, and doormat floorboard accents.
    - **World 2**: Picket fences, garden hedges, and street lamp silhouettes with soft glow discs.
    - **World 3**: Building facades, storefront awnings, and crosswalk street elements.
    - **World 4**: Park trees, wooden benches, and rolling meadow contours.
    - Curate and adapt open royalty-free craft vector motifs into LeadMate's paper-cut design system.
  - **Preview Worlds (5–8)**: Subtle thematic backdrop silhouettes behind preview teaser cards (Recall meadow, Cafe terrace, Hiking mountain ridge, Crowds plaza).
- **Clearance & Contrast Contract**: Position margin scenery props deterministically in middle-row gutter intervals (`index % 2 === 1`) where outer margins are wide open, ensuring node discs, text labels, star rows, and the Dog avatar maintain 100% legibility against background backdrops.
- **Component Unification**: Create a dedicated `WorldSceneryBackground` module, replacing hardcoded `SceneryBushes` and absorbing `HouseLandmark` while retaining an exported backward-compatible shim.
- **Touch & Accessibility Safety**: Ensure all decorative background elements have `pointerEvents="none"`, `aria-hidden={true}`, and `importantForAccessibility="no-hide-descendants"`.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `world-map-screen`: Add requirement for Trail Scenery (standardized Top Landmarks, full-height environmental backdrops, thematic margin motifs, and clearance contract) for each world trail on the World Map.

## Impact

- `GLOSSARY.md`: Added canonical term `Trail Scenery` under Progression.
- `src/shell/ui/WorldSceneryBackground.tsx`: Component providing full-height backdrops, Top Landmarks, and enriched margin scenery per world.
- `src/shell/screens/WorldMapScreen.tsx`: Replace generic dots and inline landmark with `WorldSceneryBackground`.
- `src/shell/ui/theme.ts`: World palette tokens (`theme.world.w1` - `w4`).
- Tests: `src/shell/ui/WorldSceneryBackground.test.tsx` and updated `src/shell/screens/WorldMapScreen.test.tsx`.
