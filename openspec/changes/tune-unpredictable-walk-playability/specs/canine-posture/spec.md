# Spec Delta

## MODIFIED Requirements

### Requirement: Canine Posture follows the Dog's situation
The system SHALL map the Dog's situation to a Canine Posture as follows: calm walking shows level head, neutral ears and neutral tail; a Check-in or a look after following a turn shows gaze at the Handler, ears forward and a wagging tail; Alert shows head up, ears forward and a high tail; Reactive and fixated shows gaze at the Distractor, a high tail and lunging; Rigid Pull without fixation shows ears back; sniffing shows head down and a neutral or wagging tail; Autopilot at or above 0.7 shows gaze turned away from the Handler with an autopilot drifting cloud Dog sign over the Dog, clearing when Autopilot drops below 0.4.

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

#### Scenario: Autopilot gaze and sign
- **WHEN** the Dog's Autopilot reaches 0.7 during straight walking
- **THEN** the Canine Posture shows gaze turned away from the Handler and the autopilot drifting cloud Dog sign is displayed

#### Scenario: Autopilot clears
- **WHEN** the Handler makes an unpredictable change that lowers Autopilot below 0.4
- **THEN** the autopilot drifting cloud Dog sign clears and gaze returns from turned away

### Requirement: Dog portrait in the HUD
During a walking Stage the HUD SHALL show a close-up portrait of the Dog that draws its current Canine Posture with ears, eyes, head and tail detailed enough to tell forward from back ears, a wagging from a tucked tail, and gaze at the Handler from gaze away, in the Dog's coat.

#### Scenario: Portrait follows the Dog
- **WHEN** the Dog's Canine Posture changes during a walking Stage
- **THEN** the Dog portrait shows the new state on the next drawn frame

#### Scenario: Close exercise
- **WHEN** a close leash exercise is played
- **THEN** no Dog portrait is shown, because the close view already draws the Dog large

#### Scenario: Portrait reflects Autopilot
- **WHEN** the Dog is on Autopilot at 0.7 or above
- **THEN** the Dog portrait draws head and eyes turned away from the Handler
