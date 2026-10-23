# Tasks

## 1. Simulation signal

- [x] 1.1 Add a `dog-approaching` sim event, emitted once per Stage when an active `dog` Distractor first comes within the approach range of the Dog, in `src/sim/sim.ts`. Verify with a sim unit test: fires once for a dog, never for food/child/bicycle, not before the range.
- [x] 1.2 Add `dog-approaching` to `STAGE_SIGNALS` (with the dog's bearing) and a `control-used` signal telling which control was used (`move` | `mark`) in `src/sim/messages.ts`, and emit them from `bundle/src/StageScene.ts`. Verify with tests that each is sent once per Stage.

## 2. Hint and Coach mark model

- [x] 2.1 Add `dog-approaching`, `coach-move` and `coach-mark` to `HINT_IDS`, map the signal in `hintFor`, and add text keys in `src/shell/onboarding/hints.ts`. Verify in `hints.test.ts`: seen ids suppress, unseen show, `hintsRemain` accounts for both.
- [x] 2.2 Add `coach.controls.move`, `coach.controls.mark`, `coach.dog.warning` ("{name}") to `src/i18n/es.ts`, remove `onboarding.taste.control`/`TASTE_LINE_KEY`. Verify `npm test` (catalog-usage test) passes.

## 3. Overlays

- [x] 3.1 Build the two Coach mark overlays (move, mark) in `src/shell/Overlays.tsx`, placing pointers via `hudLayout`, non-blocking, tokens only. Verify with a layout unit test for several screen sizes and `noRawColors`.
- [x] 3.2 Build the approaching-dog warning overlay with the Dog's name and an edge arrow from the bearing. Verify with a unit test of the name/neutral fallback and arrow placement.

## 4. Wiring

- [x] 4.1 In `App.tsx`, show each Coach mark from Stage start while its id is unseen, hide it when its control is used, on pause, and (Marker) after 20 s; replace the taste text line; record the id when used, including in the taste. Verify by running the app: marks appear, the move mark goes on the first drag, the Marker mark stays until the first press.
- [x] 4.2 Show the warning on the `dog-approaching` signal for 7 s; record `seenHints` outside the taste only. Verify by running the app: warning shows with the Dog's name once; replay shows none; reset shows the Coach marks again.
- [x] 4.3 Run `npm test` and the typecheck; fix regressions in taste and first-stage tests.
