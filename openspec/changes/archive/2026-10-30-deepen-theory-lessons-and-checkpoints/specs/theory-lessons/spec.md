# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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

### Requirement: Final Lessons carry no placeholder badge
A Lesson whose text and media are final SHALL NOT be marked placeholder, and SHALL NOT show the placeholder badge on its card, at its top, or on any of its blocks.

#### Scenario: Rewritten Lesson
- **WHEN** a theory Lesson has been rewritten and all its illustrations are bundled
- **THEN** neither its Library card nor any of its blocks shows the placeholder badge

#### Scenario: Stand-in video kept
- **WHEN** a final Lesson still uses a stand-in video
- **THEN** only that video block carries the placeholder badge
