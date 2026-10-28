# Proposal

## Why

Battery life matters most for a game people play on their phone during the day. The `reduce-cpu-and-battery-use` change (2026-10-21) put the Stage loop to sleep when nothing is on screen and capped play at 30 fps. Since then the app has gained the revamped World Map, minigame scenes, the vector Dog avatar and lesson videos. A review of the current code on iPhone and Android found several remaining costs: idle work, wasted wakeups and per-frame CPU work that the earlier change never reached or that the new features brought in:

- **Stage (Phaser in a WebView):** Phaser creates a WebAudio `AudioContext` by default, although the bundle plays no sound (the shell does). On Android this keeps the audio pipeline awake for the whole session, and on iOS it does so once the first touch unlocks it. Every static wall piece, shape prop and prop shadow is a separate `Graphics` object that Phaser re-tessellates on the CPU each frame. The 30 fps cap skips frames inside a `requestAnimationFrame` loop, so a 90/120 Hz Android WebView still wakes JS 90 to 120 times a second to draw 30. While Go Sniff is on offer, the HUD is redrawn on every frame.
- **Menus:** the World Map's endless "next-up" ring keeps animating while Settings, the Library or a Lesson covers the map. The splash loader loops with no foreground check. The Checkpoint countdown re-renders React 10 times a second.
- **Minigames:** the Dog's bark and strain wobbles loop with no foreground check. (The Doorbell, Poste/Harness and Diagnostic tickers also wake JS 20 times a second, but only for 15 to 60 seconds with the screen on; this change leaves them as they are, see design Non-Goals.)
- **Background:** the Supabase client's token auto-refresh timer runs whatever the app state. A lesson video, or a page in the in-app browser, can keep playing media in the Android WebView after the app goes to the background. The pending Phase 2.4/3.1/5.x device checks from the earlier change were never done, so nothing confirms the savings on real phones.

## What Changes

- Turn off Phaser's audio system in the Stage bundle, which has no Phaser sound.
- Bake the static Stage scenery (wall pieces, shape props, prop shadows, route markers until the route index changes) into textures once per Stage, so frames stop re-tessellating static geometry.
- Pace the Stage loop with a 30 Hz timer instead of filtering a display-rate `requestAnimationFrame` loop, so the loop wakes about 30 times a second on any display. Keep a fallback switch.
- Quantize the Go Sniff countdown ring in the HUD key, so the HUD redraws a few times per second instead of every frame.
- Pause every looping shell animation (World Map ring, splash loader, bell ripple, Dog wobble) when the app is not active *or* the screen that owns it is covered, using one shared hook.
- Make the Checkpoint countdown text update once per second, with the progress bar driven on the UI thread.
- Stop the Supabase auto-refresh timer in the background and start it again in the foreground (iOS and Android; the web build keeps supabase-js's own visibility handling).
- Pause lesson video and in-app browser media in place when the app goes to the background. It stays paused on return.
- Add a loop-wakeup counter to the dev perf readout and extend `scripts/power.mjs`. Record measurements on one iPhone and one Android phone with a 90/120 Hz screen with a fixed protocol, including the device checks carried over from the earlier change. Merging waits on these numbers.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `power-efficiency`: adds requirements for bounded loop wakeups (not only drawn frames), no idle audio engine, static scenery drawn without per-frame CPU tessellation, looping animations paused when covered, no background network timers or media, and per-platform device verification. Tightens the existing "Shell does no background work" requirement to cover covered screens and every looping animation.

## Impact

- `bundle/main.ts` (game config: `audio.noAudio`, `fps.forceSetTimeOut`, perf readout), `bundle/src/StageScene.ts` (baking static scenery, route markers, HUD key), `scripts/power.mjs`.
- Shell: `src/shell/ui/useAppActive.ts` (or a new `useAnimationsLive` hook), `WorldMapScreen.tsx`, `SplashScreen.tsx`, `MinigameProps.tsx`, `CanineMinigameAvatar.tsx`, `NodeScreens.tsx` (Checkpoint), `App.tsx` (marking the map as covered), `LessonVideo.tsx`, `InAppBrowserModal.tsx`, `src/shell/sync/client.ts`/`useAccount.ts`.
- No new dependencies. No change to simulation outcomes, visuals in play, or the shell–bundle message protocol.
- Platforms: iOS (WKWebView) and Android (Chromium WebView) are both in scope. The web build keeps working.
