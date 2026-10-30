# Design

## Context

The World Map renders each World as a winding trail of nodes (`WorldBlock` in `WorldMapScreen.tsx`). The container has a rounded card appearance with a sky background (`palette.sky`) and a bottom ground strip (`palette.ground`). Previously, only two decorations existed:
1. `SceneryBushes`: A basic trio of static green circles hardcoded at fixed Y coordinates (`top: 40, 110, 220`).
2. `HouseLandmark`: A small SVG house rendered at the top of World 1 only.

Following domain modeling and architectural review, the concept is formalized as **Trail Scenery** in `GLOSSARY.md`, distinguishing screen-level paper-cut backdrops from in-simulation `Scenery Set` props.

See `proposal.md` for motivation and scope.

## Goals / Non-Goals

**Goals:**
- Provide rich, full-height environmental backdrops and environment-specific SVG **Trail Scenery** for each World on the World Map (Home, Sidewalk, Urban, Park, and preview tiers).
- Standardize a 48px height **Top Landmark** entrance for active Worlds (House for World 1, Suburban Picket Gate for World 2, City Transit Arch for World 3, Park Pergola Arbor for World 4).
- Position margin scenery props deterministically in middle-row gutter intervals (`index % 2 === 1`) to preserve 100% legibility of labels, star rows, and the Dog avatar.
- Adhere strictly to the paper-cut vector craft style: clean ink outlines, layered silhouettes, and world palette tokens (`sky`, `ground`, `accent`, `soft`, `deep`).
- Ensure all decorative layers have zero impact on touch responsiveness (`pointerEvents="none"`) and are completely hidden from accessibility trees (`aria-hidden={true}`).
- Encapsulate background scenery rendering into a dedicated component (`WorldSceneryBackground`), maintaining a backward-compatible re-export for `HouseLandmark`.

**Non-Goals:**
- Interactive background elements or minigame triggers within the background.
- Dynamic parallax scrolling or heavy looping background physics.
- Modifying game simulation physics, scenario props, or gameplay node layout coordinates.

## Decisions

### Decision 1: Dedicated `WorldSceneryBackground` component
- **Choice**: Extract background scenery into `src/shell/ui/WorldSceneryBackground.tsx`, receiving `worldId`, `worldNumber`, `palette`, `stopCount`, and `isExpandedPreview`.
- **Rationale**: Keeps `WorldMapScreen.tsx` focused on map state, scrolling, and stop interactions while enabling dedicated unit testing for scenery variants.
- **Alternatives considered**:
  - Inlining SVG variants directly inside `WorldMapScreen.tsx`: Bloats `WorldMapScreen.tsx` (already ~900 lines).
  - External PNG/WebP raster images: Violates the crisp paper-cut SVG design system and doesn't scale adaptively to variable-length trails.

### Decision 2: Standardized 48px Top Landmark entrance
- **Choice**: Standardize each active world entrance to a 48px height landmark slot rendered at the head of the trail:
  - **World 1 (`home`)**: House facade with gable roof, chimney, and doorway arch.
  - **World 2 (`sidewalk`)**: Suburban garden fence entrance with brick pillar and street sign.
  - **World 3 (`urban`)**: City skyline silhouette with metro/transit shelter arch.
  - **World 4 (`park`)**: Open park entrance with a wooden pergola arbor and trail signpost.
- **Rationale**: Unifies the layout across worlds, ensuring starting node positions and top padding are consistent.

### Decision 3: Margin Scenery Cadence & Clearance Contract
- **Choice**: Margin scenery props (trees, lamps, building facades, park benches) are placed at middle-row intervals (`index % 2 === 1`) where the node is at `x = 0.45` and both outer gutters (`x < 0.25` and `x > 0.70`) are completely open.
- **Rationale**: Prevents visual collisions between scenery lines and node discs, labels, star rows, or the Dog avatar (`BreedArt`).

### Decision 4: Preview Worlds Treatment
- **Choice**: Render light thematic backdrop silhouettes inside expanded preview world blocks (Recall meadow, Cafe terrace, Hiking mountain ridge, Crowds plaza) behind the preview teaser card.
- **Rationale**: Makes exploring the future roadmap visually rewarding without cluttering the teaser card.

### Decision 5: Backward Compatibility for `HouseLandmark`
- **Choice**: Move the World 1 house SVG into `WorldSceneryBackground.tsx` and re-export `HouseLandmark` from `WorldMapScreen.tsx` (or `WorldSceneryBackground.tsx`).
- **Rationale**: Guarantees existing test suites and references remain unbroken.

### Decision 6: Full-Height Environmental Backdrops & Curated Vector Craft
- **Choice**: Replace plain solid pastel card backgrounds with responsive full-height SVG environmental backdrops adapted from open royalty-free vector craft motifs and mapped strictly to LeadMate's palette tokens (`sky`, `ground`, `soft`, `deep`, `ink`).
- **Rationale**: Elevates the visual atmosphere across variable trail heights without image distortion, maintaining crisp rendering at any device pixel ratio while preserving accessibility contrast.

## Risks / Trade-offs

- **[Risk] High node count in some worlds could cause illustrations to stretch or cluster**
  → *Mitigation*: Anchor Top Landmark to the header, ground baseline to the bottom, and repeat/stagger subtle decorative props at middle-row intervals down the trail.
- **[Risk] Visual clutter reducing legibility of node labels or dog avatar**
  → *Mitigation*: Strict clearance contract confining props to outer gutters and top header; use soft palette tones and low-opacity ink lines behind the central trail.
