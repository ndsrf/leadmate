# dog-concerns-plan Specification

## Purpose
TBD - created by archiving change personalize-onboarding-plan. Update Purpose after archive.

## Requirements

### Requirement: Concern profile
The Dog record SHALL hold up to three main concerns in the order picked, a level (1 to 3) for each home-behaviour concern (biting the owner, biting other people, barking at home, destroying things, eating non-food things), an age band (puppy, adolescent, adult, senior) and a sex (male, female). Each SHALL be skippable and default to unset. Outdoor reactions SHALL continue to live only in the Trigger Profile.

#### Scenario: Defaults
- **WHEN** a Dog record is created or loaded from a version without these fields
- **THEN** the main concerns, age band and sex are unset and no home concern has a level

#### Scenario: Outdoor reaction stays in the Trigger Profile
- **WHEN** the user marks reacting to children as a concern at level 3
- **THEN** the Trigger Profile holds level 3 for children and no second copy is stored

### Requirement: Personal plan prioritiser
The system SHALL build the personal plan as an ordered list of 3 to 5 existing Stretches from the concern profile, the Diagnostic band and the age band, as a pure function. Biting concerns SHALL put the at-home Stretches and the redirected-biting Lesson first; eating non-food things SHALL come next; then the main concern's Stretches, then other concerns by level, then the default trail order. Sex SHALL NOT change the order. Each item SHALL carry the concern that put it there.

#### Scenario: Biting leads
- **WHEN** the main concern is biting the owner and the user also reports reacting to dogs at level 3
- **THEN** the first plan item is an at-home Stretch and no reaction-to-dogs Stretch precedes it

#### Scenario: Outdoor main concern
- **WHEN** the main concern is reacting to bicycles and no biting concern is set
- **THEN** the Stretch that practices bicycles is in the first two plan items

#### Scenario: Puppy
- **WHEN** the age band is puppy
- **THEN** the at-home Stretches rank above leash-heavy Stretches

#### Scenario: Nothing answered
- **WHEN** no concern, age band or sex is set
- **THEN** the plan equals the default plan, with the Poste practice first when the Diagnostic band is slow

#### Scenario: Same sex, different dog
- **WHEN** two Dogs differ only in sex
- **THEN** their plans have the same order

### Requirement: Plan reasons
The plan card SHALL state for each item the user's answer that placed it, using the Dog's name, and SHALL say when an item points to the nearest existing material because dedicated content is not available yet.

#### Scenario: Reason shown
- **WHEN** the plan card is shown for a Dog named Luna with biting the owner as Main Concern
- **THEN** the first item's reason names Luna and the biting Concern

#### Scenario: Content not yet available
- **WHEN** a plan item stands in for a Home Behaviour with no dedicated Lesson
- **THEN** the card says dedicated lessons for it are coming

### Requirement: Safety notes
The plan card SHALL show a professional-help note when either biting Concern is at level 2 or 3, and a supervision-and-distance note when reacting to children is at level 3, each non-blocking and shown together when both apply. The notes SHALL be derived from the current levels and SHALL NOT be stored.

#### Scenario: Medium biting
- **WHEN** biting other people is at level 2
- **THEN** the plan card shows the professional-help note

#### Scenario: Mild biting
- **WHEN** both biting Concerns are at level 1
- **THEN** no professional-help note is shown

#### Scenario: Children
- **WHEN** reacting to children is at level 3
- **THEN** the plan card shows the supervision-and-distance note

#### Scenario: Level lowered
- **WHEN** the user lowers reacting to children to level 2 in settings
- **THEN** the supervision note is no longer shown

### Requirement: Home Behaviour content coverage
Each Home Behaviour SHALL have a Lesson, a Node and a Mission. Until they exist, the missing ones SHALL be listed in an explicit known-gaps list checked by a test that fails when a gap is closed without removing its entry or when a Home Behaviour is added without content.

#### Scenario: Gap listed
- **WHEN** barking at home has no Lesson and is on the known-gaps list
- **THEN** the coverage test passes

#### Scenario: Gap closed
- **WHEN** a Lesson, Node and Mission for barking at home exist but it is still on the known-gaps list
- **THEN** the coverage test fails

#### Scenario: New Home Behaviour
- **WHEN** a Home Behaviour is added with no content and no known-gaps entry
- **THEN** the coverage test fails
