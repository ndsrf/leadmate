# Spec Delta

## MODIFIED Requirements

### Requirement: Map of Worlds and Nodes
The system SHALL show the World Map as a continuous winding trail traversing titled World regions, rendering active worlds with visible Stops along the path, the immediately next locked world with an unlock requirement banner, and subsequent locked worlds as compact collapsible headers. Every collapsible world header SHALL provide visible chevrons (▼ to expand, ▲ to collapse) indicating its state and SHALL toggle expansion when activated.

#### Scenario: Worlds listed
- **WHEN** the World Map is shown
- **THEN** every World appears in order with its title, its completed-over-total Stop count ("X de Y paradas"), and its thematic topic summary

#### Scenario: Locked World
- **WHEN** a World is not yet unlocked
- **THEN** it appears with its unlock requirement and its Stops are not openable

#### Scenario: Active World path connectors
- **WHEN** an active or unlocked World is displayed
- **THEN** completed Stop segments connect via solid ink-outlined paths and upcoming or locked segments connect via dashed dotted trails

#### Scenario: Next locked World banner
- **WHEN** a World is the first locked World in sequence
- **THEN** it displays an unlock requirement banner above its path naming the preceding World and its final missing Stop

#### Scenario: Subsequent locked Worlds collapsed
- **WHEN** a World follows an already-locked World
- **THEN** it is displayed as a compact collapsible header row with a lock icon, and tapping the header toggles inline expansion of its trail

#### Scenario: Expanded locked or Coming-soon World shows collapse chevron
- **WHEN** a locked World or Coming-soon World is expanded
- **THEN** its header row displays an upward chevron ("▲") and activating the header collapses it back to its compact header row

#### Scenario: Screen reader on expanded locked World
- **WHEN** a screen reader focuses the header of an expanded locked or Coming-soon World
- **THEN** it is announced as a button with the World title and that activating it collapses the preview ("Cerrar adelanto"), with expanded state true

#### Scenario: Plus badge tap target on header
- **WHEN** the user taps the Plus badge on an expanded or collapsed Plus-tier World header
- **THEN** the Paywall opens and the World header does not toggle its expansion state

#### Scenario: Expanded locked World choice kept while visiting a Stop or Paywall
- **WHEN** the user expands a locked or Coming-soon World, visits a Stop, the Paywall, or Settings and returns to the World Map
- **THEN** that World is still expanded and the map is at the same scroll position

#### Scenario: Long World
- **WHEN** a World holds twelve or more Stops
- **THEN** every Stop is drawn on the trail without overlap and the map scrolls vertically only
