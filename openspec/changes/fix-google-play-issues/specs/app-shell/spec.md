# Spec Delta

## ADDED Requirements

### Requirement: Edge-to-edge window display and system bar styling
The system SHALL configure the Android app window to display edge-to-edge, drawing behind transparent system status and navigation bars. The system SHALL display dark status bar icons to remain readable against light application headers. The system SHALL NOT invoke deprecated Android 15 window flags or color parameters.

#### Scenario: Launch on Android 15+
- **WHEN** the app runs on Android 15 or higher
- **THEN** the window extends edge-to-edge behind the system bars with transparent status and navigation bars, and without deprecated Window or WindowManager APIs being called

#### Scenario: Status bar icon contrast
- **WHEN** the shell displays light-background screens (including Splash, World Map, and Settings)
- **THEN** status bar icons and system indicators are rendered in dark style for optimal contrast

#### Scenario: Safe area insets protection
- **WHEN** screens, headers, or interactive elements are rendered in the shell
- **THEN** content is padded inside safe area insets so interactive elements and titles are never obscured by notches, cutouts, or system navigation bars
