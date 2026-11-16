# recall-world Specification

## Purpose
Defines World 6, "The Park and Recall": its Stretches on sniffing walks ("Let them sniff", "Unpredictable walks", "Sniffing on your terms"), which build the Dog's choice to stay with the Handler while the park competes for its nose, before recall; how their Stages are scored by Stage Meters and replayed in the Debrief; and the World 3 hint that points to the World.

## Requirements

### Requirement: World 6 holds the unpredictable walks Stretch
World 6 SHALL be a Plus World unlocked by completing World 5. This change gives it one Stretch, unpredictable walks, which ends in exactly one Mission. Stretches for check-ins at distance, recall and play are added later by a separate change and are outside this requirement.

#### Scenario: Stretch loaded
- **WHEN** World 6 is loaded
- **THEN** its first Stretch is unpredictable walks, with its Lessons, Node and a last Mission Stop

#### Scenario: Plus gate
- **WHEN** a free user opens World 6
- **THEN** the Plus teaser and paywall button show and no Stop is playable

#### Scenario: Unlock
- **WHEN** a Plus user has not completed World 5
- **THEN** World 6 stays locked and names the missing World

#### Scenario: Completing World 6
- **WHEN** a Plus user passes the Mission of the unpredictable walks Stretch
- **THEN** World 6 is complete, and a note on the map says more Stretches are coming

### Requirement: Unpredictable walks Stretch
The first Stretch of World 6 SHALL teach that varied direction, pace and stops keep the dog engaged. It SHALL include a theory Lesson on why predictable walks lose the dog, a how-to Lesson with a short drill that teaches the dog to give way to light leash pressure, a Node Stop and a Mission.

#### Scenario: Stretch order
- **WHEN** the first Stretch of World 6 is listed
- **THEN** the theory Lesson comes first, then the how-to Lesson, then the Node, then the Mission

#### Scenario: Techniques covered
- **WHEN** a user finishes both Lessons
- **THEN** they have read about sudden turns, pace changes and stops, the structured cue versus Go Sniff, and when to mark and reward a Check-in

### Requirement: Stage scoring is provisional
The Node of this Stretch SHALL be scored with Rigid Pull and Check-in counts and SHALL NOT award Sintonía, because a sudden turn would break it. This scoring is interim and may be replaced by a later change.

#### Scenario: Sudden turn
- **WHEN** the Handler makes a sharp turn in this Node with a Slack leash
- **THEN** no Sintonía is lost or shown, and no Rigid Pull is counted

#### Scenario: Debrief
- **WHEN** the Stage ends
- **THEN** the Debrief reports tension and attention and offers one real-world exercise for the weaker one

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
