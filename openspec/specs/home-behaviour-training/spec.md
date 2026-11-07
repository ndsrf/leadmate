# home-behaviour-training Specification

## Purpose
Defines the training content for the five Home Behaviours (biting the owner, biting other people, barking at home, destroying things, eating non-food things): their Lessons, exercises and Missions, where they sit on the World Map, and the safety notes that lead the biting and eating content.

## Requirements

### Requirement: Content for every Home Behaviour
Each Home Behaviour (biting the owner, biting other people, barking at home, destroying things, eating non-food things, being left alone) SHALL have a Lesson and a Mission, and every behaviour except the two biting ones SHALL also have an exercise. A Home Behaviour SHALL be removed from the known-gaps list when its content ships.

#### Scenario: Gap closed
- **WHEN** a Home Behaviour has all the parts it requires (Lesson and Mission, plus an exercise unless it is a biting behaviour)
- **THEN** it is no longer on the known-gaps list and its Home Stretch is no longer a "coming soon" placeholder

#### Scenario: Being alone covered
- **WHEN** the content of being left alone ships with a Lesson, an exercise and a Mission
- **THEN** it is not on the known-gaps list and the coverage test passes

### Requirement: Lessons
Each Home Behaviour SHALL have a theory Lesson that explains the behaviour and what to do about it.

#### Scenario: Lesson available
- **WHEN** the user opens a Home Behaviour's Home Stretch
- **THEN** its Lesson can be read

### Requirement: Exercises
Each Home Behaviour other than biting the owner and biting other people SHALL have an exercise, played as a minigame-mode Node with no simulated bite. The two biting behaviours SHALL NOT have an exercise.

#### Scenario: Exercise available
- **WHEN** the user opens the exercise of barking at home, destroying things, eating non-food things or being left alone
- **THEN** it runs as a minigame-mode Node

#### Scenario: No exercise for biting
- **WHEN** the user opens a biting Home Stretch
- **THEN** it has a Lesson and a Mission and no exercise, and this is not reported as a content gap

### Requirement: Missions
Each Home Behaviour SHALL have a real-world Mission that follows the existing Mission rules.

#### Scenario: Mission available
- **WHEN** the user finishes a Home Behaviour's exercise, or its Lesson for a biting behaviour
- **THEN** its Mission brief opens

### Requirement: Biting safety
The biting Home Stretches SHALL lead with the professional-help note and teach safe handling and early prevention first. Theory content for biting SHALL teach the canine ladder of aggression / stress traffic light, environmental management to eliminate high-risk conflict zones, and tactical de-escalation protocols including the trade-up ("intercambio") game and reverse timeouts.

#### Scenario: Vet advice on eating non-food
- **WHEN** the user opens the eating non-food Lesson, or sees the Remediation of its failed Mission check-in
- **THEN** the vet note is shown early in the Lesson and in the Remediation

#### Scenario: Note first
- **WHEN** the user opens a biting Lesson
- **THEN** the professional-help note is shown before the Lesson

#### Scenario: Actionable prevention and de-escalation taught
- **WHEN** the user reads a biting theory Lesson
- **THEN** it explains reading warning signs in the yellow zone before a bite, how to structure safe zones, and the step-by-step trade-up protocol to avoid physical confrontation

### Requirement: Home Stretches in World 2
A Home Stretch of a Home Behaviour that is a Concern for the Dog SHALL be a Stretch of World 2 ("Casa y umbrales / Convivencia"), placed before the World 2 threshold Stretches (Harness Ritual, Doorbell Mat, Poste practice) in Personal Plan order with biting first. World 2 SHALL be complete only when its declared Home Stretches and threshold Stretches are done. A Home Mission SHALL follow the normal Mission rules, including the Day Skip and Owed.

#### Scenario: Declared Home Stretch gates World 2
- **WHEN** the Dog has barking at home as a Concern and its Mission is not passed
- **THEN** its Home Stretch is in World 2, World 1 completes without it, and World 3 stays locked until World 2 is done

#### Scenario: Declared late
- **WHEN** the user makes a Home Behaviour a Concern after World 2 is complete
- **THEN** its Home Stretch stays in Other Home Behaviours and World 2 stays complete

#### Scenario: Started Stretch stays
- **WHEN** the user removes a Concern whose Home Stretch is started
- **THEN** it stays in World 2 with its progress

#### Scenario: Started Stretch stays open before World 2 unlocks
- **WHEN** a Dog started a Home Stretch while Home Stretches belonged to World 1 and World 1 is not yet complete
- **THEN** that Home Stretch stays open and keeps its progress although World 2 is still locked, and Home Stretches the Dog has not started wait for World 2

### Requirement: Home Stretch membership migrates with the record
A record saved before the Home Stretches moved to World 2 SHALL be read with its list of World 1 Home Stretches (`worldHome`) re-evaluated: a Dog whose World 2 is not complete SHALL have every Concern it has join World 2, and a Dog whose World 2 is already complete SHALL keep the list so that World stays complete. The record version SHALL be raised so that a list written under the new rule is never migrated again.

#### Scenario: Old list dropped
- **WHEN** a version 9 record with a World 1 Home Stretch list and an incomplete World 2 is read
- **THEN** the list is dropped and every Concern the Dog has places its Home Stretch in World 2

#### Scenario: Complete World 2 stays complete
- **WHEN** a version 9 record whose World 2 is already complete is read
- **THEN** its list is kept and a Concern outside it stays in Other Home Behaviours

