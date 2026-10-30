# game-ui-theme Specification

## Purpose
Gives the shell screens and the Stage HUD one shared visual identity and a small set of game-style components, so every screen reads as part of the same game and stays usable and legible.

## Requirements

### Requirement: One shared visual identity
The system SHALL draw every shell screen, overlay and the Stage HUD from one shared set of colour, typography, radius, depth and spacing values, so no screen uses a colour or text style outside that set. The identity SHALL be light-first (warm paper background, near-black ink outlines of 2.5 points, solid offset shadows instead of blurred ones, rounded corners, Fredoka display type over the system body font) and SHALL define a complete Dark palette of the same colour tokens that the user can select through Appearance.

#### Scenario: Shell and HUD agree
- **WHEN** a shell button and a Stage HUD button of the same role (primary action) are shown in the light appearance
- **THEN** they use the same fill colour, corner radius, depth and label style

#### Scenario: Single point of change
- **WHEN** a shared colour value is changed
- **THEN** it changes in the shell and in the Stage HUD without editing individual screens

#### Scenario: Night tokens defined
- **WHEN** the Dark palette is read
- **THEN** every colour token the Light palette defines has a Dark value, and every text/background pair the kit draws meets the same contrast minimum in the Dark palette as in the Light palette

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

### Requirement: Appearance choice in Settings
The system SHALL offer an Appearance setting in Settings with the choices System, Light and Dark, defaulting to System. The choice SHALL be stored on this device only, SHALL be remembered across restarts and SHALL NOT be part of the synced Dog record.

#### Scenario: Default follows the phone
- **WHEN** the user has never changed Appearance and the phone is set to dark
- **THEN** the app screens are drawn with the Dark colours

#### Scenario: Device reports no preference
- **WHEN** Appearance is System and the device or browser reports no light/dark preference
- **THEN** the Light colours are used

#### Scenario: Manual override
- **WHEN** the user picks Light while the phone is set to dark
- **THEN** the app screens are drawn with the Light colours, after restarting the app too

#### Scenario: Not synced
- **WHEN** the user picks Dark on one device and opens the same account on another device
- **THEN** the other device keeps its own Appearance choice

#### Scenario: Unreadable stored value
- **WHEN** the stored Appearance value is missing or not one of the three choices
- **THEN** System is used and the sounds and haptics settings are kept

#### Scenario: Labelled choices
- **WHEN** a screen reader focuses an Appearance choice
- **THEN** it announces the choice's name from the text catalog and whether it is selected

### Requirement: Appearance applies live to app screens
The system SHALL restyle every full-screen shell screen and its modals as soon as the active Appearance changes, without a restart and without losing the screen's state. UI chrome (buttons, chips, panels, fields, glyphs, the Barkdoku grid and its unsolved silhouettes) SHALL follow the active Appearance.

#### Scenario: Switch from Settings
- **WHEN** the user picks Dark in Settings
- **THEN** the Settings screen turns dark at once, with its scroll position and unsaved field text unchanged

#### Scenario: Phone changes while System is chosen
- **WHEN** Appearance is System and the phone switches from light to dark while the app is open
- **THEN** the app screens switch to the Dark colours without a restart

#### Scenario: No light leftovers
- **WHEN** any full-screen shell screen is shown with the Dark Appearance
- **THEN** no panel, button, chip, text field, modal or glyph is drawn in a Light-only colour

#### Scenario: Barkdoku board
- **WHEN** Barkdoku is shown with the Dark Appearance
- **THEN** the grid and unsolved zone silhouettes use the Dark colours, and a solved zone's dog illustration uses the Light colours

### Requirement: Light-only regions
The system SHALL keep the Light colours, whatever the Appearance, for: the simulation, its HUD and every overlay drawn over it while a Stage is played; the Splash; each world's header and trail on the World Map, with the Stops, labels and badges drawn on its scenery; and illustrations of the Dog, the Handler, scenery and Lesson figures, drawn as they are with no backing card.

#### Scenario: Playing a Stage in Dark
- **WHEN** a Stage is played with the Dark Appearance
- **THEN** the simulation, its HUD, hints, coach marks, the Dog warning, the pause and loading overlays and the Payoff Screen use the Light colours

#### Scenario: After the Stage
- **WHEN** a Stage ends and the Debrief screen is shown with the Dark Appearance
- **THEN** the Debrief uses the Dark colours

#### Scenario: Splash on a dark phone
- **WHEN** the app cold-starts on a phone set to dark with Appearance on System
- **THEN** the Splash uses the Light colours and the next screen uses the Dark colours

#### Scenario: Art keeps its colours
- **WHEN** the World Map is shown with the Dark Appearance
- **THEN** each world's header and trail (its scenery, Stops, labels and badges) and the Dog's illustration use the same colours as in Light, and the Map Header and Status Chips use the Dark colours

### Requirement: Meaning-carrying colours
The system SHALL draw colours that carry meaning (Barkdoku zones, lead tension, arousal, world scenery, Dog coats) the same in both Appearances.

#### Scenario: Barkdoku zones in Dark
- **WHEN** a Barkdoku board is shown with the Dark Appearance
- **THEN** each zone has the same colour as with the Light Appearance
