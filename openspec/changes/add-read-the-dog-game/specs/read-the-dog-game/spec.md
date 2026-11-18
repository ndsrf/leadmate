# Spec Delta

## Purpose

Read the Dog is a short reflex Minigame that teaches the user to read a dog's body language by playing: the Dog shows one body-language signal at a time and the user classifies it as Calm, Alert or About to react before a short timer runs out, getting value in seconds instead of reading text.

## ADDED Requirements

### Requirement: Round structure
A Read the Dog round SHALL last 24 seconds of play, counted from the user's start press. During the round the Dog SHALL show one body-language signal at a time, each followed by a pause before the next, longer after a wrong or missed answer than after a right one so its line can be read. When the time is up the round SHALL end and show its result. Time SHALL NOT run while the app is in the background.

#### Scenario: Round length
- **WHEN** the user presses start and plays without pausing
- **THEN** the round ends 24 seconds later and the result is shown

#### Scenario: One signal at a time
- **WHEN** a signal is showing
- **THEN** no other signal is shown until it has been answered or its timer has run out, and the short pause has passed

#### Scenario: Time to read a correction
- **WHEN** a signal is answered wrong
- **THEN** the pause before the next signal is longer than the pause after a right answer, and the signal's line stays shown during it

#### Scenario: Signal open at the end
- **WHEN** the round time runs out while a signal is still unanswered
- **THEN** that signal counts as neither right nor missed

#### Scenario: App sent to the background
- **WHEN** the app goes to the background for 10 seconds during a round
- **THEN** the round time and the answer timer resume where they stopped when the app returns

### Requirement: Body-language signals and their class
Every signal SHALL have exactly one correct Signal Class and a difficulty, fixed in one table: Calm (soft and loose, play bow, loose wag), Alert (ears up and still, lip lick, whale eye) and About to react (freeze and stare, hackles up, stiff closed mouth). Loose wag, lip lick, whale eye and stiff closed mouth SHALL be subtle; the others SHALL be obvious. A Signal Class is the reading of the pose shown; it is not the Dog's Reaction Tier and SHALL NOT be derived from Arousal or the simulation.

#### Scenario: Classes
- **WHEN** the table of signals is read
- **THEN** soft and loose, play bow and loose wag are Calm; ears up and still, lip lick and whale eye are Alert; freeze and stare, hackles up and stiff closed mouth are About to react

#### Scenario: Every class can appear
- **WHEN** a round is played at any difficulty level
- **THEN** each of the three classes has at least one signal that can be shown

### Requirement: Answering a signal
The user SHALL answer a signal with one tap on one of three always-visible buttons (Calm, Alert, About to react) or with a swipe on the scene (left for Calm, up for Alert, right for About to react). Each signal SHALL take one answer only. Input during the pause between signals or before the round starts SHALL be ignored.

#### Scenario: Tap answer
- **WHEN** the Dog shows a freeze and stare and the user taps About to react
- **THEN** the answer is right

#### Scenario: Swipe answer
- **WHEN** the Dog shows a play bow and the user swipes left
- **THEN** the answer is Calm and is right

#### Scenario: Second answer ignored
- **WHEN** the user taps Alert and then Calm on the same signal
- **THEN** only Alert counts

#### Scenario: Input in the pause
- **WHEN** the user taps a button during the pause between two signals
- **THEN** nothing is answered and the next signal is not affected

### Requirement: Answer timer
Each signal SHALL have an answer timer, shown as a draining bar with a text alternative. A signal not answered before its timer runs out SHALL count as missed. A round started without a carried level SHALL start its timer at 2.4 seconds, and no timer SHALL ever be shorter than 1.0 second. With a screen reader on, the longer screen-reader timer applies instead (see "Playable with a screen reader").

#### Scenario: Missed signal
- **WHEN** the timer of a signal runs out without an answer
- **THEN** the signal counts as missed and the next signal follows after the pause

#### Scenario: Bounds
- **WHEN** a round starts without a carried level and with no screen reader on
- **THEN** the first signal's timer is 2.4 seconds, and no signal in any round has a timer shorter than 1.0 second

### Requirement: Instant feedback naming the signal
Every answer and every missed signal SHALL get a Feedback Message within 100 ms that says right or wrong and gives a one-line name for the signal with its class, for example "Freeze: Luna is about to react". It SHALL use the Dog's name, or a neutral "your Dog" when the name is empty.

#### Scenario: Right answer
- **WHEN** the user answers a lip lick with Alert
- **THEN** within 100 ms a right Feedback Message shows the lip lick line naming it as Alert

