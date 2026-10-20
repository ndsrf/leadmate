# Let Arousal, not a trigger radius, cause Fixation

The Dog fixates on a Distractor when its Arousal reaches its reactivity threshold. Arousal rises with Distractor speed over distance, scaled by the Distractor's Trigger Profile level, so a lower threshold or a stronger profile level makes the Dog react from farther away. This replaces the fixed trigger radius of `base-leadmate`, which stays only as the distance within which a Distractor can affect Arousal at all. Terms follow `GLOSSARY.md` (Arousal, Fixation, Trigger Profile).

## Considered Options

- **Keep the radius and show Arousal only as a score:** smaller change, but the Learning Attributes and the onboarding Trigger Profile would then have no way to change behavior except by resizing the radius.

## Consequences

Fixation timing depends on speed and history, so scenario authors tune thresholds and Distractor speeds, not just radii. `dog-drives` changes, and `engagement-and-worlds` builds its staged reactions on the same meter.
