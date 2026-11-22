# Spec Delta

## MODIFIED Requirements

### Requirement: Theory Library
The system SHALL provide a Theory Library listing unlocked Lessons in a fixed order, each entry showing its title, its kind, its suggested day (or, for a trail Lesson, its World and Stretch), an estimated reading time and whether it has been read. The Theory Library SHALL only list Lessons that the user has already encountered or completed: first-week Lessons whose suggested day has arrived or that have been read, and trail Lessons whose World or Node is completed (or for stretches without nodes, its Mission is passed) or that have been read. When no lessons or fixes are unlocked, the Theory Library SHALL display a helpful empty-state message explaining that advancing along the trail unlocks lessons.

#### Scenario: Library listed
- **WHEN** the user opens the Theory Library
- **THEN** only unlocked Lessons appear in order with title, kind, suggested day or trail place, estimated minutes and a read or unread state that does not rely on colour alone

#### Scenario: Empty library
- **WHEN** the user opens the Theory Library and has no unlocked lessons or fixes
- **THEN** an empty-state message is displayed indicating that advancing along the trail unlocks lessons

#### Scenario: Library offline
- **WHEN** the device is offline
- **THEN** the Library and the text and bundled-image parts of every unlocked Lesson remain fully readable

#### Scenario: Trail Lesson entry
- **WHEN** an unlocked Lesson is the second Stop of World 3's first Stretch
- **THEN** its Library entry shows "Mundo 3 · Tramo 1" instead of a suggested day

#### Scenario: Basics Lesson entry
- **WHEN** an unlocked Lesson is the first Stop of World 1's first Stretch
- **THEN** its Library entry shows "Mundo 1 · Tramo 1"

#### Scenario: Uncompleted content hidden
- **WHEN** a trail Lesson belongs to a World and Node the user has not completed and has not read
- **THEN** that Lesson is not listed in the Theory Library

#### Scenario: Plus world lessons hidden for free users
- **WHEN** a free user has not unlocked or completed a Plus World
- **THEN** Lessons belonging to that Plus World do not appear in the Theory Library

### Requirement: First-week Lessons
The system SHALL ship at least five Lessons whose suggested days run from day 1 to day 5 after the Dog's onboarding, and SHALL mark today's suggested unread Lesson as "for today". A first-week Lesson SHALL appear in the Theory Library only once its suggested day has arrived (`day <= currentLessonDay`) or once it has been read. Lessons whose suggested day has not arrived and that have not been read SHALL NOT appear in the Library.

#### Scenario: Today's Lesson
- **WHEN** it is the third day after onboarding and the day-3 Lesson is unread and Lessons 1-2 are read
- **THEN** that Lesson is marked "for today" at the top of the Library, and day 4 and 5 Lessons are hidden

#### Scenario: Catching up
- **WHEN** it is day 5 and Lessons 1-3 are unread
- **THEN** Lesson 1 is marked "for today" and Lessons 1 to 5 are all visible in the Library

#### Scenario: Before the first Stage
- **WHEN** the guided first Stage has not been completed
- **THEN** no Lesson is marked "for today" and unread day-based Lessons are not visible in the Library

#### Scenario: Day boundary
- **WHEN** the first Stage was completed at 23:50 and it is now 00:10 the next day
- **THEN** it is Day 2 and Day 2's Lesson becomes visible in the Library

#### Scenario: Reading ahead
- **WHEN** a first-week Lesson's suggested day has not arrived and it has not been read
- **THEN** it does not appear in the Library and cannot be opened ahead of its day

#### Scenario: Nothing for today
- **WHEN** every Lesson suggested up to today is read
- **THEN** no Lesson is marked "for today"

### Requirement: Trail Lessons
A Lesson MAY be placed on a World's trail as a Lesson Stop. Such a Lesson SHALL have no suggested day and SHALL never be marked "for today". A trail Lesson SHALL appear in the Theory Library only if its World is completed, or its associated Node is completed (or for stretches without nodes, its Mission is passed), or the Lesson has already been read on the trail. Reading a trail Lesson from the Library or from the trail SHALL mark it read and complete its Stop.

#### Scenario: Read from the Library first
- **WHEN** a trail Lesson was unlocked in the Library by node/world completion and the user reads it from the Library
- **THEN** that Lesson Stop shows as completed when the trail reaches it, and the Stop after it becomes available

#### Scenario: Not for today
- **WHEN** it is day 3 and an unread trail Lesson is visible in the Theory Library
- **THEN** the "for today" choice considers only Lessons with a suggested day

#### Scenario: Reading ahead does not pass a Mission
- **WHEN** the user reads an unlocked trail Lesson from the Library that precedes an unpassed Mission
- **THEN** the Lesson is marked read and any unpassed Missions on the trail stay unpassed

#### Scenario: Completed Node unlocks Stretch Lessons
- **WHEN** the user completes a Node on the trail, or passes the Mission of a Stretch without Nodes
- **THEN** the theory Lessons associated with that Node's Stretch appear in the Theory Library

#### Scenario: Completed World unlocks all its Lessons
- **WHEN** the user completes a World
- **THEN** every trail Lesson of that World appears in the Theory Library

#### Scenario: Lesson read on trail retained in Library
- **WHEN** the user reads a trail Lesson from its Stop on the World Map before completing the subsequent Node
- **THEN** that Lesson is marked read and remains visible in the Theory Library
