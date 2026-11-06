# Spec Delta

## ADDED Requirements

### Requirement: Home Stretches in World 2
A Home Stretch of a Home Behaviour that is a Concern for the Dog SHALL be a Stretch of World 2 ("Casa y umbrales / Convivencia"), placed before the World 2 threshold Stretches (Harness Ritual, Doorbell Mat, Poste practice) in Personal Plan order with biting first. World 2 SHALL be complete only when its declared Home Stretches and threshold Stretches are done. A Home Mission SHALL follow the normal Mission rules, including the Day Skip and Owed.

#### Scenario: Declared Home Stretch gates World 2
- **WHEN** the Dog has barking at home as a Concern and its Mission is not passed
- **THEN** its Home Stretch is in World 2, World 1 completes without it, and World 3 stays locked until World 2 is done

#### Scenario: Declared late
- **WHEN** the user makes a Home Behaviour a Concern after World 2 is complete
- **THEN** its Home Stretch stays in Other Home Behaviours and World 2 stays complete

#### Scenario: Started Stretch stays
- **WHEN** the user removes a Concern whose Home Stretch is started
- **THEN** it stays in World 2 with its progress

#### Scenario: Started Stretch stays open before World 2 unlocks
- **WHEN** a Dog started a Home Stretch while Home Stretches belonged to World 1 and World 1 is not yet complete
- **THEN** that Home Stretch stays open and keeps its progress although World 2 is still locked, and Home Stretches the Dog has not started wait for World 2

### Requirement: Home Stretch membership migrates with the record
A record saved before the Home Stretches moved to World 2 SHALL be read with its list of World 1 Home Stretches (`worldHome`) re-evaluated: a Dog whose World 2 is not complete SHALL have every Concern it has join World 2, and a Dog whose World 2 is already complete SHALL keep the list so that World stays complete. The record version SHALL be raised so that a list written under the new rule is never migrated again.

#### Scenario: Old list dropped
- **WHEN** a version 9 record with a World 1 Home Stretch list and an incomplete World 2 is read
- **THEN** the list is dropped and every Concern the Dog has places its Home Stretch in World 2

#### Scenario: Complete World 2 stays complete
- **WHEN** a version 9 record whose World 2 is already complete is read
- **THEN** its list is kept and a Concern outside it stays in Other Home Behaviours

## MODIFIED Requirements

### Requirement: Lessons open together and how to play first
The Lessons of a Stretch SHALL all be open at once; a Lesson SHALL be closed only by an unpassed earlier Mission of its World or a locked World. A Node SHALL need every Lesson of its Stretch read and a Mission SHALL need its Node. The how-to-play Lesson `howto-choose-action` SHALL be the first Stop of World 1. World 1 SHALL run its three Basics Stretches in fixed order. World 2 SHALL run the Dog's declared Home Stretches first in Personal Plan order, followed by the World 2 threshold Stretches.

#### Scenario: Lessons of a Stretch open together
- **WHEN** a new Dog opens the Map
- **THEN** all three Lessons of the first Stretch are open, how to play first, and its Node stays closed until they are read

#### Scenario: Home Node needs how to play
- **WHEN** a Dog has destroying things as a Concern and has not read how to play
- **THEN** its Home Stretch in World 2 requires the how-to-play Lesson from World 1 before its Node can be played

#### Scenario: Order for a Dog with Concerns
- **WHEN** the Dog has biting the owner and barking at home as Concerns
- **THEN** World 1 runs the three Basics Stretches, and World 2 opens with biting the owner, barking at home, followed by harness, doorbell, and poste

### Requirement: Biting safety
The biting Home Stretches SHALL lead with the professional-help note and teach safe handling and early prevention first. Theory content for biting SHALL teach the canine ladder of aggression / stress traffic light, environmental management to eliminate high-risk conflict zones, and tactical de-escalation protocols including the trade-up ("intercambio") game and reverse timeouts.

#### Scenario: Vet advice on eating non-food
- **WHEN** the user opens the eating non-food Lesson, or sees the Remediation of its failed Mission check-in
- **THEN** the vet note is shown early in the Lesson and in the Remediation

#### Scenario: Note first
- **WHEN** the user opens a biting Lesson
- **THEN** the professional-help note is shown before the Lesson

#### Scenario: Actionable prevention and de-escalation taught
- **WHEN** the user reads a biting theory Lesson
- **THEN** it explains reading warning signs in the yellow zone before a bite, how to structure safe zones, and the step-by-step trade-up protocol to avoid physical confrontation

### Requirement: Other Home Behaviours
The Home Stretches of Home Behaviours that are not Concerns SHALL be in a collapsed-by-default section after World 2 that gates and counts toward nothing, is hidden when empty, and has its Lesson, Exercise and Mission enabled. "Ahora es un problema" SHALL move a Home Stretch into World 2 at level 1.

#### Scenario: Optional and enabled
- **WHEN** the user opens a Home Behaviour in Other Home Behaviours
- **THEN** its Lesson, Exercise and Mission can be opened

## REMOVED Requirements

### Requirement: Home Stretches in World 1
**Reason**: Replaced by `Home Stretches in World 2` to eliminate the multi-week bottleneck in World 1 and group home behavioral problems with the Home and threshold environment where they belong.
**Migration**: Use `Home Stretches in World 2`.
