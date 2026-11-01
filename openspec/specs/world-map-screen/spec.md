# world-map-screen Specification

## Purpose
Presents progression as a World Map the user travels along, so the next lesson is obvious, the path ahead is visible and each completed Node feels like progress.

## Requirements

### Requirement: Map of Worlds and Nodes
The system SHALL show the World Map as a continuous winding trail traversing titled World regions, rendering active worlds with visible Stops along the path, the immediately next locked world with an unlock requirement banner, and subsequent locked worlds as compact collapsible headers.

#### Scenario: Worlds listed
- **WHEN** the World Map is shown
- **THEN** every World appears in order with its title, its completed-over-total Stop count ("X de Y paradas"), and its thematic topic summary

#### Scenario: Locked World
- **WHEN** a World is not yet unlocked
- **THEN** it appears with its unlock requirement and its Stops are not openable

#### Scenario: Active World path connectors
- **WHEN** an active or unlocked World is displayed
- **THEN** completed Stop segments connect via solid ink-outlined paths and upcoming or locked segments connect via dashed dotted trails

#### Scenario: Next locked World banner
- **WHEN** a World is the first locked World in sequence
- **THEN** it displays an unlock requirement banner above its path naming the preceding World and its final missing Stop

#### Scenario: Subsequent locked Worlds collapsed
- **WHEN** a World follows an already-locked World
- **THEN** it is displayed as a compact collapsible header row with a lock icon, and tapping the header toggles inline expansion of its trail

#### Scenario: Long World
- **WHEN** a World holds twelve or more Stops
- **THEN** every Stop is drawn on the trail without overlap and the map scrolls vertically only

### Requirement: Node states
The system SHALL show each Stop as exactly one of locked, open, next-up, waiting, owed or completed. A completed Node Stop SHALL show its star rating. Only a Mission Stop can be waiting or owed.

#### Scenario: Next-up Node
- **WHEN** at least one open Stop is not completed
- **THEN** the first such Stop in World order is marked next-up with amber fill, a soft looping attention animation, and a "Siguiente" badge pill, and the map scrolls it into view on opening the World Map

#### Scenario: Open Node
- **WHEN** a Stop is unlocked and ready but is not the primary next-up Stop
- **THEN** it renders with a light paper surface disc and the glyph of its kind

#### Scenario: Completed Node
- **WHEN** a Node Stop is completed with 2 stars
- **THEN** it shows two filled stars and one empty star below the Stop

#### Scenario: Completed Lesson or Mission Stop
- **WHEN** a Lesson Stop is read or a Mission Stop is passed
- **THEN** it shows the completed disc with a checkmark and no stars, and a Mission passed with "keep practising" also shows that mark

#### Scenario: Waiting Mission
- **WHEN** a Mission has been started or checked in today
- **THEN** its Stop shows a waiting state (a moon glyph and a label saying when the check-in opens: "Mañana", or "A las 07:50" when the 8-hour minimum ends after midnight) instead of next-up, and is not counted as next-up

#### Scenario: Owed Mission waiting
- **WHEN** a Mission was skipped with "Saltar el día" and its check-in has not opened
- **THEN** its Stop shows the owed state (a distinct "Pendiente" mark, not a checkmark) with the label saying when the check-in opens, is not next-up, and the trail after it is drawn as open

#### Scenario: Owed Mission not counted as done
- **WHEN** a 12-Stop World has every Stop done except one Owed Mission
- **THEN** its count reads "11 de 12 paradas"

#### Scenario: Owed Mission due
- **WHEN** an Owed Mission's check-in is open
- **THEN** its Stop keeps the "Pendiente" mark and shows the badge "¿Cómo fue?", but the next-up Stop stays the first open Stop of the trail

#### Scenario: Only owed check-ins left
- **WHEN** no Stop is open except Owed Missions whose check-in is due
- **THEN** the first of them in World order is next-up with the badge "¿Cómo fue?"

#### Scenario: Check-in due
- **WHEN** a Mission's check-in is open
- **THEN** its Stop is next-up with the badge "¿Cómo fue?"

#### Scenario: Locked Node reason
- **WHEN** the user presses a locked Stop
- **THEN** the system names what is still missing (the earlier Stops of its Stretch, or the Mission that must be passed first) and does not open the Stop

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

### Requirement: Dog on the map
The system SHALL show the user's customized Dog avatar (`BreedArt` using the Dog's `breed` and `coat`) on the map at the next-up Stop, or at the waiting Mission when there is no next-up Stop, standing on the open side of the path, and SHALL show an amber aura and Rusty Dog status while the Dog is Rusty.

