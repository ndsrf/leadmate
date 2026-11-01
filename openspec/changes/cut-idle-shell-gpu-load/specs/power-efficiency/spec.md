## ADDED Requirements

### Requirement: Stage view not alive behind shell screens
The system SHALL keep the Stage view (the embedded simulation bundle) unmounted whenever the player is on a shell screen that is not preparing or running a Stage, so it uses no CPU, GPU or memory there.

#### Scenario: World Map or Barkdoku open
- **WHEN** the World Map, a minigame such as Barkdoku, Settings or the Library is the current screen and no Stage is starting
- **THEN** no Stage view exists behind it

#### Scenario: Starting a Stage from the map
- **WHEN** the player opens a Node that starts a Stage
- **THEN** the Stage view is created, the loading overlay shows until it is ready, and the Stage starts with the requested seed and scenario without the player repeating any action

#### Scenario: Created ahead of the Stage
- **WHEN** the player enters a Node flow that contains a Stage
- **THEN** the Stage view is created during the Primer or Checkpoint step, so it is usually ready when the Stage begins

#### Scenario: Minigame Nodes
- **WHEN** the player opens a Node whose simulation is a Minigame, including one that also carries a scenario
- **THEN** no Stage view is created

#### Scenario: Backing out before play
- **WHEN** the player leaves a Stage Node's flow before the Stage starts
- **THEN** the Stage view is released and no queued start remains

#### Scenario: Load failure before play
- **WHEN** the Stage view fails to become ready while the player is still on the Primer or Checkpoint
- **THEN** it is remounted once silently, and the error and retry screen shows only if it is still not ready when the Stage must start

#### Scenario: Leaving a Stage
- **WHEN** a Stage ends or the player quits it
- **THEN** the Stage view is released at once, including during the Debrief, and Play again or a retry starts from a fresh view

#### Scenario: Load failure still reported
- **WHEN** the Stage view is created and never reports ready within the load timeout
- **THEN** the existing load-error state and retry are shown, and no load timeout runs while the Stage view does not exist

### Requirement: Looping animations come to rest
The system SHALL NOT run any shell animation on a resting screen indefinitely; attention-drawing loops SHALL run for a bounded number of cycles and then hold a static state.

#### Scenario: World Map Next Up ring
- **WHEN** the World Map is shown with a Next Up node
- **THEN** the ring pulses for 4 cycles and then stays as a static ring with no animation running

#### Scenario: Next Up node changes
- **WHEN** the Next Up node changes, or the map returns to the front or the app returns to the foreground
- **THEN** the pulse plays its bounded cycles again on the new or revisited ring

#### Scenario: Reduced motion
- **WHEN** reduced motion is on
- **THEN** the ring is static from the start, as before

### Requirement: Idle screens verified near idle
The system SHALL show no sustained UI-thread or CPU activity on the World Map and in Barkdoku while nothing on them changes, and no noticeable warming over a 15-minute session at fixed brightness, in a production-like build.

#### Scenario: Static World Map
- **WHEN** the World Map has rested past its bounded pulse in a production-like build
- **THEN** the UI-thread frame rate reads near idle

#### Scenario: Development build reads higher
- **WHEN** Expo Go's development mode still reads high while the production-like build reads idle
- **THEN** the result is reported separately and the check passes

### Requirement: Power checks use a production-like build
The system SHALL record power and frame-rate measurements for shell screens from a build with development mode off (or record both dev and production-like numbers), because Expo Go's development build alone overstates cost.

#### Scenario: Baseline and after numbers
- **WHEN** a change aims to reduce shell power use
- **THEN** the recorded results give frame rate and thermal or battery readings for the World Map and Barkdoku, before and after, for both a development and a production-like build

#### Scenario: Display power separated
- **WHEN** shell power readings are recorded
- **THEN** brightness is fixed (50%, auto-brightness off) and the results include one run with the Dark appearance, so display power is distinguishable from app load

### Requirement: Long World Map stays cheap to scroll
The system SHALL keep the World Map's cost bounded as worlds and nodes are added, so scrolling stays smooth and a resting map does no work, without changing what the map shows.

#### Scenario: Scrolling a long map
- **WHEN** the player scrolls the World Map with many worlds expanded
- **THEN** scrolling stays smooth on the reference phones, and the map's content and scroll position behave as before

#### Scenario: Resting map
- **WHEN** the World Map is not being scrolled and nothing on it changes
- **THEN** it triggers no re-renders or layout work
