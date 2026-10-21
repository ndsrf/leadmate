# Proposal

## Why

A tester's phone got hot after a while of play, and they suspect the game kept burning CPU even with the screen off. Reading the code confirms the suspicion: the Phaser render loop in the WebView never stops. "Pause" only freezes the simulation clock; the scene still redraws every frame at the display's refresh rate while paused, on the results screen, on the World Map (the WebView stays mounted behind every shell screen), and when the app is backgrounded or the screen is off. A daily-habit game that drains the battery gets uninstalled, so power use is a release-blocking quality, not polish.

## What Changes

- Stop the render loop (not just the simulation clock) whenever the Stage is paused, ended, not on screen, or the app is not in the foreground, and resume it cleanly on return.
- Stop the WebView from running at all while no Stage is being shown (World Map, Settings, debriefs, and so on), and start it again when a Stage starts.
- Cap rendering at 30 frames per second. The simulation keeps its fixed 60 Hz step, so training outcomes are unchanged.
- Skip HUD and camera updates for frames where nothing visible changed (static HUD, unchanged labels, camera already in place).
- Cap the render resolution at 2x device pixel ratio, turn antialiasing off and ask the GPU for low-power mode.
- Add a lightweight dev-only way to measure frames drawn and simulation steps per second, so the savings can be checked and kept from regressing.
- Shell side: stop the repeating World Map pulse and shell timers when their screen is not visible or the app is backgrounded. The minigame timers (`DiagnosticView` at 20 ms, `DoorbellMatView` and `PosteMinigameView` at 50 ms) stop re-rendering React on every tick and pause when the app is backgrounded.

Out of scope: changing simulation rules, art style or the Phaser dependency; any in-app "battery saver" setting (the defaults apply to everyone).

## Capabilities

### New Capabilities
- `power-efficiency`: The app uses no CPU/GPU for rendering when nothing is being shown or played, limits frame rate and resolution while playing, and exposes a way to measure it.

### Modified Capabilities

(none; the existing `stage-flow` "Pause when unfocused" requirement still holds and `power-efficiency` adds to it)

## Impact

- Code: `bundle/main.ts` (Phaser game config, pause/resume wiring, lifecycle), `bundle/src/StageScene.ts` (update/draw/HUD and camera gating), `src/sim/messages.ts` (new shell messages such as `suspend`), `src/shell/SimView.tsx` / `SimView.web.tsx`, `App.tsx` (AppState and view-driven lifecycle), `src/shell/screens/WorldMapScreen.tsx`, `NodeScreens.tsx`, `DiagnosticView.tsx`, `DoorbellMatView.tsx`, `PosteMinigameView.tsx` and other timers/animations.
- No new runtime dependencies; no change to save data, scoring or specs of existing capabilities. No new glossary terms and no ADR.
