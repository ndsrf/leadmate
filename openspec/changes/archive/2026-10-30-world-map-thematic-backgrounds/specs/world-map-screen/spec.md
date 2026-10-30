# Spec Delta

## ADDED Requirements

### Requirement: Trail Scenery and thematic world decorations
The system SHALL decorate active and expanded World blocks on the World Map with Trail Scenery consisting of full-height environmental backdrops, a standardized 48px Top Landmark entrance, and thematic margin backdrops matching each World's environment, rendered behind trail nodes and connectors without obstructing touch targets, readability, or assistive technology.

#### Scenario: Full-height environmental background backdrops
- **WHEN** an active or expanded World block is displayed
- **THEN** it renders continuous thematic environmental backdrop layers (Home wainscoting wallpaper & flooring, Sidewalk curb & horizon, Urban cityscape skyline & street grid, Park meadow hills & treeline) spanning the container height behind the trail nodes without obstructing node discs, text labels, or dog avatar positioning

#### Scenario: Standardized Top Landmarks
- **WHEN** an active or expanded World block is displayed
- **THEN** it renders a standardized 48px Top Landmark entrance at the head of the trail (World 1: residential house; World 2: suburban fence pillar; World 3: city transit shelter; World 4: park pergola arbor) using the World's theme palette

#### Scenario: World 1 Home environment decorations
- **WHEN** World 1 (Home & Thresholds) is rendered on the map
- **THEN** its Trail Scenery includes the wainscoting wallpaper and floorboard backdrop, the residential house Top Landmark, and interior margin motifs including hallway lines, warm window frames, and doormat floorboard accents

#### Scenario: World 2 Sidewalk environment decorations
- **WHEN** World 2 (The Quiet Sidewalk) is rendered on the map
- **THEN** its Trail Scenery includes the sidewalk curb and sky horizon backdrop, the suburban fence Top Landmark, and sidewalk margin motifs including garden fences, hedges, and street lamp silhouettes

#### Scenario: World 3 Urban environment decorations
- **WHEN** World 3 (Urban Navigations) is rendered on the map
- **THEN** its Trail Scenery includes the layered cityscape skyline and street grid backdrop, the city transit Top Landmark, and urban margin motifs including building facades, storefront awnings, and crosswalk street elements

#### Scenario: World 4 Park environment decorations
- **WHEN** World 4 (Fast Wheels & High Arousal) is rendered on the map
- **THEN** its Trail Scenery includes the rolling meadow hills and treeline landscape backdrop, the park pergola Top Landmark, and park margin motifs including park trees, wooden benches, and meadow contours

#### Scenario: Clearance contract for interactive nodes and labels
- **WHEN** Trail Scenery is rendered behind a trail of nodes
- **THEN** margin props are anchored to middle-row gutter intervals (`index % 2 === 1`) outside the interactive zig-zag corridor and background backdrops use low-contrast fills, keeping node discs, text labels, star ratings, and the Dog avatar unobstructed

#### Scenario: Non-interactive and accessible
- **WHEN** Trail Scenery is rendered
- **THEN** all decorative illustration elements disable touch events (`pointerEvents="none"`) and are hidden from accessibility screen readers (`aria-hidden={true}`)

#### Scenario: Preview and collapsed world scenery
- **WHEN** a locked World is collapsed, its Trail Scenery is omitted; WHEN a preview World (5–8) is expanded, subtle thematic backdrop silhouettes are rendered behind its preview teaser card
