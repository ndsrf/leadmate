# Proposal

## Why

Right after the onboarding questions and Walk Plan, the guided first Stage (the Primer, the Checkpoint, then the first leash walk) runs the default 90 m route. At the Handler's top speed of 2 m/s that is at least 45 s, and the distractor only appears after 30 m. It is a new user's first real walk and it drags and looks empty. This is not the short taste Stage at app start (a dog approaching), which stays as it is.

## What Changes

- The guided first Stage's route shrinks from 90 m to about 36 m, so a player can finish it in under 25 s (top speed 2 m/s gives 18 s on a 36 m route, leaving slack for stopping at the distractor).
- Its Distractor (today the default skateboard) is moved to appear around the middle of the route.
- The scenery is denser than the default.
- The first-run hints (leash colour, marker, Poste, approaching dog) must still be reachable in the shorter walk.
- Only this Stage changes: the default scenario (daily walk, Rusty warm-up, taste Stage) and the later `walk-distraction` Node keep their routes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `onboarding-funnel`: the "Guided first Stage" requirement gains a length and scenery constraint.

## Impact

- `src/shell/onboarding/introNode.ts`: `INTRO_NODE.simulation.scenario` gets a shorter waypoint, an earlier Distractor and denser scenery; `App.tsx` (`startStage({})` for the `first-stage` route) passes that scenario instead of `{}`.
- Tests that assume the default route in the first Stage (`src/App.test.tsx`, `src/shell/onboarding/introNode.test.ts`) may need updating.
- No data, sync or API changes.
