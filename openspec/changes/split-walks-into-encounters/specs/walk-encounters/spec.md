# Spec Delta

## Purpose

Defines Encounters, short walking set pieces built around one situation and one decision (the Aim), their 1-to-3-Paw result, the one-tap instant retry, and the Encounter Series that can replace a Node's single long walking Stage.

## ADDED Requirements

### Requirement: An Encounter is one short situation with one decision
An Encounter SHALL be a walking Stage with its own id, title, Aim and scenario, built around one situation (such as one Distractor crossing or one corner) and one decision. It SHALL end by the scenario's existing end conditions: a final waypoint or a time limit. A time-limited Encounter SHALL last 10 to 20 seconds. Each attempt at an Encounter SHALL be a separate Stage.

#### Scenario: Time-limited Encounter ends
- **WHEN** an Encounter with a 15-second time limit has run for 15 seconds
- **THEN** the Encounter ends and its result card is shown

#### Scenario: Waypoint Encounter ends
- **WHEN** the Handler reaches the final waypoint of a waypoint-ended Encounter
- **THEN** the Encounter ends and its result card is shown

#### Scenario: Normal play inside an Encounter
- **WHEN** an Encounter is running
- **THEN** leash physics, Marker grades, Feedback Messages, combos and Sintonía behave exactly as in any other walking Stage, and combos and Sintonía start from zero as in any new Stage

### Requirement: Encounter Aims
Each Encounter SHALL declare exactly one Aim, the decision it tests: `keep-slack` (reach the end with Rigid Pull at most 25% of the time and the Dog never Reactive), `stay-calm` (the Dog never reaches the Reactive tier), `mark-disengagement` (at least one Marker hit) or `check-in` (at least one Check-in hit). `keep-slack` and `stay-calm` Encounters SHALL be waypoint-ended, so they cannot be met by standing still.

#### Scenario: Aim met by a Marker hit
- **WHEN** a `mark-disengagement` Encounter ends with one Marker hit
- **THEN** its Aim is met

#### Scenario: Aim missed by a passing Distractor
- **WHEN** a `mark-disengagement` Encounter ends after the Distractor left before the calm period completed and no Marker hit was recorded
- **THEN** its Aim is not met

#### Scenario: Stay calm broken
- **WHEN** the Dog reaches the Reactive tier during a `stay-calm` Encounter
- **THEN** its Aim is not met

#### Scenario: Keep slack
- **WHEN** a `keep-slack` Encounter ends with 20% Rigid Pull and the Dog never Reactive
- **THEN** its Aim is met

#### Scenario: No credit for standing still
- **WHEN** the user does not walk during a `stay-calm` Encounter
- **THEN** the Encounter does not end until the Handler reaches its final waypoint, so the Aim cannot be met without passing the situation

### Requirement: One to three Paws
Every ended Encounter attempt SHALL earn 1, 2 or 3 Paws from its own debrief payload: 1 Paw when the Aim is not met, 2 Paws when the Aim is met, and 3 Paws when the Aim is met cleanly. The Paws SHALL be a pure function of the Aim and the payload, so the same seed, inputs and Dog snapshot always give the same Paws.

#### Scenario: Aim not met
- **WHEN** a `check-in` Encounter ends with no Check-in hit
- **THEN** it earns 1 Paw

#### Scenario: Aim met, not clean
- **WHEN** a `mark-disengagement` Encounter ends with one Good Marker hit, no Perfect mark and 5% Rigid Pull
- **THEN** it earns 2 Paws

#### Scenario: Reproducible
- **WHEN** the same Encounter is played twice with the same seed, the same inputs and the same Dog snapshot
- **THEN** both attempts earn the same Paws

### Requirement: Clean result
A met Aim SHALL count as clean, earning 3 Paws, only when all of these hold: the Dog never reached the Reactive tier (not required for a `mark-disengagement` Aim, because a Marker hit can only follow a Fixation, which is itself the Reactive tier), Rigid Pull was at most 10% of the Encounter, no reactive Marker press and no Late Marker press was recorded, and, for a `mark-disengagement` or `check-in` Aim, at least one mark (a Marker hit or a Check-in hit) was graded Perfect.

#### Scenario: Perfect mark
- **WHEN** a `mark-disengagement` Encounter ends with one Perfect Marker hit after the Dog's Fixation (so the Dog reached the Reactive tier), 4% Rigid Pull and no Late or reactive press
- **THEN** it earns 3 Paws

#### Scenario: Reactive tier still spoils other Aims
- **WHEN** a `check-in` Encounter ends with one Perfect Check-in hit, 4% Rigid Pull, no Late or reactive press, and the Dog reached the Reactive tier
- **THEN** it earns 2 Paws

