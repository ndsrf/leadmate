# Spec Delta

## ADDED Requirements

### Requirement: Day Skips are logged
The Activity Log SHALL log one dated entry for each Day Skip, with the local date and time and the Mission that was skipped.

#### Scenario: Skip logged
- **WHEN** the user taps "Saltar el día" on the harness Mission and the skip is applied
- **THEN** an entry with that Mission, the date and the time is added to the log

#### Scenario: Declined paywall
- **WHEN** a free user taps "Saltar el día" and closes the paywall without starting the trial
- **THEN** nothing is added to the log

### Requirement: Day Skips in the Diary
A day card SHALL show each Day Skip of that day at its time, as "Saltaste la espera" with the Mission title. A day that holds Day Skips SHALL carry a skip mark on the calendar, and a day with only Day Skips SHALL NOT count as an Active Day.

#### Scenario: Skip on a day card
- **WHEN** the user skipped the harness Mission at 18:05
- **THEN** that day's card shows "18:05 · Saltaste la espera · «harness Mission title»"

#### Scenario: Skip-only day
- **WHEN** the only activity of a day is a Day Skip
- **THEN** the day shows the skip mark and is not counted as an Active Day

### Requirement: Closing an Owed Mission in the Diary
The "¡Conseguido!" check-in that passed an Owed Mission SHALL show on its day card as closing a skipped Mission, with the date of the skip. Other check-ins given while the Mission was owed ("Costó un poco", "Hoy no pudimos") SHALL NOT carry that note, because they did not close it.

#### Scenario: Owed Mission passed
- **WHEN** the user passes on Thursday a Mission they skipped on Monday
- **THEN** Thursday's card shows the check-in with "Cierra la misión saltada el lunes"

#### Scenario: Struggle while owed
- **WHEN** the user answers "Costó un poco" on Tuesday on a Mission they skipped on Monday
- **THEN** Tuesday's card shows the check-in without the closing note

### Requirement: Day Skips in the totals
The Diary totals SHALL show how many Day Skips were used and how many Missions are still owed. The owed count SHALL only appear when it is above zero.

#### Scenario: Totals with skips
- **WHEN** the user used three Day Skips and has since passed two of those Missions
- **THEN** the totals show 3 days skipped and 1 Mission still to close
