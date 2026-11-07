## ADDED Requirements

### Requirement: World 2 Stretches grouped on the Map
On the World Map the Home Stretches of World 2 SHALL be listed in the section "Para tu perro" and the World 2 threshold Stretches in the section "Más cosas de casa". The Home Stretch of a Concern the user removed after starting it SHALL stay in "Para tu perro". Grouping SHALL NOT change which Stretches belong to World 2, their order, their unlock rules or when World 2 is complete.

#### Scenario: Home Stretch grouping
- **WHEN** the Dog has biting the owner and barking at home as Concerns
- **THEN** "Para tu perro" lists biting the owner then barking at home, and "Más cosas de casa" lists harness, doorbell and poste

#### Scenario: Started Stretch stays in its section
- **WHEN** the user removes a Concern whose Home Stretch is started
- **THEN** that Stretch stays in World 2 under "Para tu perro" with its progress

#### Scenario: Late Concern
- **WHEN** the user makes a Home Behaviour a Concern after World 2 is complete
- **THEN** its Home Stretch stays in Other Home Behaviours and not in "Para tu perro"

#### Scenario: Order unchanged
- **WHEN** a Dog has a Home Stretch it has not started and a threshold Stretch it has started
- **THEN** the Home Stretch is still before the threshold Stretch, as World 2 already orders Home Stretches first
