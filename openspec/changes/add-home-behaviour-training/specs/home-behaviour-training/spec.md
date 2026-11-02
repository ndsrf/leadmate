## ADDED Requirements

<!-- Light placeholder specs. Each requirement is a stub to be refined when the change is picked up; the scenarios are intentionally minimal. -->

### Requirement: Content for every Home Behaviour
Each Home Behaviour (biting the owner, biting other people, barking at home, destroying things, eating non-food things) SHALL have a Lesson and a Mission, and every behaviour except the two biting ones SHALL also have an exercise. A Home Behaviour SHALL be removed from the known-gaps list when its content ships.

#### Scenario: Gap closed
- **WHEN** a Home Behaviour has all the parts it requires (Lesson and Mission, plus an exercise unless it is a biting behaviour)
- **THEN** it is no longer on the known-gaps list and its Home Stretch is no longer a "coming soon" placeholder

### Requirement: Lessons
Each Home Behaviour SHALL have a theory Lesson that explains the behaviour and what to do about it. TBD: wording, length, who reviews it (open question on safety review), and which behaviours share a Home Stretch.

#### Scenario: Lesson available
- **WHEN** the user opens a Home Behaviour's Home Stretch
- **THEN** its Lesson can be read

### Requirement: Exercises
Each Home Behaviour other than biting the owner and biting other people SHALL have an exercise, played as a minigame-mode Node with no simulated bite. The two biting behaviours SHALL NOT have an exercise. TBD: the scenarios of each exercise; scoring is left to design.

#### Scenario: Exercise available
- **WHEN** the user opens the exercise of barking at home, destroying things or eating non-food things
- **THEN** it runs as a minigame-mode Node

#### Scenario: No exercise for biting
- **WHEN** the user opens a biting Home Stretch
- **THEN** it has a Lesson and a Mission and no exercise, and this is not reported as a content gap

### Requirement: Missions
Each Home Behaviour SHALL have a real-world Mission that follows the existing Mission rules. TBD: the task of each Mission, and which behaviours share a Home Stretch.

#### Scenario: Mission available
- **WHEN** the user finishes a Home Behaviour's exercise, or its Lesson for a biting behaviour
- **THEN** its Mission brief opens

### Requirement: Biting safety
The biting Home Stretches SHALL lead with the professional-help note and teach safe handling first. TBD: exact content, who reviews it (open question on safety review), and how eating objects is split between training and vet advice.

#### Scenario: Vet advice on eating non-food
- **WHEN** the user opens the eating non-food Lesson, or sees the Remediation of its failed Mission check-in
- **THEN** the vet note is shown early in the Lesson and in the Remediation

#### Scenario: Note first
- **WHEN** the user opens a biting Lesson
- **THEN** the professional-help note is shown before the Lesson

### Requirement: Home Stretches in World 1
A Home Stretch of a Home Behaviour that is a Concern for the Dog SHALL be a Stretch of World 1, ordered by the Personal Plan with biting first and never before a Stretch that holds a prerequisite Node of its Nodes, and World 1 SHALL be complete only when it is done. A Home Mission SHALL follow the normal Mission rules, including the Day Skip and Owed.

#### Scenario: Declared Home Stretch gates World 1
- **WHEN** the Dog has barking at home as a Concern and its Mission is not passed
- **THEN** its Home Stretch is in World 1 and World 2 stays locked

#### Scenario: Declared late
- **WHEN** the user makes a Home Behaviour a Concern after World 1 is complete
- **THEN** its Home Stretch stays in Other Home Behaviours and World 1 stays complete

#### Scenario: Started Stretch stays
- **WHEN** the user removes a Concern whose Home Stretch is started
- **THEN** it stays in World 1 with its progress

### Requirement: Lessons open together and how to play first
The Lessons of a Stretch SHALL all be open at once; a Lesson SHALL be closed only by an unpassed earlier Mission of its World or a locked World. A Node SHALL need every Lesson of its Stretch read and a Mission SHALL need its Node. The how-to-play Lesson `howto-choose-action` SHALL be the first Stop of World 1, every read-the-Dog Node on a trail SHALL need it read, and a Stretch holding such a Node SHALL never be placed before the Stretch holding it. World 1 for a Dog SHALL run: biting Home Stretches, the Basics Stretch that holds the how-to-play Lesson, the other Home Stretches in Personal Plan order, then the other Basics Stretches.

#### Scenario: Lessons of a Stretch open together
- **WHEN** a new Dog opens the Map
- **THEN** all three Lessons of the first Stretch are open, how to play first, and its Node stays closed until they are read

#### Scenario: Home Node needs how to play
- **WHEN** a Dog has destroying things as a Concern and has not read how to play
- **THEN** its Home Stretch is after the Basics Stretch that holds the Lesson and its Node cannot be played

#### Scenario: Order for a Dog with Concerns
- **WHEN** the Dog has biting the owner and barking at home as Concerns
- **THEN** World 1 runs biting, the first Basics Stretch, barking, home-rest, calm-first

### Requirement: Other Home Behaviours
The Home Stretches of Home Behaviours that are not Concerns SHALL be in a collapsed-by-default section between World 1 and World 2 that gates and counts toward nothing, is hidden when empty, and has its Lesson, Exercise and Mission enabled. "Ahora es un problema" SHALL move a Home Stretch into World 1 at level 1.

#### Scenario: Optional and enabled
- **WHEN** the user opens a Home Behaviour in Other Home Behaviours
- **THEN** its Lesson, Exercise and Mission can be opened

### Requirement: World 2 starts folded
The first locked World SHALL be folded to its header row by default, and a tap SHALL open its preview.

#### Scenario: World 2 folded
- **WHEN** the Map opens for a Dog that has not completed World 1
- **THEN** World 2 shows only its header
