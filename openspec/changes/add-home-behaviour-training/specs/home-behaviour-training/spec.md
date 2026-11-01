## ADDED Requirements

<!-- Light placeholder specs. Each requirement is a stub to be refined when the change is picked up; the scenarios are intentionally minimal. -->

### Requirement: Content for every Home Behaviour
Each Home Behaviour (biting the owner, biting other people, barking at home, destroying things, eating non-food things) SHALL have a Lesson and a Mission, and every behaviour except the two biting ones SHALL also have an exercise. A Home Behaviour SHALL be removed from the known-gaps list when its content ships.

#### Scenario: Gap closed
- **WHEN** a Home Behaviour has all the parts it requires (Lesson and Mission, plus an exercise unless it is a biting behaviour)
- **THEN** it is no longer on the known-gaps list and its Stretch is no longer a "coming soon" placeholder

### Requirement: Lessons
Each Home Behaviour SHALL have a theory Lesson that explains the behaviour and what to do about it. TBD: wording, length, who reviews it (open question on safety review), and which behaviours share a Stretch.

#### Scenario: Lesson available
- **WHEN** the user opens a Home Behaviour's Stretch
- **THEN** its Lesson can be read

### Requirement: Exercises
Each Home Behaviour other than biting the owner and biting other people SHALL have an exercise, played as a minigame-mode Node with no simulated bite. The two biting behaviours SHALL NOT have an exercise. TBD: the scenarios of each exercise; scoring is left to design.

#### Scenario: Exercise available
- **WHEN** the user opens the exercise of barking at home, destroying things or eating non-food things
- **THEN** it runs as a minigame-mode Node

#### Scenario: No exercise for biting
- **WHEN** the user opens a biting Stretch
- **THEN** it has a Lesson and a Mission and no exercise, and this is not reported as a content gap

### Requirement: Missions
Each Home Behaviour SHALL have a real-world Mission that follows the existing Mission rules. TBD: the task of each Mission, and which behaviours share a Stretch.

#### Scenario: Mission available
- **WHEN** the user finishes a Home Behaviour's exercise, or its Lesson for a biting behaviour
- **THEN** its Mission brief opens

### Requirement: Biting safety
The biting Stretches SHALL lead with the professional-help note and teach safe handling first. TBD: exact content, who reviews it (open question on safety review), and how eating objects is split between training and vet advice.

#### Scenario: Note first
- **WHEN** the user opens a biting Lesson
- **THEN** the professional-help note is shown before the Lesson
