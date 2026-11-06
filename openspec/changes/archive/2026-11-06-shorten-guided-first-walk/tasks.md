# Tasks

## 1. Shorten the guided first walk

- [x] 1.1 In `src/shell/onboarding/introNode.ts`, give `INTRO_NODE.simulation.scenario` a 36 m waypoint and a mid-route Distractor, and make `App.tsx` start the first Stage with it; verify an `introNode.test.ts` case shows waypoint x=36 while `defaultScenario.waypoint` stays 90.
- [x] 1.2 Add a sim test where a scripted player walks at top speed, stopping once for the Distractor; verify the Stage ends in under 25 s and the Distractor first appears at about half the route and crosses before the waypoint.
- [x] 1.3 Add a test that the taste, warm-up and `walk-distraction` scenarios keep their routes (the daily walk has a random route and does not use the first-walk override); verify it passes.
- [x] 1.4 Verify (test) that the marker and Poste first-run hints can still trigger in the shortened walk.

## 2. Denser scenery

- [x] 2.1 Scatter the scenery over the 36 m route with a higher `perMeter`; verify a test that props per meter exceed the default's and that `validateScenario` passes.
- [x] 2.2 Run the app (`/run`), go through onboarding to the first walk and eyeball it: props not hiding the Distractor or blocking the route.

## 3. Wrap-up

- [x] 3.1 Run `npm test` and typecheck and fix tests that assumed the default route in the first Stage (e.g. `src/App.test.tsx`); verify the suite is green.
