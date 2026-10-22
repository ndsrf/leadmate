## MODIFIED Requirements

### Requirement: One shared visual identity
The system SHALL draw every shell screen, overlay and the Stage HUD from one shared set of colour, typography, radius, depth and spacing values, so no screen uses a colour or text style outside that set. The identity SHALL be light-first (warm paper background, near-black ink outlines of 2.5 points, solid offset shadows instead of blurred ones, rounded corners, Fredoka display type over the system body font) and SHALL define a night variant of the same tokens that is not yet selectable.

#### Scenario: Shell and HUD agree
- **WHEN** a shell button and a Stage HUD button of the same role (primary action) are shown
- **THEN** they use the same fill colour, corner radius, depth and label style

#### Scenario: Single point of change
- **WHEN** a shared colour value is changed
- **THEN** it changes in the shell and in the Stage HUD without editing individual screens

#### Scenario: Night tokens defined
- **WHEN** the night token set is read
- **THEN** every token the light set defines has a night value and each text/background pair meets 4.5:1

### Requirement: Game-style components
The system SHALL provide buttons with a raised, pressable look (an ink outline with a solid offset shadow and a visible pressed state), panels, progress bars, badges and chips, and every shell screen SHALL use them in place of one-off styles.

#### Scenario: Pressed state
- **WHEN** the user presses a primary button
- **THEN** the button visibly sinks toward its shadow (offset reduced, face moved) and returns when released

#### Scenario: Disabled state
- **WHEN** a button is disabled
- **THEN** it is shown desaturated with its disabled text colour, loses its offset shadow, does not react to presses and does not play press feedback

#### Scenario: Keyboard focus
- **WHEN** a control receives keyboard or switch focus
- **THEN** a 3-point focus ring offset 3 points from the control is visible

## ADDED Requirements

### Requirement: Display typeface
The system SHALL use Fredoka (semi-bold) for titles, buttons, numbers and chip labels, SHALL fall back to the system font until it has loaded, and SHALL NOT load any other display face.

#### Scenario: Font not yet loaded
- **WHEN** a screen is drawn before Fredoka has loaded
- **THEN** the text shows in the system font with no overlap and no layout break

### Requirement: Designed identity assets
The system SHALL ship an app icon and a splash image that follow the design (the dog's head with collar and leash, safe within the central 66 percent for round masks) and SHALL use the page background colour for the native splash so there is no colour flash at launch.

#### Scenario: Round icon mask
- **WHEN** the Android round mask is applied
- **THEN** no part of the icon's ear or tag is clipped

#### Scenario: Launch colour
- **WHEN** the app launches
- **THEN** the native splash background matches the first in-app screen's background
