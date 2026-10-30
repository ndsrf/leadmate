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
Every power change SHALL be checked on at least one real iPhone and one real Android phone with a high-refresh display, and the results recorded with the change.

#### Scenario: Device check
- **WHEN** a power change is ready to merge
- **THEN** the recorded results show loop wakeups/s, frames/s and ms/frame while playing, zero frames on the World Map, paused and backgrounded, and battery drop or energy impact for both platforms, compared with the baseline, and the change is not merged without them

#### Scenario: Battery measurement protocol
- **WHEN** battery drop is measured for a power change
- **THEN** the before and after runs use the same device with fixed brightness (50%, auto-brightness off) and no other apps running, and each covers 15 minutes of continuous play on one fixed-seed Stage on the densest scenery theme (restarted when it ends) plus 15 minutes idle on the World Map
