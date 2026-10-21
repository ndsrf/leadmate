# ground-cover Specification

## Purpose
Defines the flat, cosmetic floor of a Stage: per-theme surfaces laid in patches along the Pathway, small flat decorations, and how the ground is drawn cheaply.

## Requirements
### Requirement: Ground Cover is flat and cosmetic
Ground Cover SHALL be drawn on the ground, SHALL NOT block movement or line of sight, and SHALL NOT affect speed, scoring, telemetry or any simulation state.

#### Scenario: Walking over a rug
- **WHEN** the Handler or the Dog walks over a rug or path patch
- **THEN** movement, Tension Ratio and score are identical to walking over bare floor

### Requirement: Each theme has varied floors
Each theme SHALL offer at least 3 floor surfaces, and a Stage SHALL lay out at least 2 of them in patches along its Pathway, deterministically from the scenario seed. Campaign Stages MAY declare hand-placed zones.

#### Scenario: Park walk
- **WHEN** an open park Stage is built
- **THEN** its ground shows at least two surfaces (for example grass and a dirt path), placed the same way for the same seed

#### Scenario: Hallway
- **WHEN** the apartment hallway Stage is built
- **THEN** its floor shows more than a single checker pattern, including a rug patch

### Requirement: Small flat decoration
A theme SHALL offer small flat decorations (such as rugs, puddles, flower patches or painted lines) that are placed on top of floor surfaces without overlapping Obstacle footprints in a way that reads as wrong.

#### Scenario: Rug under a bench
- **WHEN** a flat decoration overlaps an Obstacle footprint
- **THEN** the footprint still blocks and the decoration is drawn beneath the prop

### Requirement: Water edge is an Obstacle
Water Ground Cover (such as a pond) SHALL surround its surface with an Obstacle ring so bodies cannot walk through it.

#### Scenario: Dog heads for the pond
- **WHEN** the Dog's movement would enter a pond
- **THEN** it is held at the pond edge

### Requirement: Ground rendering stays cheap
The ground SHALL be rendered from a baked texture per Stage, and added textures SHALL keep the embedded bundle within an agreed size budget.

#### Scenario: Large Stage
- **WHEN** a long Stage is loaded
- **THEN** the ground is drawn without one image per tile each frame
