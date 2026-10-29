# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
