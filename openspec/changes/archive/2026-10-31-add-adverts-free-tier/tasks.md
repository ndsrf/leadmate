# Tasks

## 1. Dependencies and Service Abstraction

- [x] 1.1 Add `react-native-google-mobile-ads` to `package.json` and configure the Expo config plugin in `app.json` with test App IDs and iOS tracking permission description; verify with `npm run typecheck`
- [x] 1.2 Define `AdService`, `AdConsentStatus`, and ad event listener interfaces in `src/shell/ads/types.ts`; verify types compile cleanly
- [x] 1.3 Implement `MockAdService` in `src/shell/ads/mock.ts` supporting no-op banner mounting, simulated interstitial lifecycle, and consent state; verify with `src/shell/ads/mock.test.ts`
- [x] 1.4 Implement `GoogleMobileAdsService` in `src/shell/ads/admob.ts` handling AdMob banner requests, interstitial caching with 5-minute cooldown logic, and Google UMP consent initialization
- [x] 1.5 Implement `getAdService()` factory in `src/shell/ads/index.ts` with environment detection (dispatching `MockAdService` on web and Jest, native service on devices); verify with `src/shell/ads/index.test.ts`

## 2. Banner and Screen Integration

- [x] 2.1 Build `AdBanner` component in `src/shell/ads/AdBanner.tsx` that renders an anchored banner for free users and unmounts immediately when `isPlus` is true; verify with `src/shell/ads/AdBanner.test.tsx`
- [x] 2.2 Mount `AdBanner` at the base of `src/shell/screens/WorldMapScreen.tsx` conditioned on `!isPlus(record, now)` with safe area padding; verify with `src/shell/screens/WorldMapScreen.test.tsx`
- [x] 2.3 Verify that starting a trial or subscribing from the World Map immediately hides the banner without an app reload

## 3. Transition Interstitials and Paywall Messaging

- [x] 3.1 Hook transition interstitial trigger with cooldown check into debrief dismissal in `src/shell/screens/DailyResultScreen.tsx` and `src/shell/screens/NodeScreens.tsx`; verify with unit tests
- [x] 3.2 Add Spanish localized strings for the ad-free Plus perk (`Experiencia sin anuncios`) in `src/i18n/es.ts`, and display it in `PaywallScreen.tsx` and `ValueRecapScreen.tsx`; verify with `npm test`

## 4. System Verification

- [x] 4.1 Run full test suite (`npm test`) and TypeScript check (`npm run typecheck`) to confirm zero regressions across all simulation, shell, and sync test suites
