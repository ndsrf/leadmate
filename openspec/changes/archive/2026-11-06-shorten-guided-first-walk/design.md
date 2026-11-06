# Design

## Context

The funnel's `first-stage` route plays `INTRO_NODE` (`src/shell/onboarding/introNode.ts`): Primer, Checkpoint, then `App.tsx` calls `startStage({})`, so the walk is the default scenario: `waypoint` x=90, distractor `skateboard` (speed 4, `activateAfterMeters: 30`, `startOffset: 28`), seed-1 scenery. `INTRO_NODE.simulation` is `{}`. Handler speed is at most `quickSpeed` = 2 m/s, so 25 s is at most 50 m, and stopping for the distractor eats into that. The default scenario is shared with the daily walk, Rusty warm-up, taste Stage and the later `walk-distraction` Node.

## Goals / Non-Goals

**Goals:** a first walk finishable in under 25 s; the encounter happens around the middle; visibly denser scenery; first-run hints still fire.

**Non-Goals:** changing the default scenario, the taste Stage, scoring, cues or the later walk Node.

## Decisions

- **Override on the intro Node, not the default.** Put a `scenario` in `INTRO_NODE.simulation` and have `App.tsx` start the first Stage with it (`startStage(INTRO_NODE.simulation.scenario ?? {})`), as Nodes on the trail already do.
- **Route of 36 m** (18 s at top speed, 7 s of slack for the stop-and-wait).
- **Distractor at the middle of the route**: `activateAfterMeters` about 18 (half of 36 m) with a `startOffset` small enough that it is on screen and crossing shortly after, rather than the default 30 m / 28 m. Exact numbers are tuned with a sim test.
- **Denser scenery** via `scatterScenery` with `perMeter` about 0.5 (one prop per 2 m) over the 36 m route, seed 1.
- **Distractor kind stays the default skateboard.** No per-Dog or per-concern override exists for this Stage. Swapping the kind (e.g. `child`/`other`) is a one-line change if wanted.

## Risks / Trade-offs

- [Hints may not fire in a short walk: the Marker explanation needs a fixation, the Poste needs the leash at its limit] → the mid-route Distractor guarantees a fixation; a test checks the marker and Poste hints can trigger in the shortened walk.
- [36 m leaves little to practise] → this is an introduction; the trail's later walks are longer.
- [Dense props could block the route or leash] → scatter keeps its clearance; geometry validation test.
- [Tests assuming the default route] → update them to read the Node's scenario.
