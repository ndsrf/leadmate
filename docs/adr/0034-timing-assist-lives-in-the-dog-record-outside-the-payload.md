# Keep the Timing assist in the Dog record, updated from the HUD outside the debrief payload

The Timing assist (Full, Ring only, Late ring, Off, with its success and failure runs) is computed by pure HUD logic in the bundle from simulation events, sent to the shell as it changes, and stored in the Dog record as `markerAssist`. It is not a Learning Attribute and is not derived from the debrief payload, so ADR 0003's snapshot-in, payload-out update does not apply to it, and the payload and the simulation stay byte-identical at every assist level (ADR 0002). It is written mid-Stage outside the Taste Stage, like `seenHints`, so quitting a Stage or replaying a short Encounter keeps what was learned. It syncs with the record by whole-record last-write-wins (ADR 0006) with no merge rule of its own, needs no record version bump (a missing value reads as Full), and is cleared by Reset Progress. The "always show timing help" setting, by contrast, is a device-local accessibility choice and is not in the Dog record. Terms follow `GLOSSARY.md`.

## Considered Options

- **Device-local storage, like the UI settings:** simpler, but the assist describes how well this user reads this Dog, so it would be lost on a second device and would survive Reset Progress, which should start the user over.
- **Carry assist outcomes in the debrief payload and update after the Stage:** fits ADR 0003, but changes the payload and its baseline, and loses progress when a Stage is quit.
- **A dedicated sync merge (for example the lower level wins):** safer against stale devices, but adds merge code for a value that re-settles within a few Marker presses.

## Consequences

The HUD needs its own bridge message (`marker-assist`) and the shell its own write gate. A stale device can win a sync and move the assist one way or the other, which is accepted as harmless. Older builds drop the field when they rewrite the record, which reads back as Full. Moving the assist into the payload or into device-local storage later means migrating stored values.
