# Tasks

## 1. Baseline measurement

- [ ] 1.1 On a real phone, record fps (perf monitor) and 10-minute battery drop / temperature feel on the World Map and on Barkdoku, in Expo Go dev mode and with `expo start --no-dev --minify`; save the table in `docs/power-baseline.md` and verify both modes are filled in for both screens.
- [ ] 1.2 Record the same readings at fixed 50% brightness (auto-brightness off) and once with the Dark appearance, and verify the doc separates display power from app load; also record how long the Stage view takes to load from a cold mount.
- [ ] 1.3 Repeat the World Map and Barkdoku readings with the SimView temporarily removed (local hack, not committed) to confirm the WebView is the main cost; verify the numbers are in the doc and note which of Decision 1's options to pursue.

## 2. Mount the Stage view on demand

- [x] 2.1 Add a `stageViewWanted` derivation in `App.tsx` true from the Primer or Checkpoint step of any Node flow containing a Stage and for the Daily, taste, first-run and warm-up flows, false once the Stage ends or is quit; verify with a unit test that it is false on the World Map, Barkdoku, Settings, Library and the Debrief.
- [x] 2.1b Verify with tests that Nodes carrying both `minigame` and `scenario` never mount the Stage view, that backing out of the Primer or Checkpoint releases it and clears `pendingStart`, and that a load failure before play remounts once silently and then reaches the error/retry state only if still not ready at Stage start.
- [x] 2.2 Render `<SimView>` only when `stageViewWanted`, reset `bundle`/`bundleReady` on unmount and ignore messages from a stale view; verify with a test that leaving a Stage unmounts the view and the next Stage starts with the same seed and scenario.
- [x] 2.3 Gate the load-timeout effect and AppState `wake`/`suspend` sends on the view existing; verify with a test that no timer runs on the World Map and that a never-ready view still reaches the error/retry state.
- [x] 2.4 Update `docs/` (and ADR 0001 notes if it states the view is always mounted) and verify the text matches the new lifecycle.

- [ ] 2.5 Apply the Decision 1 rule using the cold-load time from task 1.2 (unmount if under about 1 s on Android, otherwise hide the view), and record the choice in `docs/power-baseline.md`.

## 3. Bounded Next Up pulse

- [x] 3.1 Change `NextUpRing` in `WorldMapScreen.tsx` to a finite repeat that ends on the static ring, restarting on live/Next Up changes; verify with `WorldMapScreen.test.tsx` that reduced motion is static and the animation is not infinite.

- [ ] 3.2 Profile World Map scrolling and first render on a real phone with several worlds expanded and record the result in `docs/power-baseline.md`; only if it is significant, limit heavy row parts to rows near the viewport and verify the map tests and scroll-to-Next-Up still pass. If not significant, record that and skip.

## 4. Verify on device

- [ ] 4.1 Re-run the task 1.1 measurements after the changes on one iPhone and one Android phone; verify, in a production-like build, that idle UI-thread activity on the map and Barkdoku is near zero and the phone does not warm noticeably over 15 minutes at fixed brightness (Expo Go dev-mode readings reported separately) and a Stage still starts from the map, daily, taste and first-run flows.
- [x] 4.2 Run `npm test` and `npm run typecheck` and verify both pass.
