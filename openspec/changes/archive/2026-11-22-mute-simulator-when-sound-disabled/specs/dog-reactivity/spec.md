# Spec Delta

## MODIFIED Requirements

### Requirement: Reactivity audio bridge event
The system SHALL emit a `{ type: 'reaction-tier-change', tier: 'calm' | 'alert' | 'reactive', time: number }` simulation event across the message bridge whenever the Dog crosses a tier threshold, enabling the shell audio pipeline to trigger non-blocking, fire-and-forget dog vocalizations (low alert whine/growl on Alert, sharp barking on Reactive) only when the user's sound preference is enabled.

#### Scenario: Event emitted on tier change
- **WHEN** the Dog's Reaction Tier changes and sound is enabled in preferences
- **THEN** a `reaction-tier-change` event is dispatched across the bridge and the shell audio service plays the dog vocalization

#### Scenario: Sound disabled in preferences
- **WHEN** the Dog's Reaction Tier changes and sound is disabled in preferences
- **THEN** a `reaction-tier-change` event is dispatched across the bridge and no dog vocalization audio is played