#### Scenario: Too much pull
- **WHEN** a `stay-calm` Encounter ends with the Dog never Reactive and 15% Rigid Pull
- **THEN** it earns 2 Paws

#### Scenario: Late press spoils it
- **WHEN** a `check-in` Encounter ends with one Perfect Check-in hit and one Late Marker press
- **THEN** it earns 2 Paws

### Requirement: Encounter result card
When an Encounter ends, the system SHALL show its Paws and title over the ended Stage with a Retry action and a Next action, and SHALL show one line saying what the next Paw needs, taken from the first condition that was not met in the order: Aim, Reactive tier (skipped for a `mark-disengagement` Aim), Rigid Pull, reactive Marker press, Late Marker press, Perfect mark. At 3 Paws it SHALL say the Encounter is done perfectly instead. All text SHALL come from the localization catalog.

#### Scenario: Two Paws
- **WHEN** a `mark-disengagement` Encounter ends with 2 Paws because its only mark was graded Good
- **THEN** the card shows 2 of 3 Paws, Retry and Next, and a line saying to mark right as the Dog looks away to earn the third Paw

#### Scenario: One Paw
- **WHEN** a `stay-calm` Encounter ends with 1 Paw because the Dog reached the Reactive tier
- **THEN** the line says to turn away or stop before the leash tightens

### Requirement: Result card holds the Stage
While an Encounter result card is shown, the Stage view SHALL draw no frames, and the Stage Back Control and system back SHALL open the Pause Menu over the card rather than leave the Series.

#### Scenario: No frames on the card
- **WHEN** an Encounter result card has been shown
- **THEN** the Stage view draws no further frames until Retry or Next

#### Scenario: Back on the result card
- **WHEN** the result card is shown and the user presses system back or the Stage Back Control
- **THEN** the Pause Menu is shown over the card, and Resume returns to the same card

### Requirement: Instant retry
Choosing Retry SHALL restart the same Encounter with the same seed and the same Dog snapshot, on the same Stage view, without a loading screen, the Theory Primer, the Checkpoint or any briefing, and the Encounter SHALL be running again within one second of the tap on the reference device. The finished attempt SHALL still count when the kept attempt is chosen.

#### Scenario: Retry
- **WHEN** the user taps Retry on an Encounter result card
- **THEN** the same Encounter restarts from its start with the same seed, and no Primer, Checkpoint, briefing or loading screen is shown

#### Scenario: Dog unchanged between attempts
- **WHEN** an Encounter is retried
- **THEN** the Dog's Learning Attributes and Trigger Profile are the same as for the previous attempt

### Requirement: Retrying never blocks progress
Next SHALL be available after every attempt whatever its Paws, and the number of retries SHALL be unlimited. Paws SHALL NOT lower Stars, progress or the Dog's record.

#### Scenario: Move on with one Paw
- **WHEN** an Encounter ends with 1 Paw and the user taps Next
- **THEN** the next Encounter of the Series starts, or the Node's Debrief opens after the last one

### Requirement: Encounter Series
A walking Node's Interactive Simulation SHALL be either one walking Stage or an Encounter Series: an ordered list of 3 to 5 Encounters played one after another. Next on an Encounter SHALL start the following Encounter directly, with a new seed and on the same Stage view, without going back through the Primer or Checkpoint. Every Encounter of a Series SHALL start from the Dog snapshot taken when the Series started. No advert SHALL be shown between Encounters or on a result card.

#### Scenario: Series order
- **WHEN** the user starts the Interactive Simulation of a Node with a four-Encounter Series
- **THEN** the four Encounters are played in their listed order and the Debrief opens after Next on the fourth

#### Scenario: Series progress shown
- **WHEN** the second Encounter of a four-Encounter Series is running
- **THEN** the screen shows the user is on Encounter 2 of 4 and the kept Paws of the first

#### Scenario: Same Dog for every Encounter
- **WHEN** the third Encounter of a Series starts after the first two were played
- **THEN** its Dog snapshot equals the one the first Encounter started from

### Requirement: Kept attempt per Encounter
For each Encounter in a Series, the system SHALL keep the attempt with the most Paws, the latest one on a tie, and SHALL use only kept attempts for the Node's result, Stars and Dog update. The Dog SHALL be updated once, when the Node's Debrief is reached after the last Encounter, never after an attempt.

#### Scenario: Best attempt kept
- **WHEN** an Encounter is played three times earning 1, 3 and 2 Paws
- **THEN** the second attempt is kept for that Encounter

#### Scenario: Tie keeps the latest
- **WHEN** an Encounter is played twice earning 2 Paws both times
- **THEN** the second attempt is kept

#### Scenario: Retries do not inflate learning
- **WHEN** an Encounter in which the user marks a calm Disengagement from a bicycle is played three times
- **THEN** the Node's result counts the calm Disengagements (`calmEncounters`) of the kept attempt only

