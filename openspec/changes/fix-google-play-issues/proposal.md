# Proposal

## Why

Google Play Console flagged two warnings for the initial release of LeadMate:
1. **DEX code optimization is below threshold**: Code obfuscation is at 1% (Google Play requires at least 25% to avoid negatively impacting app visibility and publishing capabilities). This occurs because R8 minification and shrinking were explicitly disabled in release builds to avoid a WorkManager database crash.
2. **Deprecated Edge-to-Edge APIs / parameters on Android 15**: Google Play detected calls to deprecated window and system bar parameters (`setStatusBarColor`, `setNavigationBarColor`, `setDecorFitsSystemWindows`, `FLAG_FULLSCREEN`, or related cutout parameters) enforced on Android 15 (API 35).

Resolving both issues is necessary to maintain app visibility and publishing privileges on Google Play, shrink the release bundle, and comply with Android 15 platform standards.

## What Changes

- **Enable R8 Minification & Resource Shrinking**: Update `expo-build-properties` in `app.json` to enable `enableMinifyInReleaseBuilds: true` and `enableShrinkResourcesInReleaseBuilds: true`.
- **Add ProGuard Keep Rules**: Provide explicit `extraProguardRules` in `expo-build-properties` for AndroidX WorkManager, Room Database, Google Mobile Ads, and RevenueCat to prevent startup crashes when R8 minification is enabled.
- **Android 15 Edge-to-Edge Compliance**: Modernize system bar presentation in `App.tsx` and `app.json`. Remove obsolete `hidden` parameter on `<StatusBar>` that triggered deprecated `FLAG_FULLSCREEN` and `setDecorFitsSystemWindows` calls on Android, ensuring the app draws edge-to-edge with transparent system bars and dark content styling while respecting safe area insets.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `app-shell`: Add requirement for Android 15 edge-to-edge window display and system bar handling compliant with modern AndroidX APIs.

## Impact

- **Configuration (`app.json`)**: Configures `expo-build-properties` with minification enabled and tailored ProGuard rules.
- **Root Shell (`App.tsx`)**: Replaces the deprecated full-screen status bar hide with edge-to-edge compliant status bar configuration (`<StatusBar style="dark" />`).
- **Release Artifacts (`.aab` / EAS Build)**: Release builds will be obfuscated above the 25% threshold, have smaller binary size due to resource and code shrinking, and pass Google Play pre-launch checks without Android 15 edge-to-edge deprecation notices.
