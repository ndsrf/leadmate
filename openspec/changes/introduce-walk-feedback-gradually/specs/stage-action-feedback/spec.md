# Spec Delta

## MODIFIED Requirements

### Requirement: Right actions answer back
In every walking Stage, including the Daily Stage, the system SHALL show a right Feedback Message when the simulation reports one of these actions and it is Introduced in that Stage: a Marker hit on a Disengagement, a Check-in hit, the Dog following a turn, a Disengagement, a Poste success, Sintonía starting, or Go Sniff started. Close leash exercises are out of scope.

#### Scenario: Check-in marked
- **WHEN** the user presses the Marker while the Dog checks in
- **THEN** a right Feedback Message, its icon, its effect, its sound and a haptic tick are shown within 100 ms

#### Scenario: Close exercise
- **WHEN** a close leash exercise is played
- **THEN** no Feedback Message is shown

#### Scenario: Not yet Introduced
- **WHEN** the Dog follows a turn in a Stage where the followed turn is not Introduced
- **THEN** no Feedback Message, icon, effect, sound or haptic is shown for it

### Requirement: Wrong actions answer back
In every walking Stage, including the Daily Stage, the system SHALL show a wrong Feedback Message when the simulation reports one of these actions and it is Introduced in that Stage: a Marker miss, a Late Marker press, a reactive Marker, a wasted Marker, a missed opportunity, a Cue mismatch, a harsh stop, Rigid Pull starting, or Go Sniff ended by tension.

#### Scenario: Reactive Marker
- **WHEN** the user presses the Marker while the Dog is fixated
- **THEN** a wrong Feedback Message is shown that says the Dog was reacting and what to do instead

#### Scenario: Harsh stop before the Poste is taught
- **WHEN** the user stops abruptly in a Stage where the harsh stop is not Introduced
- **THEN** no wrong Feedback Message is shown for it

### Requirement: Hint first, short message after
Each kind of Feedback Message SHALL have a Hint, its fuller first-time form, shown the first time that kind happens for the Dog in a Stage where it is Introduced, and a short form shown every later time. A kind is recorded as seen in the Dog record's `seenHints` once its Hint has been shown in a recorded Stage; a kind that was not shown SHALL NOT be recorded as seen. Resetting progress SHALL show the Hints again.

#### Scenario: First Check-in
- **WHEN** the user marks a Check-in for the first time with this Dog
- **THEN** the Hint is shown, for example "Perfect timing! {name} looked at you and you marked it.", and the kind is recorded as seen

#### Scenario: Later Check-in
- **WHEN** the user marks a Check-in after that kind was seen
- **THEN** the short form is shown, for example "Perfect!"

#### Scenario: Stage not recorded
- **WHEN** a Stage that is not recorded shows a Hint
- **THEN** the kind is not recorded as seen

#### Scenario: First followed turn after it is Introduced
- **WHEN** the Dog followed turns in earlier Stages where the followed turn was not Introduced, and then follows a turn in `park-unpredictable`
- **THEN** the followed-turn Hint is shown there, not the short form

### Requirement: Event Hints share the Feedback Message slot
The existing event Hints (the leash colours, the Marker, the Poste, and the leash first Taut or in Rigid Pull) SHALL be shown in the same one-at-a-time place as Feedback Messages and SHALL win over any Feedback Message due at the same time. When one of them covers the same event as a Feedback Message, only the Hint SHALL be shown. The Poste Hint SHALL be shown only in a Stage where the Poste is Introduced. Otherwise, when they are shown and how they are remembered SHALL not change.

#### Scenario: First Rigid Pull
- **WHEN** the leash goes into Rigid Pull for the first time in a Stage
- **THEN** the leash Hint is shown and no separate Rigid Pull Feedback Message appears at the same time

#### Scenario: Poste before it is taught
- **WHEN** the user holds a Poste in the guided first Stage
- **THEN** the Poste Hint is not shown and is not recorded as seen

### Requirement: Combos merge repeats
Right actions of the same kind within 4 seconds of the previous one SHALL merge into one Combo message with a count ("Nice turn x3") instead of separate messages, and the small-tier tick SHALL rise in pitch with each step of the Combo, up to a cap. A wrong action ends every Combo. An action that is not Introduced in the Stage SHALL neither join nor end a Combo.

#### Scenario: Three turns
- **WHEN** the Dog follows three turns, each within 4 seconds of the last
- **THEN** one message is updated to "x2" and then "x3", and the tick rises in pitch each time

#### Scenario: Hidden wrong action
- **WHEN** a Check-in Combo is running and the user stops abruptly in a Stage where the harsh stop is not Introduced
- **THEN** the Combo continues

### Requirement: Scent walk actions answer back
In a scent Stage the system SHALL also show a Feedback Message for these actions when they are Introduced in that Stage. Right: a granted sniff, a waited Plant, a waited marking, a fresh move followed by the Dog, a Chain (big tier), a Leave-it on food, a smart Jackpot. Wrong: a scent dragged past, a dragged Plant, an interrupted marking, food eaten, a repeated move the Dog ignores, a Go Sniff with nothing to sniff, a wasted Jackpot. Each wrong Feedback Message SHALL say what to try instead.

#### Scenario: Dragged Plant
- **WHEN** the Handler drags the Dog during a Plant into Rigid Pull
- **THEN** a wrong Feedback Message says the Dog was busy sniffing and to wait or turn instead

#### Scenario: Chain
- **WHEN** a Chain is recorded
- **THEN** the big-tier banner, Combo counter and fanfare play

#### Scenario: Repeated move
- **WHEN** the Handler repeats a move the Dog then ignores
- **THEN** a message says the Dog expected that one and to try something different

#### Scenario: Jackpot before it is taught
- **WHEN** a smart Jackpot happens in a scent Stage placed before the Node that Introduces it
- **THEN** no Feedback Message is shown for it
