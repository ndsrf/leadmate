# Design

## Context

- `isPlus(record, now)` in `src/shell/plus.ts` is the single source of truth for Plus membership. It currently checks `record.onboarding.mockSubscribed` or `trialState(record, now) === 'active'`.
- `DogRecord` is the offline-first source of truth (ADR 0006), replicated to Supabase as an account backup.
- Supabase authentication is managed in `src/shell/sync/auth.ts` and `src/shell/sync/client.ts`, providing a stable `user.id` UUID upon sign-up or login.
- UI touchpoints for subscription conversion:
  - `PaywallScreen.tsx`: displays Annual vs Monthly tier cards and currently triggers `onSubscribeAnnual` / `onSubscribeMonthly`.
  - `ValueRecapScreen.tsx`: celebratory first cold-start screen after trial expiration showing achievements and tier choices.
  - `WorldMapScreen.tsx`: `PlusChip` routes to `PaywallScreen` in subscription mode when expired.
- See `proposal.md` for motivation and `specs/billing-revenuecat/spec.md` for behavioral requirements.

## Goals / Non-Goals

**Goals:**
- Abstract billing operations behind a `BillingService` interface to ensure clean isolation between native StoreKit / Play Billing APIs and React Native / Web UI code.
- Support real in-app subscription purchases (Annual and Monthly) using RevenueCat (`react-native-purchases`).
- Dynamically fetch store offerings and display live localized pricing and currency symbols on `PaywallScreen` and `ValueRecapScreen`.
- Connect RevenueCat identity to Supabase auth: anonymous initialization on first launch, aliasing via `Purchases.logIn(supabaseUser.id)` on registration/login, and resetting via `Purchases.logOut()` on sign-out.
- Add "Restaurar compras" (restore purchases) functionality across conversion screens and Settings.
- Cache active entitlement status with expiration timestamps in `DogRecord` to preserve offline playability.
- Provide a robust mock billing adapter for automated Jest tests, Web browser preview, and Expo Go fallback.

**Non-Goals:**
- Requiring upfront credit card or StoreKit payment authorization at onboarding: the initial 7-day trial remains frictionless. Real billing is triggered upon trial expiry or gated perk interaction.
- Server-side webhook handling via Supabase Edge Functions in this phase: client SDK aliasing and RevenueCat entitlement verification satisfy requirements without adding backend infrastructure.
- One-time consumable purchases (LeadMate Plus is an auto-renewing subscription).

## Decisions

### 1. `BillingService` Seam and Platform Adapter
Define an abstracted interface `BillingService` in `src/shell/billing/types.ts`:
```ts
export interface BillingPackage {
  id: string; // e.g. '$rc_annual', '$rc_monthly'
  tier: 'annual' | 'monthly';
  priceString: string; // e.g. "39,99 €"
  rawPrice: number;
  currencyCode: string;
}

export interface BillingService {
  initialize(apiKey: string, appUserId?: string): Promise<void>;
  getPackages(): Promise<BillingPackage[]>;
  purchasePackage(pkg: BillingPackage): Promise<{ success: boolean; isPlus: boolean; userCancelled?: boolean }>;
  restorePurchases(): Promise<{ success: boolean; isPlus: boolean }>;
  logIn(userId: string): Promise<void>;
  logOut(): Promise<void>;
  checkEntitlements(): Promise<{ isPlus: boolean; expiresAt: string | null }>;
}
```
- Implement `RevenueCatBillingService` wrapping `react-native-purchases`.
- Implement `MockBillingService` for Jest unit tests, web preview, and dev fallback when native modules are unavailable.
- Factory function `getBillingService()` selects the appropriate implementation based on platform and environment.
*Alternatives considered:* Calling `Purchases` directly inside React components. Rejected: breaks Jest unit tests, Expo web simulator, and violates architectural separation of concerns.

### 2. Supabase User Identity Aliasing Lifecycle
- In `src/shell/sync/useAccount.ts`, observe auth transitions:
  - On `SIGNED_IN` with valid `session.user.id`: invoke `billing.logIn(session.user.id)`. RevenueCat links the anonymous App User ID to the Supabase UUID, preserving any existing subscription and retrieving subscriptions active on other devices.
  - On `SIGNED_OUT`: invoke `billing.logOut()`. RevenueCat generates a fresh anonymous App User ID.
