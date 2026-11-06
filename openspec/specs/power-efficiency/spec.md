# power-efficiency Specification

## Purpose
Keeps the app's CPU, GPU and battery use low so that a play session does not heat the phone or drain the battery, and so that nothing runs when the user is not looking at the game.

## Requirements

### Requirement: No rendering when not visible
The system SHALL NOT run the render loop while the app is in the background, the screen is off, or the Stage is not on screen.

#### Scenario: Screen turned off during a Stage
- **WHEN** the user turns the screen off or switches to another app during a Stage
- **THEN** the Stage pauses and rendering stops, with no frames drawn until the app is foregrounded

#### Scenario: Browser tab hidden
- **WHEN** the standalone simulation page's tab is hidden
- **THEN** rendering stops until the tab is visible again

#### Scenario: Shell screen in front
- **WHEN** a screen other than a playing Stage is shown (World Map, Settings, Debrief)
- **THEN** the simulation bundle draws no frames

### Requirement: No rendering while paused or ended
The system SHALL stop drawing frames while a Stage is paused or after it ended, and SHALL draw once more when the visible state changes (pause card, results, resize).

#### Scenario: Paused Stage
- **WHEN** the user pauses a Stage
- **THEN** after the pause is shown, frames are no longer drawn until the user resumes

#### Scenario: Resume
- **WHEN** the user resumes a paused Stage
- **THEN** drawing restarts at once, no Stage time has elapsed meanwhile, and the Dog does not jump

### Requirement: Bounded frame rate
The system SHALL draw at most 30 frames per second during play, whatever the display's refresh rate, while the simulation keeps stepping at its fixed rate.

#### Scenario: High-refresh display
- **WHEN** a Stage runs on a 120 Hz display
- **THEN** no more than 30 frames per second are drawn and the simulation advances at the same pace and with the same outcomes as on a 60 Hz display

### Requirement: Bounded resolution and cheap rendering
The system SHALL limit the render resolution on high-density screens, disable antialiasing and request low-power GPU mode, so the cost of each frame stays bounded.

#### Scenario: Dense screen
- **WHEN** the device pixel ratio is above the limit
- **THEN** the Stage renders at the limit and fills the screen, and the HUD stays readable and touch targets stay aligned

### Requirement: Idle frames are cheap
The system SHALL NOT redo work for parts of a frame that did not change.

#### Scenario: Unchanged HUD
- **WHEN** nothing in the HUD changed since the last frame
- **THEN** the HUD is not redrawn and its labels are not re-laid out

#### Scenario: Camera already in place
- **WHEN** the camera target and zoom did not change since the last frame
- **THEN** the camera is not updated again

### Requirement: Shell does no background work
The system SHALL stop shell timers and repeating animations that belong to a screen when that screen is not visible, is covered by another screen, or the app is in the background, and SHALL NOT re-render React on every tick of a minigame or countdown timer.

#### Scenario: App backgrounded on the World Map
- **WHEN** the app goes to the background while the World Map is shown
- **THEN** its repeating animation stops and restarts when the app returns

#### Scenario: World Map covered by another screen
- **WHEN** Settings, the Library or a Lesson is shown over the World Map
- **THEN** the World Map's repeating animation stops, and restarts when the World Map is in front again

#### Scenario: App backgrounded during a minigame
- **WHEN** the app goes to the background during a minigame
- **THEN** its timer and its looping Dog and bell animations stop, and continue when the app returns

#### Scenario: App backgrounded on the splash or welcome screen
- **WHEN** the app goes to the background while the splash loader is animating
- **THEN** the loader animation stops and restarts when the app returns

#### Scenario: Minigame running
- **WHEN** a minigame timer ticks
- **THEN** React state is only updated for discrete changes, not for every tick

#### Scenario: Checkpoint countdown
- **WHEN** the Checkpoint countdown is running
- **THEN** its number changes once per whole second, its bar moves smoothly, and the screen re-renders at most once per second

### Requirement: Power cost is measurable
The system SHALL offer a development-only readout of frames drawn and simulation steps per second and the time spent per frame, and SHALL have an automated check that a paused or hidden Stage draws no frames.

#### Scenario: Regression check
- **WHEN** the automated check pauses the Stage and waits
- **THEN** it fails if any frame is drawn

### Requirement: Bounded loop wakeups during play
The system SHALL wake the Stage's game loop at most about as often as it draws (about 30 times a second) during play, on any display refresh rate, instead of waking at the display rate and skipping frames.

#### Scenario: 120 Hz Android phone
- **WHEN** a Stage runs on a 120 Hz display
- **THEN** the dev readout shows about 30 loop wakeups and at most 30 frames drawn per second, and the simulation's steps per second and outcomes match a 60 Hz display

#### Scenario: Pacing fallback
- **WHEN** timer-paced frames show visible judder on a device
- **THEN** a single build setting returns to display-paced frames without other code changes, and a dev URL option switches pacing for a side-by-side check without rebuilding the bundle

### Requirement: No idle audio engine in the Stage
The Stage bundle SHALL NOT create or keep an audio engine running, because all game sound is played by the shell.

