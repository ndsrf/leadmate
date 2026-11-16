# stage-action-feedback Specification

## Purpose
Tells the user immediately, during a walking Stage, what they just did right or wrong with a Feedback Message (a short text, a game-style effect, a sound and a haptic), so they learn handling the way the app teaches them to reward a Dog: at the moment it happens.

## Requirements

### Requirement: Right actions answer back
In every walking Stage, including the Daily Stage, the system SHALL show a right Feedback Message when the simulation reports: a Marker hit on a Disengagement, a Check-in hit, the Dog following a turn, a Disengagement, a Poste success, Sintonía starting, or Go Sniff started. Close leash exercises are out of scope.

#### Scenario: Check-in marked
- **WHEN** the user presses the Marker while the Dog checks in
- **THEN** a right Feedback Message, its icon, its effect, its sound and a haptic tick are shown within 100 ms

#### Scenario: Close exercise
- **WHEN** a close leash exercise is played
- **THEN** no Feedback Message is shown

### Requirement: Wrong actions answer back
In every walking Stage, including the Daily Stage, the system SHALL show a wrong Feedback Message when the simulation reports: a Marker miss, a Late Marker press, a reactive Marker, a wasted Marker, a missed opportunity, a Cue mismatch, a harsh stop, Rigid Pull starting, or Go Sniff ended by tension.

#### Scenario: Reactive Marker
- **WHEN** the user presses the Marker while the Dog is fixated
- **THEN** a wrong Feedback Message is shown that says the Dog was reacting and what to do instead

### Requirement: Hint first, short message after
Each kind of Feedback Message SHALL have a Hint, its fuller first-time form, shown the first time that kind happens for the Dog, and a short form shown every later time. A kind is recorded as seen in the Dog record's `seenHints` once its Hint has been shown in a recorded Stage. Resetting progress SHALL show the Hints again.

#### Scenario: First Check-in
- **WHEN** the user marks a Check-in for the first time with this Dog
- **THEN** the Hint is shown, for example "Perfect timing! {name} looked at you and you marked it.", and the kind is recorded as seen

#### Scenario: Later Check-in
- **WHEN** the user marks a Check-in after that kind was seen
- **THEN** the short form is shown, for example "Perfect!"

#### Scenario: Stage not recorded
- **WHEN** a Stage that is not recorded shows a Hint
- **THEN** the kind is not recorded as seen

### Requirement: Event Hints share the Feedback Message slot
The existing event Hints (the leash colours, the Marker, the Poste, and the leash first Taut or in Rigid Pull) SHALL be shown in the same one-at-a-time place as Feedback Messages and SHALL win over any Feedback Message due at the same time. When one of them covers the same event as a Feedback Message, only the Hint SHALL be shown. When they are shown and how they are remembered SHALL not change.

#### Scenario: First Rigid Pull
- **WHEN** the leash goes into Rigid Pull for the first time in a Stage
- **THEN** the leash Hint is shown and no separate Rigid Pull Feedback Message appears at the same time

### Requirement: Taste Stage shows only right messages
In the Taste Stage the system SHALL show only right Feedback Messages, never wrong ones, and SHALL record no Hint as seen, because that Stage is built to end with the Dog Reactive.

#### Scenario: Reaction in the Taste Stage
- **WHEN** the Dog fixates and the user presses the Marker during the Taste Stage
- **THEN** no wrong Feedback Message is shown

### Requirement: Wrong messages say what to try
Every wrong Feedback Message, Hint or short form, SHALL name what went wrong and what to try next, and SHALL NOT shame the user, remove Meter Points or progress, or block play.

#### Scenario: Late Marker press
- **WHEN** the user presses the Marker just after a Check-in window closed
- **THEN** the message says the look was over and to press while the Dog is looking

#### Scenario: Meter Points kept
- **WHEN** a wrong Feedback Message is shown in a Stage with Stage Meters
- **THEN** no Stage Meter loses Meter Points because of it

### Requirement: Effect tiers
Each Feedback Message SHALL come with an effect from one of four tiers: small (pop-up word, icon, small spark burst, about 0.6 s), medium (star burst and bounce, about 0.8 s), big (banner across the top, glowing screen edge and a Combo counter, about 1.2 s) and wrong (the word wobbles with a grey puff, about 0.6 s). The wrong tier SHALL NOT shake the screen or flash red.

#### Scenario: Perfect press
- **WHEN** the user presses the Marker with the Marker timing grade Perfect
- **THEN** the medium effect plays around the Dog

