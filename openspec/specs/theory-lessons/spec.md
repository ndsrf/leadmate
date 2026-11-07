# theory-lessons Specification

## Purpose

Gives the user a small library of standalone theory Lessons, mixing text, images and video, to read and revisit between walks, starting with a suggested first-week sequence.

## Requirements

### Requirement: Theory Library
The system SHALL provide a Theory Library listing every Lesson in a fixed order, each entry showing its title, its kind, its suggested day (or, for a trail Lesson, its World and Stretch), an estimated reading time and whether it has been read.

#### Scenario: Library listed
- **WHEN** the user opens the Theory Library
- **THEN** every Lesson appears in order with title, kind, suggested day or trail place, estimated minutes and a read or unread state that does not rely on colour alone

#### Scenario: Library offline
- **WHEN** the device is offline
- **THEN** the Library and the text and bundled-image parts of every Lesson remain fully readable

#### Scenario: Trail Lesson entry
- **WHEN** a Lesson is the second Stop of World 3's first Stretch
- **THEN** its Library entry shows "Mundo 3 · Tramo 1" instead of a suggested day

#### Scenario: Basics Lesson entry
- **WHEN** a Lesson is the first Stop of World 1's first Stretch
- **THEN** its Library entry shows "Mundo 1 · Tramo 1"

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
The system SHALL present a Lesson as a vertical sequence of blocks of these types: heading, text, image, video, tip, steps, example, compare and takeaways. Each image and video block SHALL have a caption and alt text from the text catalog. A steps block SHALL show a numbered list; an example block a short real-walk story set apart from the body; a compare block a labelled "do" and "don't" side; a takeaways block a short bulleted summary.

#### Scenario: Mixed Lesson
- **WHEN** a Lesson contains text, an image and a video block
- **THEN** they are shown in the declared order inside one scrollable column

#### Scenario: Screen reader
- **WHEN** a screen reader reaches an image or video block
- **THEN** it announces the block's alt text and caption

#### Scenario: Steps announced in order
- **WHEN** a screen reader reaches a steps block
- **THEN** it announces it as a list and reads each step with its number

#### Scenario: Compare without colour
- **WHEN** a compare block is shown
- **THEN** the "do" and "don't" sides are told apart by a label and an icon, not by colour alone

#### Scenario: Compare at narrow width
- **WHEN** a compare block is shown at 320 points wide
- **THEN** the two sides stack vertically with "do" first and nothing is clipped

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

