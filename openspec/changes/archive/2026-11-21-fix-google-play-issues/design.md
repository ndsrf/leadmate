# Design

## Context

See `proposal.md` for background and Google Play Console warning details.

In previous releases, R8 minification and resource shrinking were set to `false` in `app.json` via `expo-build-properties` because an earlier build encountered startup issues with AndroidX WorkManager's `WorkDatabase` under default R8 code shrinking. This resulted in an obfuscation score of only 1%, triggering Google Play's DEX optimization warning.

Additionally, `<StatusBar style="dark" hidden />` in `App.tsx` causes React Native's `StatusBarModule` to invoke deprecated window parameters (`FLAG_FULLSCREEN`, `setDecorFitsSystemWindows(false)`, and cutout mode adjustments) that Android 15 flags as deprecated in edge-to-edge environments.

## Goals / Non-Goals

**Goals:**
- Re-enable R8 code shrinking/minification (`enableMinifyInReleaseBuilds: true`) and resource shrinking (`enableShrinkResourcesInReleaseBuilds: true`) in release builds.
- Define robust `extraProguardRules` in `expo-build-properties` that preserve AndroidX WorkManager, Room Database, Google Mobile Ads, and RevenueCat classes from stripping or renaming.
- Resolve Android 15 edge-to-edge deprecated API warnings by removing `hidden` from `<StatusBar>` in `App.tsx` and configuring clean edge-to-edge styling that uses transparent system bars with dark icons.
- Ensure all existing unit and integration tests continue to pass.

**Non-Goals:**
- Modifying iOS build configurations.
- Upgrading major Expo or React Native dependencies (Expo SDK 58 and React Native 0.88 already provide Android 15 compatibility primitives).
- Altering the safe area inset padding logic in existing screens (which already use `useSafeAreaInsets`).

## Decisions

### Decision 1: Re-enable R8 minification with explicit ProGuard keep rules
- **Choice**: Enable `enableMinifyInReleaseBuilds: true` and `enableShrinkResourcesInReleaseBuilds: true` in `app.json` under `expo-build-properties`. Add targeted `extraProguardRules` covering:
  - **AndroidX WorkManager & Room**:
    ```proguard
    -keep class androidx.work.** { *; }
    -keep class * extends androidx.work.Worker { *; }
    -keep class * extends androidx.work.ListenableWorker { *; }
    -keep class androidx.work.impl.WorkDatabase_Impl { *; }
    -keep class * extends androidx.room.RoomDatabase { *; }
    -dontwarn androidx.work.impl.**
    ```
  - **Google Mobile Ads**:
    ```proguard
    -keep class com.google.android.gms.ads.** { *; }
    -keep class com.google.ads.** { *; }
    ```
  - **RevenueCat Purchases**:
    ```proguard
    -keep class com.revenuecat.purchases.** { *; }
    ```
- **Rationale**: This directly resolves the 1% obfuscation metric, satisfies Google Play's >25% threshold, reduces the release bundle size, and prevents the previously encountered WorkManager startup crash.
- **Alternatives Considered**: Requesting an exemption from Google Play or relying on full ProGuard disablement. Rejected because Google Play requires code optimization to maintain store discovery and publishing standing.

### Decision 2: Modernize status bar configuration to edge-to-edge compliant style
- **Choice**: Replace `<StatusBar style="dark" hidden />` with `<StatusBar style="dark" />` in `App.tsx`.
- **Rationale**: Setting `hidden: true` in React Native invokes legacy `Window.statusBarHide()` which calls deprecated `FLAG_FULLSCREEN` and `setDecorFitsSystemWindows(false)`. Removing `hidden` allows Android 15's native edge-to-edge engine to draw the layout under transparent status and navigation bars while using modern `WindowInsetsControllerCompat` to render dark status bar icons over LeadMate's light theme background (`#F6EFE0`).
- **Alternatives Considered**: Using third-party edge-to-edge wrapper plugins. Unnecessary because Expo SDK 58 and React Native 0.88 already support modern Android 15 insets natively.

## Risks / Trade-offs

- **[Risk] R8 strips reflection-based classes in unforeseen dependencies** → *Mitigation*: The ProGuard keep rules target the known dynamic libraries (WorkManager, Room, RevenueCat, AdMob). Release builds can be validated using the EAS preview profile (`npm run eas-build:preview` or local APK build).
- **[Risk] Status bar icons clash with dark screen elements** → *Mitigation*: LeadMate's UI uses warm light backgrounds across the Shell, Map, and Settings; `style="dark"` provides crisp, accessible contrast.
- **[Risk] Unit test mock regressions** → *Mitigation*: `App.test.tsx` already mocks `expo-status-bar`, so removing the `hidden` attribute has zero negative impact on test assertions.
