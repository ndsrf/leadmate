# cafe-world Specification

## Purpose

Defines World 7, "Terrazas y cafeterías". Its four Stretches teach a Handler to sit at a café terrace with the Dog: prepare the visit, settle the Dog at the table, handle waiters and passers-by, and leave in time. It also sets the method rules, languages and art those Stretches follow.

## Requirements

### Requirement: World 7 holds four terrace Stretches
World 7 SHALL be a playable Plus World unlocked by completing World 6, no longer a Preview. It SHALL hold four Stretches in this order: "Preparar la visita", "Relajación en mesa", "Paso de camareros" and "Irse a tiempo", each ending in exactly one Mission.

#### Scenario: Stretches loaded
- **WHEN** World 7 is loaded from the pack
- **THEN** its Stretches are "Preparar la visita", "Relajación en mesa", "Paso de camareros" and "Irse a tiempo", in that order, each with a last Mission Stop

#### Scenario: Plus gate
- **WHEN** a free user opens World 7
- **THEN** the Plus teaser and paywall button show and no Stop is playable

#### Scenario: Unlock
- **WHEN** a Plus user has not completed World 6
- **THEN** World 7 stays locked and names the missing World

#### Scenario: Completing World 7
- **WHEN** a Plus user passes the Mission of "Irse a tiempo" with every earlier Stop of World 7 done
- **THEN** World 7 is complete and World 8 unlocks as a Coming-soon World

### Requirement: Preparar la visita Stretch
The first Stretch SHALL teach choosing a table out of the waiters' path (a corner or wall, the Dog on the wall side), arriving after a sniffing walk, and bringing a mat. It SHALL hold a theory Lesson, a walking Stage Node arriving at a terrace on a city street with food on the ground, and a Mission for a first visit of about 10 minutes.

#### Scenario: Stretch order
- **WHEN** the "Preparar la visita" Stretch is listed
- **THEN** the theory Lesson comes first, then the Stage Node, then the Mission

#### Scenario: Food near the tables
- **WHEN** the Stage Node of this Stretch is played
- **THEN** food lies on the route near the terrace and Leave-it is available to pass it

#### Scenario: Which table
- **WHEN** the Checkpoint of this Node is shown
- **THEN** it includes an Image Duel between a corner table by the wall and a table on the waiters' lane, and the corner table is the right answer

### Requirement: Relajación en mesa Stretch
The second Stretch SHALL teach settling at the table: a mat that smells of home, a chew, treats dropped quietly while the Dog lies calm, and never paying begging. It SHALL hold a theory Lesson, a Terrace choose-the-action Minigame Node and a Mission to stay settled for one coffee.

#### Scenario: Stretch order
- **WHEN** the "Relajación en mesa" Stretch is listed
- **THEN** the theory Lesson comes first, then the Terrace Minigame Node, then the Mission

#### Scenario: When to reward
- **WHEN** the Checkpoint of the Terrace Minigame Node is shown
- **THEN** it includes an Image Duel between a treat dropped while the Dog lies calm and a treat given while the Dog sits whining at the table, and the calm one is the right answer

### Requirement: Paso de camareros Stretch
The third Stretch SHALL teach handling people and dogs passing the table: gather the leash short and slack, keep the Dog on the far side, put the Handler's body between the Dog and the passage, and mark when the Dog looks back. It SHALL hold a theory Lesson, a close-view exercise Node in which another dog passes by the table, and a Mission about waiters and passers-by.

#### Scenario: Stretch order
- **WHEN** the "Paso de camareros" Stretch is listed
- **THEN** the theory Lesson comes first, then the close-view Node, then the Mission

#### Scenario: Close-view controls
- **WHEN** the close-view Node of this Stretch is played
- **THEN** the Handler stays in place while a dog walks past, and gathering the leash, shielding and the Marker are available

#### Scenario: Leash as a waiter passes
- **WHEN** the Checkpoint of the close-view Node is shown
- **THEN** it includes an Image Duel between a short slack leash with the Dog beyond the chair and a long leash across the walkway, and the short slack leash is the right answer

### Requirement: Irse a tiempo Stretch
The fourth Stretch SHALL teach reading overload at the table (getting up off the mat, panting, whining, staring at food) and leaving while the Dog is still calm. It SHALL hold a theory Lesson and a Mission. The Mission's target SHALL be to leave a terrace visit while the Dog is still settled.

#### Scenario: Stretch order
- **WHEN** the "Irse a tiempo" Stretch is listed
- **THEN** the theory Lesson comes first, then the Mission

#### Scenario: Mission target
- **WHEN** the Mission of this Stretch is opened
- **THEN** its target asks the user to get up and leave while the Dog is still lying calm, before any overload signal

### Requirement: Terrace content follows the method rules
Every Lesson, Checkpoint question, image and Mission of World 7 SHALL follow the app's method rules. It SHALL reward calm instead of punishing begging, SHALL NOT teach corrections, leash pops or repeated cues, and SHALL give an exit (more distance, a shorter visit, leaving) in every Lesson that deals with triggers.

#### Scenario: Begging
- **WHEN** a World 7 Lesson discusses a Dog begging at the table
- **THEN** it says not to pay the begging and to reward the Dog once it is lying calm, and it does not suggest scolding or pushing the Dog away

#### Scenario: Mistake blocks
- **WHEN** a World 7 Lesson lists a common mistake
- **THEN** the mistake is a well-meant handler error, such as feeding from the plate or letting the leash run across the walkway, never an abusive method

#### Scenario: Exit
- **WHEN** a World 7 Lesson deals with waiters, passing dogs or overload
- **THEN** it tells the user they can move to a quieter table, shorten the visit or leave

### Requirement: Terrace rules are left to the venue
World 7 content SHALL NOT state whether dogs are allowed at terraces in any city or country. Where access comes up, it SHALL tell the user to ask the venue.

#### Scenario: Access mentioned
- **WHEN** a World 7 Lesson or Mission mentions whether dogs may sit at a terrace
- **THEN** it tells the user to ask the venue and cites no law or by-law

### Requirement: Terrace content in both languages
All World 7 text SHALL exist in Spanish and English: titles, Lessons, captions, alt text, Checkpoints, Image Duel descriptions and Missions. Its illustrations SHALL contain no words, so one image set serves both languages.

#### Scenario: English reader
- **WHEN** a user whose language is English opens a World 7 Lesson or Node
- **THEN** every text shows in English, with the same images as in Spanish

### Requirement: Terrace art from the shared kit
World 7 illustrations SHALL be drawn with the shared Lesson art kit, extended with terrace props, the waiter and the new Dog poses. They SHALL pass the kit's palette and no-words checks. Each theory Lesson SHALL have a concept image, a scene image and, where it has a do / don't block, art for both sides.

#### Scenario: Style check
- **WHEN** the Lesson art is rendered
- **THEN** every World 7 image uses only design-system colours and contains no text

#### Scenario: Duel images
- **WHEN** a World 7 Image Duel is shown
- **THEN** its two images carry no check, cross or other hint until the user answers
