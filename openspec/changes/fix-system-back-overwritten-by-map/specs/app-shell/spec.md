## ADDED Requirements

### Requirement: System back on screens layered over the World Map
Screens that keep the World Map mounted beneath them (Settings, the Theory Library, the Diary, a Lesson) and the Plus trial modal SHALL each get their own system back behavior, and the World Map underneath SHALL NOT replace or swallow it. System back SHALL close the Plus trial modal only while that modal is open.

#### Scenario: Back from the Library, Diary or a Lesson opened from the map
- **WHEN** the user opens the Theory Library, the Diary or a Lesson from the map and presses system back
- **THEN** the screen's own back action runs, exactly as its on-screen back, whether or not the Plus trial modal was opened earlier in the session

#### Scenario: Back closes the open Plus trial modal
- **WHEN** the Plus trial modal is open over the World Map and the user presses system back
- **THEN** the modal closes and the app stays on the World Map

#### Scenario: Back on the bare World Map after a closed modal
- **WHEN** the user has opened and closed the Plus trial modal, the World Map is shown with nothing over it, and the user presses system back
- **THEN** the platform default applies and the app is left on the first press
