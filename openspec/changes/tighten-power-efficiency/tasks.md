# Tasks

## 1. Measure

- [x] 1.1 Add a `wakes` counter (`game.loop.frame`, which also counts frames the fps limit skips) to `__leadmate.perf` and the `?perf=1` readout in `bundle/main.ts`. Verify in `npm run sim:dev` that the readout shows wakes/s next to frames/s.
- [ ] 1.2 Record a baseline from a `main` build (this can happen at any time, in parallel with the code tasks): wakes/s, frames/s and ms/frame while playing (calm and with Go Sniff on offer, on the densest scenery theme), paused and on the World Map. Record them on a real Android phone at 90/120 Hz (dev build with `EXPO_PUBLIC_SIM_URL` pointing at `sim:dev?perf=1`) and a real iPhone. Measure battery drop (Android battery stats, Xcode energy gauge) with the fixed protocol: same device as the 5.1 run, 50% brightness with auto-brightness off, no other apps, 15 minutes of continuous play on one fixed-seed Stage on the densest theme (restart it when it ends), then 15 minutes idle on the World Map. Save the numbers in the PR description draft. Verify by comparing them with the readout values.

## 2. Stage bundle

- [x] 2.1 Set `audio: { noAudio: true }` in the Phaser game config. Verify `game.sound` is a `NoAudioSoundManager` from `__leadmate.game.sound.constructor.name` in Playwright, and that Cue and Dog sounds still play through the shell on a device.
- [x] 2.2 Add `PACE_WITH_TIMER = true` and `fps.forceSetTimeOut`, set from `PACE_WITH_TIMER` unless the URL has `?pace=raf` (or `?pace=timer`). Extend `scripts/power.mjs` to assert wakes/s ≤ 33 while playing and 0 while paused, ended, suspended or hidden, and steps/s unchanged. Verify `node scripts/power.mjs` passes, `npm test` sim tests pass, and `?pace=raf` brings back display-rate wakes in `sim:dev`.
- [x] 2.3 Quantize `sniffLeft` in the HUD dirty key (design §4) and add a `hud.test.ts`/`dirty.test.ts` case. Verify that HUD redraws per second while Go Sniff is on offer drop from about 30 to about 16 (count `hud.clear` calls in a Playwright run).
- [x] 2.4 Move route markers and the flag into their own `Graphics`, redrawn only when `routeIndex` changes. Verify visually that the passed marker greys out on the frame it is passed.
- [x] 2.5 Bake shape-drawn props into generated textures, and prop shadows into the ground chunks (design §3). Free the generated textures on scene shutdown. Verify with before/after screenshots of each theme (Playwright, same seed) that at most 0.5% of pixels differ beyond a small per-channel delta, and that the texture count does not grow across three Stage restarts. (Accepted exception: the HALLWAY close-up at about 0.64%, edge pixels only; design Risks.)
- [x] 2.6 Replace wall-piece `Graphics` with `Image`s from cached generated textures that keep per-piece depth and alpha. Make `fadeWalls` skip converged pieces. Verify with screenshots (same 0.5% tolerance, plus one manual side-by-side look at the densest theme) and by walking behind a wall in `sim:dev` (fade and sort as before), and that ms/frame on the densest scenario drops against the 1.2 baseline.
- [x] 2.7 Document `wakes`, `PACE_WITH_TIMER`, `?pace=` and the new power.mjs checks in README's power section. Verify the documented commands run as written.

## 3. Shell animations and countdowns

- [x] 3.1 Add `useLive(covered?)` (app active and not covered) next to `useAppActive`, with a hook test that toggles AppState and `covered`. Verify `npm test` passes.
- [x] 3.2 Use `useLive` in `NextUpRing`, `LoaderLead`, `BellRipple` and `useWobble`: cancel and reset to a static frame when not live, restart when live. Verify by manually toggling AppState in a dev build that each one stops and restarts.
- [x] 3.3 Add a `covered` prop to `WorldMapScreen`, set from `mapWith` in `App.tsx` when Settings, the Library or a Lesson is shown. Verify on a device with the reanimated/perf monitor (or React DevTools profiler) that the ring stops under Settings and resumes on close.
- [x] 3.4 Checkpoint: keep the 100 ms ticker as the only source of the timeout, update `left` only on whole-second changes, and drive `ProgressBar` with a purely visual UI-thread `withTiming` that pauses and resumes with `useLive` (design §6). Verify with a test that the screen renders about once per second, and by hand that the bar is smooth and the timeout still fires on time after a background/foreground round trip.

## 4. Background work

- [x] 4.1 Create the Supabase client with `autoRefreshToken: Platform.OS === 'web'`, and on native only start/stop auto-refresh from AppState in `useAccount`. Add a test with a mocked client that on native background stops it and foreground starts it, and that on web neither is called.
- [x] 4.2 `LessonVideo` (native) and `InAppBrowserModal` pause main-frame media in place via `injectJavaScript` when the app goes to the background, with no unmount fallback (design §8). Verify on an Android phone and an iPhone that a playing lesson video stops when the app is backgrounded (no audio, no media notification), and on return is still paused at the same position.

## 5. Device verification (both platforms)

- [ ] 5.1 Re-run the 1.2 measurements with the same protocol on the same Android phone and iPhone. The PR does not merge without these numbers. Confirm about 30 wakes/s and ≤ 30 frames/s while playing, 0 frames/wakes on the World Map, paused and backgrounded (carried over from the earlier change's open tasks 2.4/5.1/5.2), and lower ms/frame and battery drop than the baseline. Record the results in the PR.
- [ ] 5.2 Check pan smoothness on both devices, comparing timer pacing with `?pace=raf` against `sim:dev`. If timer pacing judders, set `PACE_WITH_TIMER` to false for that build and record why. Verify by recording the decision in the PR.
- [x] 5.3 Run `npm test`, `npm run typecheck` and `node scripts/power.mjs`, and confirm all pass.

## Workflow follow-up

- Archive the change with `/opsx:archive` after device results are recorded and the PR is reviewed.
