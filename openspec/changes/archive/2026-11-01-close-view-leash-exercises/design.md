# Design

## Context

LeadMate currently runs a 2.5D isometric walking simulation in Phaser 3 (`bundle/`), loaded via a WebView in the Expo React Native shell (`src/shell/SimView.tsx`). The walking simulation (`bundle/src/StageScene.ts`) uses Kenney mini-character sprites and focuses on route movement, obstacle avoidance, and joystick navigation. While this works well for open walks, handlers need dedicated training for close-quarters encounters—such as passing another dog on a narrow sidewalk—where steering is replaced with precise leash gathering, tension buffering, body shielding, and marker/cue timing.

As established in the proposal and scoping decisions:
- Close-view exercises are dedicated training stages within the node loop (not mid-walk mode switches).
- The user practices direct leash manipulation (shortening/gathering, anchoring tension, releasing slack) and body shielding rather than movement navigation.
- The view is rendered within the Phaser simulation bundle using a dedicated close 2D isometric camera with high-detail canine, handler, and distractor graphics.

## Goals / Non-Goals

**Goals:**
- Provide a dedicated close 2D isometric scene (`CloseExerciseScene`) in Phaser optimized for close-range visual clarity.
- Implement high-detail sprite assets for the Handler, canine postures (neutral, alert, strained, relaxed), and approaching distractor dogs.
- Model pure deterministic leash manipulation in `src/sim/`: effective leash length gathering ($L_{eff}$), tension anchoring, and lateral shielding stance.
- Create an approaching distractor dog exercise scenario in a narrow passage setting.
- Integrate close leash exercise stages into the training node loop (`training-node-loop`) with telemetry and debrief transfer exercises.

**Non-Goals:**
- Dynamic camera zooming or mid-walk transitions between walking and close views during a single route stage.
- Free-roaming joystick navigation within close exercise stages.
- Replacing existing static React Native SVG minigames (Doorbell Mat, Poste practice); close exercises complement them within Phaser.

## Decisions

### Decision 1: Dedicated Phaser Scene (`CloseExerciseScene`) vs Branching in `StageScene`
- **Choice**: Implement a dedicated `CloseExerciseScene` inside `bundle/src/CloseExerciseScene.ts`.
- **Rationale**: `StageScene` has extensive logic for ground tile baking, route waypoints, wall quad fading, and joystick steering. A dedicated scene isolates close-view camera logic, high-res character assets, and leash-centric HUD controls without risking regressions in standard walking stages.
- **Alternatives considered**: Adding conditional `mode === 'close_exercise'` branches into `StageScene.ts`. Rejected because it creates tight coupling, complicates camera management, and bloats the walking scene.

### Decision 2: High-Resolution Close-Up Isometric Graphics
- **Choice**: Introduce a dedicated close-up sprite atlas (`close_sprites.png` / `close_sprites.json`) rendering detailed handler hands/torso, nuanced canine head and ear postures, and distractor dog silhouettes.
- **Rationale**: The Kenney mini-characters from `bundle/assets/kenney/sprites.png` lack the anatomical detail (ear set, eye direction, leash grip) needed for handlers to read subtle behavioral cues in close quarters.
- **Alternatives considered**: Scaling up existing Kenney sprites with camera zoom. Rejected as visual fidelity degrades into blurred or pixelated artifacts that obscure canine tension cues.

### Decision 3: Pure Deterministic Leash Manipulation Model in `src/sim/`
- **Choice**: Model leash gathering, tension anchoring, and shielding directly in `src/sim/` as part of `CloseExerciseState`:
  - `effectiveLeashLength`: Dynamically bounded between $L_{min}$ (0.5 m) and $L_{max}$ (2.0 m) based on gather/release input rate.
  - `isAnchored`: Boolean indicating handler brace stance, damping sudden tension jolts at the cost of slight canine resistance.
  - `shieldSide`: `'left' | 'right' | 'none'`, which computes line-of-sight occlusion between the Dog and the passing distractor.
- **Rationale**: Keeps simulation logic pure, fixed-step, and testable without UI or Phaser dependencies, aligning with ADR 0002.
- **Alternatives considered**: Managing leash length only as a visual effect in the Phaser rendering layer. Rejected because tension ratios, arousal spikes, and debrief scoring must depend deterministically on effective leash length.

### Decision 4: Declarative Exercise Control Schemes and Modular Sub-State
- **Choice**: Structure `CloseExerciseScene` as an extensible close-quarters exercise platform (see [ADR 0019](file:///home/jgm/orca/workspaces/leadmate/Simulator-close-view/docs/adr/0019-close-exercise-view-as-modular-phaser-stage.md)). Instead of hardcoding a single control layout, the scenario configuration declares `controls: 'leash_drill' | 'platform_pivot' | ...`.
  - In `src/sim/`: The base `CloseExerciseState` manages common close-view state (Handler position, Dog orientation/posture, Arousal, Leash Bézier, Marker/Reward Window), while exercise-specific logic is encapsulated in pluggable sub-states (`LeashDrillState` for street passing, extensible to `PlatformPivotState` for target and perch drills).
  - On the HUD: For `leash_drill`, the left thumb controls Leash Gathering (hold-to-gather with quick latch) and Handler Shielding (lateral side-switch toggle), while the right thumb controls Tension Anchor, Cues, and Marker.
- **Rationale**: Generalizes the close view to support future target/body-awareness exercises (such as training front paws on a box and rear-leg circle pivots) without redesigning scene architecture or cluttering the HUD.
- **Alternatives considered**: Hardcoding narrow-street leash controls into the scene. Rejected because it forces rewriting or cloning scenes when adding target exercises.

### Decision 5: Node Loop Integration (`mode: 'close_exercise'`)
- **Choice**: Add `mode: 'close_exercise'` to `NodeDef` in `src/shell/nodes/node.ts`. The shell launches `SimView` with a close exercise scenario config and processes standard `SimulationDebriefPayload` enriched with close leash handling telemetry.
- **Rationale**: Fits seamlessly into the four-step Node loop (Theory Primer → Checkpoint → Interactive Simulation → Debrief) without requiring new screen types or shell architectures.

## Risks / Trade-offs

- **[Risk] High-resolution asset load on memory and startup time**
  - *Mitigation*: Pack close-view sprites into an optimized atlas loaded only when entering close exercise stages, or lazily preloaded during the Checkpoint step. Dog coat variations will continue to use programmatic tints over neutral grayscale bases (`DOG_COATS`).
- **[Risk] Cognitive complexity of multiple leash controls**
  - *Mitigation*: Progressive onboarding across multiple training nodes: introduce leash gathering first, add tension anchoring in the next node, and introduce body shielding against approaching dogs subsequently.
- **[Risk] Leash Bézier visual artifacts at short distances**
  - *Mitigation*: When $L_{eff}$ is short and handler and dog are close, clamp Bézier control point sag to prevent the leash from dipping through the ground plane.

## Migration Plan

1. Define close exercise simulation state and pure logic in `src/sim/` with 100% test coverage.
2. Add high-detail close asset atlas and register in `bundle/src/assets.ts`.
3. Implement `CloseExerciseScene` in `bundle/src/` with close camera framing and leash HUD.
4. Update `src/shell/nodes/` and scenario generators to include close exercise nodes.
5. Add localization entries in `src/i18n/es.ts`.
