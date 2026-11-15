# Spec Delta

## Purpose

Adds a Checkpoint question kind where the user chooses the better of two stacked images, to make the quiz more engaging and to teach by showing good and poor handling rather than describing it.

## ADDED Requirements

### Requirement: Image duel question
A Checkpoint SHALL be able to contain an image duel question: a prompt, two images stacked top and bottom, one marked correct, and an explanation. The user SHALL answer by tapping one image.

#### Scenario: Question shown
- **WHEN** an image duel question is presented
- **THEN** the prompt and both images are visible together and each image is tappable

#### Scenario: Mixed Checkpoint
- **WHEN** a Checkpoint holds text and image duel questions
- **THEN** they appear in the authored order and the existing timer applies to each

### Requirement: Order is shuffled
The system SHALL show the correct image on top or at the bottom at random each time the question is shown.

#### Scenario: Repeat play
- **WHEN** the same question is shown on several plays
- **THEN** the correct image is not always in the same position

### Requirement: Verdict after answering only
The images SHALL NOT carry a right or wrong marker before the user answers. After answering, the system SHALL mark the correct and the chosen image with a check or cross badge, never by colour alone, and show the explanation.

#### Scenario: Before answering
- **WHEN** the question is shown
- **THEN** neither image has a check, cross or colour hint

#### Scenario: Wrong choice
- **WHEN** the user taps the poorer image
- **THEN** the chosen image shows a cross, the other a check, and the explanation shows

### Requirement: Image duel accessibility
Each duel image SHALL have a localized text description. The timer settings and the rule that answers never block the simulation SHALL apply to image duel questions as to text ones, and a screen reader SHALL be able to choose either image.

#### Scenario: Screen reader
- **WHEN** a screen reader user opens an image duel question
- **THEN** both images are announced with their descriptions and either can be chosen

#### Scenario: Timeout
- **WHEN** the time limit passes with no tap
- **THEN** the question counts as unanswered, the explanation shows and the simulation is not blocked

### Requirement: Pack format and compatibility
The Content Pack SHALL let a Node declare an image duel question with its two images in the Node's media and its text per language. Validation SHALL reject a duel without exactly two existing images and exactly one correct. An app older than the pack's minimum app version SHALL not load the pack.

#### Scenario: Valid duel
- **WHEN** an author adds a duel with two images and one correct answer
- **THEN** the pack validates

#### Scenario: Invalid duel
- **WHEN** a duel has one image or no correct image
- **THEN** validation fails and names the Node

#### Scenario: Older app
- **WHEN** an app below the minimum app version meets a pack that uses image duels
- **THEN** it keeps its bundled content instead of loading the pack
