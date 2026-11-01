# Close-View Leash Exercise Guide

This document describes the architecture of LeadMate's close 2D isometric view leash handling simulation and provides a step-by-step authoring guide for creating new close exercise training nodes and scenarios.

---

## 1. Architectural Overview

### Purpose
While walking stages (`mode: 'stage'`, rendered via `StageScene.ts`) focus on route navigation, obstacle avoidance, and joystick steering, close leash exercises (`mode: 'close_exercise'`, rendered via `CloseExerciseScene.ts`) isolate high-tension close-quarters encounters (e.g. passing an oncoming dog on a narrow sidewalk). Steering is replaced with direct leash mechanics:
- **Leash gathering & release**: Shortening working leash length smoothly to maintain control without harsh pull jolts.
- **Handler shielding**: Shifting handler stance to occlude line of sight between the dog and approaching distractors.
- **Poste**: Stopping and bracing to absorb lunges and damp sudden tension spikes.
- **Disengagement marking**: Timing marker cues when the dog looks away from the trigger.

### Architecture Components

```
┌──────────────────────────────────────────────────────────┐
│              Shell (React Native / Expo)                 │
│  - NodeScreens (Primer -> Checkpoint -> Simulation)      │
│  - SimView / App.tsx: sends 'start', receives 'debrief'  │
└──────────────────────────┬───────────────────────────────┘
                           │ postMessage
┌──────────────────────────▼───────────────────────────────┐
│               Phaser Simulation Bundle                   │
│  - bundle/main.ts: routes to CloseExerciseScene          │
│  - CloseExerciseScene.ts: 3.2x zoom, HUD, narrow scenery │
│  - sprites.ts / assets.ts: high-res close_sprites atlas   │
└──────────────────────────┬───────────────────────────────┘
                           │ fixed-step loop
┌──────────────────────────▼───────────────────────────────┐
│          Pure Fixed-Step Simulation Engine               │
│  - src/sim/closeExercise.ts                              │
│    - CloseExerciseConfig / CloseExerciseState            │
│    - tickCloseExercise(): pure step function             │
│    - calculateCloseLeashCurve(): dynamic Bézier curve    │
│    - buildCloseExercisePayload(): debrief telemetry      │
└──────────────────────────────────────────────────────────┘
```

