# Spec Delta

## MODIFIED Requirements

### Requirement: Active trial status modal
The system SHALL provide a modal sheet when tapping the active Plus chip that recaps the user's active LeadMate Plus benefits (unlocked technique videos, unlimited Day Skips, upcoming Plus Worlds) and remaining trial days, dismissed via a single button without leaving the World Map. The modal sheet SHALL be rendered anchored to the viewport rather than inside the scroll container, remaining visible and centered on the user's current screen without requiring vertical scrolling.

#### Scenario: Inspecting active trial benefits
- **WHEN** an active trial user taps the Plus chip on the World Map
- **THEN** the trial status modal opens displaying active perks and remaining trial duration

#### Scenario: Viewport visibility without scrolling
- **WHEN** the user opens the trial status modal from any scroll position on the World Map
- **THEN** the modal sheet is centered in the current viewport above the map and header without scrolling

#### Scenario: Dismissing trial modal
- **WHEN** the user taps "Entendido" in the trial status modal
- **THEN** the modal closes and the user remains on the World Map at their current scroll position
