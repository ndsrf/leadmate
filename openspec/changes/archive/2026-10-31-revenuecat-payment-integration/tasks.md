# Tasks

## 1. Billing Service Abstraction & Mock Adapter

- [x] 1.1 Define billing types (`BillingPackage`, `BillingService`, `CustomerEntitlement`) in `src/shell/billing/types.ts` and verify `npm run typecheck` succeeds.
- [x] 1.2 Implement `MockBillingService` in `src/shell/billing/mock.ts` with configurable packages, simulated purchases, cancellations, and restorations; verify with comprehensive unit tests in `src/shell/billing/mock.test.ts`.
- [x] 1.3 Add `react-native-purchases` dependency and implement `RevenueCatBillingService` in `src/shell/billing/revenuecat.ts` with safe environment checks; verify with mock-backed unit tests in `src/shell/billing/revenuecat.test.ts`.
- [x] 1.4 Create `getBillingService()` factory in `src/shell/billing/index.ts` selecting between native and mock adapters based on runtime platform and environment; verify with `src/shell/billing/index.test.ts`.

## 2. DogRecord Schema & Plus Status Integration

- [x] 2.1 Extend `DogRecord` with optional `billing` state in `src/shell/dogRecord.ts`, update record migration fixtures, and verify `src/shell/dogRecord.test.ts` passes.
- [x] 2.2 Update `isPlus` and `progressAt` in `src/shell/plus.ts` to evaluate cached billing entitlements alongside trial states, and verify with updated unit tests in `src/shell/plus.test.ts`.

## 3. Supabase Auth Identity Aliasing

- [x] 3.1 Integrate `logIn(user.id)` and `logOut()` into `useAccount` auth state listener in `src/shell/sync/useAccount.ts`, and verify auth transitions in `src/shell/sync/useAccount.test.ts`.
- [x] 3.2 Initialize the billing service with anonymous user identity on app launch in `App.tsx` and verify test suite stability.

## 4. Paywall, Value Recap & Settings UI Integration

- [x] 4.1 Update `PaywallScreen.tsx` to render dynamic localized package prices, handle silent cancellation and non-blocking error states, and provide an Apple-compliant "Restaurar compras" button; verify with `src/shell/screens/PaywallScreen.test.tsx`.
- [x] 4.2 Update `ValueRecapScreen.tsx` to trigger package purchases via the billing service and support purchase restoration; verify with `src/shell/screens/ValueRecapScreen.test.tsx`.
- [x] 4.3 Add a "Restaurar compras" action, subscription status display, and subscription cancellation advisory on account deletion to `SettingsModal.tsx`; verify with `src/shell/screens/SettingsModal.test.tsx`.
- [x] 4.4 Wire purchase completion and pending action resumption (`resolvePendingPlus`) in `App.tsx`; verify in end-to-end screen navigation tests.

## 5. Verification & Documentation

- [x] 5.1 Run full project test suite (`npm test`) and typecheck (`npm run typecheck`) and verify all tests pass.
- [x] 5.2 Document RevenueCat setup, environment variables (`EXPO_PUBLIC_REVENUECAT_APPLE_KEY`, `EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY`), StoreKit configuration file testing, and sandbox testing workflows in `README.md` and `docs/adr/`.

## Workflow follow-up

- Archive the change after code review and sandbox testing approval.
- Sync delta specs to main specs (`openspec sync specs`).
