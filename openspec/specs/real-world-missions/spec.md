# real-world-missions Specification

## Purpose
Turns simulator training into real walks. Each Stretch of a World ends in a Mission that sets one concrete real-world target. The user checks it in on a later day, and the Mission helps them correct what went wrong before the trail moves on.

## Requirements

### Requirement: Mission brief
A Mission Stop SHALL show a brief with one concrete real-world target: what to do, how many times, and what success looks like. It SHALL also show "Tu foco", the exercise from the user's latest Debrief in the Stretch, and the Stops that train the target. The wait SHALL start only when the user taps "Start mission".

#### Scenario: Brief after the last Debrief
- **WHEN** the user leaves the Debrief of the last Node Stop in a Stretch
- **THEN** the Mission brief opens with the action, the repetition target, the success sign, "Tu foco" and a "Start mission" action

#### Scenario: Brief closed without starting
- **WHEN** the user closes the brief without tapping "Start mission"
- **THEN** the Mission is next-up on the World Map and has not started

#### Scenario: Mission started
- **WHEN** the user taps "Start mission"
- **THEN** the Mission is active, the start time is recorded and the Stop shows as waiting

### Requirement: Check-in opens on a later day
A Mission check-in SHALL open only when two conditions both hold: it is a later local calendar day than the Mission's start or last check-in, and at least 8 hours have passed since then. Until then, the Mission SHALL show its target and say when the check-in opens.

#### Scenario: Same day
- **WHEN** a Mission was started today
- **THEN** no check-in answer can be chosen and the Stop says the check-in opens tomorrow

#### Scenario: Just past midnight
- **WHEN** a Mission was started at 23:50 and it is now 00:10 on the next day
- **THEN** the check-in is still closed and the Stop says it opens at 07:50

#### Scenario: Next morning
- **WHEN** a Mission was started at 23:50 and it is now 08:00 on the next day
- **THEN** the check-in asks "How did it go?" with the three Walk Diary answers

#### Scenario: Next day
- **WHEN** a Mission was started yesterday at 18:00 and it is now 10:00
- **THEN** the check-in is open

#### Scenario: Clock moved back
- **WHEN** the device time is earlier than the Mission's start
- **THEN** the check-in stays closed

### Requirement: Mission gate
While a Mission is not passed, every Stop after it in World order SHALL stay locked. The Stops before it, the Daily Stage and the Theory Library SHALL stay available.

#### Scenario: Practice while waiting
- **WHEN** a Mission is waiting for its check-in
- **THEN** the user can replay any completed Stop of that Stretch or earlier ones, and the first Stop after the Mission is locked with the reason "Finish the mission first"

#### Scenario: No other daily cap
- **WHEN** the user has an open Stretch with several Stops not yet done
- **THEN** they can complete all of them on the same day, up to the Mission

### Requirement: Successful check-in
Answering "¡Conseguido!" SHALL pass the Mission. The next Stretch, or the next World when this was the World's last Mission, SHALL open at once.

#### Scenario: Pass
- **WHEN** the user answers "¡Conseguido!" on an open check-in
- **THEN** the Mission shows as done, the Stop after it becomes next-up and a celebration plays

### Requirement: Struggled check-in leads to a Fix
Answering "Costó un poco" SHALL ask what went wrong, using the Mission's fixed list of problems plus "Otra cosa", with no free-text entry. It SHALL then show the Fix for the chosen problem. The Mission SHALL stay active with the Fix's easier target and SHALL restart its wait.

#### Scenario: Problem chosen
- **WHEN** the user answers "Costó un poco" on the harness Mission and picks "Se excita al ver el arnés"
- **THEN** the Fix for that problem is shown

#### Scenario: Something else
- **WHEN** the user picks "Otra cosa"
- **THEN** the Mission's general Fix is shown

#### Scenario: Retry with the easier target
- **WHEN** a Fix has been shown
- **THEN** the Mission is waiting again with the Fix's easier target, and its check-in follows the later-day rule from now

### Requirement: Fix page
A Fix SHALL be a single scrollable page with, in order: reassurance that the problem is common, the likely cause, two or three concrete corrections illustrated by an image or video, the easier target for the next attempt, and a "Practise again" action. That action SHALL open the Stop that trains the correction.

