# Spec Delta

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Stage scoring is provisional
**Reason**: Replaced by Stage Meters on every Stage of World 6 (ADR 0029).
**Migration**: `park-unpredictable` keeps its id and is scored by its Stage Meters; Stars already earned on it are kept, because Stars merge by maximum.

## ADDED Requirements

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
