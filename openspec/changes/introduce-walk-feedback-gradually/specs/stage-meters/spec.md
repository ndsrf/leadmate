# Spec Delta

## MODIFIED Requirements

### Requirement: Scenarios may declare Stage Meters
A scenario SHALL be able to declare up to two Stage Meters, each with an id, a label and an icon from the catalog, a target number of Meter Points, and the Meter Points each kind of action adds to it. A scenario that declares none SHALL behave exactly as before. In a channel where at least one Node Introduces an action kind, every action kind a Node's meter gives Meter Points for SHALL be Introduced at that Node. A channel where no Node Introduces anything (content not yet promoted) SHALL skip this check.

#### Scenario: Stage without meters
- **WHEN** a Stage runs whose scenario declares no meters
- **THEN** no meter is shown, no Meter Points are shown, and its handling score is computed as before

#### Scenario: Invalid meter
- **WHEN** content declares a meter with no target, a target of zero or less, or an action kind the simulation does not report
- **THEN** content validation fails and names the meter and field

#### Scenario: Meter Points for an action not yet Introduced
- **WHEN** a Node's meter gives Meter Points for a fresh move and neither that Node nor any Node before it on the trail Introduces the fresh move
- **THEN** content validation fails and names the Node, the meter and the action kind

#### Scenario: Channel without introductions
- **WHEN** no Node in a channel Introduces any action kind and a Node's meter gives Meter Points for a fresh move
- **THEN** content validation does not fail for that meter, and the channel's warnings list the fresh move as never Introduced