#### Scenario: Wrong action
- **WHEN** a wrong Feedback Message is shown
- **THEN** the wrong effect plays with no screen shake and no red flash

### Requirement: An icon per kind of action
Each kind of action SHALL have its own icon (paw for a followed turn, eye for a Check-in, nose for Go Sniff, hourglass for waiting, sparkle for a fresh move, star for a Chain, grey puff for a mistake), so actions can be told apart without reading and without relying on colour.

#### Scenario: Followed turn
- **WHEN** the Dog follows a turn
- **THEN** the paw icon is shown with the Feedback Message

### Requirement: Sound and haptic per tier
Each effect tier SHALL play its own short sound (a tick for small, a chime for medium, a fanfare for big, a soft "bonk" for wrong) and a haptic (a light tick for right actions, a soft thud for wrong ones), each subject to the user's sound and haptic settings.

#### Scenario: Sounds off
- **WHEN** the user has UI sounds off
- **THEN** effects play without sound and haptics still follow their own setting

### Requirement: One message at a time
The system SHALL show at most one Feedback Message at a time. When two actions happen together, the wrong one wins over the right one, then the higher tier wins. A message that loses SHALL be dropped, not queued. A new message SHALL replace one already showing only if it would win over it.

#### Scenario: Two at once
- **WHEN** a Check-in hit and Rigid Pull starting are reported on the same tick
- **THEN** only the Rigid Pull message is shown

#### Scenario: Nothing piles up
- **WHEN** five right actions happen within one second
- **THEN** no message is shown after the last one has finished

### Requirement: Combos merge repeats
Right actions of the same kind within 4 seconds of the previous one SHALL merge into one Combo message with a count ("Nice turn x3") instead of separate messages, and the small-tier tick SHALL rise in pitch with each step of the Combo, up to a cap. A wrong action ends every Combo.

#### Scenario: Three turns
- **WHEN** the Dog follows three turns, each within 4 seconds of the last
- **THEN** one message is updated to "x2" and then "x3", and the tick rises in pitch each time

### Requirement: Rigid Pull feedback is rate-limited
The Rigid Pull wrong Feedback Message SHALL be shown at most once every 8 seconds, so holding a tight leash does not repeat it constantly.

#### Scenario: Long pull
- **WHEN** the leash stays in Rigid Pull for 20 seconds
- **THEN** the Rigid Pull message is shown at most three times

### Requirement: Feedback never changes the Stage
Feedback Messages, effects, sounds and haptics SHALL NOT change the simulation, its inputs, its seeded results or its telemetry, SHALL NOT delay input, and SHALL NOT cover the controls.

#### Scenario: Same run with and without feedback
- **WHEN** a Stage runs twice with the same seed and inputs, once with Feedback Messages shown and once without
- **THEN** both debrief payloads are identical

### Requirement: Reduced motion and text
With reduced motion requested, the system SHALL replace bursts, bounces, wobbles and the screen-edge glow with fades that show the same message and icon. All Feedback Message text SHALL come from the i18n catalog in Spanish and English, use the Dog's name and each language's cue words, and fit its space without being clipped.

#### Scenario: Reduced motion
- **WHEN** reduced motion is requested and the user completes a Chain
- **THEN** the banner and icon fade in and out without moving, and the sound still plays

#### Scenario: English
- **WHEN** the app language is English
- **THEN** messages use English wordings and the cue words "Let's Go" and "Go Sniff"

### Requirement: Scent walk actions answer back
In a scent Stage the system SHALL also show a Feedback Message for these actions. Right: a granted sniff, a waited Plant, a waited marking, a fresh move followed by the Dog, a Chain (big tier), a Leave-it on food, a smart Jackpot. Wrong: a scent dragged past, a dragged Plant, an interrupted marking, food eaten, a repeated move the Dog ignores, a Go Sniff with nothing to sniff, a wasted Jackpot. Each wrong Feedback Message SHALL say what to try instead.

#### Scenario: Dragged Plant
- **WHEN** the Handler drags the Dog during a Plant into Rigid Pull
- **THEN** a wrong Feedback Message says the Dog was busy sniffing and to wait or turn instead

#### Scenario: Chain
- **WHEN** a Chain is recorded
- **THEN** the big-tier banner, Combo counter and fanfare play

#### Scenario: Repeated move
- **WHEN** the Handler repeats a move the Dog then ignores
- **THEN** a message says the Dog expected that one and to try something different