#### Scenario: Wrong answer names the right class
- **WHEN** the user answers hackles up with Calm
- **THEN** a wrong Feedback Message shows the hackles line naming it as About to react

#### Scenario: Missed
- **WHEN** a whale eye signal is missed
- **THEN** a wrong Feedback Message shows the whale eye line naming it as Alert

### Requirement: One form of Feedback Message
Read the Dog Feedback Messages SHALL have one form only: they SHALL have no Hint and SHALL NOT record anything as seen in the Dog record. A new Feedback Message SHALL replace the one still showing.

#### Scenario: Replaced, not stacked
- **WHEN** a signal is answered while the previous Feedback Message is still showing
- **THEN** only the new Feedback Message is shown

#### Scenario: No Hint and nothing recorded as seen
- **WHEN** a round ends after several right and wrong answers
- **THEN** the Dog record's seen Hints are unchanged

### Requirement: Feedback tiers, sounds and haptics
Read the Dog Feedback Messages SHALL use the existing effect tiers with their sounds and haptics, subject to the user's sound and haptic settings: small for a right answer, medium for a right answer on a subtle signal or at a Combo of 3 or more, big with the Combo counter at every fifth step of a Combo (5, 10, 15 and so on), and wrong for a wrong or missed answer. The wrong tier SHALL NOT shake the screen or flash red.

#### Scenario: Subtle signal right
- **WHEN** the user answers a stiff closed mouth correctly with no Combo running
- **THEN** the medium effect plays with its chime and a light tick haptic

#### Scenario: Fifth in a row
- **WHEN** the user gives a fifth right answer in a row
- **THEN** the big effect plays with the Combo counter and the fanfare

#### Scenario: Combo of 3 is not big
- **WHEN** the user gives a third right answer in a row on an obvious signal
- **THEN** the medium effect plays, not the big one

#### Scenario: Wrong answer
- **WHEN** the user answers wrong
- **THEN** the wrong effect plays with the soft "bonk" and a soft thud haptic, with no screen shake and no red flash

### Requirement: Combo
Right answers in a row SHALL build a Combo shown as a counter, and the small-tier tick SHALL rise in pitch with each step up to the existing cap. A wrong or missed answer SHALL end the Combo. The round SHALL remember its best Combo.

#### Scenario: Building a Combo
- **WHEN** the user gives three right answers in a row
- **THEN** the counter shows x3

#### Scenario: Combo broken
- **WHEN** the user misses a signal during a Combo of 4
- **THEN** the counter is cleared and the best Combo of the round stays at least 4

### Requirement: Score
The round SHALL keep a score that only right answers raise: each right answer SHALL add points that grow with how much of its timer was left and with the running Combo. Wrong and missed answers SHALL NOT remove points.

#### Scenario: Faster is worth more
- **WHEN** two right answers are given on the same Combo step, one with more of its timer left
- **THEN** the faster one adds more points

#### Scenario: No penalty
- **WHEN** the user answers wrong
- **THEN** the score does not go down

### Requirement: Difficulty adapts to the user
The round SHALL keep a difficulty level that starts at the lowest level, or at the level carried from the previous round on a replay. Three right answers in a row SHALL raise it one level and two wrong or missed answers in a row SHALL lower it one level; after each change the count toward the next change SHALL start again from zero. A higher level SHALL give a shorter answer timer, and subtle signals SHALL appear only from the third level up.

#### Scenario: Getting faster
- **WHEN** the user answers three signals right in a row at the lowest level
- **THEN** the next signal's timer is shorter than 2.4 seconds

#### Scenario: Easing off
- **WHEN** the user misses two signals in a row above the lowest level
- **THEN** the next signal's timer is longer than the one before

#### Scenario: One level per run of three
- **WHEN** the user answers four signals right in a row from the lowest level
- **THEN** the level has risen exactly one step

#### Scenario: Subtle signals come later
- **WHEN** the level is one of the two lowest
- **THEN** only obvious signals are shown

### Requirement: Missed signals come back more often
A signal answered wrong or missed SHALL become more likely to be drawn again later in the round and in an instant replay, and a right answer on it SHALL make it less likely again, never below its starting chance. The same signal SHALL NOT be shown twice in a row.

#### Scenario: Weak signal repeats
- **WHEN** the user misses whale eye twice and a long run of signals is drawn with the same seed
- **THEN** whale eye is shown more often than in the same run where it was answered right

#### Scenario: No immediate repeat
- **WHEN** any signal is shown
- **THEN** the next signal is a different one