### Requirement: Series score and Stars
The handling score of a Node played to the end of an Encounter Series SHALL be 1000 times the sum of the kept Paws divided by three times the number of Encounters in the Series, rounded, so the existing Star thresholds apply unchanged. Stars earned this way SHALL be kept at their best like any Node's Stars.

#### Scenario: All three Paws
- **WHEN** every Encounter of a four-Encounter Series keeps 3 Paws
- **THEN** the handling score is 1000 and the Node earns 3 Stars

#### Scenario: All two Paws
- **WHEN** every Encounter of a four-Encounter Series keeps 2 Paws
- **THEN** the handling score is 667 and the Node earns 2 Stars

#### Scenario: Mixed
- **WHEN** a four-Encounter Series keeps 3, 3, 2 and 2 Paws
- **THEN** the handling score is 833 and the Node earns 2 Stars

#### Scenario: Earlier Stars kept
- **WHEN** a user who earned 3 Stars on the long walk of a Node finishes its new Encounter Series with 2 Stars
- **THEN** the Node still shows 3 Stars

### Requirement: Debrief shows each Encounter
The Debrief of a Node played as an Encounter Series SHALL list each Encounter in order with its title, kept Paws (or "not played") and number of attempts, before the telemetry rows, and Play again SHALL restart the Series from its first Encounter with new seeds.

#### Scenario: Per-Encounter Paws
- **WHEN** the Debrief opens after a four-Encounter Series
- **THEN** it lists the four Encounters with their titles, Paws and attempts

#### Scenario: Play the Series again
- **WHEN** the user chooses Play again on that Debrief
- **THEN** the Series restarts at its first Encounter with new seeds, without the Primer or the Checkpoint

### Requirement: Leaving a Series early
Choosing Exit in the Pause Menu during an Encounter Series, while an Encounter runs or on its result card, SHALL end the whole Series and discard the running attempt. If every Encounter of the Series already has a kept attempt, the Series SHALL finish as if Next had been chosen on the last one; otherwise it SHALL be skipped.

#### Scenario: Exit after every Encounter was played
- **WHEN** the user retries the last Encounter of a Series in which every Encounter has a kept attempt and chooses Exit
- **THEN** the Series finishes from the kept attempts as if Next had been chosen, with Stars from the Series score and the Dog updated

### Requirement: Skipped Encounter Series
A skipped Encounter Series SHALL be treated like any skipped Stage: the Node's Debrief opens with completion credit and 1 Star, and the Dog is not updated. The Debrief SHALL list the kept Paws of the Encounters already played and mark the rest as not played.

#### Scenario: Exit on the third Encounter
- **WHEN** the user chooses Exit during the first attempt of the third Encounter of a four-Encounter Series
- **THEN** the Debrief opens, the Node counts as completed with 1 Star, the Dog's record is unchanged, the first two Encounters show their kept Paws and the last two show as not played

#### Scenario: Exit while retrying
- **WHEN** the user chooses Exit during a retry of the second Encounter, whose first attempt earned 2 Paws
- **THEN** the Debrief shows 2 Paws for the second Encounter and the running attempt is not counted

### Requirement: No saved Encounter Series
The system SHALL NOT save or resume an Encounter Series that was left before its Debrief; nothing from its attempts SHALL reach the Dog record.

#### Scenario: App closed mid-Series
- **WHEN** the app is closed during the third Encounter of a Series and reopened
- **THEN** no Encounter or Series is resumed, the Node is not completed by that play, and the Dog's record is as it was before the Series

### Requirement: Encounter attempts are measurable
When product analytics is available and not opted out, each Encounter attempt SHALL be reported as a Stage start and end carrying the Node id, Encounter id, Encounter attempt number and Paws, and nothing that identifies the user.

#### Scenario: Retry reported
- **WHEN** the user retries an Encounter once and analytics is on
- **THEN** two Stage ends are reported for that Encounter, with Encounter attempt numbers 1 and 2 and their Paws

#### Scenario: Opted out
- **WHEN** the user has turned analytics off
- **THEN** no Encounter attempt is reported

### Requirement: Prototype on one Stretch
Only the Node of the "walk with distractions" Stretch of World 3 (`walk-distraction`) SHALL be played as an Encounter Series in this change, and its Theory Primer, Checkpoint, Lessons and Mission SHALL stay as they are. Every other Node SHALL keep its single walking Stage, and the Daily Stage SHALL be unchanged.

#### Scenario: Prototype Node
- **WHEN** the user plays the `walk-distraction` Node from a pack that defines its Series
- **THEN** its Interactive Simulation is an Encounter Series

#### Scenario: Other Nodes unchanged
- **WHEN** the user plays the `blind-corner` Node or the Daily Stage
- **THEN** it runs as one walking Stage, as before, with the same handling score rule
