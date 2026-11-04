# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Home is for resting
The "En casa se descansa" Stretch SHALL teach that indoors the dog rests. It SHALL teach the "rincón y espacio seguro" protocol (establishing a defined resting zone, den, open crate, or playpen where the dog sleeps undisturbed and learns to remain alone calmly without anxiety). When the dog comes asking for attention outside of scheduled interactions, the handler calmly sends it away without looking at, talking to, or touching it. Play and vigorous exercise happen outdoors.

#### Scenario: Send away calmly
- **WHEN** the user reads the Stretch's theory Lesson
- **THEN** its steps describe sending the Dog away by calmly walking into its space, with no eye contact, words or touch, and moving play and attention outdoors

#### Scenario: Safe small space denning protocol
- **WHEN** the user completes the "En casa se descansa" theory Lesson
- **THEN** the lesson teaches setting up a quiet, bounded sleeping area with safe chew items and positive associations to help puppies and newly adopted dogs settle alone peacefully
