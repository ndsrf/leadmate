# Spec Delta

## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Placeholder content is visibly provisional
**Reason**: The "Provisional" badges make the app look unfinished; the user asked to remove every one of them.
**Migration**: Lessons and their blocks lose the `placeholder` flag; missing media keeps the themed placeholder (see "No placeholder badge on Lesson content").

### Requirement: Final Lessons carry no placeholder badge
**Reason**: No Lesson is flagged placeholder any more, so the distinction between final and stand-in content no longer exists.
**Migration**: Covered by "No placeholder badge on Lesson content"; the conformance check applies to every theory Lesson.