#### Scenario: Dog follows progress
- **WHEN** the user completes a Stop and the next-up Stop advances
- **THEN** the customized Dog avatar is positioned beside the new next-up Stop

#### Scenario: Dog waits at a Mission
- **WHEN** every available Stop is done and a Mission is waiting
- **THEN** the Dog avatar is placed beside that Mission in a resting pose

#### Scenario: Dog reflects breed and coat
- **WHEN** the user has selected a breed and coat in onboarding or settings
- **THEN** the Dog marker on the World Map displays the matching breed silhouette and coat colors

#### Scenario: Rusty Dog on map
- **WHEN** the Dog is in the Rusty Dog state
- **THEN** the Dog marker displays an amber attention aura and announces the Rusty state in its accessibility label

### Requirement: Existing prompts keep their place
The system SHALL keep the Rusty warm-up prompt, the skipped-warm-up note and the account banner on the World Map, shown above the map and never covering a Node.

#### Scenario: Rusty prompt
- **WHEN** the Dog is Rusty and the user has not chosen yet
- **THEN** the warm-up prompt with Warm-up and Skip actions is shown above the map

#### Scenario: Account banner
- **WHEN** a non-blocking account banner exists
- **THEN** it is shown above the map without hiding the chips

### Requirement: Theory Library entry
The system SHALL keep a Library entry visible with the other status chips at the top of the World Map. It SHALL open the Theory Library and SHALL show an indicator while a Lesson is marked "for today".

#### Scenario: Entry visible while scrolled
- **WHEN** the user has scrolled down the map
- **THEN** the Library entry remains visible

#### Scenario: Indicator
- **WHEN** a Lesson is marked "for today"
- **THEN** the entry shows a dot and a text label, not colour alone

#### Scenario: Narrow screen
- **WHEN** the status chips do not fit on one line
- **THEN** they wrap onto a further line with nothing clipped and the Library entry still visible

#### Scenario: Back to the map
- **WHEN** the user leaves the Theory Library
- **THEN** the World Map is shown at its previous scroll position

### Requirement: Trail Scenery and thematic world decorations
The system SHALL decorate active and expanded World blocks on the World Map with Trail Scenery consisting of full-height environmental backdrops, a standardized 48px Top Landmark entrance, and thematic margin backdrops matching each World's environment, rendered behind trail nodes and connectors without obstructing touch targets, readability, or assistive technology. Each World's scenery and theme palette SHALL be chosen by the World itself, not by its position number, so renumbering Worlds never changes how a World looks.

#### Scenario: Full-height environmental background backdrops
- **WHEN** an active or expanded World block is displayed
- **THEN** it renders continuous thematic environmental backdrop layers (Basics living-room wall & rug, Home wainscoting wallpaper & flooring, Sidewalk curb & horizon, Urban cityscape skyline & street grid, Park meadow hills & treeline) spanning the container height behind the trail nodes without obstructing node discs, text labels, or dog avatar positioning

#### Scenario: Standardized Top Landmarks
- **WHEN** an active or expanded World block is displayed
- **THEN** it renders a standardized 48px Top Landmark entrance at the head of the trail (World 1 Basics: dog bed; World 2 Home: residential house; World 3 Sidewalk: suburban fence pillar; World 4 Urban: city transit shelter; World 5 Park: park pergola arbor) using the World's theme palette

#### Scenario: Basics environment decorations
- **WHEN** World 1 (Un perro es un perro) is rendered on the map
- **THEN** its Trail Scenery includes the living-room wall and rug backdrop, the dog bed Top Landmark, and home margin motifs including a sofa, a dog bed and a garden door

#### Scenario: World 1 Home environment decorations
- **WHEN** the Home & Thresholds World (now World 2) is rendered on the map
- **THEN** its Trail Scenery includes the wainscoting wallpaper and floorboard backdrop, the residential house Top Landmark, and interior margin motifs including hallway lines, warm window frames, and doormat floorboard accents

#### Scenario: World 2 Sidewalk environment decorations
- **WHEN** The Quiet Sidewalk World (now World 3) is rendered on the map
- **THEN** its Trail Scenery includes the sidewalk curb and sky horizon backdrop, the suburban fence Top Landmark, and sidewalk margin motifs including garden fences, hedges, and street lamp silhouettes

#### Scenario: World 3 Urban environment decorations
- **WHEN** the Urban Navigations World (now World 4) is rendered on the map
- **THEN** its Trail Scenery includes the layered cityscape skyline and street grid backdrop, the city transit Top Landmark, and urban margin motifs including building facades, storefront awnings, and crosswalk street elements

