# Tasks

## 1. Rusty Dog per App Session

- [x] 1.1 Reproduce with a failing App-level test (gap reached while in the background) and verify it fails on the unchanged code
- [x] 1.2 Add `useRustyDog` in `src/shell/` and verify `useRustyDog.test.tsx` covers the first decision, a new session after a graded Stage, a reset warm-up outcome and a progress reset
- [x] 1.3 Use the hook in `App.tsx` (map props, capacity, foreground handler, progress reset) and verify the App tests cover the reproduction, a short absence and a progress reset

## 2. Warm-up countdown

- [x] 2.1 Add the scenario flag, the seconds-left rule and the `countdown` message, report it from the Stage, and verify tests show 40 at the start, a falling value, no change while paused, 0 at the end and nothing for other scenarios
- [x] 2.2 Show the countdown overlay in the warm-up with Spanish and English text, below which the hint panel starts, and verify the overlay and App tests cover showing, updating, pausing and disappearing
- [x] 2.3 Keep the hint panel's usual place in every other Stage, and verify the overlay and App tests cover both places
- [x] 2.4 Verify an App test covers a new App Session starting during the warm-up walk

## 3. Integration

- [x] 3.1 Verify `npm run typecheck`, `npm test`, `npm run content:validate`, `npm run sim:build` and `openspec validate fix-rusty-dog-on-new-session --strict` pass
- [x] 3.2 Verify in the web shell that a Rusty Dog appears after a background gap without a reload, and that the warm-up countdown starts at 40 s, falls, freezes while paused and is gone when the walk ends
