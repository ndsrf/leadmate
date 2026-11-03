# Spec Delta

## ADDED Requirements

### Requirement: Biting content points to the drill
The Lessons and Missions of biting the owner and biting other people SHALL point the user to the "calm hands and leash" Node of the first Basics Stretch as practice for keeping the Dog calm around hands. The pointer SHALL NOT present the Node as a bite exercise, and the biting Home Stretches SHALL still have no exercise of their own.

#### Scenario: Lesson points to the drill
- **WHEN** the user reads the biting-the-owner Lesson
- **THEN** it mentions the "calm hands and leash" drill as practice for calm around hands, after the professional-help note

#### Scenario: Mission points to the drill
- **WHEN** the user opens the biting-the-owner Mission brief
- **THEN** it refers to the drill as the practice for calm hands and leash handling

#### Scenario: Still no biting exercise
- **WHEN** the user opens a biting Home Stretch
- **THEN** it holds a Lesson and a Mission and no Node of its own, and this is not reported as a content gap

#### Scenario: Drill reachable without a biting Concern
- **WHEN** the Dog has no biting Concern
- **THEN** the "calm hands and leash" Node is still in World 1's first Basics Stretch and nothing in it refers to biting
