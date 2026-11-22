# Proposal

## Why

When users turn off the sound toggle in Settings (Preferences), they expect the entire app—especially the interactive simulation/walk—to be completely silent. Currently, turning off sounds only silences UI button taps and HUD feedback chimes, while the simulator continues to play dog vocalizations (whines, growls, barks) and voice cues ("Let's go", "Aquí"), directly violating user preferences.

## What Changes

- Extend the sound preference check in the shell audio pipeline so that when sound is disabled (`sounds === false`):
  - Dog vocalizations (`reaction-tier-change` events: whines, growls, barks) are muted.
  - Voice cues triggered by the simulator (`playCue` events) are muted.
  - All stage feedback sounds (ticks, chimes, bonks, fanfares) and telegraph countdown ticks remain muted.
- Update Settings preference copy and help text in English and Spanish to reflect that turning sound off silences all sounds (removing the outdated note claiming walk sounds and voice cues are unaffected).
- Ensure manual audio previews in the Settings screen (testing a voice pack or recorded custom cue) remain intentional or explicitly handled without making unwanted noises during simulation.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `ui-feedback`: Extend the user sound preference requirement so that disabling sound silences all audio playback across the application, including walk and simulation sounds.
- `dog-reactivity`: Clarify that the shell audio pipeline for `reaction-tier-change` triggers dog vocalizations only when the device sound preference is enabled.
- `voice-cues`: Clarify that the shell audio pipeline plays simulation `playCue` audio only when the device sound preference is enabled.

## Impact

- **Shell audio & stage integration**: `App.tsx` and `src/shell/audio.ts` (or `vocalizer` invocations) to check the active `uiSettings.sounds` state before playing vocalizations or voice cues.
- **Settings UI & translations**: `src/shell/screens/SettingsScreen.tsx`, `src/i18n/en.ts`, and `src/i18n/es.ts` updated to remove misleading helper text.
- **Specs & Tests**: Unit and integration tests for `App.tsx`, `audio.test.ts`, `uiSettings.test.ts`, and `SettingsScreen.test.tsx`.