### Requirement: Calm hands and leash in World 2 biting Stretch
The close-view "calm hands and leash" Node Stop (`calm-hands`) SHALL be located in World 2 within the biting-the-owner Stretch (`mouth-person`), placed after the biting theory Lesson (`theory-bite-owner`) and before the biting Mission (`mission-bite-owner`). It SHALL train safe hand and leash handling around the dog without physical correction.

#### Scenario: Placement in World 2 biting Stretch
- **WHEN** the Dog has biting the owner declared as a Concern
- **THEN** the biting Stretch in World 2 runs the biting theory Lesson, "calm hands and leash", and the biting Mission, in that order

### Requirement: Lessons open together and how to play first
The Lessons of a Stretch SHALL all be open at once; a Lesson SHALL be closed only by an unpassed earlier Mission of its World or a locked World. A Node SHALL need every Lesson of its Stretch read and a Mission SHALL need its Node. The first Stop of World 1 SHALL be the "Tiene nombre" theory Lesson, and the how-to-play Lesson `howto-choose-action` SHALL precede the first choose-the-action Minigame. World 1 SHALL run its three Basics Stretches in fixed order. World 2 SHALL run the Dog's declared Home Stretches first in Personal Plan order, followed by the World 2 threshold Stretches.

#### Scenario: Lessons of a Stretch open together
- **WHEN** a new Dog opens the Map
- **THEN** all three Lessons of the first Stretch are open, with "Tiene nombre" as the first Stop, and its Node stays closed until they are read

#### Scenario: Home Node needs how to play
- **WHEN** a Dog has destroying things as a Concern and has not read how to play
- **THEN** its Home Stretch in World 2 requires the how-to-play Lesson from World 1 before its Node can be played

#### Scenario: Order for a Dog with Concerns
- **WHEN** the Dog has biting the owner and barking at home as Concerns
- **THEN** World 1 runs the three Basics Stretches, and World 2 opens with biting the owner, barking at home, followed by harness, doorbell, and poste

### Requirement: Other Home Behaviours
The Home Stretches of Home Behaviours that are not Concerns SHALL be in a collapsed-by-default section after World 2 that gates and counts toward nothing, is hidden when empty, and has its Lesson, Exercise and Mission enabled. "Ahora es un problema" SHALL move a Home Stretch into World 2 at level 1.

#### Scenario: Optional and enabled
- **WHEN** the user opens a Home Behaviour in Other Home Behaviours
- **THEN** its Lesson, Exercise and Mission can be opened

### Requirement: World 2 starts folded
The first locked World SHALL be folded to its header row by default, and a tap SHALL open its preview.

#### Scenario: World 2 folded
- **WHEN** the Map opens for a Dog that has not completed World 1
- **THEN** World 2 shows only its header

### Requirement: World 2 Stretches grouped on the Map
On the World Map the Home Stretches of World 2 SHALL be listed in the section "Para tu perro" and the World 2 threshold Stretches in the section "Más cosas de casa". The Home Stretch of a Concern the user removed after starting it SHALL stay in "Para tu perro". Grouping SHALL NOT change which Stretches belong to World 2, their order, their unlock rules or when World 2 is complete.

#### Scenario: Home Stretch grouping
- **WHEN** the Dog has biting the owner and barking at home as Concerns
- **THEN** "Para tu perro" lists biting the owner then barking at home, and "Más cosas de casa" lists harness, doorbell and poste

#### Scenario: Started Stretch stays in its section
- **WHEN** the user removes a Concern whose Home Stretch is started
- **THEN** that Stretch stays in World 2 under "Para tu perro" with its progress

#### Scenario: Late Concern
- **WHEN** the user makes a Home Behaviour a Concern after World 2 is complete
- **THEN** its Home Stretch stays in Other Home Behaviours and not in "Para tu perro"

#### Scenario: Order unchanged
- **WHEN** a Dog has a Home Stretch it has not started and a threshold Stretch it has started
- **THEN** the Home Stretch is still before the threshold Stretch, as World 2 already orders Home Stretches first

### Requirement: Being alone Stretch
Being left alone SHALL have one Home Stretch: Lessons on the psychology of a small space, the playpen plus crate, the force-free protocol and the pre-departure routine with crying and frustration versus panic; an exercise where the user chooses the action in scenes such as whether to open the door; and a multi-day home Mission that holds the step-by-step protocol (open door, distance, micro-close, release cue).

#### Scenario: Stretch order
- **WHEN** the Dog has being left alone as a Concern
- **THEN** its Stretch runs its Lessons, the exercise and the Mission in that order, like the other Home Stretches

#### Scenario: Protocol in the Mission
- **WHEN** the user opens the Mission of being left alone
- **THEN** its brief gives the protocol in steps and its check-in asks how it went at home

### Requirement: Being alone safety first
The Lesson that teaches the force-free protocol SHALL show, before the protocol, a note on what panic looks like and when to stop and ask a professional. The rule of not opening the door while the Dog cries SHALL state a time limit and the age of the Dog it applies to, and SHALL say a young puppy must not be left waiting as long as an adult. No content of this Stretch SHALL teach tension on the leash or any physical correction.

#### Scenario: Note first
- **WHEN** the user opens the protocol Lesson
- **THEN** the panic and when-to-stop note is shown before the protocol steps

#### Scenario: Crying rule has limits
- **WHEN** the user reads the rule of not opening the door while the Dog cries
- **THEN** it states how long to wait, says it differs for a young puppy, and says to stop and open the door at signs of panic

#### Scenario: No downward leash tension
- **WHEN** the user reads the leash-related Lesson of this course
- **THEN** it does not advise downward tension on the leash
