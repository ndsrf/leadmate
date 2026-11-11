## ADDED Requirements

### Requirement: System back on screens layered over the World Map
Screens that keep the World Map mounted beneath them (Settings, the Theory Library, the Diary, a Lesson, Shop) and the Plus trial modal SHALL each get their own system back behavior, and the World Map underneath SHALL NOT replace or swallow it. System back SHALL close the Plus trial modal only while that modal is open.

#### Scenario: Back from the Library, Diary or a Lesson opened from the map
- **WHEN** the user opens the Theory Library, the Diary or a Lesson from the map and presses system back
- **THEN** the screen's own back action runs, exactly as its on-screen back, whether or not the Plus trial modal was opened earlier in the session

#### Scenario: Back closes the open Plus trial modal
- **WHEN** the Plus trial modal is open over the World Map and the user presses system back
- **THEN** the modal closes and the app stays on the World Map

#### Scenario: Back on the bare World Map after a closed modal
- **WHEN** the user has opened and closed the Plus trial modal, the World Map is shown with nothing over it, and the user presses system back
- **THEN** the platform default applies and the app is left on the first press

### Requirement: Immediate back availability during active Stage loading
While an active simulation Stage is loading (`bundle === 'loading'`) or has failed to load (`bundle === 'error'`), an on-screen back control SHALL be visible immediately without waiting for the simulation bundle to initialize, and system back SHALL exit the Stage and return to the caller rather than being consumed.

#### Scenario: Cancelling a loading Stage
- **WHEN** the user starts a Stage (Node Stage, Daily walk, warm-up, taste, or first-stage) and taps the on-screen back button or presses system back while the bundle is still loading
- **THEN** loading is aborted and the app returns to the caller screen (World Map or Primer)

### Requirement: Settings Screen header close control
The Settings screen SHALL display an accessible close control in its fixed header bar in addition to the button at the bottom of the scroll view.

#### Scenario: Closing Settings from header
- **WHEN** the user is viewing the Settings screen and taps the close button in the header
- **THEN** Settings closes and the World Map is shown

### Requirement: Multi-step onboarding funnel system back
When viewing an onboarding funnel step with multiple sub-parts (Dog Look screen's name prompt, Setup screen's weights or about steps), pressing system back SHALL navigate to the previous sub-part matching the on-screen back action.

#### Scenario: Stepping back in Dog Look
- **WHEN** the user is on the dog name sub-part of DogLookScreen and presses system back
- **THEN** the view returns to the breed and coat selection sub-part
