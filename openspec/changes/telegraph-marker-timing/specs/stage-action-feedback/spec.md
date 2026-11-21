# Spec Delta

## ADDED Requirements

### Requirement: Perfect Marker presses in a row raise the pitch
The sound of the Feedback Message shown for a Marker press graded Perfect SHALL rise in pitch one step for each Perfect in a row within a Stage, up to the Combo pitch cap, with no time limit between them. Any other Marker outcome (Good, a missed Reward Window, a Late, reactive or wasted press) SHALL end the run, and each Stage SHALL start a new one. The Combo rule SHALL be unchanged. A platform that cannot change pitch SHALL play the normal pitch.

#### Scenario: Three Perfects
- **WHEN** the user makes three Marker presses graded Perfect in a row, 20 s apart
- **THEN** the second plays one step higher and the third two steps higher than the first

#### Scenario: Good breaks the run
- **WHEN** a Marker hit graded Good follows two graded Perfect, and a Perfect follows it
- **THEN** that Perfect plays at the base pitch

#### Scenario: New Stage
- **WHEN** the user made two Perfects in a row at the end of one Stage and makes a Perfect in the next Stage
- **THEN** that Perfect plays at the base pitch

#### Scenario: Missed opportunity does not break the run
- **WHEN** a Distractor leaves before the calm period completes between two Perfects
- **THEN** the second Perfect plays one step higher

#### Scenario: Sounds off
- **WHEN** UI sounds are off
- **THEN** no sound plays for the Perfect and the haptic follows its own setting
