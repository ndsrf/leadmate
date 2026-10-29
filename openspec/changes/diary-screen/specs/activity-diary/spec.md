# Spec Delta

## Purpose

Keeps a dated record of what the user did with their Dog and lets them browse it day by day, as a month calendar or as a list of the days with activity.

## ADDED Requirements

### Requirement: Activity Log
The system SHALL log one dated entry for each Node Debrief reached, each Daily Stage play, each Lesson read for the first time and the guided first Stage, with the local date and time it happened.

#### Scenario: Node Debrief logged
- **WHEN** the user reaches the Debrief of a Node
- **THEN** an entry with that Node, the date and the time is added to the log

#### Scenario: Every Daily Stage play
- **WHEN** the user plays the Daily Stage twice on one day
- **THEN** both plays are logged, not only the day's best

#### Scenario: Lesson read once
- **WHEN** the user finishes a Lesson they had already read
- **THEN** no second entry is logged

### Requirement: What is not logged
The Activity Log SHALL NOT log warm-up walks, the Taste Stage or the Diagnostic.

#### Scenario: Warm-up walk
- **WHEN** the user finishes a warm-up walk
- **THEN** nothing is added to the log

### Requirement: Log entry details
Each logged Stage SHALL keep its handling score, duration, Slack and pull shares, peak Arousal, Marker accuracy, Marker hits, missed opportunities, check-ins, Poste successes, harsh stops, Sintonía time and Go Sniffs. A Node entry SHALL also keep the stars earned on that run, its Minigame metrics when it was a Minigame, and the real-world exercise its Debrief assigned.

#### Scenario: Stage numbers kept
- **WHEN** a Node Stage ends with a score of 900
- **THEN** its entry holds the score 900, three stars and the other Stage numbers

#### Scenario: Minigame metrics kept
- **WHEN** a Minigame Node ends
- **THEN** its entry holds the Minigame's metrics and no Stage numbers

### Requirement: Log is display-only and bounded
The Activity Log SHALL NOT change Learning Attributes, the Trigger Profile, the Streak, stars or completed Nodes. The system SHALL keep only the newest 500 entries, and SHALL drop unreadable stored entries without failing to load the Dog.

#### Scenario: Oldest entries dropped
- **WHEN** a 501st entry is logged
- **THEN** the oldest entry is removed

#### Scenario: Corrupt entry
- **WHEN** the stored log holds an entry with an unknown kind or an invalid date
- **THEN** that entry is dropped and the rest load

### Requirement: Reset clears the log
Reset Progress SHALL clear the Activity Log with the rest of the Dog's progress.

#### Scenario: After reset
- **WHEN** the user resets progress
- **THEN** the Diary is empty

### Requirement: Diary days
The Diary SHALL show, for each local calendar day, the logged entries in the order they happened, the Walk Diary check-ins, the best Daily Stage score and the start of the free trial, and SHALL include days dated before the log existed from the data that was already dated.

#### Scenario: Data from before the log
- **WHEN** a Dog has a Daily best and a Walk Diary entry but an empty log
- **THEN** both days appear in the Diary with that information

#### Scenario: First Stage before the log
- **WHEN** the first Stage was completed before the log existed
- **THEN** its day shows the first Stage

### Requirement: Diary entry
The World Map's Streak chip SHALL open the Diary over the map, and leaving the Diary SHALL return to the map at its previous scroll position. The Diary SHALL be free for every user and read-only: no notes, edits or Walk Diary answers are made from it.

#### Scenario: Open and close
- **WHEN** the user opens the Diary and goes back
- **THEN** the World Map shows at the same scroll position and the record is unchanged

### Requirement: Calendar view
The Diary SHALL offer a Monday-first month calendar that starts on the current month, moves to earlier and later months, and returns to today. Days with activity SHALL be highlighted with a mark for each kind of activity (Node, Daily Stage, Lesson, real-world exercise, first Stage), today SHALL be outlined, and the days of the live Streak SHALL be marked.

#### Scenario: Highlighted day
- **WHEN** the month holds a day with a Node run and a Walk Diary check-in
- **THEN** that day is highlighted and shows a Node mark and a real-world exercise mark

#### Scenario: Month across a year
- **WHEN** the user moves back from January
- **THEN** December of the previous year is shown

#### Scenario: Not colour alone
- **WHEN** a screen reader focuses a day
- **THEN** it reads the full date, whether it is today, the kinds of activity and whether it is a Streak day; and a legend names each mark colour

### Requirement: Day details on tap
Tapping a calendar day SHALL show everything known about that day below the calendar; a day with nothing logged SHALL say so. Today SHALL be selected when the Diary opens.

#### Scenario: Tap a highlighted day
- **WHEN** the user taps a highlighted day
- **THEN** its card shows each entry with its time and details

#### Scenario: Tap an empty day
- **WHEN** the user taps a day with no activity
- **THEN** the card says nothing was logged that day

### Requirement: Days-with-activity view
The Diary SHALL offer a second view listing only the days that have something to show, newest first, grouped under month headings, each with its full day card. With no activity at all it SHALL show an empty-state message.

#### Scenario: Only active days
- **WHEN** the user switches to the days-with-activity view
- **THEN** days without activity are not listed

#### Scenario: Empty Diary
- **WHEN** nothing has been logged yet
- **THEN** a message explains how to fill the Diary

### Requirement: Nodes and Lessons named apart
The Diary SHALL call Nodes walks ("paseos del mapa") and Lessons readings ("lecturas"), and SHALL never call a Node a Lesson.

#### Scenario: Node label
- **WHEN** a day holds a Node run
- **THEN** its mark and the totals call it a walk on the map, not a lesson

### Requirement: Day card content
A day card SHALL show the long date, a Today marker, a Streak-day marker, the number of activities and the kinds present. Each entry SHALL show its time and what it was: a Node with its World, kind (walk or Minigame), stars earned, Stage numbers or Minigame metrics and assigned exercise; a Daily Stage with its numbers; a Lesson with its title, day and reading time; a real-world exercise with its Node and outcome.

#### Scenario: Node run detail
- **WHEN** the day holds a Node walk
- **THEN** the card shows the Node title, its World, the stars of that run, its score and Stage numbers and the assigned exercise

#### Scenario: Removed content
- **WHEN** an entry refers to a Node or Lesson that no longer exists
- **THEN** the card still shows the entry, labelled as removed content

### Requirement: Diary totals
The Diary SHALL show totals: current and best Streak, Active Days (days that credited the Streak, so a day with only a Lesson read is not one), best score of any logged Stage or Daily best, Node runs, Daily Stage plays, Lessons read, real-world exercises (with how many were completed) and the date of the first active day.

#### Scenario: Totals
- **WHEN** the user played one Node, one Daily Stage at 800 and logged one completed exercise on two days
- **THEN** the totals show 2 Active Days, 1 Node run, 1 Daily play, a best score of 800 and 1 completed exercise

#### Scenario: Lesson-only day
- **WHEN** the only activity of a day is reading a Lesson
- **THEN** the day is highlighted with a Lesson mark but is not counted as an Active Day
