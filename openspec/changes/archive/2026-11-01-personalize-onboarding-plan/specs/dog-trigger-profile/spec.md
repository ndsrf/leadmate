## ADDED Requirements

### Requirement: Home-behaviour concerns
The Dog setup questionnaire SHALL also ask which home behaviours are a problem (biting the owner, biting other people, barking at home, destroying things, eating non-food things such as socks) as selectable chips with the same three intensities, saved as the Dog's home concerns and not in the Trigger Profile. The settings editor SHALL let the user change them, the main concern, age band and sex, and the plan SHALL be rebuilt on save.

#### Scenario: Concern saved
- **WHEN** the user selects "eats socks" at "a lot"
- **THEN** the Dog's home concerns hold level 3 for eating objects and the Trigger Profile is unchanged

#### Scenario: Edited later
- **WHEN** the user changes the main concern in settings
- **THEN** the plan is rebuilt and the World Map's next-up follows it
