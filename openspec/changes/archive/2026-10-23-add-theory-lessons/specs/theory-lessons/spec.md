## Purpose

Gives the user a small library of standalone theory Lessons, mixing text, images and video, to read and revisit between walks, starting with a suggested first-week sequence.

## ADDED Requirements

### Requirement: Theory Library
The system SHALL provide a Theory Library listing every Lesson in a fixed order, each entry showing its title, its suggested day, an estimated reading time and whether it has been read.

#### Scenario: Library listed
- **WHEN** the user opens the Theory Library
- **THEN** every Lesson appears in order with title, suggested day, estimated minutes and a read or unread state that does not rely on colour alone

#### Scenario: Library offline
- **WHEN** the device is offline
- **THEN** the Library and the text and bundled-image parts of every Lesson remain fully readable

### Requirement: First-week Lessons
The system SHALL ship at least five Lessons whose suggested days run from day 1 to day 5 after the Dog's onboarding, and SHALL mark today's suggested unread Lesson as "for today". Every Lesson SHALL be openable at any time; no Lesson is locked.

Days are calendar days in the user's local timezone, and the day the guided first Stage is completed is Day 1. "For today" is the oldest unread Lesson whose suggested day has arrived.

#### Scenario: Today's Lesson
- **WHEN** it is the third day after onboarding and the day-3 Lesson is unread and Lessons 1-2 are read
- **THEN** that Lesson is marked "for today" at the top of the Library

#### Scenario: Catching up
- **WHEN** it is day 5 and Lessons 1-3 are unread
- **THEN** Lesson 1 is marked "for today"

#### Scenario: Before the first Stage
- **WHEN** the guided first Stage has not been completed
- **THEN** no Lesson is marked "for today" and every Lesson can still be opened

#### Scenario: Day boundary
- **WHEN** the first Stage was completed at 23:50 and it is now 00:10 the next day
- **THEN** it is Day 2

#### Scenario: Reading ahead
- **WHEN** the user opens a Lesson whose suggested day has not arrived
- **THEN** it opens normally

#### Scenario: Nothing for today
- **WHEN** every Lesson suggested up to today is read
- **THEN** no Lesson is marked "for today"

### Requirement: Lesson blocks
The system SHALL present a Lesson as a vertical sequence of blocks of these types: heading, text, image, video and tip. Each image and video block SHALL have a caption and alt text from the text catalog.

#### Scenario: Mixed Lesson
- **WHEN** a Lesson contains text, an image and a video block
- **THEN** they are shown in the declared order inside one scrollable column

#### Scenario: Screen reader
- **WHEN** a screen reader reaches an image or video block
- **THEN** it announces the block's alt text and caption

### Requirement: Placeholder content is visibly provisional
The system SHALL support marking a Lesson, or its media, as placeholder and SHALL show it with a "placeholder" badge so it is never mistaken for final content.

#### Scenario: Placeholder Lesson
- **WHEN** a Lesson is marked placeholder
- **THEN** its Library card and the top of the Lesson carry the placeholder badge

#### Scenario: Placeholder video
- **WHEN** a Lesson video is marked placeholder
- **THEN** it plays normally and carries a visible placeholder badge with the caption

### Requirement: Read tracking
The system SHALL record a Lesson as read when the user reaches its end, SHALL keep that record on the Dog's record locally first, and SHALL merge read sets from multiple devices as a union.

#### Scenario: Finished Lesson
- **WHEN** the user scrolls to the end of a Lesson and taps "Done"
- **THEN** the Lesson is marked read, the Library updates and the user returns to the Library

#### Scenario: Left early
- **WHEN** the user leaves a Lesson before tapping "Done"
- **THEN** the Lesson stays unread

#### Scenario: Done is the last block
- **WHEN** a Lesson is shown
- **THEN** "Done" is the final block of the column, not a fixed control, so it can only be reached by reading to the end

#### Scenario: Read cannot be undone
- **WHEN** a Lesson is read
- **THEN** no action marks it unread

#### Scenario: Reset Progress
- **WHEN** the user confirms Reset Progress
- **THEN** all Lessons are unread and the Day count restarts with the Funnel

#### Scenario: Two devices
- **WHEN** device A has read Lessons 1-2 and device B has read Lessons 2-3
- **THEN** after sync both have read Lessons 1-3

#### Scenario: First Stage on two devices
- **WHEN** two copies of the Dog have different first-Stage completion times
- **THEN** after sync the earliest time is used for the Day count

### Requirement: Design-system conformance
The system SHALL draw the Library and Lesson screens only from the shared design tokens and game-style components, with Fredoka titles, 2.5pt ink outlines, solid offset shadows, touch targets of at least 44 by 44 points, text at 4.5:1 contrast, a readable column on wide screens, and a static alternative to every animation under reduced motion.

#### Scenario: Narrow phone
- **WHEN** a Lesson is shown at 320 points wide
- **THEN** nothing is clipped and no horizontal scrolling is needed

#### Scenario: Reduced motion
- **WHEN** reduced motion is on
- **THEN** no Lesson or Library animation plays and final states show immediately

#### Scenario: Missing translation
- **WHEN** a Lesson string has no entry in the selected language
- **THEN** the Spanish text is shown
