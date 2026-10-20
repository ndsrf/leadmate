# Pass learning state into the simulation as a snapshot and update it outside

The Dog's Learning Attributes, Trigger Profile, Equipment and session modifiers reach a Stage as a read-only snapshot in the Stage config, and the shell computes the next Learning Attributes with a pure function from the old attributes and the debrief payload after the Stage. The simulation never reads or writes storage, so ADR 0002 still holds: the same seed, inputs and snapshot reproduce the same Stage and payload, and the update function is unit-testable on its own. Terms follow `GLOSSARY.md`.

## Considered Options

- **Simulation reads and writes storage:** simplest to write, but it breaks replays and the daily shared level, and storage lives outside the bundle (ADR 0001).
- **Bridge calls during a Stage:** adds latency and nondeterminism inside the timing-critical loop.

## Consequences

The payload must carry every signal the update needs (marked follows, Check-in hits, Poste successes, peak Arousal). Adding a new attribute means extending both the snapshot and the payload.
