# Spec Delta

## Purpose

Lets the user read the Dog's body language during a walking Stage (where it looks, what its head, ears and tail do, whether it sniffs, plants or marks) on the walking Dog and on the Dog portrait in the HUD, so the user learns to read a real dog.

## ADDED Requirements

### Requirement: Canine Posture derived from the simulation
The system SHALL derive, on every drawn frame of a walking Stage, its Canine Posture, made of: gaze (at the Handler, away to the left, away to the right, at a Distractor, at the ground), head (up, level, down), ears (forward, neutral, back), tail (high, wagging, neutral, tucked) and action (idle, walk, trot, sniff-walk, sniffing in place, planted, marking, lunging). Deriving it SHALL NOT change the simulation, its seed or its telemetry.

#### Scenario: Same Stage, same Canine Postures
- **WHEN** two Stages run with the same seed and the same inputs
- **THEN** the Dog shows the same Canine Posture at the same simulation times, and the debrief payloads are identical to a run without drawing

#### Scenario: Action the simulation does not support yet
- **WHEN** a scenario has no mechanic that can make the Dog plant or mark
- **THEN** the Dog never shows the planted or marking action

### Requirement: Canine Posture follows the Dog's situation
The system SHALL map the Dog's situation to a Canine Posture as follows: calm walking shows level head, neutral ears and neutral tail; a Check-in or a look after following a turn shows gaze at the Handler, ears forward and a wagging tail; Alert shows head up, ears forward and a high tail; Reactive and fixated shows gaze at the Distractor, a high tail and lunging; Rigid Pull without fixation shows ears back; sniffing shows head down and a neutral or wagging tail.

#### Scenario: Check-in
- **WHEN** the Dog glances at the Handler
- **THEN** for the length of the Check-in window the Dog looks at the Handler with ears forward and a wagging tail

#### Scenario: Alert
- **WHEN** the Dog's Reaction Tier becomes Alert
- **THEN** its head comes up, its ears go forward and its tail goes high

#### Scenario: Rigid Pull
- **WHEN** the leash is in Rigid Pull and the Dog is not fixated
- **THEN** the Dog's ears go back

#### Scenario: Looking away
- **WHEN** the Dog walks with its gaze on something to its left or right that is not the Handler
- **THEN** its head turns that way and the gaze reads as away from the Handler

### Requirement: Walking Dog shows its Canine Posture as a silhouette
The walking Dog sprite SHALL show, in each of the 8 drawn directions and for every Dog coat, the head turned toward or away from the Handler, the nose to the ground, a planted stance, a raised leg while marking, a lunge, and a tail that is visibly high, neutral or tucked, at the walking camera's normal zoom.

#### Scenario: Head turned to the Handler
- **WHEN** the Dog looks at the Handler while walking away from them
- **THEN** the walking sprite shows the head turned back toward the Handler, not only the body facing its walking direction

#### Scenario: Marking
- **WHEN** the Dog is marking
- **THEN** the walking sprite shows a raised hind leg for the length of the marking

#### Scenario: Coats
- **WHEN** the Dog record uses any of the Dog coats
- **THEN** every pose of the walking sprite is drawn in that coat

### Requirement: Dog portrait in the HUD
During a walking Stage the HUD SHALL show a close-up portrait of the Dog that draws its current Canine Posture with ears, eyes, head and tail detailed enough to tell forward from back ears, a wagging from a tucked tail, and gaze at the Handler from gaze away, in the Dog's coat.

#### Scenario: Portrait follows the Dog
- **WHEN** the Dog's Canine Posture changes during a walking Stage
- **THEN** the Dog portrait shows the new state on the next drawn frame

#### Scenario: Close exercise
- **WHEN** a close leash exercise is played
- **THEN** no Dog portrait is shown, because the close view already draws the Dog large

### Requirement: Dog portrait placement
The Dog portrait SHALL sit where it never covers a control, the Dog, the Handler or a Coach mark, on every screen from 320 points wide in portrait up to a wide desktop browser, and SHALL respect safe-area insets. It SHALL NOT accept input.

#### Scenario: Narrow phone
- **WHEN** a walking Stage runs on a 320-point-wide screen
- **THEN** the Dog portrait and every control are fully visible and do not overlap

#### Scenario: Touch on the Dog portrait
- **WHEN** the user touches the Dog portrait
- **THEN** nothing happens and the touch is not taken as movement input

### Requirement: Canine Posture does not rely on motion or colour alone
With reduced motion requested, the system SHALL show a wagging tail as a still, raised, curved tail and SHALL keep every other Canine Posture as a still pose, so the same information is shown. A Check-in SHALL keep a gaze marker between the Dog and the Handler in addition to the Canine Posture.

#### Scenario: Reduced motion
- **WHEN** reduced motion is requested and the Dog checks in
- **THEN** the walking sprite and the Dog portrait show a still pose with a raised tail and gaze at the Handler, and no wag animation plays

#### Scenario: Check-in marker
- **WHEN** the Dog checks in
- **THEN** the gaze marker between the Dog and the Handler is shown as today, together with the new Canine Posture
