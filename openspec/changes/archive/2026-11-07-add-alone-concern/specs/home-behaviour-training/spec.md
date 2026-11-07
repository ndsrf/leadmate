# Spec Delta

## MODIFIED Requirements

### Requirement: Content for every Home Behaviour
Each Home Behaviour (biting the owner, biting other people, barking at home, destroying things, eating non-food things, being left alone) SHALL have a Lesson and a Mission, and every behaviour except the two biting ones SHALL also have an exercise. A Home Behaviour SHALL be removed from the known-gaps list when its content ships.

#### Scenario: Gap closed
- **WHEN** a Home Behaviour has all the parts it requires (Lesson and Mission, plus an exercise unless it is a biting behaviour)
- **THEN** it is no longer on the known-gaps list and its Home Stretch is no longer a "coming soon" placeholder

#### Scenario: Being alone covered
- **WHEN** the content of being left alone ships with a Lesson, an exercise and a Mission
- **THEN** it is not on the known-gaps list and the coverage test passes

### Requirement: Exercises
Each Home Behaviour other than biting the owner and biting other people SHALL have an exercise, played as a minigame-mode Node with no simulated bite. The two biting behaviours SHALL NOT have an exercise.

#### Scenario: Exercise available
- **WHEN** the user opens the exercise of barking at home, destroying things, eating non-food things or being left alone
- **THEN** it runs as a minigame-mode Node

#### Scenario: No exercise for biting
- **WHEN** the user opens a biting Home Stretch
- **THEN** it has a Lesson and a Mission and no exercise, and this is not reported as a content gap

## ADDED Requirements

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
