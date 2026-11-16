# recall-world Specification

## Purpose
Defines World 6, "The Park and Recall": its Stretches on sniffing walks ("Let them sniff", "Unpredictable walks", "Sniffing on your terms"), which build the Dog's choice to stay with the Handler while the park competes for its nose, before recall; how their Stages are scored by Stage Meters and replayed in the Debrief; and the World 3 hint that points to the World.

## Requirements

### Requirement: World 6 holds the unpredictable walks Stretch
World 6 SHALL be a Plus World unlocked by completing World 5. It SHALL hold three Stretches in this order: "Let them sniff", "Unpredictable walks" and "Sniffing on your terms", each ending in exactly one Mission. Stretches for check-ins at distance, recall and play are added later by a separate change and are outside this requirement.

#### Scenario: Stretch loaded
- **WHEN** World 6 is loaded
- **THEN** its Stretches are "Let them sniff", "Unpredictable walks" and "Sniffing on your terms", in that order, each with its Lessons, Stage Nodes and a last Mission Stop

#### Scenario: Plus gate
- **WHEN** a free user opens World 6
- **THEN** the Plus teaser and paywall button show and no Stop is playable

#### Scenario: Unlock
- **WHEN** a Plus user has not completed World 5
- **THEN** World 6 stays locked and names the missing World

#### Scenario: Completing World 6
- **WHEN** a Plus user passes the Mission of the last of these Stretches
- **THEN** World 6 is complete, and a note on the map says more Stretches are coming

### Requirement: Unpredictable walks Stretch
The "Unpredictable walks" Stretch of World 6 SHALL teach that varied direction, pace and stops keep the dog engaged. It SHALL include a theory Lesson on why predictable walks lose the dog, a how-to Lesson with a short drill that teaches the dog to give way to light leash pressure, two Stage Nodes (turn and look, then keep it fresh) and a Mission.

#### Scenario: Stretch order
- **WHEN** the "Unpredictable walks" Stretch is listed
- **THEN** the theory Lesson comes first, then the how-to Lesson, then the turn-and-look Node, then the keep-it-fresh Node, then the Mission

#### Scenario: Techniques covered
- **WHEN** a user finishes both Lessons
- **THEN** they have read about sudden turns, pace changes and stops, the structured cue versus Go Sniff, and when to mark and reward a Check-in

#### Scenario: Smells to win the Dog back from
- **WHEN** either Node of this Stretch is played
- **THEN** it has Scent Spots, so walking on Autopilot lets the Dog drift toward smells

### Requirement: Cue words follow the language
Lessons, Checkpoints, Missions and captions SHALL use each language's own cue words: "Vamos" and "Olfatea" in Spanish, and "Let's Go" and "Go Sniff" in English.

#### Scenario: Spanish reader
- **WHEN** a Spanish user reads the Stretch
- **THEN** the cues appear as "Vamos" and "Olfatea" and no English cue word is left untranslated

### Requirement: Unpredictability follows the method rules
Every Lesson, Checkpoint question, image and Mission in World 6 SHALL follow the app's method rules. They SHALL NOT teach corrections, leash pops or repeated cues, SHALL describe leash pressure as light and released the instant the dog gives, and SHALL give an exit (turn around, leave, end the session) wherever triggers are involved.

#### Scenario: Pressure drill wording
- **WHEN** the yield-to-pressure drill is read
- **THEN** it asks for light tension released and rewarded the moment the dog moves toward the Handler, and it does not describe pulling the dog

#### Scenario: Mistake blocks
- **WHEN** a Lesson lists a common mistake
- **THEN** the mistake is a well-meant handler error such as talking too much or marking late, never an abusive method

### Requirement: Content in both languages
All text of this Stretch SHALL exist in Spanish and English, and its illustrations SHALL contain no words so one image set serves both languages.

#### Scenario: English reader
- **WHEN** a user whose language is English opens a World 6 Lesson
- **THEN** title, body, captions, alt text, quiz text and Mission text show in English with the same images

