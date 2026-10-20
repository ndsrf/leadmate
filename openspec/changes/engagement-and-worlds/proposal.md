# Proposal

## Why

Retention and content breadth come last: game feel, daily habit loop, and the world map. Phase 4 of 4.

## What Changes

- Require a scenery set with a minimum density for every scenario so no world ships as a bare route (playtest finding).
- Add the Sintonía sync combo, the Go Sniff reward (World 2+), Walk Diary with daily streak, "El Paseo del Día" (Daily Stage), and the 4-world progression map (World 1-2 seeded, World 3-4 stubbed).
- Add Dog reactivity: visible and audible Reaction Tiers (Calm, Alert, Reactive with barking and lunging) driven by the Arousal meter from `training-loop-and-learning`.

## Capabilities

### New Capabilities
- `sync-combo`: Sintonía flow feedback and telemetry.
- `go-sniff`: Contextual Arousal decompression reward.
- `walk-diary-streak`: One-tap real-world check-in and daily streak.
- `daily-walk`: Procedurally generated Daily Stage and leaderboard scoring (ADR 0005).
- `world-progression`: Four-world mechanics map, multi-cue progression, boundary collisions, and unlocks.
- `dog-reactivity`: Reaction Tiers (Calm, Alert, Reactive) driven by Arousal.

### Modified Capabilities

(none)

## Impact

- Builds on `training-loop-and-learning` (Arousal meter, Learning Attributes, proactive Cues) and `onboarding-and-accounts`. Dog reactivity audio dispatches over the message bridge to the shell audio service. Design is recorded in `design.md` and [ADR 0005](file:///home/jgm/dev/projects/web-projects/leadmate/docs/adr/0005-daily-stage-leaderboard-scoring.md). Tasks are ready to be broken down.
