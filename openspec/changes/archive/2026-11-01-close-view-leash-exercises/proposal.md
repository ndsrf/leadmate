# Proposal

## Why

The current walking simulator operates from a broad isometric camera optimized for route navigation, which lacks the visual proximity and mechanical controls needed to practice close-quarters leash handling. Handlers facing high-tension encounters—such as passing an approaching dog in a narrow street—need dedicated practice on fine-grained leash gathering, body shielding, tension dampening, and marker/cue timing without the cognitive load of navigating movement along a route.

## What Changes

- **Close 2D Isometric View**: Add a dedicated, close-up 2D isometric scene in the simulation bundle using high-detail canine, handler, and distractor graphics to clearly visualize canine body language, head turns, and leash tension geometry.
- **Direct Leash Handling Mechanics**: Replace directional walking movement controls in close-view exercises with direct leash manipulation actions: gathering/shortening leash length, anchoring tension, releasing slack, and shifting handler position to visually shield the dog.
- **Narrow Street Passing Encounter**: Introduce a close-view exercise scenario simulating a narrow street or sidewalk where an approaching distractor dog passes, challenging the handler's leash gathering, tension management, and cue timing.
- **Training Node Integration**: Support dedicated close-view leash exercise stages within the training node loop, capturing leash handling telemetry and feeding focused debrief real-world transfer exercises.

## Capabilities

### New Capabilities
- `close-leash-exercises`: Close 2D isometric simulation view and mechanics for practicing leash gathering/shortening, tension anchoring, slack release, body shielding positioning, and passing distractor encounters.

### Modified Capabilities
- `training-node-loop`: Extends interactive simulation modes to include dedicated close-view leash exercise stages that record leash handling performance and route into the four-step node lifecycle.

## Impact

- `bundle/`: Adds close-view isometric scene rendering, high-detail canine and handler asset representations, and specialized leash HUD controls.
- `src/sim/`: Adds scenario configurations, state machines, and input models for close-view leash gathering, shielding, and approaching distractor trajectories.
- `src/shell/`: Integrates close-view exercise nodes into the curriculum and maps simulation messages to telemetry and debrief screens.
- `src/i18n/`: Adds localized copy for close leash handling controls, instructional hints, and debrief feedback.
