# dog-basics-world Specification

## Purpose
Teaches new owners the basics of living with a dog as a dog: their dog's quirks have names, no humanising, home is for resting, and calm comes before learning. These basics come before any outdoor leash work, in the first World of the trail.

## Requirements

### Requirement: Basics World trail
World 1, "Un perro es un perro", SHALL hold strictly three universal Stretches in this order: "Tu perro es un perro", "En casa se descansa" and "Primero, calma". Each Stretch SHALL have at least one theory Lesson Stop, one choose-the-action Node Stop and one home Mission Stop, which comes last. The first Stretch SHALL run "Tiene nombre", "Tu perro es un perro", "Cómo se juega", the choose-the-action Node "Tu perro es un perro", and its Mission. World 1 SHALL NOT interleave dynamic Home Concern Stretches and SHALL NOT hold the "calm hands and leash" drill.

#### Scenario: Trail order
- **WHEN** World 1 is loaded
- **THEN** it holds strictly the Stretches "Tu perro es un perro", "En casa se descansa" and "Primero, calma", in that order, each ending in its Mission, without dynamic concern insertions

#### Scenario: First Stretch Stop order
- **WHEN** the first Stretch of World 1 is loaded
- **THEN** it runs "Tiene nombre", "Tu perro es un perro", "Cómo se juega", the choose-the-action Node and its Mission, in that order, without the "calm hands and leash" Node

#### Scenario: New user starts here
- **WHEN** a new user finishes the first-run funnel and opens the World Map
- **THEN** the map opens on World 1 with its first Lesson Stop next-up

### Requirement: World 1 Mission Check
An unstarted World 1 Mission SHALL open on a dedicated check screen ("¿Ya haces esto con {name}?") rather than the standard Mission brief, both when selected from the World Map and when transitioning immediately from the Stretch's last Node debrief. The check screen SHALL ask whether the handler and dog already practice the habit at home and offer two choices: confirming that they already do ("Sí, ya lo hacemos") and choosing to test it ("Aún no, quiero ponerlo a prueba"). Confirming it SHALL immediately pass the Mission for today without any waiting period, advance the streak, trigger the passed celebration, and unlock the next Stretch. Choosing to test it SHALL open the standard Mission brief where the user can start the Mission with its real-world practice and check-in waiting rules.

#### Scenario: Habit already practiced at home
- **WHEN** an unstarted World 1 Mission is opened and the user taps "Sí, ya lo hacemos"
- **THEN** the Mission is marked passed on today's date, the Streak day is marked active, the celebration view opens, and the next Stretch unlocks without waiting

#### Scenario: Habit not yet practiced or needs testing
- **WHEN** an unstarted World 1 Mission is opened and the user taps "Aún no, quiero ponerlo a prueba"
- **THEN** the standard Mission brief opens with its target, focus, and "Comenzar misión" action

#### Scenario: Reached from last Node debrief
- **WHEN** the user completes the final Node debrief of a World 1 Stretch
- **THEN** the flow transitions directly to the World 1 check screen for the Stretch's Mission

#### Scenario: Started or passed World 1 Mission
- **WHEN** a World 1 Mission has already been started or passed
- **THEN** it does not open on the check screen and follows normal Mission entry (waiting, check-in, or passed screen)

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
The "En casa se descansa" Stretch SHALL teach that indoors the dog rests. It SHALL teach the "rincón y espacio seguro" protocol (establishing a defined resting zone, den, open crate, or playpen where the dog sleeps undisturbed and learns to remain alone calmly without anxiety). When the dog comes asking for attention outside of scheduled interactions, the handler calmly sends it away without looking at, talking to, or touching it. Play and vigorous exercise happen outdoors.

#### Scenario: Send away calmly
- **WHEN** the user reads the Stretch's theory Lesson
- **THEN** its steps describe sending the Dog away by calmly walking into its space, with no eye contact, words or touch, and moving play and attention outdoors

