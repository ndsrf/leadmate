# Design

## Context

Sound in Leadmate originates from two main pipelines:
1. **Interactive UI & Stage Feedback**: Managed by `src/shell/ui/feedback.ts`, which already checks `getSettings().sounds` before triggering button press clicks, star reveals, celebration sounds, in-stage feedback sounds (chimes, ticks, fanfares, bonks), and telegraph ticks.
2. **Simulation Audio Events**: Dispatched across the WebView bridge from the simulation to the shell in `App.tsx`:
   - `reaction-tier-change`: Calls `vocalizer.current.onTier(...)`, which fires `playDogSound(...)` (`assets/dog/bark.wav`, `whine.wav`, `growl.wav`).
   - `playCue`: Calls `playResolvedCue(...)` to voice the Dog's cue (`lets-go.es.wav`, `aqui.es.wav`, or custom user recording).

Previously, simulation audio events bypassed `ui.settings.sounds` because the setting was originally conceived as "Interface sounds" only (with explanatory text stating it did not affect walk sounds or voice cues). When users turn sound off, they expect all audio from the simulator and walks to be muted.

See `proposal.md` for motivation and `specs/` for behavioral requirements.

## Goals / Non-Goals

**Goals:**
- Completely silence the simulator and walk sessions when `ui.settings.sounds === false`, including dog vocalizations (`reaction-tier-change`) and voice cues (`playCue`).
- Keep the pure deterministic simulation behavior intact: simulation calculations, Arousal meters, debrief telemetry, and cue mechanics must run identically whether sound is enabled or disabled.
- Update Settings UI copy and translations (`src/i18n/en.ts`, `src/i18n/es.ts`) so labels and help captions accurately reflect that sound controls both interface and simulator audio.
- Preserve intentional on-demand cue audio previews within the Settings screen if the user explicitly presses "Play" while testing or configuring a voice pack.

**Non-Goals:**
- Changing simulation message protocols or altering bridge payloads.
- Adding independent multi-channel audio sliders (e.g. separate volume bars for effects vs voices); a single unified sound toggle matches the app's clean design.

## Decisions

### 1. Gate simulation audio in the shell event dispatch layer

- **Decision**: In `App.tsx`, check `ui.settings.sounds` before triggering audio playback on bridge messages (`reaction-tier-change` and `playCue`).
- **Implementation**:
  - Keep `vocalizer.current` alive so its internal tier tracking and cooldown timers continue advancing naturally. Provide a playback callback that checks the current `sounds` setting before calling `playDogSound`, or gate the `onTier` audio trigger.
  - Gate `playResolvedCue` in the `playCue` bridge message handler so audio is skipped when `ui.settings.sounds` is false.
- **Alternatives considered**:
  - *Muting inside `src/shell/audio.ts` globally*: Would require `audio.ts` to maintain state or depend on `uiSettings`. Keeping `audio.ts` stateless and letting `App.tsx` (which already owns `ui.settings`) control playback keeps `audio.ts` simple and easily testable.

### 2. Update Settings copy and catalog translations

- **Decision**: Update `'settings.feedback.sounds'` from "Interface sounds" ("Sonidos de la interfaz") to "Sounds" ("Sonidos"). Update `'settings.feedback.help'` to remove the sentence "Does not affect walk sounds or your Dog's voice cues." ("No afecta al paseo ni a la voz de tu perro."), leaving only "On this device only." ("Solo en este dispositivo.").
- **Rationale**: Eliminates user confusion and aligns the UI with actual behavior.

## Risks / Trade-offs

- **[Risk]** User turns sounds off, but vocalizer cooldown becomes desynchronized if vocalizer calls are bypassed entirely.
  - **Mitigation**: Allow `vocalizer.current.onTier` to track state updates, but have its output player function respect the `sounds` preference (or check `sounds` inside the audio callback).
- **[Risk]** Broken test expectations that mock or spy on `playDogSound` and `playResolvedCue` during walk tests.
  - **Mitigation**: Ensure default test fixtures have `sounds: true` unless testing the muted preference, and add explicit unit tests for both enabled and muted states.
