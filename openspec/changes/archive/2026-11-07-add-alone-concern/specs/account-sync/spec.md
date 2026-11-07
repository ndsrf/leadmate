# Spec Delta

## MODIFIED Requirements

### Requirement: Conflict resolution
The system SHALL resolve conflicting edits per record by last-write-wins on `updatedAt`, SHALL union Walk Diary entries by date and Node or Mission, SHALL merge Mission state with a passed Mission winning over an active one, SHALL union the seen Fixes, SHALL union Activity Log entries by time, kind and item (keeping the newest 500), SHALL keep the best Daily Stage score per date, SHALL keep the earlier first Daily Barkdoku solve per date, SHALL keep the longer Streak (the later `lastActiveDate` for the current run, the maximum for the best), SHALL keep the being-alone answer if either copy has one (the winning copy's when both do, together with that copy's level for being alone when only the other copy answered), and SHALL NOT blend Learning Attributes field by field.

#### Scenario: Two devices edit
- **WHEN** two devices change the Learning Attributes offline
- **THEN** the record with the later `updatedAt` wins whole

#### Scenario: Diary entries from both devices
- **WHEN** each device logged a different day
- **THEN** both days are present after sync

#### Scenario: Mission passed on one device
- **WHEN** one device passed a Mission while the other, with a later `updatedAt`, still has it waiting
- **THEN** the Mission is passed after sync

#### Scenario: Activity from both devices
- **WHEN** each device logged different activity offline
- **THEN** the Diary shows the activity of both after sync, with no entry duplicated

#### Scenario: Daily Barkdoku solved on both devices
- **WHEN** one device first solved today's Daily Barkdoku at 09:00 in 2:10 and the other at 20:00 in 1:50
- **THEN** after sync today's Daily Solve Time is 2:10 on both devices

#### Scenario: Being alone answered on one device
- **WHEN** one device answered the being-alone question while the other, with a later `updatedAt`, has not
- **THEN** after sync both devices hold the answer, the card is not shown again, and the level for being alone is the answering device's

#### Scenario: Answered on both devices
- **WHEN** both devices answered the being-alone question differently
- **THEN** the answer and level of the record with the later `updatedAt` win
