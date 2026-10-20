# Spec Delta

## Purpose

Expresses the Dog's Arousal visibly and audibly across distinct Reaction Tiers, so approaching Distractors elicit readable physical escalation and audible vocalizations, allowing the Handler to recognize early warning signs before the Dog reaches full reactivity.

## ADDED Requirements

### Requirement: Reaction Tiers
The system SHALL express the Dog's emotional escalation in three distinct Reaction Tiers (Calm, Alert, Reactive), driven by the Arousal meter and the Dog's `reactivityThreshold` ($T_R$):
1. **Calm**: $\text{Arousal} < 0.6 \times T_R$. The dog exhibits relaxed posture, natural gait, and standard check-in glances.
2. **Alert**: $0.6 \times T_R \le \text{Arousal} < T_R$. The dog perks up, raises head, decelerates slightly, and orients toward the Distractor without lunging or barking.
3. **Reactive**: $\text{Arousal} \ge T_R$. Fixation locks in, the dog barks, lunges toward the Distractor with an additional $+1.5\text{ m/s}^2$ outward acceleration, and pulls the leash into Rigid Pull.

#### Scenario: Escalating to Alert
- **WHEN** Arousal rises to or above 60% of `reactivityThreshold` while below 100%
- **THEN** the Dog transitions to the Alert tier, perks up its posture, and orients toward the Distractor

#### Scenario: Escalating to Reactive
- **WHEN** Arousal reaches 100% of `reactivityThreshold`
- **THEN** the Dog transitions to the Reactive tier, barks, lunges toward the Distractor, and pulls the leash into Rigid Pull

### Requirement: Marker locked out during Reactive tier
The system SHALL NOT award a Marker hit if the Handler presses the Marker while the Dog is in the Reactive tier, and SHALL record the press as a `marker-reactive` event.

#### Scenario: Marker pressed while Reactive
- **WHEN** the user presses the Marker while the Dog is in the Reactive tier
- **THEN** the press is recorded in telemetry as `reactiveMarkers` and no hit credit is awarded

### Requirement: Reactivity audio bridge event
The system SHALL emit a `{ type: 'reaction-tier-change', tier: 'calm' | 'alert' | 'reactive', time: number }` simulation event across the message bridge whenever the Dog crosses a tier threshold, enabling the shell audio pipeline to trigger non-blocking, fire-and-forget dog vocalizations (low alert whine/growl on Alert, sharp barking on Reactive).

#### Scenario: Event emitted on tier change
- **WHEN** the Dog's Reaction Tier changes
- **THEN** a `reaction-tier-change` event is dispatched across the bridge to the shell audio service

### Requirement: Recovery through Arousal decay
The system SHALL return the Dog from Reactive back to Alert and Calm once line of sight to the Distractor is broken or distance exceeds the Distractor's trigger radius, with Arousal decaying through its standard decay rate.

#### Scenario: Line of sight broken or distance opened
- **WHEN** a visual shield blocks line of sight or the Distractor moves out of range
- **THEN** Arousal decays, and the Dog transitions back from Reactive to Alert, and subsequently to Calm once Arousal falls below 60% of `reactivityThreshold`
