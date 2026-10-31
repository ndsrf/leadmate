# Proposal

## Why

Users who choose not to start the 7-day free trial or who remain on the free tier after their trial expires currently generate no revenue, despite actively consuming app resources and content. Introducing targeted, non-intrusive mobile advertising for non-Plus users monetizes the free tier while creating a strong incentive to upgrade to LeadMate Plus for an ad-free experience.

## What Changes

- **Library Investigation & Integration (`react-native-google-mobile-ads`)**:
  - Evaluated cross-platform mobile advertising SDKs for iOS and Android (Google Mobile Ads / AdMob, AppLovin MAX, Unity Ads).
  - Selected `react-native-google-mobile-ads` (Google AdMob SDK with Google User Messaging Platform CMP) as the best-in-class library: official Expo Config Plugin support, high eCPMs/fill rates across iOS and Android, robust privacy compliance (GDPR/UMP and Apple ATT), and seamless native prebuild integration.
- **Tier-Gated Ad Experience**:
  - **Free Tier Users** (unstarted trial who bypassed or expired trial without subscription): Serve anchored banner ads on the World Map and infrequent interstitial ads upon completing a Node Debrief or Daily Stage walk.
  - **LeadMate Plus Users** (active 7-day trial or active monthly/annual subscription): 100% ad-free experience with all banner, interstitial, and promotional ad calls completely suppressed.
  - **Seamless Ad Dismissal**: Upgrading to Plus (starting trial or purchasing subscription) immediately unmounts active banners and disables interstitials without requiring an app reload.
- **Protected Core Simulation Gameplay**:
  - Advertisements are strictly prohibited during active walk simulations (`SimView`), Minigames (`BarkdokuView`, `DoorbellMatView`, `PosteMinigameView`), and active timing exercises to avoid distracting dog handlers and compromising training safety.
- **Interstitial Frequency Capping**:
  - Interstitial ads enforce a minimum cooldown interval (e.g., 5 minutes) and appear only at natural transition points (after concluding a Stage debrief before returning to the map), never during active user interaction.
- **Privacy & Consent Compliance**:
  - Integrate Google User Messaging Platform (UMP) for European GDPR / UK consent gathering and Apple App Tracking Transparency (ATT) permission requests.
- **Modular Ad Architecture with Mock Fallback**:
  - Establish an `AdService` interface with `MockAdService` and `GoogleMobileAdsService`, ensuring tests (`jest`), web builds (`npm run web`), and offline development run cleanly without native crashes.

## Capabilities

### New Capabilities
- `in-app-adverts`: Defines mobile advertising integration for iOS and Android via Google Mobile Ads, including anchored banner placement on the World Map, transition interstitials with frequency capping, privacy consent flows (GDPR/UMP and ATT), and environment-aware service fallbacks.

### Modified Capabilities
- `plus-membership`: Adds requirement for an ad-free experience, establishing that active trial and subscribed users have all advertisements suppressed, and that transitioning to Plus immediately eliminates ads.

## Impact

- **Dependencies**: Adds `react-native-google-mobile-ads` to `package.json` along with Expo config plugin entries in `app.json`.
- **Architecture**: Adds `src/shell/ads/` containing `AdService` interface, `GoogleMobileAdsService`, `MockAdService`, and `AdBanner` component.
- **UI Screens**:
  - `src/shell/screens/WorldMapScreen.tsx`: Mounts `AdBanner` at the screen base for non-Plus users, adjusting safe area padding.
  - `src/shell/screens/DailyResultScreen.tsx` / `src/shell/screens/NodeScreens.tsx`: Triggers transition interstitial upon navigating back to map after debrief.
  - `src/shell/screens/PaywallScreen.tsx` / `src/shell/screens/ValueRecapScreen.tsx`: Highlights "Experiencia 100% libre de anuncios" as a key Plus benefit.
- **Localization**: Adds Spanish advertising-related strings (such as Plus paywall benefit copy and consent fallback messages) to `src/i18n/es.ts`.
- **Testing**: Mocks ad services in Jest test suite ensuring no regression in existing navigation and map tests.
