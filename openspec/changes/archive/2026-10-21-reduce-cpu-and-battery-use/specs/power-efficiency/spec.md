# Spec Delta

## Purpose

Keeps the app's CPU, GPU and battery use low so that a play session does not heat the phone or drain the battery, and so that nothing runs when the user is not looking at the game.

## ADDED Requirements

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
The system SHALL stop shell timers and repeating animations that belong to a screen when that screen is not visible or the app is in the background, and SHALL NOT re-render React on every tick of a minigame timer.

#### Scenario: App backgrounded on the World Map
- **WHEN** the app goes to the background while the World Map is shown
- **THEN** its repeating animation stops and restarts when the app returns

#### Scenario: App backgrounded during a minigame
- **WHEN** the app goes to the background during a minigame
- **THEN** its timer stops and continues when the app returns

#### Scenario: Minigame running
- **WHEN** a minigame timer ticks
- **THEN** React state is only updated for discrete changes, not for every tick

### Requirement: Power cost is measurable
The system SHALL offer a development-only readout of frames drawn and simulation steps per second and the time spent per frame, and SHALL have an automated check that a paused or hidden Stage draws no frames.

#### Scenario: Regression check
- **WHEN** the automated check pauses the Stage and waits
- **THEN** it fails if any frame is drawn
