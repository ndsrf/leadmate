# Spec Delta

## MODIFIED Requirements

### Requirement: Sequential World unlocking
The system SHALL organize Nodes into sequential Worlds (`WorldDef`), unlocking each World only when all required Nodes of the preceding World have been completed, and distinguishing free progression worlds from premium LeadMate Plus worlds.

#### Scenario: Locked World
- **WHEN** the user has not completed all required Nodes in World 1
- **THEN** World 2 remains locked

#### Scenario: Plus World gating
- **WHEN** a World is designated as a LeadMate Plus world and the user has not unlocked Plus
- **THEN** the World remains locked and indicates it requires a LeadMate Plus membership

## ADDED Requirements

### Requirement: Extended Curriculum and World Topics
The system SHALL support extended curriculum worlds with topic metadata and node counts to preview advanced canine training stages, including park recall, cafe manners, hiking trails, urban crowds, and cooperative care.

#### Scenario: Extended worlds defined
- **WHEN** the progression system loads world definitions
- **THEN** it includes preview worlds beyond the core initial worlds, each with a title, world number, topic summary, tier, preview flag, and planned node count

#### Scenario: World topic metadata available
- **WHEN** a World is queried for map presentation
- **THEN** it provides a localized topic summary describing the skills trained in that World (e.g. "puertas, timbre, escaleras")
