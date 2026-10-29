# Spec Delta

## ADDED Requirements

### Requirement: Owed state merge
On multi-device sync, a Mission SHALL be owed after the merge when either copy holds it as owed and neither copy has passed it, keeping the earliest skip time. A passed Mission SHALL win over an owed one.

#### Scenario: Skipped on one device
- **WHEN** device A skipped a Mission that device B still shows as waiting
- **THEN** after sync both devices show it owed and the Stops after it open

#### Scenario: Passed wins over owed
- **WHEN** device A shows a Mission owed and device B has passed it
- **THEN** after sync the Mission is passed and not owed
