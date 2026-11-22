# Tasks

## 1. Simulator and Walk Audio Gating

- [x] 1.1 Update `reaction-tier-change` handling in `App.tsx` so `playDogSound` is suppressed when `ui.settings.sounds` is `false`, while preserving vocalizer tier tracking, and verify with a test in `src/App.test.tsx` that dog vocalizations are not played when sound is disabled
- [x] 1.2 Update `playCue` handling in `App.tsx` so `playResolvedCue` is suppressed when `ui.settings.sounds` is `false`, and verify with a test in `src/App.test.tsx` that voice cues are not played when sound is disabled

## 2. Settings Copy and Translations

- [x] 2.1 Update `'settings.feedback.sounds'` and `'settings.feedback.help'` in `src/i18n/en.ts` and `src/i18n/es.ts` to reflect full app/simulator sound muting without the misleading walk sound exclusion disclaimer, and verify with `npm test -- src/i18n/i18n.test.ts`
- [x] 2.2 Update `src/shell/screens/SettingsScreen.test.tsx` to reflect the updated translation copy and verify the settings toggle tests pass

## 3. End-to-End Verification

- [x] 3.1 Run all affected audio, settings, and shell tests (`npm test -- src/shell/audio.test.ts src/shell/ui/uiSettings.test.ts src/App.test.tsx src/shell/screens/SettingsScreen.test.tsx`) to verify complete silence in simulation when sound preference is disabled
