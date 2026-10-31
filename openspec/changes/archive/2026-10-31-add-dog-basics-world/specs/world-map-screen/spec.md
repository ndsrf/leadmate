# Spec Delta

## MODIFIED Requirements

### Requirement: Trail Scenery and thematic world decorations
The system SHALL decorate active and expanded World blocks on the World Map with Trail Scenery consisting of full-height environmental backdrops, a standardized 48px Top Landmark entrance, and thematic margin backdrops matching each World's environment, rendered behind trail nodes and connectors without obstructing touch targets, readability, or assistive technology. Each World's scenery and theme palette SHALL be chosen by the World itself, not by its position number, so renumbering Worlds never changes how a World looks.

#### Scenario: Full-height environmental background backdrops
- **WHEN** an active or expanded World block is displayed
- **THEN** it renders continuous thematic environmental backdrop layers (Basics living-room wall & rug, Home wainscoting wallpaper & flooring, Sidewalk curb & horizon, Urban cityscape skyline & street grid, Park meadow hills & treeline) spanning the container height behind the trail nodes without obstructing node discs, text labels, or dog avatar positioning

#### Scenario: Standardized Top Landmarks
- **WHEN** an active or expanded World block is displayed
- **THEN** it renders a standardized 48px Top Landmark entrance at the head of the trail (World 1 Basics: dog bed; World 2 Home: residential house; World 3 Sidewalk: suburban fence pillar; World 4 Urban: city transit shelter; World 5 Park: park pergola arbor) using the World's theme palette

#### Scenario: Basics environment decorations
- **WHEN** World 1 (Un perro es un perro) is rendered on the map
- **THEN** its Trail Scenery includes the living-room wall and rug backdrop, the dog bed Top Landmark, and home margin motifs including a sofa, a dog bed and a garden door

#### Scenario: World 1 Home environment decorations
- **WHEN** the Home & Thresholds World (now World 2) is rendered on the map
- **THEN** its Trail Scenery includes the wainscoting wallpaper and floorboard backdrop, the residential house Top Landmark, and interior margin motifs including hallway lines, warm window frames, and doormat floorboard accents

#### Scenario: World 2 Sidewalk environment decorations
- **WHEN** The Quiet Sidewalk World (now World 3) is rendered on the map
- **THEN** its Trail Scenery includes the sidewalk curb and sky horizon backdrop, the suburban fence Top Landmark, and sidewalk margin motifs including garden fences, hedges, and street lamp silhouettes

#### Scenario: World 3 Urban environment decorations
- **WHEN** the Urban Navigations World (now World 4) is rendered on the map
- **THEN** its Trail Scenery includes the layered cityscape skyline and street grid backdrop, the city transit Top Landmark, and urban margin motifs including building facades, storefront awnings, and crosswalk street elements

#### Scenario: World 4 Park environment decorations
- **WHEN** the Fast Wheels & High Arousal World (now World 5) is rendered on the map
- **THEN** its Trail Scenery includes the rolling meadow hills and treeline landscape backdrop, the park pergola Top Landmark, and park margin motifs including park trees, wooden benches, and meadow contours

#### Scenario: Renumbering keeps the look
- **WHEN** Home & Thresholds moves from World 1 to World 2
- **THEN** it keeps its wainscoting backdrop, house landmark and palette

#### Scenario: Clearance contract for interactive nodes and labels
- **WHEN** Trail Scenery is rendered behind a trail of nodes
- **THEN** margin props are anchored to middle-row gutter intervals (`index % 2 === 1`) outside the interactive zig-zag corridor and background backdrops use low-contrast fills, keeping node discs, text labels, star ratings, and the Dog avatar unobstructed

#### Scenario: Non-interactive and accessible
- **WHEN** Trail Scenery is rendered
- **THEN** all decorative illustration elements disable touch events (`pointerEvents="none"`) and are hidden from accessibility screen readers (`aria-hidden={true}`)

#### Scenario: Preview and collapsed world scenery
- **WHEN** a locked World is collapsed, its Trail Scenery is omitted; WHEN a preview World (6–9) is expanded, subtle thematic backdrop silhouettes are rendered behind its preview teaser card