#### Scenario: Safe small space denning protocol
- **WHEN** the user completes the "En casa se descansa" theory Lesson
- **THEN** the lesson teaches setting up a quiet, bounded sleeping area with safe chew items and positive associations to help puppies and newly adopted dogs settle alone peacefully

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

### Requirement: Calm hands and leash drill in World 2
The close-view "calm hands and leash" Node Stop (`calm-hands`) SHALL be located in World 2 within the biting-the-owner Stretch (`mouth-person`), placed after the biting theory Lesson (`theory-bite-owner`) and before the biting Mission (`mission-bite-owner`). In it the user keeps the Dog calm around an offered hand using the leash, Gather, Poste and Marker. It SHALL open once the biting theory Lesson is read, and the Stretch's Mission SHALL need both Nodes. It SHALL count as complete when its Debrief is reached or the simulation is skipped, and SHALL stay replayable.

#### Scenario: Placement in World 2 biting Stretch
- **WHEN** the Dog has biting the owner declared as a Concern
- **THEN** the biting Stretch in World 2 runs the biting theory Lesson, "calm hands and leash", and the biting Mission, in that order

#### Scenario: Opens after biting theory Lesson
- **WHEN** the user has read the biting theory Lesson
- **THEN** the "calm hands and leash" Node opens

#### Scenario: Skipped simulation
- **WHEN** the user leaves the drill's simulation through the pause menu's skip
- **THEN** the Node is completed like a played one

#### Scenario: Completed by reaching the Debrief
- **WHEN** the user reaches the Debrief of the drill, whether the Dog stayed calm or not
- **THEN** the Node is completed and can be replayed

### Requirement: Drill copy follows the age band and never corrects
The primer, Checkpoint, Debrief and real-world exercise of the "calm hands and leash" Node SHALL follow the Dog's age band. Their text SHALL NOT suggest hitting, kicking, shoving, scruffing, jerking the leash, lifting the Dog by it or any other physical correction.

#### Scenario: Content review
- **WHEN** the Node's text is checked against the catalog
- **THEN** none of it tells the user to physically correct the Dog

#### Scenario: Puppy copy
- **WHEN** the Dog is a puppy and the user opens the Node
- **THEN** its primer and real-world exercise speak of a mouthy puppy and a toy reward

#### Scenario: No age band
- **WHEN** the Dog has no age band and the user opens the Node
- **THEN** its text says "your dog" and speaks of a treat reward, with no mention of a puppy

### Requirement: Puppy satellite stops in World 1
When the Dog's recorded age band is `puppy`, World 1 ("Un perro es un perro") SHALL display companion satellite stops anchored alongside its foundational Stretches: Bite Inhibition alongside Stretch 1, Sound Desensitisation alongside Stretch 2, and Vet Body Handling alongside Stretch 3. For any Dog whose age band is not `puppy` (or is unset), these satellite stops SHALL NOT be rendered on the map.

#### Scenario: Puppy record renders satellite stops
- **WHEN** the World Map renders World 1 for a Dog with `ageBand === 'puppy'`
- **THEN** the map displays the three companion puppy stops anchored alongside the corresponding foundational Stretches

#### Scenario: Non-puppy record omits satellite stops
- **WHEN** the World Map renders World 1 for a Dog with an age band of adolescent, adult, senior, or null
- **THEN** no puppy satellite stops are displayed on World 1

#### Scenario: Tapping a puppy satellite stop
- **WHEN** the user taps an open puppy satellite stop in World 1
- **THEN** the system opens the corresponding puppy track learning module without advancing or blocking the main trail

#### Scenario: Companion satellite stop layout
- **WHEN** World 1 is displayed for a puppy record
- **THEN** the companion satellite stops are anchored beside their corresponding foundational Stretches along the World 1 spine without adding extra rows or vertical trail length

#### Scenario: Completed satellite stop
- **WHEN** a puppy satellite stop's module is completed in the Dog record
- **THEN** the stop displays a completed checkmark badge and announces its completion status in the accessibility label
