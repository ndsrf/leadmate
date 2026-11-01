# RevenueCat Integration and Offline Subscription Entitlements

LeadMate Plus subscriptions are managed through RevenueCat, linking store purchases (Annual and Monthly) on Apple App Store and Google Play Store to the user's Supabase account via App User ID aliasing (`Purchases.logIn(supabaseUser.id)`). Entitlements are verified online and cached with an expiration timestamp in `DogRecord`, maintaining full offline playability until the recorded expiry date without requiring network access on launch.

## Considered Options

- **Upfront StoreKit introductory trial at onboarding:** Prompting for Face ID / Google Pay authorization during onboarding causes significant drop-off before users experience the app. Rejected: onboarding retains the frictionless 7-day in-app Trial, and store subscription tiers charge immediately upon conversion.
- **Server-side webhook sync to Supabase database:** Routing RevenueCat webhooks through a Supabase Edge Function to write to a Postgres table adds operational and backend overhead. Rejected: RevenueCat SDK natively handles cross-device entitlement recovery and user ID aliasing, preserving the client-driven offline-first architecture.
- **Online-only entitlement verification:** Requiring an active internet connection to verify Plus status before playing video embeds or opening Plus Worlds breaks the offline-first promise ([ADR 0006](0006-local-first-sync.md)). Rejected: verified entitlements are cached in `DogRecord.billing` with an expiration date and refreshed opportunistically.
- **Strict single-account Apple ID locking:** Blocking a user from subscribing or restoring if their Apple ID was previously seen on another Supabase email causes support dead-ends. Rejected: RevenueCat aliases store receipts to the active authenticated Supabase user.

## Consequences

- `isPlus(record, now)` evaluates active in-app trials, development mock states, and cached store entitlements with expiration timestamps.
- Free users and unauthenticated users can purchase subscriptions anonymously; signing up or logging in with Supabase transfers their entitlement automatically.
- Users can restore purchases across devices using the standard "Restaurar compras" action without manual backend intervention.

## Configuration & Testing Workflows

### Environment Variables
- `EXPO_PUBLIC_REVENUECAT_APPLE_KEY`: Public SDK API key from the RevenueCat iOS project (`appl_...`).
- `EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY`: Public SDK API key from the RevenueCat Android project (`goog_...`).
- When running in web browsers, Expo Go, or test environments without native modules, the app falls back automatically to `MockBillingService` without crashing.

### StoreKit Configuration (iOS Testing)
1. Add a `StoreKit.configuration` file in Xcode with auto-renewable subscription products:
   - Annual: `leadmate_plus_annual`
   - Monthly: `leadmate_plus_monthly`
2. Link the configuration file to the Xcode scheme under **Edit Scheme > Run > Options > StoreKit Configuration**.
3. Configure accelerated renewal time intervals (e.g. 1 month = 5 minutes) to test expiration transitions, renewals, billing retries, and offline continuity.

### Google Play Billing Sandbox (Android Testing)
1. Configure products in the Google Play Console under **Monetize > Subscriptions**.
2. Add tester Google accounts to the **License Testing** list with license response set to `RESPOND_NORMALLY`.
3. Distribute development or staging builds via an Internal Testing track.

### RevenueCat Dashboard
- Real-time events (initial purchases, renewals, cancellations, expiration) can be inspected in the RevenueCat Customer Dashboard.
- User identity aliasing between anonymous IDs (`$RCAnonymousID:...`) and Supabase UUIDs can be viewed on customer detail pages.
