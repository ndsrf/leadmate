# dog-basics-world Specification

## Purpose
Teaches new owners the basics of living with a dog as a dog: their dog's quirks have names, no humanising, home is for resting, and calm comes before learning. These basics come before any leash work, in the first World of the trail.

## Requirements

### Requirement: Basics World trail
World 1, "Un perro es un perro", SHALL hold three Stretches in this order: "Tu perro es un perro", "En casa se descansa" and "Primero, calma". Each Stretch SHALL have at least one theory Lesson Stop, one choose-the-action Node Stop and one home Mission Stop, which comes last.

#### Scenario: Trail order
- **WHEN** World 1 is loaded
- **THEN** it holds the Stretches "Tu perro es un perro", "En casa se descansa" and "Primero, calma", in that order, each ending in its Mission

#### Scenario: New user starts here
- **WHEN** a new user finishes the first-run funnel and opens the World Map
- **THEN** the map opens on World 1 with its first Lesson Stop next-up

### Requirement: Your dog has a name for it
The first Stop of World 1 SHALL be the "Tiene nombre" theory Lesson. It names behaviours owners often think are unique to their dog. For each it gives the common name, what it looks like, why dogs do it and a first step. It SHALL cover at least the turtle, puppy zoomies, reacting to other dogs and redirected biting of the owner.

#### Scenario: First thing read
- **WHEN** a new user opens World 1
- **THEN** the "Tiene nombre" Lesson is the only open Stop

#### Scenario: Each behaviour is named and explained
- **WHEN** the user reads "Tiene nombre"
- **THEN** each behaviour shows its name, a one-line description, why it happens and a first step, and the Lesson closes by saying these are common dog behaviours that can be worked on

#### Scenario: The turtle
- **WHEN** the user reads the turtle entry
- **THEN** it describes a Dog lying down and waiting, fixed on another dog that is coming, that often reacts once the other dog is close; it explains that lying down here is a warning sign, not calm, and its first step is to create distance or move on before the other dog arrives

#### Scenario: Readable from the Library
- **WHEN** an existing user whose World 1 was marked complete opens the Theory Library
- **THEN** "Tiene nombre" and every other World 1 Lesson are listed as read and can be opened

### Requirement: Treat the dog as a dog
The "Tu perro es un perro" Stretch SHALL teach not lifting the dog, not taking it to bed and not kissing it. It SHALL teach greeting it only when calm, and that misbehaviour usually comes from treating it like a person or a toy rather than a dog.

#### Scenario: Lesson content
- **WHEN** the user reads the Stretch's theory Lesson
- **THEN** it has a "do" and "don't" comparison covering lifting, the bed and kisses, and its takeaways say misbehaviour usually starts with not treating the Dog as a dog

### Requirement: Home is for resting
The "En casa se descansa" Stretch SHALL teach that indoors the dog rests. When it comes asking for attention, the handler calmly sends it away without looking at, talking to or touching it. Play and attention happen outdoors.

#### Scenario: Send away calmly
- **WHEN** the user reads the Stretch's theory Lesson
- **THEN** its steps describe sending the Dog away by calmly walking into its space, with no eye contact, words or touch, and moving play and attention outdoors

### Requirement: Calm before learning
The "Primero, calma" Stretch SHALL teach that a dog barking nonstop or racing around is too aroused to learn. The handler waits for calm, adds no energy, asks for nothing until the dog is calm and then rewards the calm.

#### Scenario: Over-aroused Dog
- **WHEN** the user reads the Stretch's theory Lesson
- **THEN** it explains that a Dog barking nonstop cannot learn in that state, and that the first step is waiting for calm, not giving a Cue

### Requirement: No physical correction
No World 1 Lesson, Minigame hint, Mission or Fix SHALL suggest hitting, kicking, shoving, scruffing or any other physical correction. "Sending away" SHALL always mean walking calmly into the dog's space without touching it.

#### Scenario: Content review
- **WHEN** World 1 text is checked against the catalog
- **THEN** none of it tells the user to physically correct the Dog

### Requirement: Existing users skip the Basics World
On the first launch after this change, a Dog record that already has progress SHALL get World 1 marked complete: every Lesson read, every Node completed and every Mission passed. Progress means a finished first Stage, a completed Node, a read Lesson or a started Mission. No celebration SHALL play and no Diary entry SHALL be added. A record without progress SHALL NOT be marked.

#### Scenario: Returning user
- **WHEN** a user who had finished World 1 Home & Thresholds before this change opens the updated app
- **THEN** World 1 (Basics) and World 2 (Home) show complete, and the map opens where it opened before

#### Scenario: User partway through Home
- **WHEN** a user who had completed only the Harness Ritual opens the updated app
- **THEN** World 1 is complete and World 2's trail shows the same progress as before

#### Scenario: No celebration on update
- **WHEN** World 1 is marked complete by the update
- **THEN** no World-complete celebration, Mission celebration or Diary entry appears

#### Scenario: User still in the funnel
- **WHEN** a record without progress, such as one still in the first-run funnel, is opened after the update
- **THEN** World 1 is not marked and the user plays it

#### Scenario: Old copy synced later
- **WHEN** a copy of the Dog saved by the old app is merged with a copy saved by the updated app
- **THEN** World 1 stays complete on both

#### Scenario: Reset Progress
- **WHEN** the user confirms Reset Progress
- **THEN** World 1 is no longer complete and the user starts on its first Stop
