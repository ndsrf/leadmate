# Tasks

## 1. Android Build Properties & ProGuard Optimization

- [x] 1.1 Configure `app.json` `expo-build-properties` to enable R8 minification (`enableMinifyInReleaseBuilds: true`) and resource shrinking (`enableShrinkResourcesInReleaseBuilds: true`), and verify that `npx expo config --type prebuild` parses the config cleanly
- [x] 1.2 Add `extraProguardRules` in `expo-build-properties` to keep AndroidX WorkManager, Room Database, Google Mobile Ads, and RevenueCat classes, and verify that the rules are included in prebuild configuration

## 2. Android 15 Edge-to-Edge & Status Bar Compliance

- [x] 2.1 Update `App.tsx` to remove the obsolete `hidden` prop from `<StatusBar style="dark" />`, enabling edge-to-edge rendering without deprecated `FLAG_FULLSCREEN` or window fitting calls
- [x] 2.2 Run shell and UI unit tests (`npm test -- -t "Screen|App"`) to verify status bar and safe area rendering behave as expected

## 3. Verification & Type Safety

- [x] 3.1 Run `npm run typecheck` and `npm test` across the project to ensure no regressions
- [x] 3.2 Inspect prebuild Android configuration with `npx expo config --type prebuild` to ensure all properties and rules are properly formed
