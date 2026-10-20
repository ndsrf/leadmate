# Spec Delta

## MODIFIED Requirements

### Requirement: Fixation on Distractors
The system SHALL make the Dog fixate on a Distractor when the Dog's Arousal reaches its reactivity threshold because of that Distractor. A Distractor SHALL affect Arousal only within its trigger radius.

#### Scenario: Fixation starts
- **WHEN** the Dog's Arousal due to a Distractor reaches its reactivity threshold
- **THEN** the Dog stops following its Drive and fixates on the Distractor

#### Scenario: Outside the radius
- **WHEN** a Distractor is outside its trigger radius
- **THEN** it does not raise the Dog's Arousal

#### Scenario: Lower threshold reacts earlier
- **WHEN** the Dog's reactivity threshold is lower
- **THEN** it fixates from a greater distance for the same Distractor
