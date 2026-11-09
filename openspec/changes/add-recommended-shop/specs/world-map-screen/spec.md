# Spec Delta

## ADDED Requirements

### Requirement: Basket button opens the Shop
The World Map header SHALL show a basket button next to the Settings gear whenever the active pack has at least one listed shop Category, and tapping it SHALL open the Shop. The button SHALL have an accessible label and SHALL be hidden when the shop is empty.

#### Scenario: Shop available
- **WHEN** the World Map is shown with a non-empty shop
- **THEN** a basket button appears beside the gear and opens the Shop when tapped

#### Scenario: Shop empty
- **WHEN** the active pack has no shop content
- **THEN** only the gear is shown, as before

#### Scenario: Small screen
- **WHEN** the screen is narrow
- **THEN** the basket and gear chips both stay fully visible and tappable without overlapping other header content