- For unregistered users, RevenueCat runs with an auto-generated anonymous ID (`$RCAnonymousID:...`), allowing full purchasing before account creation.
*Alternatives considered:* Deploying a Supabase Edge Function to receive RevenueCat webhooks and write to a Postgres table. Rejected: unnecessary backend overhead for the current architecture; RevenueCat SDK natively handles receipt validation, entitlement caching, and account aliasing.

### 3. Frictionless Onboarding and Conversion Gates
- Onboarding paywall continues to invoke `passPaywall(record, true, now)` to grant the 7-day in-app trial without launching store billing.
- Native StoreKit / Play Billing purchase sheets are triggered only when:
  1. The user taps "Suscribirse" on `ValueRecapScreen` (after the 7-day trial expires).
  2. The user taps "Suscribirse" on `PaywallScreen` in subscription mode (reached via expired `PlusChip` or locked perk triggers like lesson videos or Plus Worlds).
- Upon successful purchase or restore, the app triggers `resolvePendingPlus()` so any interrupted action (e.g., watching a lesson video) resumes immediately.
*Alternatives considered:* Requiring an Apple/Google introductory free trial upfront at onboarding. Rejected: significantly degrades onboarding conversion; our recent engagement change specifically introduced the Value Recap screen to convert users after building habit and streak momentum.

### 4. Entitlement State and Offline Continuity in `DogRecord`
- Extend `DogRecord` with an optional `billing` field:
  ```ts
  billing?: {
    isSubscribed: boolean;
    expiresAt: string | null;
    lastVerifiedAt: string;
    tier?: 'annual' | 'monthly';
  }
  ```
- Update `isPlus(record, now)` in `src/shell/plus.ts`:
  ```ts
  export function isPlus(record: Pick<DogRecord, 'onboarding' | 'billing'>, now: Date): boolean {
    if (record.onboarding.mockSubscribed) return true;
    if (trialState(record, now) === 'active') return true;
    if (record.billing?.isSubscribed) {
      if (!record.billing.expiresAt) return true;
      return now.getTime() < Date.parse(record.billing.expiresAt);
    }
    return false;
  }
  ```
- When online, the billing service checks entitlements on app launch and updates `record.billing`.
- When offline, the app evaluates `record.billing.expiresAt`, preserving Plus access without internet connectivity until the recorded expiration date.

### 5. Testing & Verification Strategy
- **Local Unit Tests**: Jest tests use `MockBillingService` to test purchase success, cancellation, restore, and error states deterministically without network.
- **StoreKit Sandbox Testing (iOS)**: Use a `StoreKit.configuration` file in Xcode for offline purchase testing with configurable renewal rates (e.g. 1 month = 5 minutes).
- **Google Play Billing Testing (Android)**: Use Google Play Console Internal Testing track with License Testers.
- **RevenueCat Sandbox**: Monitor transaction events and entitlement grants in the RevenueCat Customer Dashboard.

### 6. Error & Cancellation Handling
- When a user dismisses or cancels the native store purchase sheet (`userCancelled: true`), the app silently returns to the paywall without showing an error dialog.
- For genuine transaction failures (network errors, billing issue, card declined), the screen renders a non-blocking toast/notice allowing immediate retry.
- Subscription expiration is handled passively: `isPlus(record, now)` evaluates to `false` when past `expiresAt`, locking Plus features without launching disruptive blocking dialogs on cold start.

### 7. Account Deletion Compliance
- Per Apple App Store Guidelines (Section 5.1.1(v)), the account deletion confirmation flow in `SettingsModal` includes explicit guidance that deleting the Supabase account does not cancel auto-renewing store subscriptions, directing the user to device Settings to manage billing.

## Risks / Trade-offs

- [Native module requirement in Expo] → `react-native-purchases` cannot run inside Expo Go.
  *Mitigation*: The factory function checks `isNativePurchasesAvailable()` and falls back gracefully to `MockBillingService` in Expo Go and web browsers, logging a helpful reminder to use a development build (`npx expo run:ios` / `npx expo run:android`).
- [Device clock manipulation to bypass offline expiry] → Users setting system clock backwards could theoretically prolong an expired subscription offline.
  *Mitigation*: Same trade-off already documented in ADR 0014 and ADR 0016; accepted until periodic monotonic server validation is warranted.
- [App Store Review rejection for missing Restore button] → Apple requires a clear "Restore Purchases" button on all paywalls.
  *Mitigation*: Added an explicit "Restaurar compras" button to `PaywallScreen`, `ValueRecapScreen`, and `SettingsModal`.
