# Spec Delta

## MODIFIED Requirements

### Requirement: Persistent status chips
The system SHALL keep the Streak, the Library entry, the Plus chip, the Settings entry, the Daily Stage, and Daily Barkdoku visible at the top of the World Map while the map scrolls. The Settings entry SHALL be an icon-only gear button pinned to the top right of the Map Header on Row 1. The status chips SHALL be structured into two rows: Row 1 containing Streak, Library entry, and the Settings gear button; Row 2 containing the Plus chip, Daily Stage chip (displaying "Paseo"), and Daily Barkdoku chip (displaying "Guaudoku"). The Settings entry SHALL keep at least the minimum touch target (44 points) and SHALL expose the localized Settings name to screen readers.

#### Scenario: Scrolled map
- **WHEN** the user has scrolled down the map
- **THEN** the Streak chip, the Plus chip, the Daily Stage chip and Settings remain visible

#### Scenario: Daily Stage chip
- **WHEN** today's Daily Stage has not been played
- **THEN** its chip displays the label "Paseo" with a highlighted "new" state, and after it is played shows the day's best score

#### Scenario: Header order
- **WHEN** the World Map header is shown
- **THEN** Row 1 displays Streak ("X días seguidos") and Biblioteca with Settings gear on the right, and Row 2 displays Plus ("Gratis"), Paseo, and Guaudoku

#### Scenario: Settings as a gear
- **WHEN** the World Map header is shown
- **THEN** the Settings entry shows a gear icon with no visible text, anchored at the top right of Row 1, with a face no taller than the status chips

#### Scenario: Gear stays put when chips wrap
- **WHEN** the header status chips are displayed
- **THEN** the Settings gear stays anchored at the top right of Row 1 without jumping between chips or being pushed down by wrapping chips

#### Scenario: Settings gear is accessible
- **WHEN** a screen reader focuses the gear
- **THEN** it is announced as a button named with the localized Settings label, and activating it opens Settings

### Requirement: Plus chip lifecycle states
The Plus chip in the Map Header SHALL adapt its appearance and behavior to the user's trial status. For an unstarted trial, it SHALL display "Plus" with "Gratis" and open the paywall with bypass. During an active trial, it SHALL display "Plus" with the remaining days ("X d") and open the trial status modal. For an expired trial, it SHALL display "Pasar a Plus" and open the conversion screen. For an active subscription, it SHALL display "Plus" with "Activo" and open the membership status modal.

#### Scenario: Free user sees trial offer chip
- **WHEN** the user has not started the trial
- **THEN** the Plus chip displays "Plus" with "Gratis", and tapping it opens the paywall screen

#### Scenario: Active trial user sees remaining days
- **WHEN** the user is 3 days into their 7-day trial
- **THEN** the Plus chip displays "Plus · 4 d", and tapping it opens the trial status modal

#### Scenario: Expired trial user sees upgrade prompt
- **WHEN** the user's 7-day trial has expired
- **THEN** the Plus chip displays "Pasar a Plus", and tapping it opens the conversion screen

#### Scenario: Subscribed user sees active membership chip
- **WHEN** the user has an active Plus subscription
- **THEN** the Plus chip displays "Plus · Activo", and tapping it opens the trial status modal