#### Scenario: Fix content
- **WHEN** a Fix is shown
- **THEN** it presents the five parts in that order, and the corrections include at least one image or video block with caption and alt text

#### Scenario: Practise again
- **WHEN** the user taps "Practise again" on the harness Fix
- **THEN** the harness ritual Node starts, and finishing it returns to the World Map with the Mission still waiting

### Requirement: Easier target passes the Mission
When a Mission's active target is a Fix's easier target, answering "¡Conseguido!" SHALL pass the Mission. The full target does not have to be repeated.

#### Scenario: Easier target achieved
- **WHEN** the user struggled once, then answers "¡Conseguido!" on the easier target
- **THEN** the Mission is passed and the next Stretch opens

### Requirement: Moving on after repeated struggles
From the second "Costó un poco" on the same Mission, the Fix page SHALL also offer "Move on anyway". Choosing it SHALL pass the Mission and mark it "keep practising". The user is never stuck behind one Mission.

#### Scenario: First struggle
- **WHEN** the user answers "Costó un poco" on a Mission for the first time
- **THEN** the Fix page offers no way to move on

#### Scenario: Second struggle
- **WHEN** the user answers "Costó un poco" on the same Mission a second time and chooses "Move on anyway"
- **THEN** the Mission is passed, shown with a "keep practising" mark, and the next Stretch opens

### Requirement: Skipped check-in
Answering "Hoy no pudimos" SHALL leave the Mission active with its current target and restart its wait, with no advice and no penalty. After three "Hoy no pudimos" answers in a row on the same Mission, the system SHALL offer to switch to the Mission's easier target.

#### Scenario: Not today
- **WHEN** the user answers "Hoy no pudimos"
- **THEN** the Mission keeps its target, its check-in follows the later-day rule from now and the Dog's Learning Attributes are unchanged

#### Scenario: Third skip in a row
- **WHEN** the user answers "Hoy no pudimos" for the third consecutive check-in on the same Mission
- **THEN** the system offers the easier target, and accepting it makes that the active target

#### Scenario: Skip run broken
- **WHEN** a "Costó un poco" answer comes between two skips
- **THEN** the consecutive-skip count starts again

### Requirement: One check-in per Mission per day
The system SHALL accept at most one check-in answer per Mission per local calendar day.

#### Scenario: Second answer same day
- **WHEN** the user has already answered a Mission's check-in today
- **THEN** the Stop shows today's answer and offers no new check-in until the later-day rule allows it

### Requirement: Mission state is kept on the Dog and merged
Mission state SHALL be stored on the Dog record locally first. On multi-device sync, a passed Mission SHALL win over an active one, check-in history SHALL merge as a union, and the latest start SHALL decide the active target and the wait.

#### Scenario: Passed on one device
- **WHEN** device A has passed a Mission that device B still shows as waiting
- **THEN** after sync both devices show it passed

#### Scenario: History union
- **WHEN** device A logged a struggle on Monday and device B a skip on Tuesday for the same Mission
- **THEN** after sync the Mission's history holds both answers

### Requirement: Missions in existing progress
For a Dog whose record predates Missions, a Mission SHALL count as passed when it was never started and a Node Stop after it in its World is already completed, or when it is its World's last Mission and every Node Stop of its Stretch was completed before Missions existed. The user SHALL NOT be locked out of content they already reached.

#### Scenario: Returning user
- **WHEN** a user had completed all Nodes of World 1 before this change
- **THEN** World 1 shows every Mission passed and World 2 is open

#### Scenario: Partly through a World
- **WHEN** a user had completed only the first Node of World 1
- **THEN** the Missions after it are not passed, and the first unpassed Mission gates the Stops after it

### Requirement: Mission content is plain catalog data
Every Mission SHALL be data: target text, repetition count, success sign, the Stops it trains, a fixed list of problems each with a Fix, and a general Fix. A Fix holds Lesson-style blocks, an easier-target text and the Stop to practise again. All text SHALL come from the localization catalog and MAY be flagged placeholder.

#### Scenario: Placeholder Mission
- **WHEN** a Mission or Fix is flagged placeholder
- **THEN** its brief and Fix page carry the placeholder badge

#### Scenario: Missing translation
- **WHEN** a Mission string has no entry in the selected language
- **THEN** the Spanish text is shown
