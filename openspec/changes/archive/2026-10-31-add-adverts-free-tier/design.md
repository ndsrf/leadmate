# Design

## Context

The LeadMate mobile application is built with Expo (React Native 0.88.1, React 19.3.0, Expo SDK 58) and NativeWind, with interactive canine simulations running in Phaser 3 inside a WebView. In-app subscriptions are managed via RevenueCat using a decoupled `BillingService` architecture (`src/shell/billing/`) with an automatic `MockBillingService` fallback for web browsers (`react-native-web`) and Jest unit tests.

User tier is evaluated centrally by `isPlus(record, now)` in `src/shell/plus.ts`:
- **Plus member**: active 7-day trial or active billing entitlement.
- **Free Tier user**: trial unstarted (or bypassed) or trial expired without a subscription.

See `GLOSSARY.md` for canonical terms (`Free Tier`, `Commercial Ad`, `Anchored Banner`, `Transition Interstitial`, `Ad Cooldown`) and `docs/adr/0018-google-mobile-ads-free-tier-and-simulation-isolation.md` for architectural context.

## Goals / Non-Goals

**Goals:**
- Integrate `react-native-google-mobile-ads` (Google AdMob SDK) with Expo Config Plugins for seamless iOS and Android prebuilds and production builds.
- Establish an `AdService` interface with `MockAdService` and `GoogleMobileAdsService`, guaranteeing zero runtime crashes and 100% test pass rate in web browsers, Expo Go, and Jest tests.
- Support environment variables `EXPO_PUBLIC_ADMOB_BANNER_ID` and `EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID` with automatic fallback to official Google `TestIds` in `__DEV__` and tests.
- Mount an anchored adaptive banner ad at the base of `WorldMapScreen` via an extensible `footer` slot in `Screen.tsx` for Free Tier users, collapsing to height 0 on offline or unfill, and dynamically removing it the instant the user starts a trial or subscribes.
- Present opportunistic transition interstitial ads upon exiting a completed Stage debrief back to the World Map, constrained by a persisted minimum cooldown timer (5 minutes) stored in `AsyncStorage` (`@leadmate/ads:last_interstitial_at`).
- Integrate privacy compliance: Google User Messaging Platform (UMP) consent handling for EU GDPR and Apple App Tracking Transparency (ATT) permission prompt for iOS, deferred until reaching the World Map (keeping the first-run Funnel 100% ad-free).
- Invalidate and purge preloaded interstitial cache (`clearCache()`) immediately upon upgrading to Plus.
- Guarantee that core simulation gameplay (`SimView`) and minigames (`BarkdokuView`, `DoorbellMatView`, `PosteMinigameView`) remain strictly 100% ad-free at all times.

**Non-Goals:**
- In-simulation banner overlays or mid-walk video ads (strictly prohibited to protect handler safety and training immersion).
- Interstitials on minigames (`Barkdoku`, `Doorbell Mat`) or real-world Mission check-ins.
- Interstitials during the first-run Funnel (Taste Stage debrief is 100% ad-free).
- Rewarded video ads or ad-based Day Skips in this initial release.
- Complex third-party mediation networks (e.g., AppLovin MAX, IronSource) beyond Google AdMob's standard network.

## Decisions

### Decision 1: Advertising SDK Selection — `react-native-google-mobile-ads`
- **Choice**: `react-native-google-mobile-ads` (v14+).
- **Rationale**:
  - Offers an official Expo Config Plugin (`react-native-google-mobile-ads` in `app.json`), eliminating manual Xcode / Gradle project maintenance.
  - Highest global inventory fill rates and competitive eCPMs across iOS and Android.
  - First-class support for Google UMP SDK, meeting European TCF v2.2 GDPR requirements and iOS 14.5+ ATT compliance out of the box.
  - Clean TypeScript typings and event-driven hooks.
- **Alternatives Considered**:
  - *AppLovin MAX (`react-native-applovin-max`)*: Superior for complex multi-network waterfall mediation, but significantly heavier native footprint, higher maintenance burden, and weaker official Expo plugin support.
  - *Unity Ads (`react-native-unity-ads`)*: Community-maintained bridges with slow update cycles and lacking official Expo config plugin support.

