## ADDED Requirements

### Requirement: Obstacles block the Handler and the Dog
Every prop type SHALL declare whether it is an Obstacle and, if so, a collision footprint (disc radius, or a segment for long props). The Handler and the Dog SHALL NOT enter an Obstacle footprint; when a move would enter it they are pushed out to its edge while movement along the edge is preserved (sliding).

#### Scenario: Handler walks into a bench
- **WHEN** the Handler moves directly toward an Obstacle bench
- **THEN** the Handler stops at the footprint edge and does not pass through, and moving sideways slides along it

#### Scenario: Dog is pulled toward a tree
- **WHEN** the Dog's Drive or Rigid Pull would carry it through an Obstacle tree
- **THEN** the Dog is held at the footprint edge

#### Scenario: Walkable props do not block
- **WHEN** the Handler walks over a prop classified as walkable (such as a floor mat)
- **THEN** movement is unaffected

### Requirement: The leash wraps around Obstacles
A Obstacle SHALL obstruct the leash like a Boundary: the leash path between Handler and Dog goes around the prop's footprint when it lies between them, and the Tension Ratio uses the wrapped length.

#### Scenario: Dog circles a lamp post
- **WHEN** the Dog walks around a lamp post so the straight line crosses its footprint
- **THEN** the leash length measured is the path around the footprint, longer than the straight distance

### Requirement: Scenery is dense and varied
An outdoor walking scenario SHALL have at least one prop per 3 m of route and at least 12 props. An indoor scenario SHALL have at least 8 props, scaled by floor area instead of route length, and SHALL use hand-placed set pieces along its walls rather than scatter alone. Every scenario SHALL use at least 6 distinct prop types of its theme, and each theme SHALL offer at least 12 prop types. Main Stages SHALL include hand-placed set pieces in addition to seeded scatter.

#### Scenario: Short route
- **WHEN** a scenario has a 10 m route
- **THEN** validation requires at least 12 props

#### Scenario: Short indoor hallway
- **WHEN** an indoor scenario has a narrow 14 m hallway
- **THEN** it needs at least 8 props, placed as set pieces, and the corridor stays at least 1.2 m clear

#### Scenario: Low variety
- **WHEN** a scenario uses fewer than 6 distinct prop types
- **THEN** validation reports it

### Requirement: Props never make a Stage unwinnable
Obstacle footprints SHALL NOT overlap each other, a Boundary, the Handler's start or the Dog's start, and SHALL leave a clear corridor along the route at least 1.2 m wide. Scenario validation SHALL reject a scenario in which that corridor is blocked.

#### Scenario: Scatter respects the corridor
- **WHEN** scenery is scattered for any seed
- **THEN** no solid footprint intrudes on the route corridor

#### Scenario: Hand-placed prop blocks the route
- **WHEN** a scenario places a Obstacle on its route
- **THEN** validation reports the blocked leg

### Requirement: Collision stays deterministic and cheap
Prop collision SHALL depend only on the scenario's scenery set and positions, SHALL not use randomness at run time, and SHALL only test the solids near a body.

#### Scenario: Same seed, same run
- **WHEN** the same scenario, seed and input are simulated twice
- **THEN** the Handler and Dog positions are identical

### Requirement: Obstacles do not block sight or affect score
An Obstacle SHALL block line of sight only when it is also marked as a Visual Shield. Bumping into an Obstacle SHALL NOT change any score and SHALL NOT emit a telemetry event.

#### Scenario: Bench between Dog and Distractor
- **WHEN** an Obstacle that is not a Visual Shield lies between the Dog and a Distractor
- **THEN** the Dog still sees the Distractor

#### Scenario: Handler blocked by a bench
- **WHEN** the Handler is stopped by an Obstacle
- **THEN** no penalty is applied and no telemetry event is emitted
