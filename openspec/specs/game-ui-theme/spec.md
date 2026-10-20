# game-ui-theme Specification

## Purpose
Gives the shell screens and the Stage HUD one shared visual identity and a small set of game-style components, so every screen reads as part of the same game and stays usable and legible.

## Requirements
### Requirement: One shared visual identity
The system SHALL draw every shell screen, overlay and the Stage HUD from one shared set of colour, typography, radius, depth and spacing values, so no screen uses a colour or text style outside that set.

#### Scenario: Shell and HUD agree
- **WHEN** a shell button and a Stage HUD button of the same role (primary action) are shown
- **THEN** they use the same fill colour, corner radius, depth and label style

#### Scenario: Single point of change
- **WHEN** a shared colour value is changed
- **THEN** it changes in the shell and in the Stage HUD without editing individual screens

### Requirement: Game-style components
The system SHALL provide buttons with a raised, pressable look (a visible pressed state), panels, progress bars, badges and chips, and every shell screen SHALL use them in place of one-off styles.

#### Scenario: Pressed state
- **WHEN** the user presses a primary button
- **THEN** the button visibly sinks and returns when released

#### Scenario: Disabled state
- **WHEN** a button is disabled
- **THEN** it is shown desaturated, does not react to presses and does not play press feedback

### Requirement: Readable and reachable
The system SHALL keep text at a contrast ratio of at least 4.5:1 against its background, SHALL give every interactive element a touch target of at least 44 by 44 points, and SHALL NOT rely on colour alone to show a state.

#### Scenario: Locked Node
- **WHEN** a Node is locked
- **THEN** it shows a lock icon and a text reason in addition to its muted colour

#### Scenario: Small control
- **WHEN** an icon-only control is drawn smaller than 44 points
- **THEN** its touchable area is still at least 44 by 44 points

### Requirement: Text from the catalog and tolerant of length
The system SHALL take every new user-facing string from the text catalog with the Spanish fallback, and SHALL lay out buttons, chips and titles so a longer translation wraps or shrinks instead of being clipped or overlapping.

#### Scenario: Missing translation
- **WHEN** a new string has no entry in the selected language
- **THEN** the Spanish text is shown

#### Scenario: Long label
- **WHEN** a button label is 40 percent longer than its Spanish text
- **THEN** the whole label is still visible and no other element is covered

### Requirement: Consistent on every screen size
The system SHALL keep screens usable from a 320-point-wide phone in portrait up to a wide desktop browser, with content in a readable column and safe-area insets respected.

#### Scenario: Narrow phone
- **WHEN** a screen is shown at 320 points wide
- **THEN** nothing is clipped and no horizontal scrolling is needed

#### Scenario: Notched phone
- **WHEN** the device has a notch or a home indicator
- **THEN** controls are not drawn beneath it
