# canine-minigames Specification

## Purpose
Provides rich, canine-centric graphical interfaces and behavioral posture representations for static minigames, connecting user timing directly to visible dog body language and environmental context.

## Requirements
### Requirement: Canine posture and behavioral state visualization
The system SHALL display visual posture representations of the Dog reflecting its behavioral state and arousal during static minigames, including standing alert, lunging/straining, settling, and resting calmly, instead of relying solely on abstract colored boxes or text labels.

#### Scenario: Doorbell Mat canine posture cycle
- **WHEN** a round of Doorbell Mat runs
- **THEN** the system displays the Dog progressing through four distinct postures: `standing_waiting` before the bell, `alert_barking` when the bell rings, `settling_towards_mat` as it disengages from the door, and `calm_sphinx_on_mat` once settled

#### Scenario: Early mark triggers agitation
- **WHEN** the user marks while the Dog is in `alert_barking` or `settling_towards_mat`
- **THEN** the system displays the Dog remaining aroused and barking, providing immediate visual canine feedback that an uncalm state was rewarded

#### Scenario: Poste and Harness Ritual leash strain postures
- **WHEN** the Dog strains against the leash in the Poste or Harness Ritual
- **THEN** the system renders the Dog's body visibly leaning and pulling forward under tension, transitioning to an eased rest and relaxed sit as the Handler holds and settles the Dog

### Requirement: Environmental scene context in minigames
The system SHALL render visual environmental props for static minigames, including an entrance door with audio-visual chime cues and a target mat for the Doorbell Mat minigame, and an anchored handler-leash connection for the Poste and Harness Ritual minigames.

#### Scenario: Visual doorbell and mat cues
- **WHEN** the doorbell triggers in Doorbell Mat
- **THEN** the scene shows a chime ripple at the door prop and highlights the mat target where the Dog settles

#### Scenario: Leash tension visualization
- **WHEN** tension changes in the Poste or Harness Ritual
- **THEN** the rendered leash dynamically reflects the curve between Handler and Dog, appearing rigid during pull and curving into slack when held

### Requirement: Canine-cue-driven interaction timing
The system SHALL align user input timing to observable canine body language cues, rewarding the user for reading the Dog's physical demeanor and penalizing actions taken during inappropriate canine behavioral states.

#### Scenario: Marking on calm canine posture
- **WHEN** the user presses Mark while the Dog displays the `calm_sphinx_on_mat` posture
- **THEN** the system registers a successful hit and provides positive canine feedback

#### Scenario: Premature release in hold minigame
- **WHEN** the Handler releases the hold button before the Dog has fully settled into slack
- **THEN** the Dog immediately lunges forward again and the round ends as a release failure