### Decision 2: Architectural Abstraction — Decoupled `AdService` & `MockAdService`
- **Choice**: Model advertising services after LeadMate's existing billing subsystem:
  ```
  src/shell/ads/
  ├── types.ts          # AdService interface, AdConsentStatus, AdEvent listeners
  ├── mock.ts           # MockAdService (web, Jest, and offline dev fallback)
  ├── admob.ts          # GoogleMobileAdsService (native iOS & Android)
  ├── index.ts          # getAdService() factory with environment detection
  ├── storage.ts        # Cooldown persistence in AsyncStorage (@leadmate/ads:last_interstitial_at)
  └── AdBanner.tsx      # Safe-area aware banner component with collapse-on-error
  ```
- **Rationale**: Direct invocation of native modules crashes in web environments (`npm run web`), Expo Go without native build, and Jest test runners. A singleton factory (`getAdService()`) seamlessly dispatches to `GoogleMobileAdsService` on native platforms and `MockAdService` on web/test platforms without branching logic inside UI screens.

### Decision 3: Ad Placement & Simulation Isolation
- **Choice**:
  1. **Anchored Banner**: Positioned at the bottom of `WorldMapScreen` via a pinned `footer` slot in `Screen.tsx`. When user is Plus, component unmounts and height collapses to 0. When offline or unfill occurs, height cleanly collapses to 0.
  2. **Stage Debrief Interstitial**: Preloaded in background and presented opportunistically only when user taps "Volver al mapa" or "Continuar" from `DailyResultScreen` or `NodeScreens` Debrief, subject to frequency capping. If not ready, navigation proceeds immediately without delay. Minigames and Missions never trigger interstitials.
  3. **Zero Ads in Simulation**: The simulation iframe/WebView and minigame screens never load ad modules or reserve ad slots.
- **Rationale**: Dog training requires sustained attention and clear timing reflexes. Interrupting a walk or timing minigame with an ad would ruin user experience and create negative associations. Post-debrief return to map is a low-stress, natural break point.

### Decision 4: Frequency Capping & Cooldown Persistence
- **Choice**: Enforce a minimum cooldown interval of 300 seconds (5 minutes) between interstitial impressions, persisting the last impression timestamp in device `AsyncStorage` (`@leadmate/ads:last_interstitial_at`).
- **Rationale**: Prevents aggressive ad frequency from frustrating engaged free users and prevents force-quitting the app from resetting the cooldown timer.

### Decision 5: Consent Flow & Onboarding Immunity
- **Choice**: Defer Google UMP consent initialization and ATT prompts until the user reaches the World Map. Keep the entire first-run Funnel (Taste Stage, Dog setup, Diagnostic, Walk Plan, first guided Stage debrief) 100% ad-free.
- **Rationale**: Eliminates early onboarding drop-off and complies with Apple ATT recommendations to defer prompts until relevant context is reached.

## Risks / Trade-offs

- **[Risk] Native module crash on unsupported environments (Web, Expo Go, Jest)**
  - *Mitigation*: The `getAdService()` factory inspects runtime platform and environment flags, returning `MockAdService` whenever native Google Mobile Ads SDK is unlinked or running in Jest/web.
- **[Risk] App Store Rejection for Tracking / Privacy Non-Compliance**
  - *Mitigation*: Configure `userTrackingUsageDescription` in `app.json`, initialize Google UMP consent before requesting personalized ads, and gracefully fall back to Non-Personalized Ads (NPA) if consent is withheld.
- **[Risk] Layout Jump or Blank Space on Banner Unfill**
  - *Mitigation*: `AdBanner` reserves standard anchored banner height only while loading, collapsing cleanly to 0 height if no fill or network error occurs.
- **[Risk] Network Latency Slowing Down Navigation**
  - *Mitigation*: Interstitial ads are preloaded asynchronously during debrief display; navigation back to the map does not wait for network fetch if no ad is ready.
