## ADDED Requirements

### Requirement: Energy budget
The system SHALL stay within an energy budget measured against a static reference screen (display on, fixed brightness, no app work) over 10 minutes on a production-like build: idle shell screens add no measurable energy, and a simulator session (Stage or hand drill) adds at most 2% of battery capacity.

#### Scenario: Idle shell screen
- **WHEN** the World Map, Barkdoku, Settings or another resting shell screen is shown for 10 minutes
- **THEN** the measured energy is no more than 0.3% of battery capacity above the reference screen

#### Scenario: Simulator session
- **WHEN** a Stage or the hand drill is played for 10 minutes
- **THEN** the measured energy is no more than 2% of battery capacity above the reference screen

#### Scenario: Budget judged on energy
- **WHEN** a device run is recorded
- **THEN** pass or fail uses the platform's energy measure (milliamp-hours on Android, Energy Impact on iPhone), and battery percent is kept only as a sanity check

### Requirement: Whole-app activity readout
The system SHALL offer a development-only readout covering the shell, the in-WebView DOM views and the Stage bundle: shell JS-thread rate, live looping animations, active timers, running CSS animations, DOM view renders per second, loop wakeups, frames and simulation steps, plus the current screen and app state. It SHALL NOT collect or send field telemetry.

#### Scenario: Readout on a resting screen
- **WHEN** a resting shell screen is shown
- **THEN** the readout shows zero frames, zero loop wakeups, zero running animations and no repeating timers

#### Scenario: No production collection
- **WHEN** a production build runs
- **THEN** no performance data is collected or uploaded

### Requirement: Scenario regression check
The system SHALL have an automated scenario check that walks the World Map, Barkdoku, the hand drill and a Stage for fixed durations and fails if the activity counters exceed the budgeted values for the scenario, including a paused, covered, backgrounded or ended state of each.

#### Scenario: Paused hand drill
- **WHEN** the check pauses the hand drill and waits
- **THEN** it fails if any frame is drawn, any DOM view render happens or any CSS or SVG animation is still running

#### Scenario: Resting screens
- **WHEN** the check waits on the World Map and on Barkdoku
- **THEN** it fails if any looping animation or repeating timer is active

### Requirement: No endless animation on a resting view
The system SHALL NOT run an endless animation, in the shell or in a DOM view inside the Stage bundle, while its view is resting, paused, ended, covered by another screen, behind a card that stops the clock, or the app is in the background. Bounded animations that settle are allowed.

#### Scenario: Hand drill paused
- **WHEN** the user pauses the hand drill
- **THEN** the tempting-hand, Dog and button animations stop, and resume when the drill resumes

#### Scenario: How-to-play card open
- **WHEN** the hand drill's how-to-play card is shown
- **THEN** no animation behind the card runs and the Stage loop is asleep, until the user starts the drill

#### Scenario: Minigame idle in front
- **WHEN** a minigame Dog or prop is in a posture that does not need motion
- **THEN** no endless animation runs for it

#### Scenario: New endless animation
- **WHEN** a change adds an endless animation outside the reviewed allow-list
- **THEN** an automated test fails

### Requirement: DOM animation respects the frame cap
The system SHALL NOT animate Stage-bundle DOM or SVG views at the display's refresh rate while play is bounded to 30 frames per second; motion in such a view is either driven at the capped rate or limited to properties the browser animates without repainting.

#### Scenario: High-refresh display in the hand drill
- **WHEN** the hand drill runs on a 120 Hz display
- **THEN** the view repaints no more than about 30 times a second

### Requirement: Close view does no idle work
The system SHALL NOT draw an empty Stage canvas for the hand drill, SHALL NOT re-query or rewrite unchanged view elements on each frame, and SHALL sleep the loop while the drill is paused, ended or showing its how-to-play card.

#### Scenario: Drill running
- **WHEN** the hand drill is played
- **THEN** only elements whose shown value changed are written on a frame, and no canvas frame is drawn for a world that is not built

#### Scenario: Result hold
- **WHEN** the drill ends in a calm result
- **THEN** the last frame and the reward show for their moment, then the loop sleeps and nothing repeats

### Requirement: Ads and media cost nothing at rest
The system SHALL NOT load, refresh or animate an ad on a resting shell screen with no ad slot in view, SHALL NOT run ad refresh timers in the background, and SHALL NOT autoplay Lesson video.

#### Scenario: Screen with no ad slot
- **WHEN** a screen without an ad slot is shown
- **THEN** no ad request, refresh timer or ad animation is active

#### Scenario: App backgrounded with an ad shown
- **WHEN** the app goes to the background with an ad on screen
- **THEN** ad refresh and animation stop until the app returns

## MODIFIED Requirements

### Requirement: Power savings verified on both platforms
Every power change SHALL be checked on at least one real iPhone and one real Android phone with a high-refresh display, and the results recorded with the change, with pass or fail against the energy budget.

#### Scenario: Device check
- **WHEN** a power change is ready to merge
- **THEN** the recorded results show loop wakeups/s, frames/s and ms/frame while playing, zero frames and zero running animations on the World Map, paused and backgrounded, and the energy measure for both platforms compared with the baseline and the budget, and the change is not merged without them or if it is over budget

#### Scenario: Battery measurement protocol
- **WHEN** energy is measured for a power change
- **THEN** the before and after runs use the same device with fixed brightness (50%, auto-brightness off) and no other apps running, and each covers 10 minutes of continuous play on one fixed-seed Stage on the densest scenery theme (restarted when it ends), 10 minutes of the hand drill, and 10 minutes idle on the World Map, each compared with the same device's reference screen