### Requirement: Seeded and repeatable
The order of signals SHALL come only from the round's seed, the difficulty level and the user's answers, with no other source of randomness. Two rounds with the same seed, starting state and answers at the same times SHALL show the same signals and give the same result. A round SHALL NOT change the Dog's Learning Attributes.

#### Scenario: Same seed, same round
- **WHEN** a round is played twice with the same seed and the same answers at the same times
- **THEN** both show the same signals in the same order and report identical results

#### Scenario: Dog unchanged
- **WHEN** a round ends, whether or not it is the round whose latency the Diagnostic records
- **THEN** the round itself has not read or changed the Dog's Learning Attributes; only the onboarding Diagnostic's one-time recording does

### Requirement: Reaction latency
The round SHALL report a reaction latency in seconds on the same scale as the reflex Diagnostic it replaces. Each right answer SHALL count as its time to answer minus a fixed allowance for choosing between three answers, kept within 0 to 1.5 seconds; each missed signal SHALL count as 1.5 seconds; the latency SHALL be the median of these values. Wrong answers and a signal still open at the end SHALL NOT count, and a round with nothing counted SHALL report 1.5 seconds.

#### Scenario: Quick and right
- **WHEN** every signal of a round is answered right, quickly
- **THEN** the reported latency is lower than in a round where the same signals were answered right more slowly

#### Scenario: Nothing answered
- **WHEN** the user answers no signal in the round, so every closed signal is missed
- **THEN** the reported latency is 1.5 seconds

#### Scenario: Only wrong answers
- **WHEN** every answer in the round is wrong
- **THEN** the reported latency is 1.5 seconds

#### Scenario: Wrong answers ignored
- **WHEN** a round has right answers and some quick wrong answers
- **THEN** the latency is the same as for the same round without the wrong answers

### Requirement: Round result
At the end of a round the system SHALL show the score, the best Combo, the share of signals answered right and the signals answered wrong or missed, each named, and SHALL report one round result with the score, best Combo, right, wrong and missed counts per class, the end level and the reaction latency.

#### Scenario: Result shown
- **WHEN** a round ends with a lip lick missed
- **THEN** the result shows the score, best Combo and share right, and names lip lick among the signals to watch

#### Scenario: Result reported once
- **WHEN** a round ends
- **THEN** exactly one round result is passed to the screen's result callback for it, and it holds no name or free text

### Requirement: Instant replay
The round result SHALL offer a replay that starts a new round at once with one tap and no other screen in between. The new round SHALL use a new seed, derived from the first round's seed and the replay count, and SHALL start from the difficulty level and signal chances the previous round ended with. Level and signal chances SHALL last only while the screen is open; they are not saved.

#### Scenario: Play again
- **WHEN** the user taps replay on the result
- **THEN** a new round starts at once, its first timer matches the level the previous round ended at, and its signals can differ

### Requirement: Readable without motion, colour or sight
With reduced motion requested, signals SHALL change at once as still poses and effects SHALL fade instead of moving, with the same information shown. Buttons SHALL show text and an icon and meet the 44-point target. Swipes SHALL be optional: every answer SHALL also be possible with the buttons.

#### Scenario: Reduced motion
- **WHEN** reduced motion is requested and the user answers right
- **THEN** the Feedback Message fades in and out without moving, and the next signal appears without animation

#### Scenario: Not colour only
- **WHEN** a Feedback Message says right or wrong
- **THEN** it carries an icon and words, not colour alone

### Requirement: Playable with a screen reader
Before an answer, a screen reader SHALL describe the Dog's body without naming the class, and SHALL read the Feedback Message line after it. With a screen reader on, the level SHALL stay at the lowest and every answer timer SHALL be a screen-reader timer of 6 seconds, so the description can be heard before time runs out.

#### Scenario: Screen reader
- **WHEN** a screen reader is on and a hackles up signal appears
- **THEN** it announces a description of the Dog's body such as raised fur along the back, not the words About to react, and the timer is 6 seconds

### Requirement: Read the Dog text from the catalog
All Read the Dog text (help, buttons, signal lines, screen-reader descriptions, result and replay) SHALL come from the i18n catalog in every supported language, and SHALL fit its space without clipping on a 320-point-wide screen.

#### Scenario: English
- **WHEN** the app language is English
- **THEN** every Read the Dog label, signal line and result text is in English

#### Scenario: Spanish
- **WHEN** the app language is Spanish
- **THEN** every Read the Dog label, signal line and result text is in Spanish
