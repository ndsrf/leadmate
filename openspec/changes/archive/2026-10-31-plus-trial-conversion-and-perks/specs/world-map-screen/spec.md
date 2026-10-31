# Spec Delta: world-map-screen

## MODIFIED Requirements

### Requirement: Persistent status chips
The system SHALL keep the Streak, the Library entry, the Plus chip, the Settings entry, the Daily Stage, and Daily Barkdoku visible at the top of the World Map while the map scrolls. The Map Header SHALL show its entries as a single row that wraps, in this order: the Streak chip, the Library entry, the Plus chip, the Settings entry, the Daily Stage chip, the Daily Barkdoku chip. The Settings entry SHALL be a compact, icon-only gear button. It SHALL keep at least the minimum touch target and SHALL expose the localized Settings name to screen readers.

#### Scenario: Scrolled map
- **WHEN** the user has scrolled down the map
- **THEN** the Streak chip, the Plus chip, the Daily Stage chip and Settings remain visible

#### Scenario: Daily Stage chip
- **WHEN** today's Daily Stage has not been played
- **THEN** its chip shows a highlighted "new" state, and after it is played shows the day's best score

#### Scenario: Header order
- **WHEN** the World Map header is shown
- **THEN** its entries appear in reading order as Streak ("X días seguidos"), Biblioteca, the Plus chip, the Settings gear, El Paseo del Día, Guaudoku, and no other entry sits between them

#### Scenario: Settings as a gear
- **WHEN** the World Map header is shown
- **THEN** the Settings entry shows a gear icon with no visible text, between the Plus chip and the Daily Stage chip, with a face no taller than the Status Chips

#### Scenario: Gear stays put when chips wrap
- **WHEN** the header entries do not fit on one line
- **THEN** they wrap onto further lines in the same order, the gear keeping its place after the Plus chip and before the Daily Stage chip, with nothing clipped

#### Scenario: Settings gear is accessible
- **WHEN** a screen reader focuses the gear
- **THEN** it is announced as a button named with the localized Settings label, and activating it opens Settings

## ADDED Requirements

### Requirement: Plus chip lifecycle states
The Plus chip in the Map Header SHALL adapt its appearance and behavior to the user's trial status. For an unstarted trial, it SHALL display "7 días gratis" and open the paywall with bypass. During an active trial, it SHALL display "Plus" with the remaining days and open the trial status modal. For an expired trial, it SHALL display "Pasar a Plus" and open the conversion screen. For an active subscription, it SHALL display "Plus" with "Activo" and open the membership status modal.

#### Scenario: Free user sees trial offer chip
- **WHEN** the user has not started the trial
- **THEN** the Plus chip displays "7 días gratis", and tapping it opens the paywall screen

#### Scenario: Active trial user sees remaining days
- **WHEN** the user is 3 days into their 7-day trial
- **THEN** the Plus chip displays "Plus · 4 d", and tapping it opens the trial status modal

#### Scenario: Expired trial user sees upgrade prompt
- **WHEN** the user's 7-day trial has expired
- **THEN** the Plus chip displays "Pasar a Plus", and tapping it opens the conversion screen

#### Scenario: Subscribed user sees active membership chip
- **WHEN** the user has an active Plus subscription
- **THEN** the Plus chip displays "Plus · Activo", and tapping it opens the trial status modal

### Requirement: Active trial status modal
The system SHALL provide a modal sheet when tapping the active Plus chip that recaps the user's active LeadMate Plus benefits (unlocked technique videos, unlimited Day Skips, upcoming Plus Worlds) and remaining trial days, dismissed via a single button without leaving the World Map.

#### Scenario: Inspecting active trial benefits
- **WHEN** an active trial user taps the Plus chip on the World Map
- **THEN** the trial status modal opens displaying active perks and remaining trial duration

#### Scenario: Dismissing trial modal
- **WHEN** the user taps "Entendido" in the trial status modal
- **THEN** the modal closes and the user remains on the World Map at their current scroll position