#### Scenario: World 4 Park environment decorations
- **WHEN** the Fast Wheels & High Arousal World (now World 5) is rendered on the map
- **THEN** its Trail Scenery includes the rolling meadow hills and treeline landscape backdrop, the park pergola Top Landmark, and park margin motifs including park trees, wooden benches, and meadow contours

#### Scenario: Renumbering keeps the look
- **WHEN** Home & Thresholds moves from World 1 to World 2
- **THEN** it keeps its wainscoting backdrop, house landmark and palette

#### Scenario: Clearance contract for interactive nodes and labels
- **WHEN** Trail Scenery is rendered behind a trail of nodes
- **THEN** margin props are anchored to middle-row gutter intervals (`index % 2 === 1`) outside the interactive zig-zag corridor and background backdrops use low-contrast fills, keeping node discs, text labels, star ratings, and the Dog avatar unobstructed

#### Scenario: Non-interactive and accessible
- **WHEN** Trail Scenery is rendered
- **THEN** all decorative illustration elements disable touch events (`pointerEvents="none"`) and are hidden from accessibility screen readers (`aria-hidden={true}`)

#### Scenario: Preview and collapsed world scenery
- **WHEN** a locked World is collapsed, its Trail Scenery is omitted; WHEN a preview World (6–9) is expanded, subtle thematic backdrop silhouettes are rendered behind its preview teaser card

### Requirement: Stop kinds are distinguishable
Each Stop SHALL show a glyph for its kind (a book for a theory Lesson, a controller for a how-to-play Lesson, a paw for a Node, a flag for a Mission). Its accessibility label SHALL name the kind and title, so kind is never shown by icon or colour alone.

#### Scenario: Screen reader on a Stop
- **WHEN** a screen reader focuses a Mission Stop
- **THEN** it announces "Misión" with the Mission title and its state

### Requirement: Stretch boundaries
The trail SHALL mark the end of each Stretch at its Mission Stop with a flag and a "Tramo N" label. A user SHALL be able to tell how much of the current Stretch is left.

#### Scenario: Current Stretch
- **WHEN** the user is in the second Stretch of a World
- **THEN** the map shows "Tramo 2" at its Mission and the Stops of that Stretch between the previous flag and this one

### Requirement: Opening a Stop
Pressing an available Stop SHALL open it by kind: a Lesson Stop opens the Lesson screen, a Node Stop starts the Node, and a Mission Stop opens its brief or check-in. Finishing it SHALL return to the World Map at the same scroll position.

#### Scenario: Lesson Stop
- **WHEN** the user presses an open Lesson Stop and reaches "Done"
- **THEN** the Lesson is marked read, the user returns to the World Map and the next Stop becomes next-up

### Requirement: Diary entry
The Streak chip at the top of the World Map SHALL open the Diary. The system SHALL NOT show a separate Diary chip or any other "Diario" button in the Map Header. The Streak chip's accessible label SHALL say that it opens the Diary.

#### Scenario: Open from the Streak chip
- **WHEN** the user taps the Streak chip, whether or not a Streak is running
- **THEN** the Diary opens over the map

#### Scenario: No Diario chip
- **WHEN** the World Map header is shown
- **THEN** no chip labelled "Diario" is present, and the Streak chip is the only header entry that opens the Diary

#### Scenario: Entry visible while scrolled
- **WHEN** the user has scrolled down the map
- **THEN** the Streak chip remains visible and still opens the Diary

#### Scenario: Screen reader
- **WHEN** a screen reader focuses the Streak chip
- **THEN** it announces the Streak and the Diary

### Requirement: Day Skip on the waiting Mission screen
The waiting screen of a Mission that can be skipped SHALL show a secondary "Saltar el día" action below the wait message, with the Plus badge. For a free user it SHALL open the paywall. For a Plus member it SHALL apply the skip, return to the World Map and scroll to the new next-up Stop.

#### Scenario: Plus member skips
- **WHEN** a Plus member taps "Saltar el día" on a waiting Mission
- **THEN** the World Map shows the Mission as owed and the first Stop of the next Stretch as next-up

#### Scenario: Accessibility
- **WHEN** a screen reader focuses the action
- **THEN** it announces "Saltar el día" and that it is part of LeadMate Plus

### Requirement: Owed Missions panel
While a World has Owed Missions, its region on the World Map SHALL show a "Cerrar el mundo" panel at its end, listing each Owed Mission with its title and either when its check-in opens or "¿Cómo fue?" when it is due. Tapping an item SHALL open that Mission. The panel SHALL disappear once no Mission of the World is owed.

