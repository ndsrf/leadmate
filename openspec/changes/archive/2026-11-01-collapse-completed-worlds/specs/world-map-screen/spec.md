## ADDED Requirements

### Requirement: Completed Worlds collapse
The system SHALL show an unlocked Completed World as a compact header row with a completed mark, its title, its Stop count and topic summary, and no trail, Stops or Trail Scenery. Tapping the header SHALL toggle its full trail inline. Completed Worlds SHALL start collapsed in each app session, and a toggle SHALL hold for the rest of the session.

#### Scenario: Completed World collapsed by default
- **WHEN** the World Map opens in a new app session and World 1 has all 8 of its Stops done and no Owed Mission
- **THEN** World 1 is a single header row showing its title, "8 de 8 paradas", its topic summary and a completed mark, with no Stops and no Trail Scenery drawn

#### Scenario: Tapping the name expands
- **WHEN** the user taps the header of a collapsed Completed World
- **THEN** its full trail is shown inline with its Stops, star ratings and Trail Scenery, and its completed Stops can be opened as before

#### Scenario: Tapping the name again collapses
- **WHEN** the user taps the header of an expanded Completed World
- **THEN** it returns to the compact header row

#### Scenario: Choice kept while visiting a Stop
- **WHEN** the user expands a Completed World, opens one of its Stops and returns to the World Map
- **THEN** that World is still expanded and the map is at the same scroll position

#### Scenario: New session collapses again
- **WHEN** the user expanded a Completed World and later relaunches the app
- **THEN** that World is collapsed again on the World Map

#### Scenario: World finished during the session
- **WHEN** the user completes the last Stop of a World and returns to the World Map
- **THEN** that World is shown collapsed and the map scrolls to the new next-up Stop

#### Scenario: Owed Mission keeps the World open
- **WHEN** every Stop of a World is done except one Owed Mission
- **THEN** the World is not collapsed and its "Cerrar el mundo" panel is shown

#### Scenario: Completed Plus World after Plus lapses
- **WHEN** a Plus World is a Completed World and the user's Plus membership has ended
- **THEN** it is shown as a locked World, not with the completed row

#### Scenario: In-progress World not collapsible
- **WHEN** the user taps the header of the World holding the next-up Stop
- **THEN** the World stays expanded

#### Scenario: Screen reader on a collapsed World
- **WHEN** a screen reader focuses the header of a Completed World
- **THEN** it is announced as a button with the World title, that the World is completed, and whether activating it shows or hides its Stops
