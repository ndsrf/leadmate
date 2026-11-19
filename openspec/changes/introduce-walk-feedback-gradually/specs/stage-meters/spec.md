# Spec Delta

## MODIFIED Requirements

### Requirement: Scenarios may declare Stage Meters
A scenario SHALL be able to declare up to two Stage Meters, each with an id, a label and an icon from the catalog, a target number of Meter Points, and the Meter Points each kind of action adds to it. A scenario that declares none SHALL behave exactly as before. Every action kind a Node's meter gives Meter Points for SHALL be Introduced at that Node.

#### Scenario: Stage without meters
- **WHEN** a Stage runs whose scenario declares no meters
- **THEN** no meter is shown, no Meter Points are shown, and its handling score is computed as before

#### Scenario: Invalid meter
- **WHEN** content declares a meter with no target, a target of zero or less, or an action kind the simulation does not report
- **THEN** content validation fails and names the meter and field

#### Scenario: Meter Points for an action not yet Introduced
- **WHEN** a Node's meter gives Meter Points for a fresh move and neither that Node nor any Node before it on the trail Introduces the fresh move
- **THEN** content validation fails and names the Node, the meter and the action kind