### Requirement: World 3 points ahead to World 6
The World 3 Lessons on the loose leash and the slack U SHALL each say in one short line that making walks unpredictable, so the dog keeps choosing the Handler, is taught in World 6. The line SHALL not make World 6 a prerequisite of anything in World 3.

#### Scenario: Teaser shown
- **WHEN** a user reads the World 3 loose-leash Lesson
- **THEN** it includes one line saying the idea returns in World 6 and names the World

#### Scenario: Free user
- **WHEN** a free user reads the teaser
- **THEN** the Lesson stays fully readable and no paywall opens from it

### Requirement: Let them sniff Stretch
The first Stretch of World 6 SHALL teach that sniffing is the Dog's main need on a walk and that Go Sniff, granted after a Check-in, is a reward. It SHALL hold a theory Lesson, one Stage Node in which Scent Spots pull the Dog and Go Sniff is available at any time, and a Mission whose target is to give Go Sniff at least 3 times on one walk, each right after the Dog looks at the Handler.

#### Scenario: Stretch order
- **WHEN** the "Let them sniff" Stretch is listed
- **THEN** the theory Lesson comes first, then the Node, then the Mission

#### Scenario: Only one new idea
- **WHEN** its Node is played
- **THEN** it has Scent Spots but no hot Scent Spots, no marking posts, no food and no Jackpot

### Requirement: Sniffing on your terms Stretch
The third Stretch of World 6 SHALL teach when to let the Dog sniff and when not: waiting out a Plant or marking instead of dragging, Leave-it for food, and a Jackpot for hard moments. It SHALL hold a theory Lesson, a how-to-play Lesson for the Jackpot, two Stage Nodes (Plant and marking, then food and the Jackpot) and a Mission whose target is to wait out 2 sniffing stops without pulling and use Leave-it once on food or rubbish, on one walk.

#### Scenario: Stretch order
- **WHEN** the "Sniffing on your terms" Stretch is listed
- **THEN** the theory Lesson comes first, then the Jackpot how-to-play Lesson, then the Plant-and-marking Node, then the food-and-Jackpot Node, then the Mission

#### Scenario: Jackpot taught before use
- **WHEN** the food-and-Jackpot Node is reached
- **THEN** the Jackpot how-to-play Lesson has already been read in this Stretch

### Requirement: World 6 Stages scored by Nose and Connection
Each Stage Node of World 6 SHALL declare Stage Meters: Nose, fed by granted sniffs, waited Plants, waited markings and Leave-it on food; and Connection, fed by Check-in hits after a followed change, fresh moves, Chains and smart Jackpots. The "Let them sniff" Node SHALL declare only Nose. Each Node SHALL weight its Meter Points toward its Stretch's technique. These Nodes SHALL NOT award Sintonía.

#### Scenario: Let them sniff
- **WHEN** the "Let them sniff" Node is played
- **THEN** only the Nose Stage Meter is shown and the handling score comes from it

#### Scenario: Dragging past every smell
- **WHEN** a user in the Plant-and-marking Node never grants a sniff and drags every Plant
- **THEN** the Nose Stage Meter stays low and the Node earns fewer Stars, even with many Check-ins

#### Scenario: Sudden turn
- **WHEN** the Handler makes a sharp turn in a World 6 Node with a Slack leash
- **THEN** no Sintonía is lost or shown

### Requirement: Debrief replays the walk
The Debrief of a World 6 Stage SHALL show the walk's timeline as a bar of right and wrong moments, let the user tap a moment to read its Feedback Message, and end with up to two things done well and one thing to try next, chosen from the Stage's results.

#### Scenario: Tap a moment
- **WHEN** the user taps a wrong moment on the Debrief timeline
- **THEN** the Feedback Message for that moment is shown, including what to try instead

#### Scenario: Summary
- **WHEN** the Debrief of a World 6 Stage is shown
- **THEN** it lists at most two things done well and exactly one thing to try next
