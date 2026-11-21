# Spec Delta

## ADDED Requirements

### Requirement: Terrace scene reads the Dog at a café
The choose-the-action Minigame SHALL offer a Terrace scene, set at a café terrace with a table, a chair, the Handler seated and the Dog's mat. It SHALL have five Action beats with the same decision window, retry and hint rules as the other scenes. The buttons SHALL be Ignore, Wait, Marker and Feed from the table.

#### Scenario: Terrace actions
- **WHEN** the Terrace scene is running
- **THEN** the buttons offered are Ignore, Wait, Marker and Feed from the table

#### Scenario: Scene length
- **WHEN** a Terrace scene runs
- **THEN** it has five Action beats, each with a decision window of about five seconds

#### Scenario: Set at a terrace
- **WHEN** the Terrace scene is drawn
- **THEN** it shows a café front, a table with a cup, the seated Handler and the Dog on its mat, and no living-room props

### Requirement: Terrace states map to one action each
Each readable state of the Terrace scene SHALL map to exactly one correct action, defined once for the scene. Begging at the table maps to Ignore, staring at a passing waiter to Wait, looking back at the Handler to Marker, and lying relaxed on the mat to Marker.

#### Scenario: Correct actions
- **WHEN** the Terrace scene shows the Dog begging at the table, staring at a passing waiter, looking back at the Handler, or lying relaxed on the mat
- **THEN** the correct actions are Ignore, Wait, Marker and Marker respectively

#### Scenario: Waiter shown while staring
- **WHEN** the Dog stares at a passing waiter
- **THEN** a waiter carrying a tray is drawn crossing the scene, and the caption names what the Dog is looking at

#### Scenario: Marker drops a treat
- **WHEN** the user picks Marker on a right beat
- **THEN** a treat is shown dropping onto the mat by the Dog

### Requirement: Feeding from the table is never right
Picking Feed from the table SHALL count as a mistake in every Terrace beat. The Dog SHALL get more insistent, and the hint SHALL say that food from the table pays begging, so the Dog asks harder next time.

#### Scenario: Feed while begging
- **WHEN** the user picks Feed from the table while the Dog begs
- **THEN** the beat counts as a mistake, the Dog begs harder and the hint says food from the table pays the begging

#### Scenario: Feed while relaxed
- **WHEN** the user picks Feed from the table while the Dog lies relaxed
- **THEN** the beat counts as a mistake and the hint says the calm is paid with a treat dropped on the mat, not with food from the plate

### Requirement: Terrace scripts vary and end calm
A Terrace script SHALL open with begging and staring at a waiter in a seeded order, then show the Dog looking back at the Handler, then begging or staring again (seeded), and end with the Dog lying relaxed. Every Terrace scene SHALL end with the Dog calm.

#### Scenario: Seeded order
- **WHEN** two Terrace scenes start with different seeds
- **THEN** the order of the first two beats or the fourth beat can differ, and both end with the Dog lying relaxed

#### Scenario: Different states need different actions
- **WHEN** any Terrace scene is played
- **THEN** at least three different buttons are needed to answer every beat correctly

### Requirement: Terrace Minigame result
The Terrace scene SHALL report `timing` and `tension` to the Debrief, with a handling score for stars, as the Basics scenes do. `timing` SHALL be the share of correct beats, and `tension` SHALL fall with the number of wrong choices.

#### Scenario: Perfect run
- **WHEN** every Terrace beat is answered correctly
- **THEN** `timing` and `tension` are both 100%

#### Scenario: Feeding lowers the score
- **WHEN** the user picks Feed from the table twice in a run
- **THEN** `tension` is lower than in a run with no wrong choices

### Requirement: Terrace states are expressive and captioned
The Dog in the Terrace scene SHALL show distinct body language for begging at the table, staring at a waiter, looking back at the Handler and lying relaxed. Every state SHALL be named in a short caption and announced to screen readers when its beat starts.

#### Scenario: Screen reader
- **WHEN** a Terrace beat starts
- **THEN** the Dog's state is announced, and every button has an accessible label with its name and effect

#### Scenario: States look different
- **WHEN** the Dog moves from staring at the waiter to looking back at the Handler
- **THEN** the head direction and at least one of ears, tail or mouth change