### Requirement: Lesson kinds
Every Lesson SHALL be of kind `theory` (how to train the real dog) or `how-to-play` (how to use the simulator's controls and read the virtual Dog). A how-to-play Lesson SHALL show each control it covers with an annotated image or clip of the actual control.

#### Scenario: How-to-play Lesson
- **WHEN** the user opens the how-to-play Lesson before the first walking Stage
- **THEN** it shows the joystick, how the leash goes slack or taut, the Poste and Go Sniff, each with an annotated image or clip

#### Scenario: Kind label
- **WHEN** a Lesson is shown in the Library or at the top of the Lesson screen
- **THEN** its kind is named in text ("Teoría" or "Cómo se juega")

### Requirement: Trail Lessons
A Lesson MAY be placed on a World's trail as a Lesson Stop. Such a Lesson SHALL have no suggested day and SHALL never be marked "for today". It SHALL stay openable from the Library at any time. Reading it from the Library or from the trail SHALL complete its Stop.

#### Scenario: Read from the Library first
- **WHEN** the user reads a trail Lesson from the Library before reaching its Stop
- **THEN** that Lesson Stop shows as completed when the trail reaches it, and the Stop after it becomes available

#### Scenario: Not for today
- **WHEN** it is day 3 and an unread trail Lesson exists
- **THEN** the "for today" choice considers only Lessons with a suggested day

#### Scenario: Reading ahead does not pass a Mission
- **WHEN** the user reads, from the Library, a trail Lesson that comes after a waiting Mission
- **THEN** the Lesson is marked read and the Stops after the Mission stay locked

### Requirement: Fixes kept in the Library
The Theory Library SHALL include a "Tus ajustes" section listing every Fix the user has been shown, most recent first, each naming its Mission and problem. A Fix SHALL be readable from there at any time and offline. The section SHALL be hidden while empty.

#### Scenario: Fix kept
- **WHEN** the user has been shown the Fix for "Se excita al ver el arnés"
- **THEN** the Library's "Tus ajustes" section lists it with the harness Mission's name and opens the same Fix page

#### Scenario: No Fixes yet
- **WHEN** the user has never been shown a Fix
- **THEN** the Library shows no "Tus ajustes" section

#### Scenario: Fixes across devices and reset
- **WHEN** two devices have seen different Fixes, or the user confirms Reset Progress
- **THEN** after sync the section lists the union, and after a reset it is empty

### Requirement: Theory Lesson teaching pattern
Every theory Lesson SHALL follow, in this order: a hook naming the problem the user recognises; why it happens, in plain behaviour-science terms; how to do it as numbered steps; a worked example on a real walk; common mistakes as a do / don't comparison; a "try it today" tip; and key takeaways. Illustrations and an optional video sit between these sections.

#### Scenario: Pattern present
- **WHEN** any theory Lesson is opened
- **THEN** it shows, in order, the hook, the why, numbered steps, a worked example, a do / don't comparison, a "try it today" tip and key takeaways, followed by "Done"

#### Scenario: How-to-play Lessons exempt
- **WHEN** a How-to-play Lesson is opened
- **THEN** it keeps its per-control layout and is not required to follow the theory pattern

### Requirement: Theory Lesson depth
Every theory Lesson SHALL contain between 350 and 700 words of body text in Spanish, at least two illustrations, at least three numbered steps and at least two takeaways.

#### Scenario: Too thin
- **WHEN** a theory Lesson has fewer than 350 words or fewer than two illustrations
- **THEN** the content check fails

#### Scenario: Too long
- **WHEN** a theory Lesson exceeds 700 words
- **THEN** the content check fails

### Requirement: Derived reading time
The system SHALL show each Lesson's estimated reading time computed from the words of its text blocks in the active language at 180 words per minute, plus a fixed allowance for each illustration and video, rounded up to whole minutes with a minimum of one.

#### Scenario: Reading time
- **WHEN** a Lesson has 450 words and two illustrations
- **THEN** its Library card shows a whole number of minutes no lower than 3

#### Scenario: Content edited
- **WHEN** a Lesson's text grows
- **THEN** its estimated minutes update without editing the Lesson's definition

### Requirement: No placeholder badge on Lesson content
The system SHALL NOT show a "placeholder" or "provisional" badge on any Lesson card, Lesson top or Lesson block. Media that is missing or fails to load SHALL still show the themed placeholder without such a badge.

#### Scenario: Library card
- **WHEN** the user browses the Theory Library
- **THEN** no Lesson card carries a placeholder badge

#### Scenario: Lesson blocks
- **WHEN** any Lesson is opened
- **THEN** none of its image or video blocks, nor its top, carries a placeholder badge

#### Scenario: Missing media
- **WHEN** a Lesson image or video cannot be shown
- **THEN** the themed placeholder appears without a placeholder badge and the Lesson stays readable

### Requirement: Lesson YouTube videos are in the user's language
A Lesson's YouTube video SHALL be spoken in the user's active language. Each YouTube video of a Lesson SHALL be declared for one language, and the system SHALL show a Lesson's YouTube video block only when the Lesson has a video in the active language. It SHALL NOT show a video in another language instead. Lesson Animations, which carry no words, are shown in every language.

#### Scenario: Video in the active language
- **WHEN** the user opens a Lesson that has a YouTube video in the active language
- **THEN** that video's block is shown after the do / don't comparison

#### Scenario: No video in the active language
- **WHEN** the user opens a Lesson whose YouTube videos are all in other languages, or that has none
- **THEN** no YouTube block is shown, reading time counts no YouTube video, and the Lesson Animation, if any, is still shown

### Requirement: Plus-gated video demonstrations
The system SHALL restrict video demonstration playback to users with LeadMate Plus. For free users, the video block SHALL display a locked preview overlay over the poster art with an unlock button that opens the paywall while retaining the pending play action. For Plus users (trial or full), the video block SHALL display an unlocked Plus badge and allow direct playback.

#### Scenario: Free user encounters video demonstration
- **WHEN** a user without an active Plus membership views a Lesson containing a video block
- **THEN** the video card displays a locked overlay and an unlock button, and tapping the unlock button opens the paywall

#### Scenario: Active trial user plays video demonstration
- **WHEN** a user with an active trial views a Lesson containing a video block
- **THEN** the video card displays a "Desbloqueado con Plus" badge and the play button starts video playback

#### Scenario: Reading non-video content remains unrestricted
- **WHEN** a free user reads a Lesson with a gated video block
- **THEN** all headings, body text, illustrations, steps, tips, and takeaways remain fully accessible and readable


### Requirement: Rest lesson covers size, place and the free-run myth
The "En casa se descansa" Lesson (`theory-home-rest`) SHALL teach the size of the safe space, where to put it, and why giving the dog the whole house is not kinder, within the teaching pattern and depth limits. Its do / don't comparison and two illustrations SHALL match this content.

#### Scenario: Size criterion
- **WHEN** the Lesson is opened
- **THEN** it states that the space lets the dog stand, turn 360 degrees and lie stretched on its side, and does not call a larger space better

#### Scenario: Place criterion
- **WHEN** the Lesson is opened
- **THEN** it says to put the safe space in a quiet zone without busy corridors

#### Scenario: Whole-house myth
- **WHEN** the Lesson is opened
- **THEN** it says that total freedom at home means more vigilance, more risks and less hygiene control for the dog

#### Scenario: Pattern and depth kept
- **WHEN** the content check runs on the Lesson
- **THEN** it passes: every teaching-pattern section is present, the body is 350 to 700 words, and there are at least two illustrations, three numbered steps and two takeaways
