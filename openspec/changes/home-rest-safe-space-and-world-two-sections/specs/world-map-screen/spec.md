## ADDED Requirements

### Requirement: World 2 shows two sections
The World Map SHALL draw World 2 as one World with two titled sections in trail order: "Para tu perro", holding the Home Stretches of the Dog's declared Concerns, and "Más cosas de casa", holding the fixed threshold Stretches (Harness Ritual, Doorbell Mat, Poste practice). A section with no Stretches SHALL NOT be shown, with its title. Sections SHALL be presentation only.

#### Scenario: Dog with Concerns
- **WHEN** the Dog has barking at home as a Concern and World 2 is open
- **THEN** World 2 shows "Para tu perro" with the barking Home Stretch, followed by "Más cosas de casa" with harness, doorbell and poste

#### Scenario: No declared Home Stretch
- **WHEN** the Dog has no Home Stretch in World 2
- **THEN** "Para tu perro" and its title are not shown and World 2 shows its threshold Stretches under "Más cosas de casa"

#### Scenario: Still one World
- **WHEN** World 2 is shown with both sections
- **THEN** it has one title, one Stop count ("X de Y paradas"), one progress bar and one unlock requirement, and its World number and the Worlds around it are unchanged

#### Scenario: Sections do not change progress
- **WHEN** a Dog completes or skips Stops in either section
- **THEN** locks, next-up, Owed Missions, completion of World 2 and the unlock of World 3 follow the same rules as without sections

#### Scenario: Started threshold Stretch
- **WHEN** the Dog has started a threshold Stretch and also has a declared Home Stretch it has not started
- **THEN** the threshold Stretch still appears under "Más cosas de casa", after the Home Stretch

#### Scenario: Stretch flags and scrolling
- **WHEN** World 2 is shown with sections
- **THEN** each Mission still carries its "Tramo N" flag numbered across the whole World, the section titles do not overlap any Stop, and the map still scrolls to the next-up Stop
