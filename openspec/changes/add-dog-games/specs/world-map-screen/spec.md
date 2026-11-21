# Spec Delta

## ADDED Requirements

### Requirement: Games entry in the Map Header
The system SHALL show an icon-only Games chip in Row 1 of the Map Header, next to the Settings gear and the Shop basket, while the active Content Pack contains at least one Dog Game. It SHALL open the Games screen, SHALL keep at least the minimum touch target (44 points) and SHALL expose the localized name "Juegos" to screen readers. It SHALL NOT change the position of the Settings gear.

#### Scenario: Games chip beside Settings and Shop
- **WHEN** the active pack has games and a shop
- **THEN** Row 1 shows the Settings gear, the Shop basket and the Games chip as icon-only buttons at the top right

#### Scenario: Games chip opens the screen
- **WHEN** the user taps the Games chip
- **THEN** the Games screen opens over the World Map and closing it returns to the same map position

#### Scenario: No games
- **WHEN** the pack has no games
- **THEN** the Games chip is not shown and the other chips keep their places

#### Scenario: Narrow screen
- **WHEN** the header is shown at 320 points wide
- **THEN** the three icon buttons stay on Row 1 without pushing the Streak or Library chips off the row
