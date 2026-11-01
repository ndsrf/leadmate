# Proposal

## Why

Playing in Expo Go still heats the phone: the performance monitor shows 50–60 fps on the World Map and on Barkdoku, screens that should be near-static. Earlier work (`power-efficiency`) capped the Stage at 30 fps and stopped the Stage's render loop when hidden, but the shell still pays for things nobody is looking at. Reading the code, the likely sources are a full-screen Phaser WebView that stays mounted under every shell screen, and an endless pulse on the World Map's Next Up ring. Barkdoku has no loop of its own, so its 60 fps points at the WebView (or at Expo Go's dev build) rather than the puzzle.

## What Changes

- Measure first: record a baseline on the World Map and Barkdoku in a production-like build (not just dev-mode Expo Go) with the WebView mounted vs. not, so each fix is judged against real numbers.
- Mount the Stage WebView only while a Stage (or its loading/warm-up) is needed, and unmount it when the player returns to shell screens, so no browser engine, compositor layer or JS heap sits behind the World Map or Barkdoku.
- Bound the World Map Next Up pulse: it runs a few cycles after the map appears or the Next Up node changes, then rests as a static ring, instead of animating forever.
- Gate the app-wide "bundle never reported ready" load timeout so it only runs while the Stage view is mounted and loading.
- Separate display power from CPU/GPU cost in the baseline: fixed brightness, and a run on the Dark appearance for comparison, so a bright UI on an OLED screen is not mistaken for app load.
- Check the World Map's scroll and first-render cost (all worlds and nodes render at once in a plain `ScrollView`), and only if it is significant, stop rendering the heavy parts of rows far off-screen.
- Keep a short written device-check record (fps, thermal/battery) with the change, as `power-efficiency` already requires.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `power-efficiency`: adds requirements that the Stage view is not alive behind shell screens, that no looping animation runs indefinitely on a resting screen, and that power checks use a production-like build.

## Impact

- `App.tsx` (SimView mount/unmount, `bundle` loading state, pending-start handling, load-timeout effect, AppState wake/suspend).
- `src/shell/SimView.tsx` / `SimView.web.tsx` (lifecycle only; no protocol change).
- `src/shell/screens/WorldMapScreen.tsx` (`NextUpRing`).
- Tests: App-level Stage start/retry flow, WorldMapScreen ring tests.
- Docs: a note in `docs/` with the baseline and after numbers.
- Trade-off: the first Stage after a screen change pays the bundle load time (the existing LoadingOverlay covers it).
- Out of scope: Stage render cost (already capped at 30 fps), Reanimated minigame animations, and ads.
