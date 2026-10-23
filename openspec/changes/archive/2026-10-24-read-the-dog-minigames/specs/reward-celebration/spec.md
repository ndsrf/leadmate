## MODIFIED Requirements

### Requirement: Star rating from handling quality
The system SHALL give a finished Node 1 to 3 stars from its handling score: 1 star for completing it, 2 stars at a score of 650 or more and 3 stars at 850 or more, out of 1000. An action Minigame SHALL report a handling score of 1000 minus the share of failed Action beats, so a run with no failed beat earns 3 stars and a run with one failed beat out of four or five earns 2 stars.

#### Scenario: Completed with a low score
- **WHEN** a Node is completed with a handling score of 400
- **THEN** it earns 1 star

#### Scenario: Excellent handling
- **WHEN** a Node is completed with a handling score of 870
- **THEN** it earns 3 stars

#### Scenario: Node without a Stage score
- **WHEN** a Node has no handling score, such as the Poste practice
- **THEN** its completion earns 1 star and the result explains that

#### Scenario: Action Minigame with no failed beat
- **WHEN** the Harness Ritual or the Doorbell Mat is finished with every Action beat correct
- **THEN** the Node earns 3 stars

#### Scenario: Action Minigame with one failed beat
- **WHEN** the Harness Ritual or the Doorbell Mat is finished with one failed Action beat
- **THEN** the Node earns 2 stars

#### Scenario: Action Minigame with many failed beats
- **WHEN** the Harness Ritual or the Doorbell Mat is finished with two or more failed Action beats
- **THEN** the Node earns 1 star
