# Spec Delta

## MODIFIED Requirements

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

#### Scenario: Barkdoku spatial conflict posture
- **WHEN** a dog placement in Barkdoku violates a line-of-sight, region, or personal space constraint
- **THEN** conflicting dogs transition to alert posture with pricked ears and barking indicators until the conflict is resolved

### Requirement: Environmental scene context in minigames
The system SHALL render visual environmental props for static minigames, including an entrance door with audio-visual chime cues and a target mat for the Doorbell Mat minigame, an anchored handler-leash connection for the Poste and Harness Ritual minigames, and terrain zone boundaries for spatial deduction minigames.

#### Scenario: Visual doorbell and mat cues
- **WHEN** the doorbell triggers in Doorbell Mat
- **THEN** the scene shows a chime ripple at the door prop and highlights the mat target where the Dog settles

#### Scenario: Leash tension visualization
- **WHEN** tension changes in the Poste or Harness Ritual
- **THEN** the rendered leash dynamically reflects the curve between Handler and Dog, appearing rigid during pull and curving into slack when held

#### Scenario: Barkdoku park and terrace terrain zones
- **WHEN** Barkdoku renders its grid
- **THEN** the environmental background depicts a park or cafe terrace divided into terrain zones with visual obstacle props acting as sight-blocking buffers
