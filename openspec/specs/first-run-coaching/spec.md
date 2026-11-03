# first-run-coaching Specification

## Purpose
Gives a new user drawn, non-blocking help (Coach marks and a Hint) on the Stage itself: where the controls are and a warning when another dog approaches, each shown once so experienced users are never nagged.

## Requirements

### Requirement: Control Coach marks
The system SHALL, from the start of a Stage in which the controls have not been learned, draw a Coach mark on the movement control labelled "drag to move" and a Coach mark on the Marker button labelled "tap to reward", positioned on the real controls for the screen size. Coach marks SHALL NOT block or delay any input. The movement mark SHALL disappear at the first movement input. The Marker mark SHALL stay until the first Marker press or 20 seconds, whichever is first, and SHALL NOT cover the button.

#### Scenario: First time on the Stage
- **WHEN** a new user's first Stage starts
- **THEN** a Coach mark points at the movement control and another at the Marker button, each with its label

#### Scenario: User moves
- **WHEN** the user moves while both marks are shown
- **THEN** the movement takes effect at once, the movement mark disappears and the Marker mark stays

#### Scenario: User marks
- **WHEN** the user presses the Marker while its mark is shown
- **THEN** the press takes effect at once and the mark disappears

#### Scenario: User never marks
- **WHEN** 20 seconds pass without a Marker press
- **THEN** the Marker mark disappears

#### Scenario: Paused
- **WHEN** the Stage is paused while a mark is shown
- **THEN** the mark is hidden until the Stage resumes

### Requirement: Approaching dog warning
The system SHALL, the first time a dog Distractor approaches the Dog in a Stage where the warning has not been seen, show a warning with the Dog's name, such as "A dog is coming. Careful that {name} doesn't react", and a pointer toward the approaching dog. The warning only warns: it SHALL NOT tell the user what to do, and SHALL NOT change the Stage's difficulty. It SHALL be non-blocking and SHALL disappear after 7 seconds or when the dog has passed, whichever is first. It SHALL be shown for dog Distractors only, and once per Stage.

#### Scenario: A dog approaches
- **WHEN** a dog Distractor becomes active and comes within the approach range of the Dog for the first time
- **THEN** the warning names the Dog and a pointer shows the side the dog comes from

#### Scenario: Another kind of Distractor
- **WHEN** a Distractor of any other kind approaches
- **THEN** no approaching-dog warning is shown

#### Scenario: No name
- **WHEN** the Dog has no name
- **THEN** the warning uses the neutral "your dog"

#### Scenario: Seen already
- **WHEN** the user has seen the warning in a guided Stage
- **THEN** later Stages do not show it

### Requirement: Help is remembered
The system SHALL show the approaching-dog warning and the Coach marks at most once in recorded Stages, recording each as seen in the Dog record's `seenHints`, and SHALL NOT block input or the simulation while they are shown. All their text SHALL come from the i18n catalog. Resetting progress SHALL make both appear again.

#### Scenario: Replay
- **WHEN** the user replays a Stage after seeing both
- **THEN** neither is shown

#### Scenario: Learned in the taste
- **WHEN** the user moved and pressed the Marker in the taste Stage
- **THEN** the first guided Stage shows no Coach marks

#### Scenario: Not learned in the taste
- **WHEN** the user made no input of a control in the taste Stage
- **THEN** the first guided Stage shows that control's Coach mark

#### Scenario: Progress reset
- **WHEN** the user resets progress and starts the first Stage
- **THEN** the Coach marks are shown again

### Requirement: Close-view control Coach marks
The system SHALL, from the start of a close exercise in which the close-view controls have not been learned, draw a Coach mark on each control the exercise offers (Gather, Poste, Marker), positioned on the real controls for the screen size. Coach marks SHALL NOT block or delay any input. Each mark SHALL disappear at the first press of its control or after 20 seconds, whichever is first, SHALL NOT cover its control, and SHALL be hidden while the exercise is paused.

#### Scenario: First close exercise
- **WHEN** a user who has not used the close-view controls starts a close exercise
- **THEN** a Coach mark with its label points at the Gather control, the Poste control and the Marker button

#### Scenario: User presses a control
- **WHEN** the user presses the Gather control while its mark is shown
- **THEN** the press takes effect at once and that mark disappears while the others stay

#### Scenario: Never pressed
- **WHEN** 20 seconds pass without a press of a control
- **THEN** that control's mark disappears

#### Scenario: Learned already
- **WHEN** the user has used a control in an earlier close exercise
- **THEN** that control's mark is not shown again

#### Scenario: Walking Marker mark does not count
- **WHEN** the user pressed the Marker only in a walking Stage
- **THEN** the close-view Marker mark is still shown the first time

### Requirement: Close-view help is remembered
The system SHALL record each close-view Coach mark as seen in the Dog record's `seenHints`, SHALL show it at most once, SHALL take all its text from the i18n catalog, and SHALL show it again after progress is reset.

#### Scenario: Replay
- **WHEN** the user replays a close exercise after seeing its marks
- **THEN** no mark is shown

#### Scenario: Progress reset
- **WHEN** the user resets progress and starts the close exercise
- **THEN** the Coach marks are shown again
