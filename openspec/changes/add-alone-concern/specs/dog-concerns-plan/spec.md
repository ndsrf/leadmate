# Spec Delta

## MODIFIED Requirements

### Requirement: Concern profile
The Dog record SHALL hold up to three main concerns in the order picked, a level (1 to 3) for each home-behaviour concern (biting the owner, biting other people, barking at home, destroying things, eating non-food things, being left alone), an age band (puppy, adolescent, adult, senior) and a sex (male, female). Each SHALL be skippable and default to unset. Outdoor reactions SHALL continue to live only in the Trigger Profile. Being left alone SHALL NOT be offered in onboarding or as a Main Concern; it is set from the question card, Other Home Behaviours or Settings.

#### Scenario: Defaults
- **WHEN** a Dog record is created or loaded from a version without these fields
- **THEN** the main concerns, age band and sex are unset and no home concern has a level

#### Scenario: Outdoor reaction stays in the Trigger Profile
- **WHEN** the user marks reacting to children as a concern at level 3
- **THEN** the Trigger Profile holds level 3 for children and no second copy is stored

#### Scenario: Being alone has a level
- **WHEN** the Dog's level for being left alone is set to 3
- **THEN** the record holds level 3 for it and the personal plan orders its Home Stretch among the other concerns by level

#### Scenario: Not a Main Concern
- **WHEN** the user picks the Main Concerns in onboarding
- **THEN** being left alone is not among the options
