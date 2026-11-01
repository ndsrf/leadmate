# 0019 Close Exercise View as Modular Phaser Stage

## Context
LeadMate provides a broad isometric walking view in Phaser for route navigation, while static drills (Doorbell Mat, Poste practice) run as React Native SVG Minigames. Close-quarters canine training—such as passing another dog on a narrow street—requires close visual proximity to read subtle canine posture and continuous physical leash dynamics, but without open route navigation.

## Decision
We implement Close Exercise Stages as dedicated Phaser scenes (`CloseExerciseScene`) driven by the pure fixed-step simulation engine (`src/sim/`), rather than as React Native SVG Minigames or camera zoom modes inside `StageScene`. The scene replaces joystick movement with declarative control schemes defined per scenario (e.g. `leash_drill` with Leash Gathering, Handler Shielding, and Poste).

## Consequences
- Preserves the domain rule that only Stages mutate persistent Learning Attributes and emit debrief telemetry.
- Prevents bloat and regressions in `StageScene.ts` by decoupling broad pathway traversal from close-range drills.
- Allows modular addition of new close-quarters leash exercises sharing the same close 2D isometric rendering pipeline.
