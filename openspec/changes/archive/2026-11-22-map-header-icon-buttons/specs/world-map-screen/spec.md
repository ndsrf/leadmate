# Spec Delta

## MODIFIED Requirements

### Requirement: Persistent status chips
The system SHALL keep the Streak, the Library entry, the Plus chip, the Settings entry, the Daily Stage, and Daily Barkdoku visible at the top of the World Map while the map scrolls. The Settings entry SHALL be an icon-only gear button pinned to the far top right of the Map Header on Row 1 as the final element of the right-hand icon cluster. The status chips SHALL be structured into two rows: Row 1 containing Streak on the left and an icon cluster on the right comprising Library, Games (when available), Shop (when available), and Settings; Row 2 containing the Plus chip, Daily Stage chip, and Daily Barkdoku chip rendered in a compact, single-line horizontal row that fits without wrapping on viewports down to 320 points. When today's Daily Stage has been played, the header chip SHALL display the score in compact slash notation ("{score}/1000"). All icon buttons and chips SHALL keep at least the minimum touch target (44 points) and SHALL expose their localized names to screen readers.

#### Scenario: Scrolled map
- **WHEN** the user has scrolled down the map
- **THEN** the Streak chip, the Plus chip, the Daily Stage chip and Settings remain visible

#### Scenario: Daily Stage chip
- **WHEN** today's Daily Stage has not been played
- **THEN** its chip displays the label "Paseo" with a highlighted "new" state, and after it is played shows the day's best score in compact slash format ("{score}/1000") while announcing the full score to screen readers

#### Scenario: Header order
- **WHEN** the World Map header is shown
- **THEN** Row 1 displays Streak ("X días seguidos" or "Comenzar racha") on the left and the icon button cluster on the right in order: Library (book glyph), Games (when active), Shop (when active), and Settings (gear glyph) anchored at the far right; Row 2 displays Plus, Paseo, and Guaudoku in a single horizontal row

#### Scenario: Settings as a gear
- **WHEN** the World Map header is shown
- **THEN** the Settings entry shows a gear icon with no visible text, anchored at the far top right of Row 1 as the last icon button in the header, with a face no taller than the status chips

#### Scenario: Gear stays put when chips wrap
- **WHEN** the header status chips are displayed
- **THEN** the Settings gear stays anchored at the top right of Row 1 without jumping between chips or being pushed down by wrapping chips

#### Scenario: Settings gear is accessible
- **WHEN** a screen reader focuses the gear
- **THEN** it is announced as a button named with the localized Settings label, and activating it opens Settings

#### Scenario: Row 2 fits in a single line on compact viewports
- **WHEN** the user has an active Plus subscription or trial, has completed today's Daily Stage with a score, and has solved today's Barkdoku
- **THEN** Row 2 displays the Plus chip, the Paseo score chip in slash format, and the Guaudoku solve chip in a single non-wrapping row on viewports down to 320 points wide

### Requirement: Plus chip lifecycle states
The Plus chip in the Map Header SHALL adapt its appearance and behavior to the user's trial status. For an unstarted trial, it SHALL display "Plus" with "Gratis" and open the paywall with bypass. During an active trial, it SHALL display "Plus" with the remaining days ("X d") in a compact format and open the trial status modal. For an expired trial, it SHALL display "Pasar a Plus" and open the conversion screen. For an active subscription, it SHALL display "Plus" with "Activo" in a quiet, unhighlighted compact surface that does not visually dominate the daily activity chips, and open the membership status modal.

#### Scenario: Free user sees trial offer chip
- **WHEN** the user has not started the trial
- **THEN** the Plus chip displays "Plus" with "Gratis", and tapping it opens the paywall screen

#### Scenario: Active trial user sees remaining days
- **WHEN** the user is 3 days into their 7-day trial
- **THEN** the Plus chip displays "Plus · 4 d" in a compact chip, and tapping it opens the trial status modal

#### Scenario: Expired trial user sees upgrade prompt
- **WHEN** the user's 7-day trial has expired
- **THEN** the Plus chip displays "Pasar a Plus", and tapping it opens the conversion screen

#### Scenario: Subscribed user sees active membership chip
- **WHEN** the user has an active Plus subscription
- **THEN** the Plus chip displays "Plus · Activo" in a quiet, unhighlighted compact chip, and tapping it opens the trial status modal

### Requirement: Theory Library entry
The system SHALL keep a Library entry visible as an icon-only button in Row 1 of the Map Header, placed as the first icon in the right-hand icon cluster. It SHALL open the Theory Library, SHALL keep at least the minimum touch target (44 points), and SHALL expose the localized name "Biblioteca" to screen readers. While a Lesson is marked "for today", it SHALL show an unread dot indicator and announce the "for today" status to screen readers.

#### Scenario: Entry visible while scrolled
- **WHEN** the user has scrolled down the map
- **THEN** the Library entry remains visible

#### Scenario: Indicator
- **WHEN** a Lesson is marked "for today"
- **THEN** the Library icon button displays a visible accent dot indicator and its accessibility label announces both the Library name and "para hoy"

#### Scenario: Icon presentation
- **WHEN** the World Map header is displayed
- **THEN** the Library entry renders as a circular icon button with an ink book glyph, with no visible text label

#### Scenario: Narrow screen
- **WHEN** the status chips do not fit on one line
- **THEN** Row 1 keeps the Streak pill and the icon cluster aligned without clipping and the Library entry remains visible

#### Scenario: Back to the map
- **WHEN** the user leaves the Theory Library
- **THEN** the World Map is shown at its previous scroll position

### Requirement: Games entry in the Map Header
The system SHALL show an icon-only Games chip in Row 1 of the Map Header, positioned in the right-hand icon cluster between the Library book icon and the Shop basket (or Settings gear when Shop is absent), while the active Content Pack contains at least one Dog Game. It SHALL open the Games screen, SHALL keep at least the minimum touch target (44 points) and SHALL expose the localized name "Juegos" to screen readers. It SHALL NOT alter the far top-right position of the Settings gear.

#### Scenario: Games chip beside Settings and Shop
- **WHEN** the active pack has games and a shop
- **THEN** Row 1 shows the icon buttons in order: Library book icon, Games controller icon, Shop basket icon, and Settings gear icon anchored at the far top right

#### Scenario: Games chip opens the screen
- **WHEN** the user taps the Games chip
- **THEN** the Games screen opens over the World Map and closing it returns to the same map position

#### Scenario: No games
- **WHEN** the pack has no games
- **THEN** the Games chip is not shown and the remaining icon buttons keep their relative order with Settings at the far right

#### Scenario: Narrow screen
- **WHEN** the header is shown at 320 points wide
- **THEN** the icon buttons stay on Row 1 without pushing the Streak chip off the row
