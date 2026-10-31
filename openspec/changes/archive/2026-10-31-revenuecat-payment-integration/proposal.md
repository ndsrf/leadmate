# Proposal

## Why

LeadMate recently established Plus membership gating (theory lesson videos, Plus Worlds, and Day Skips) alongside a 7-day trial lifecycle and a post-trial Value Recap screen. Currently, subscription conversions rely on a local `mockSubscribed` flag without real store billing. Integrating RevenueCat brings legitimate Apple App Store (StoreKit) and Google Play Store subscription billing to the app, connecting entitlement ownership directly to the user's Supabase account while preserving local-first play and frictionless onboarding.

## What Changes

- Introduce a new capability `billing-revenuecat` providing an abstracted billing service with a production `react-native-purchases` implementation and an in-memory test/web mock adapter.
- Configure RevenueCat packages (Annual and Monthly subscription tiers) with live pricing and localized currency fetched from store offerings.
- Link RevenueCat app user identity to existing Supabase authentication: initialize anonymously for offline/unregistered users, alias to `Purchases.logIn(supabaseUser.id)` upon sign-up or login, and reset on logout.
- Connect subscription purchase flows in `PaywallScreen` (subscription mode) and `ValueRecapScreen` to RevenueCat purchase execution, replacing mock subscriptions with verified store entitlements.
- Add a "Restaurar compras" (restore purchases) action accessible from paywall and settings screens to re-activate active entitlements on fresh installs or secondary devices.
- Retain the friction-free 7-day trial at onboarding (no payment credentials upfront); enforce payment strictly after trial expiration or when accessing gated Plus perks as an expired user.
- Cache entitlement status locally in `DogRecord` to ensure full offline playability once a subscription is validated.

## Capabilities

### New Capabilities
- `billing-revenuecat`: Handles in-app purchase offerings, native StoreKit/Play Billing purchase flows via RevenueCat SDK, anonymous-to-authenticated Supabase User ID aliasing, customer entitlement validation, and purchase restoration with a test/web mock adapter.

### Modified Capabilities
- `plus-membership`: Modifies requirements to recognize active RevenueCat subscription entitlements (in addition to the active 7-day trial) as conferring LeadMate Plus membership, deprecating reliance on `mockSubscribed`. Adds support for restoring purchases.

## Impact

- **Dependencies**: Adds `react-native-purchases` (and development build / native config plugins for Expo SDK 58).
- **Architecture**: Defines a `BillingService` interface in `src/shell/billing/` to preserve unit test isolation and web preview compatibility without native store dependencies.
- **Supabase Integration**: `useAccount` and auth hooks notify the billing service of auth state transitions (`logIn` with `user.id`, `logOut`).
- **UI Screens**: `PaywallScreen`, `ValueRecapScreen`, and `SettingsModal` handle live package pricing, purchasing states (loading/error spinners), and restore actions.
- **Data Model**: `DogRecord` onboarding state or dedicated billing cache records verified entitlement status for offline continuity.
