# mission-day-skip Specification

## Purpose
Lets LeadMate Plus members skip the day-long wait of a Mission and keep progressing, while making sure every skipped Mission is still checked in on a real walk before its World is completed.

## Requirements

### Requirement: Day Skip on a waiting Mission
A Mission that is waiting for its check-in SHALL offer a "Saltar el día" action. This covers the wait after "Start mission", after a "Costó un poco" Fix and after "Hoy no pudimos". Using it SHALL make the Mission an Owed Mission at once. The Mission SHALL keep its active target, its wait and its check-in history.

#### Scenario: Skip after starting
- **WHEN** a Plus member starts a Mission and taps "Saltar el día" the same day
- **THEN** the Mission is owed and its target and check-in opening time are unchanged

#### Scenario: Skip after a struggle
- **WHEN** a Plus member answered "Costó un poco", saw the Fix and taps "Saltar el día"
- **THEN** the Mission is owed with the Fix's easier target as its active target

#### Scenario: Not offered when the check-in is due
- **WHEN** a Mission's check-in is already open
- **THEN** no "Saltar el día" action is shown, only the check-in

#### Scenario: Not offered before the start
- **WHEN** a Mission's brief is shown and "Start mission" has not been tapped
- **THEN** no "Saltar el día" action is shown

### Requirement: Day Skip is a Plus benefit
A Plus member SHALL be able to use any number of Day Skips. A free user SHALL have none. Free users SHALL still see the "Saltar el día" action, marked with the Plus badge, and tapping it SHALL open the paywall. If they start the trial there, the skip SHALL be applied.

#### Scenario: Unlimited for Plus
- **WHEN** a Plus member skips the Missions of three Stretches in a row on the same day
- **THEN** every skip is applied and the fourth Stretch is open

#### Scenario: Free user taps skip
- **WHEN** a free user taps "Saltar el día"
- **THEN** the paywall opens and the Mission stays waiting

#### Scenario: Trial started from the skip
- **WHEN** a free user taps "Saltar el día" and then "Empezar prueba"
- **THEN** the trial starts, the Mission is owed and the next Stop is next-up on the World Map

#### Scenario: Trial over
- **WHEN** a user's trial ended and a Mission is waiting
- **THEN** "Saltar el día" opens the paywall and no skip is applied

#### Scenario: Trial over and "Empezar prueba"
- **WHEN** a user whose trial ended taps "Saltar el día" and then "Empezar prueba"
- **THEN** no skip is applied and the user is back on the Mission, still waiting

#### Scenario: Check-in opened while the paywall was up
- **WHEN** a free user taps "Saltar el día", the Mission's check-in opens, and the user then chooses "Quizá más tarde"
- **THEN** the Mission opens on its check-in, not on the wait

### Requirement: Owed Mission opens the trail
An Owed Mission SHALL count as passed for the Stops after it in its World. The Stops after it SHALL be open as they would be after a pass. No celebration SHALL play, because the Mission is not done.

#### Scenario: Next Stretch opens
- **WHEN** the Mission of Stretch 1 becomes owed
- **THEN** the first Stop of Stretch 2 is next-up

### Requirement: Last Mission of a World cannot be skipped
The last Mission of a World SHALL NOT offer "Saltar el día", because skipping it would open no Stop. It waits for its check-in as before.

#### Scenario: World's last Mission
- **WHEN** the last Mission of World 1 is waiting
- **THEN** no "Saltar el día" action is shown, for Plus members or free users

### Requirement: Owed Missions are checked in like any Mission
An Owed Mission SHALL keep the check-in rules of every Mission: it opens on a later local day and at least 8 hours after the wait started, it takes one answer per day, it has the same three answers, Fix, easier target, easier-target offer after three "Hoy no pudimos" and "Move on anyway". Passing it, including through "Move on anyway", SHALL clear its owed state. An Owed Mission SHALL NOT offer "Saltar el día" again.

#### Scenario: Owed Mission passed
- **WHEN** an Owed Mission's check-in is open and the user answers "¡Conseguido!"
- **THEN** the Mission is passed and is no longer owed

#### Scenario: Owed Mission struggled
- **WHEN** the user answers "Costó un poco" on an Owed Mission
- **THEN** the Fix is shown, the Mission stays owed with the easier target and its wait restarts

#### Scenario: No second skip
- **WHEN** an Owed Mission is waiting for its check-in
- **THEN** no "Saltar el día" action is shown

#### Scenario: Trail stays open after the trial ends
- **WHEN** a user's trial ends while two of their Missions are owed
- **THEN** the Stops those Day Skips opened stay open, and only a new Day Skip opens the paywall

#### Scenario: Check-in after the trial ends
- **WHEN** a Mission was skipped during the trial and the trial is now over
- **THEN** the Mission is still owed and its check-in works as normal

#### Scenario: Owed Mission in a Plus World after the trial
- **WHEN** a Mission of a Plus World was skipped during the trial and the trial is now over
- **THEN** the Mission is locked with its World, and it is owed again when the user has Plus

### Requirement: A World closes only when no Missions are owed
A World SHALL be complete, and SHALL unlock the World after it, only when every one of its Missions is passed. An Owed Mission SHALL NOT count as passed for completing the World. The World-complete celebration SHALL play when the last owed or waiting Mission of the World is passed.

#### Scenario: Owed Mission blocks the next World
- **WHEN** every Stop of World 1 is done except one Owed Mission in Stretch 2
- **THEN** World 2 stays locked

#### Scenario: Closing the last debt
- **WHEN** the last Mission of World 1 was passed earlier and the user now passes its only Owed Mission
- **THEN** World 1 is complete, the World-complete celebration plays and World 2 unlocks

### Requirement: Day Skips are not progress in the Dog
A Day Skip SHALL NOT change the Dog's Learning Attributes, Trigger Profile, Stars or Streak, and SHALL NOT add a Walk Diary entry.

#### Scenario: Skip leaves the Dog unchanged
- **WHEN** the user uses a Day Skip
- **THEN** the Learning Attributes, Streak and Walk Diary are unchanged

### Requirement: Existing progress is unaffected
Missions passed or grandfathered before this change SHALL stay passed. No Mission SHALL become owed unless a Day Skip was used on it.

#### Scenario: Returning user
- **WHEN** a user who passed all Missions of World 1 updates the app
- **THEN** World 1 is complete and has no Owed Missions
