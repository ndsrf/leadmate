# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
