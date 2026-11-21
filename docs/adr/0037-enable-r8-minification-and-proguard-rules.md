# Enable R8 Minification and ProGuard Rules

LeadMate enables R8 code minification and resource shrinking for Android release builds via `expo-build-properties` to satisfy Google Play's 25% code optimization threshold. To prevent startup crashes previously encountered when R8 stripped AndroidX WorkManager's `WorkDatabase`, explicit ProGuard keep rules are configured for WorkManager, Room, Google Mobile Ads, and RevenueCat.

## Considered Options

- **Disable R8 minification (`enableMinifyInReleaseBuilds: false`):** Completely disabling R8 avoids class stripping issues without requiring ProGuard rules, but leaves code obfuscation at ~1%. Rejected: Google Play flags apps with under 25% DEX code optimization and restricts store visibility and publishing privileges.
- **Global keep rules (`-dontobfuscate` / `-dontshrink`):** Allows R8 to run while disabling obfuscation or shrinking. Rejected: Does not satisfy Google Play's obfuscation requirement and inflates the APK/AAB bundle size.
- **Targeted keep rules for critical reflection/database packages:** Keep class names and interfaces for `androidx.work.**`, `androidx.room.**`, `com.google.android.gms.ads.**`, and `com.revenuecat.purchases.**` while allowing R8 to shrink and obfuscate the rest of the application. Selected: Satisfies Google Play requirements, shrinks dead code, and guarantees runtime stability.

## Consequences

- `app.json` configures `enableMinifyInReleaseBuilds: true` and `enableShrinkResourcesInReleaseBuilds: true` under `expo-build-properties`.
- `extraProguardRules` preserves runtime database instantiation and reflection in WorkManager, Room, AdMob, and RevenueCat.
- Obfuscation metric in Google Play exceeds the 25% threshold, maintaining full store discovery and publishing compliance.
