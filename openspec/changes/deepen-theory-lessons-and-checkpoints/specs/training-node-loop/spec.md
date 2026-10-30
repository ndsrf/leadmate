# Spec Delta

## MODIFIED Requirements

### Requirement: Step timing targets
The system SHALL size the Theory Primer at 30-60 seconds as 3-5 short tappable cards, limit each Checkpoint question to 5 seconds by default, and size the Interactive Simulation at 60-90 seconds.

#### Scenario: Checkpoint timeout
- **WHEN** the user does not answer a Checkpoint question within the time limit
- **THEN** the system records that question as missed and shows the next question, or advances to the Interactive Simulation after the last one

#### Scenario: Timer restarts per question
- **WHEN** the user answers the first Checkpoint question with 1 second left
- **THEN** the second question starts with the full time limit

### Requirement: Checkpoint accessibility
The system SHALL let the user extend the Checkpoint limit to 10 seconds or turn the timer off in settings, and SHALL use the Checkpoint answer only as feedback in the Debrief, never to block the Interactive Simulation or change the Dog.

#### Scenario: Timer off
- **WHEN** the user has turned the timer off
- **THEN** every Checkpoint question waits for an answer without a time limit

#### Scenario: Wrong answer
- **WHEN** the user answers any or all Checkpoint questions wrongly
- **THEN** the Interactive Simulation still starts and the Learning Attributes are not affected

## ADDED Requirements

### Requirement: Multi-question Checkpoint
The system SHALL ask three questions in the Checkpoint of every trail Node, each with exactly one right answer among three options, all testing the theory Lesson placed before that Node. The introductory Node of the onboarding funnel MAY ask a single question. Questions are shown one at a time with a "1 de 3" progress indicator.

#### Scenario: Three questions
- **WHEN** the user reaches the Checkpoint of a trail Node
- **THEN** three questions are shown one after another, each with a progress indicator, before the Interactive Simulation starts

#### Scenario: No going back
- **WHEN** the user has answered a question
- **THEN** the next question is shown and the answered one cannot be changed

#### Scenario: Questions cover the Lesson
- **WHEN** a trail Node's Checkpoint is authored
- **THEN** its three questions test different points of the theory Lesson (for example the why, a step and a common mistake), not three wordings of one point

### Requirement: Shuffled option order
The system SHALL show the options of every Checkpoint question in a random order each time the question is presented, independent of the order in which they are authored, so the position of the right answer carries no information.

#### Scenario: Position varies
- **WHEN** the same question is presented many times
- **THEN** the right answer appears in each of the three positions

#### Scenario: Answer graded by content
- **WHEN** the user taps the option showing the right answer in any position
- **THEN** the answer is recorded as correct

#### Scenario: Stable while shown
- **WHEN** a question is on screen and the screen re-renders
- **THEN** the options do not reorder

### Requirement: Checkpoint feedback in the Debrief
The Debrief SHALL show how many Checkpoint questions were answered correctly out of how many were asked and, for each question answered wrongly or missed, the question, its right answer and a one-sentence explanation from the catalog.

#### Scenario: Two of three
- **WHEN** the user answered two questions correctly and one wrongly
- **THEN** the Debrief shows "2 de 3" and the missed question with its right answer and explanation

#### Scenario: All correct
- **WHEN** every Checkpoint question was answered correctly
- **THEN** the Debrief shows the full score and no question list

#### Scenario: Timed out
- **WHEN** a question timed out
- **THEN** it counts as not correct and is listed with its right answer and explanation, marked as out of time
