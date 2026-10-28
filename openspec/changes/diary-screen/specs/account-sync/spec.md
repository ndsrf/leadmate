# Spec Delta

## MODIFIED Requirements

### Requirement: Conflict resolution
The system SHALL resolve conflicting edits per record by last-write-wins on `updatedAt`, SHALL union Walk Diary entries by date and Node, SHALL union Activity Log entries by time, kind and item (keeping the newest 500), SHALL keep the best Daily Stage score per date, SHALL keep the longer Streak (the later `lastActiveDate` for the current run, the maximum for the best), and SHALL NOT blend Learning Attributes field by field.

#### Scenario: Two devices edit
- **WHEN** two devices change the Learning Attributes offline
- **THEN** the record with the later `updatedAt` wins whole

#### Scenario: Diary entries from both devices
- **WHEN** each device logged a different day
- **THEN** both days are present after sync

#### Scenario: Activity from both devices
- **WHEN** each device logged different activity offline
- **THEN** the Diary shows the activity of both after sync, with no entry duplicated