1. **Pure Simulation Model (`src/sim/closeExercise.ts`)**:
   Fixed-step, deterministic, and 100% testable in Node.js without browser or DOM dependencies ([ADR 0002](file:///home/jgm/orca/workspaces/leadmate/Simulator-close-view/docs/adr/0002-pure-seeded-simulation.md)). Computes canine posture (`neutral`, `alert`, `strained`, `relaxed`, `head_turn`), effective leash length $L_{eff}$, lateral shielding occlusion, tension ratios, and emits `SimulationDebriefPayload`.

2. **Dedicated Phaser Scene (`bundle/src/CloseExerciseScene.ts`)**:
   Operates an isometric camera with high magnification (3.2x zoom) framing the Handler and Dog with tight screen padding. Renders narrow corridor cobblestones, curbs, and brick walls. Manages left-thumb and right-thumb touch HUD buttons alongside keyboard bindings (`Space`, `KeyA`, `KeyD`, `KeyS`, `KeyC`, `KeyV`).

3. **High-Resolution Asset Atlas (`bundle/assets/close_sprites.{png,json}`)**:
   Dedicated 4x resolution sprites for canine emotional postures, handler hands, torso stances, and distractor silhouettes, loaded independently of the low-res Kenney mini-character walking sprites.

4. **Curriculum Integration (`src/shell/nodes/`)**:
   Integrated into the standard four-step training loop via `mode: 'close_exercise'`, seamlessly connecting Theory Primers, Checkpoint quizzes, interactive practice, and debrief metric reviews.

---

## 2. Close Exercise Scenario Configuration

Close exercises are configured via `CloseExerciseConfig` in `src/sim/closeExercise.ts`:

```typescript
export interface CloseExerciseConfig {
  controls: CloseExerciseControls;           // 'leash_drill'
  fixedStep: number;                         // Simulation step (default: 1 / 60)
  leashMinLength: number;                    // Shortest gathered length in meters (e.g. 0.5)
  leashMaxLength: number;                    // Max relaxed length in meters (e.g. 2.0)
  gatherRate: number;                        // Gathering speed in m/s (e.g. 1.5)
  releaseRate: number;                       // Release speed in m/s (e.g. 2.0)
  posteDamping: number;                      // Tension damping factor during poste (e.g. 0.35)
  posteArousalDamping: number;               // Arousal reduction factor during poste (e.g. 0.4)
  shieldOcclusionDistance: number;           // Radius within which handler blocks line of sight (e.g. 0.65)
  shieldOffset: number;                      // Lateral offset distance of shielding stance (e.g. 0.8)
  handlerBase: Vec2;                         // Handler isometric ground coordinates { x, y }
  dogOffset: Vec2;                           // Dog offset relative to handler { x, y }
  distractor: ApproachingDistractorConfig;   // Approaching distractor path and trigger settings
  cues: CueType[];                           // Available cue buttons (e.g. ['lets-go'])
  calmSeconds: number;                       // Calm duration required after distractor passes
  rewardWindowSeconds: number;               // Reward window length after disengagement (e.g. 1.1s)
  markBudget: number;                        // Maximum marks allowed before scoring penalty
  checkInWindow: number;                     // Interval for spontaneous handler check-ins
  configVersion: string;
}
```

### Distractor Path Configuration
The approaching distractor moves from `startPos` to `endPos` at a constant speed:
```typescript
distractor: {
  kind: 'dog',
  speed: 1.4,                 // Speed in m/s
  triggerRadius: 6.0,          // Distance at which canine becomes alerted/fixated
  startPos: { x: 1.8, y: 12.0 }, // Approach from upper corridor
  endPos: { x: 1.8, y: -6.0 },   // Pass through and exit lower corridor
  cue: 'lets-go',
}
```

---

## 3. Step-by-Step Scenario Authoring Guide

Follow these steps to author and register a new close leash exercise:

### Step 1: Define Scenario in `src/shell/nodes/scenarios.ts`
Create and export the scenario configuration:
```typescript
export const NARROW_STREET_PASS: CloseExerciseConfig = {
  ...defaultCloseExerciseConfig,
  controls: 'leash_drill',
  leashMinLength: 0.5,
  leashMaxLength: 2.0,
  gatherRate: 1.5,
  releaseRate: 2.0,
  posteDamping: 0.35,
  distractor: {
    kind: 'dog',
    speed: 1.4,
    triggerRadius: 6.0,
    startPos: { x: 1.8, y: 12.0 },
    endPos: { x: 1.8, y: -6.0 },
    cue: 'lets-go',
  },
};
```

### Step 2: Define Training Node in `src/shell/nodes/content.ts`
Add the slug to `Slug` and define the node:
```typescript
export const CLOSE_PASS_NODE = textNode('closepass', 'close-narrow-street-pass', {
  mode: 'close_exercise',
  primer: recapPrimer('closepass', { art: 'theory-visual-shields-2' }),
  simulation: { scenario: { theme: 'urban_street' }, closeScenario: NARROW_STREET_PASS },
  exercises: [
    { metric: 'tension', n: 1 },
    { metric: 'timing', n: 2 },
    { metric: 'attention', n: 3 },
  ],
  prerequisites: [SCOOTER_NODE.id],
});
```
Add `CLOSE_PASS_NODE` to the exported `NODES` array.

### Step 3: Wire into World Progression in `src/shell/world.ts`
Insert the node into the target stretch:
```typescript
  {
    id: 'urban', title: 'world.urban.title', worldNumber: 4, unlockedBy: 'sidewalk', topics: 'world.urban.topics', tier: 'free',
    stretches: [
      ...
      [lesson('theory-choosing-cue'), node('close-narrow-street-pass'), node('urban-mix'), mission('mission-cue-choice')],
    ],
  },
```
In `src/shell/missions/content.ts`, ensure the stretch's ending mission lists the node in its `trains` parameter:
```typescript
mission('mission-cue-choice', 'cuechoice', 'cue-choice', 2, [node('close-narrow-street-pass'), node('urban-mix')], ...);
```

### Step 4: Add Spanish Localization in `src/i18n/es.ts` and `es.trail.ts`
Add the required keys for the node title, primer cards, checkpoint quiz, and exercises:
- `node.<slug>.title`
- `node.<slug>.recap1`
- `media.caption.<slug>`
- `node.<slug>.tq1.question`, `right`, `wrong1`, `wrong2`, `why`
- `node.<slug>.tq2.question`, `right`, `wrong1`, `wrong2`, `why`
- `node.<slug>.tq3.question`, `right`, `wrong1`, `wrong2`, `why`
- `node.<slug>.exercise1`, `exercise2`, `exercise3`

---

## 4. Verification & Testing

Verify new scenarios and nodes using the standard toolchain:

```bash
# 1. Typecheck the entire workspace and bundle
npm run typecheck

# 2. Verify trail continuity, prerequisites, and catalog coverage
npx jest src/shell/world.test.ts src/shell/nodes/node.test.ts src/i18n/catalog-usage.test.ts

# 3. Test close simulation mechanics and leash curves
npx jest src/sim/closeExercise.test.ts

# 4. Build single-file embedded bundle
npm run sim:embed
```
