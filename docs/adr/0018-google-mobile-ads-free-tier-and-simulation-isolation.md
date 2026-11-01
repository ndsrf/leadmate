# Google Mobile Ads for Free Tier and Simulation Isolation

LeadMate monetizes Free Tier users via Google Mobile Ads (`react-native-google-mobile-ads`) using an Anchored Banner at the base of the World Map and infrequent Transition Interstitials when returning from completed Stage Debriefs. To preserve handler safety and canine training focus, all interactive simulations and minigames are strictly isolated and 100% ad-free.

## Considered Options

- **Multi-network mediation (AppLovin MAX / IronSource):** Mediation networks can offer fractional eCPM gains in certain regions, but introduce heavy native SDK footprints, higher crash risks, and brittle Expo config plugins. Rejected: Google AdMob provides official Expo Config Plugin maintenance, global fill rates, and integrated Google User Messaging Platform (UMP) consent.
- **In-simulation or mid-walk video ads:** Placing ads before or during active simulated walks or minigames. Rejected: LeadMate is a timing and reflex simulator for dog owners; interruptions destroy pedagogical immersion and compromise handler safety. Commercial Ads are strictly prohibited inside `SimView`, minigames, and active exercises.
- **In-memory-only ad cooldown tracking:** Keeping the 5-minute Transition Interstitial cooldown only in memory allows app force-quits to reset the cooldown. Rejected: the last interstitial impression timestamp is persisted in device storage to enforce the cooldown across restarts.
- **Fixed placeholder reservation on unfill:** Keeping a 50dp reserved blank box when offline or when no ad fills. Rejected: ad containers collapse height to 0 on failure or offline status to avoid blank UI artifacts on the World Map.

## Consequences

- An `AdService` interface decouples native Google Mobile Ads from the UI layer, falling back to `MockAdService` for web builds, Jest unit tests, and Expo Go.
- `AdBanner` is mounted at the bottom of the World Map for `!isPlus` users and unmounts immediately upon trial start or subscription.
- European GDPR / UK consent is handled via Google UMP with automatic fallback to Non-Personalized Ads (NPA) if consent is withheld or tracking is restricted by iOS App Tracking Transparency (ATT).
