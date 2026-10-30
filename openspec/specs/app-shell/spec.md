# app-shell Specification

## Purpose
Defines how the app starts and moves between screens: the branded Splash, routing by onboarding state, the World Map as the main screen, and one place that decides which screen shows.

## Requirements

### Requirement: Splash on launch
The system SHALL show a branded splash on every cold start, SHALL keep it up until the Dog record and display font are loaded and for a short minimum time so it does not flash, and SHALL then show the first screen the Dog's onboarding state calls for. The splash SHALL NOT accept input while it loads and SHALL NOT delay launch by more than 2.5 seconds beyond the time loading takes. For a new user the same screen stays up once loading is done, as the welcome screen.

#### Scenario: Cold start
- **WHEN** the user opens the app
- **THEN** the splash is shown until loading is done and then gives way to the next screen

#### Scenario: Slow storage
- **WHEN** loading the Dog record takes longer than the minimum splash time
- **THEN** the splash stays until it finishes and no blank or text-only loading screen appears

#### Scenario: Back from background
- **WHEN** the app returns from the background without having been closed
- **THEN** no splash is shown

#### Scenario: Reduced motion
- **WHEN** the device prefers reduced motion
- **THEN** the splash uses a plain fade and no looping animation

#### Scenario: New user
- **WHEN** loading is done and the Dog is at the first-run step
- **THEN** the splash's loader is replaced by the welcome actions on the same screen, with no second screen in between

### Requirement: Launch routing
After the splash the system SHALL route by the persisted onboarding step: to the onboarding funnel while the funnel is unfinished, to the guided first Stage when that is the next step, and otherwise to the World Map.

#### Scenario: First run
- **WHEN** a new user passes the splash
- **THEN** the welcome actions are shown on the splash screen itself

#### Scenario: Returning user
- **WHEN** a user who has finished the funnel passes the splash
- **THEN** the World Map is shown

#### Scenario: Killed mid-funnel
- **WHEN** the app is reopened during the funnel
- **THEN** the splash is followed by the funnel's next step

### Requirement: World Map is the main screen
The World Map SHALL be the main screen, SHALL be reached from Settings, Node flows, the Daily Stage, warm-up and registration by finishing or leaving them, and SHALL NOT be accompanied by a persistent tab bar. Settings SHALL remain reachable from the World Map's Settings chip.

#### Scenario: Leaving a flow
- **WHEN** the user finishes or exits a Node, the Daily Stage or the warm-up
- **THEN** the World Map is shown

#### Scenario: Settings round trip
- **WHEN** the user opens Settings from the map and closes it
- **THEN** the World Map is shown with its scroll position kept

#### Scenario: Auth from Settings
- **WHEN** the user opens log in from Settings and finishes or goes back
- **THEN** Settings is shown again

### Requirement: Single place for navigation decisions
The decision of which screen to show SHALL depend only on the loaded state, the onboarding step and the active flow, so that no combination of them shows two screens or none.

#### Scenario: Funnel wins over the map
- **WHEN** the onboarding step is inside the funnel
- **THEN** no map or Settings screen is shown, even if a flow was left active

### Requirement: Localized shell text
All splash text added by the shell SHALL come from the i18n catalog.

#### Scenario: Spanish
- **WHEN** the device language is Spanish
- **THEN** the splash tagline appears in Spanish

### Requirement: System back button follows the screen's own back
On platforms with a system back button, pressing it SHALL do exactly what the current screen's own back or close action does, so it returns to the World Map or to the screen that opened the current one. The shell SHALL handle the press and SHALL NOT leave the app unless the World Map, or an onboarding step with no previous screen, is shown. Where the current screen has no back or close action, pressing system back SHALL do nothing.

#### Scenario: Back from the Diary
- **WHEN** the user opens the Diary from the Streak chip and presses system back
- **THEN** the World Map is shown at its previous scroll position and the app stays open

#### Scenario: Back from Library, Settings or Guaudoku
- **WHEN** the user presses system back on the Theory Library, Settings or the Daily Barkdoku board opened from the map
- **THEN** the World Map is shown

#### Scenario: Back to the opener
- **WHEN** the user opens a Lesson from the Theory Library and presses system back
- **THEN** the Theory Library is shown, and pressing system back again shows the World Map

#### Scenario: Back inside a Mission
- **WHEN** the user is on a Mission's problem picker reached from its check-in and presses system back
- **THEN** the check-in screen is shown, the same as its on-screen back

#### Scenario: Back from login opened in Settings
- **WHEN** the user opens log in from Settings and presses system back
- **THEN** Settings is shown again

#### Scenario: Back on the World Map
- **WHEN** the World Map is shown with no Diary, Library, Settings or other screen open over it, including while a lock note is showing, and the user presses system back
- **THEN** the platform default applies and the app is left on the first press

#### Scenario: Back on a Node Debrief
- **WHEN** the user presses system back on a Node Debrief
- **THEN** the same happens as choosing its Done action: the Mission brief opens after the last Node of a Stretch, otherwise the World Map is shown, and the result already recorded is kept

#### Scenario: Back on a result screen
- **WHEN** the user presses system back on the Daily Stage result or a Mission passed screen
- **THEN** the World Map is shown and the result already recorded is kept

#### Scenario: Back in a Minigame with no exit
- **WHEN** the user presses system back while playing the Doorbell, harness or Poste Minigame
- **THEN** system back is consumed and the Minigame continues

#### Scenario: Back in Barkdoku
- **WHEN** the user presses system back on a Node's Barkdoku or the Daily Barkdoku board
- **THEN** the same happens as its on-screen exit, and the World Map is shown

#### Scenario: Back in the onboarding first Stage's Checkpoint or Debrief
- **WHEN** the user presses system back on the onboarding first Stage's Checkpoint or Debrief
- **THEN** system back is consumed and the screen stays

#### Scenario: Back on the taste payoff
- **WHEN** the payoff after the onboarding taste Stage is shown and the user presses system back
- **THEN** system back is consumed and the payoff stays

#### Scenario: Back while choosing a Dog
- **WHEN** the Choose Dog screen is shown after sign-in and the user presses system back
- **THEN** system back is consumed and the choice stays on screen

#### Scenario: Back on a timed Checkpoint
- **WHEN** the user presses system back on a Node's timed Checkpoint question
- **THEN** system back is consumed and the question stays on screen