#### Scenario: Panel lists debts
- **WHEN** World 1 has two Owed Missions, one due and one opening tomorrow
- **THEN** the panel lists both, the first with "¿Cómo fue?" and the second with "Mañana"

#### Scenario: Unlock banner names owed Missions
- **WHEN** the next World is locked only because Missions of the World before it are owed
- **THEN** its unlock banner says the Missions still to close instead of naming a final Stop

#### Scenario: Panel cleared
- **WHEN** the user passes the World's last Owed Mission
- **THEN** the panel is no longer shown

### Requirement: Daily Barkdoku chip
The World Map top bar SHALL offer a Daily Barkdoku chip, labelled "Guaudoku" in Spanish, that opens today's date-seeded, timed board. Before today's first solve the chip SHALL show a highlighted "new" state; after, it SHALL show today's Daily Solve Time and the Target Time, marked when the Daily Solve Time is within the target.

#### Scenario: Not yet solved today
- **WHEN** the user has not solved today's Daily Barkdoku
- **THEN** the chip shows a highlighted "new" state

#### Scenario: Solved within target
- **WHEN** today's Daily Solve Time is 1:42 on a board with a 2:00 target
- **THEN** the chip shows `1:42 / 2:00` with a "target met" mark

#### Scenario: Practice leaves the chip alone
- **WHEN** the user solves today's board again in practice, faster than the first solve
- **THEN** the chip still shows the first solve's time

#### Scenario: New day
- **WHEN** the date changes after a solved day
- **THEN** the chip returns to the "new" state for the new day's board

### Requirement: Completed Worlds collapse
The system SHALL show an unlocked Completed World as a compact header row with a completed mark, its title, its Stop count and topic summary, and no trail, Stops or Trail Scenery. Tapping the header SHALL toggle its full trail inline. Completed Worlds SHALL start collapsed in each app session, and a toggle SHALL hold for the rest of the session.

#### Scenario: Completed World collapsed by default
- **WHEN** the World Map opens in a new app session and World 1 has all 8 of its Stops done and no Owed Mission
- **THEN** World 1 is a single header row showing its title, "8 de 8 paradas", its topic summary and a completed mark, with no Stops and no Trail Scenery drawn

#### Scenario: Tapping the name expands
- **WHEN** the user taps the header of a collapsed Completed World
- **THEN** its full trail is shown inline with its Stops, star ratings and Trail Scenery, and its completed Stops can be opened as before

#### Scenario: Tapping the name again collapses
- **WHEN** the user taps the header of an expanded Completed World
- **THEN** it returns to the compact header row

#### Scenario: Choice kept while visiting a Stop
- **WHEN** the user expands a Completed World, opens one of its Stops and returns to the World Map
- **THEN** that World is still expanded and the map is at the same scroll position

#### Scenario: New session collapses again
- **WHEN** the user expanded a Completed World and later relaunches the app
- **THEN** that World is collapsed again on the World Map

#### Scenario: World finished during the session
- **WHEN** the user completes the last Stop of a World and returns to the World Map
- **THEN** that World is shown collapsed and the map scrolls to the new next-up Stop

#### Scenario: Owed Mission keeps the World open
- **WHEN** every Stop of a World is done except one Owed Mission
- **THEN** the World is not collapsed and its "Cerrar el mundo" panel is shown

#### Scenario: Completed Plus World after Plus lapses
- **WHEN** a Plus World is a Completed World and the user's Plus membership has ended
- **THEN** it is shown as a locked World, not with the completed row

#### Scenario: In-progress World not collapsible
- **WHEN** the user taps the header of the World holding the next-up Stop
- **THEN** the World stays expanded

#### Scenario: Screen reader on a collapsed World
- **WHEN** a screen reader focuses the header of a Completed World
- **THEN** it is announced as a button with the World title, that the World is completed, and whether activating it shows or hides its Stops

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

### Requirement: Active trial status modal
The system SHALL provide a modal sheet when tapping the active Plus chip that recaps the user's active LeadMate Plus benefits (unlocked technique videos, unlimited Day Skips, upcoming Plus Worlds) and remaining trial days, dismissed via a single button without leaving the World Map.

#### Scenario: Inspecting active trial benefits
- **WHEN** an active trial user taps the Plus chip on the World Map
- **THEN** the trial status modal opens displaying active perks and remaining trial duration

#### Scenario: Dismissing trial modal
- **WHEN** the user taps "Entendido" in the trial status modal
- **THEN** the modal closes and the user remains on the World Map at their current scroll position