#### Scenario: Stage played with touch
- **WHEN** a Stage is started and the user touches the screen
- **THEN** no web audio context exists in the Stage bundle, and Cue and Dog sounds still play through the shell

### Requirement: Static scenery costs nothing per frame
The system SHALL draw the Stage scenery that does not change during a Stage (walls, shape-drawn props, prop shadows, route markers between route changes) without rebuilding its geometry each frame, with the same look and the same depth sorting against the Dog and Handler.

#### Scenario: Walking past a wall
- **WHEN** the Handler walks behind a wall piece
- **THEN** the piece fades and sorts in front exactly as before, and the per-frame CPU time does not grow with the number of wall pieces and shape props

#### Scenario: Route progress
- **WHEN** the Handler reaches the next route point
- **THEN** the passed marker changes colour on that frame, and route markers are not rebuilt on frames where the route index did not change

### Requirement: HUD redraws only on visible change
The system SHALL redraw the Stage HUD only when something it shows changes by a visible amount, including countdown rings.

#### Scenario: Go Sniff on offer
- **WHEN** the Go Sniff button is on offer and nothing else in the HUD changes
- **THEN** the HUD is redrawn only when the countdown ring moves by a visible step, not on every frame

### Requirement: No background timers, network or media
The system SHALL NOT run network refresh timers or play embedded media while the app is in the background.

#### Scenario: Signed-in user backgrounds the app
- **WHEN** a signed-in user puts the iOS or Android app in the background
- **THEN** the account token auto-refresh stops, and starts again (with a refresh if due) when the app returns

#### Scenario: Lesson video playing when backgrounded
- **WHEN** a lesson video or an in-app browser page is playing media and the app goes to the background
- **THEN** the media stops on both iOS and Android, keeps its playback position, and does not resume until the user plays it again

#### Scenario: Media inside a cross-origin frame
- **WHEN** an in-app browser page plays media inside a cross-origin frame and the app goes to the background
- **THEN** that media is not guaranteed to stop on Android; pages we host do not embed media that way

### Requirement: Power savings verified on both platforms
Every power change SHALL be checked on at least one real iPhone and one real Android phone with a high-refresh display, and the results recorded with the change, with pass or fail against the energy budget.

#### Scenario: Device check
- **WHEN** a power change is ready to merge
- **THEN** the recorded results show loop wakeups/s, frames/s and ms/frame while playing, zero frames and zero running animations on the World Map, paused and backgrounded, and the energy measure for both platforms compared with the baseline and the budget, and the change is not merged without them or if it is over budget

#### Scenario: Battery measurement protocol
- **WHEN** energy is measured for a power change
- **THEN** the before and after runs use the same device with fixed brightness (50%, auto-brightness off) and no other apps running, and each covers 10 minutes of continuous play on one fixed-seed Stage on the densest scenery theme (restarted when it ends), 10 minutes of the hand drill, and 10 minutes idle on the World Map, each compared with the same device's reference screen

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
The system SHALL offer a development-only readout covering the shell, the in-WebView DOM views and the Stage bundle: live looping animations, active timers, running CSS animations, DOM view renders per second, loop wakeups, frames and simulation steps, plus the current screen and app state. It SHALL NOT collect or send field telemetry.

#### Scenario: Readout on a resting screen
- **WHEN** a resting shell screen is shown
- **THEN** the readout shows zero frames, zero loop wakeups, zero running animations and no repeating timers

#### Scenario: No production collection
- **WHEN** a production build runs
- **THEN** no performance data is collected or uploaded

### Requirement: Readout panel is opt-in
The shell's on-screen readout panel SHALL be hidden by default and shown only when `EXPO_PUBLIC_DEV_PERF_OVERLAY=1` is set at bundle time. The counters SHALL keep running in development either way so scripted checks can read them, and the panel SHALL NOT run a loop or timer of its own.

#### Scenario: Panel hidden by default
- **WHEN** a development build starts without `EXPO_PUBLIC_DEV_PERF_OVERLAY=1`
- **THEN** no readout panel is drawn, and the counters are still readable by scripted checks

#### Scenario: Panel adds no activity
- **WHEN** the panel is shown on a resting screen
- **THEN** it adds no animation frame callback or repeating timer of its own

### Requirement: Scenario regression check
The system SHALL have an automated scenario check that walks the World Map, Barkdoku, the hand drill and a Stage for fixed durations and fails if the activity counters exceed the budgeted values for the scenario, including a paused, covered, backgrounded or ended state of each.

#### Scenario: Paused hand drill
- **WHEN** the check pauses the hand drill and waits
- **THEN** it fails if any frame is drawn, any DOM view render happens or any CSS or SVG animation is still running

#### Scenario: Resting screens
- **WHEN** the check waits on the World Map and on Barkdoku
- **THEN** it fails if any looping animation or repeating timer is active, except the visible Barkdoku puzzle clock while a started puzzle is in front

#### Scenario: Visible puzzle clock
- **WHEN** a Barkdoku puzzle has started and is in front of the app
- **THEN** its clock may tick at most twice a second, and stops when the puzzle is backgrounded, paused or finished

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
