## ADDED Requirements

<!-- Light placeholder specs. Each requirement is a stub to be refined when the change is picked up; the scenarios are intentionally minimal. -->

### Requirement: Content for every Home Behaviour
Each Home Behaviour (biting the owner, biting other people, barking at home, destroying things, eating non-food things) SHALL have a Lesson, an exercise and a Mission, and SHALL be removed from the known-gaps list when its content ships.

#### Scenario: Gap closed
- **WHEN** a Home Behaviour has its Lesson, exercise and Mission
- **THEN** it is no longer on the known-gaps list and its Stretch is no longer a "coming soon" placeholder

### Requirement: Lessons
Each Home Behaviour SHALL have a theory Lesson that explains the behaviour and what to do about it. TBD: wording, length and who reviews it.

#### Scenario: Lesson available
- **WHEN** the user opens a Home Behaviour's Stretch
- **THEN** its Lesson can be read

### Requirement: Exercises
Each Home Behaviour SHALL have an exercise played in the new practice sim view. TBD: what each exercise trains, and how it is scored.

#### Scenario: Exercise available
- **WHEN** the user opens a Home Behaviour's exercise
- **THEN** it runs in the practice sim view

### Requirement: Missions
Each Home Behaviour SHALL have a real-world Mission that follows the existing Mission rules. TBD: the task of each Mission.

#### Scenario: Mission available
- **WHEN** the user finishes a Home Behaviour's exercise
- **THEN** its Mission brief opens

### Requirement: Biting safety
The biting Stretches SHALL lead with the professional-help note and teach safe handling first. TBD: exact content and review.

#### Scenario: Note first
- **WHEN** the user opens a biting Lesson
- **THEN** the professional-help note is shown before the Lesson
