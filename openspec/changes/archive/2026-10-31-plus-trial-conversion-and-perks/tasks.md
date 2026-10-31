# Tasks

## 1. Trial Lifecycle & Membership Helpers

- [x] 1.1 Add `mockSubscribed?: boolean` and `trialRecapSeenAt?: string` to `OnboardingState` in `src/shell/dogRecord.ts`, and verify migration in `src/shell/dogRecord.test.ts`.
- [x] 1.2 Implement `trialState(record, now)` and `trialDaysRemaining(record, now)` in `src/shell/plus.ts`, and update `isPlus(record, now)` to account for `mockSubscribed || trialState === 'active'`.
- [x] 1.3 Extend `PendingPlusAction` union to support video unlock actions (`{ kind: 'video'; lessonId: string }`) and verify resolution in `src/shell/plus.test.ts`.

## 2. Theory Lesson Video Gating

- [x] 2.1 Update `LessonVideoCard.tsx` to render a locked preview overlay with contextual unlock CTA (`"Desbloquear con 7 días gratis"` vs `"Desbloquear con Plus"`) and an active `"Desbloqueado con Plus"` badge for members.
- [x] 2.2 Wire `LessonScreen` and `App.tsx` to pass trial state and pending video actions, returning users directly to active playback upon trial or subscription unlock.
- [x] 2.3 Verify video gating and playback triggers in `src/shell/ui/LessonVideoCard.test.tsx` and `src/shell/screens/LessonScreens.test.tsx`.

## 3. World Map Header Plus Chip & Trial Status Modal

- [x] 3.1 Implement `PlusChip` in `src/shell/screens/WorldMapScreen.tsx` with visual states for `unstarted` (`7 días gratis`), `active` (`Plus · X d`), and `expired` (`Pasar a Plus`).
- [x] 3.2 Place `PlusChip` in the Map Header row between `LibraryChip` and the Settings gear icon, verifying accessibility labels and wrapping order in `src/shell/screens/WorldMapScreen.test.tsx`.
- [x] 3.3 Implement `TrialStatusModal` overlay sheet in `WorldMapScreen.tsx` recapping active trial duration and benefits, dismissed via "Entendido" or hardware back.

## 4. Post-Trial Value Recap Screen & Conversion Routing

- [x] 4.1 Add `{ name: 'recap' }` route and back decision handling in `src/shell/navigation.ts`, routing newly expired trials to the recap screen on cold start.
- [x] 4.2 Create `src/shell/screens/ValueRecapScreen.tsx` displaying dog trial achievements (active streak days, completed video lessons, day skips used), Annual/Monthly plans, and free tier bypass button.
- [x] 4.3 Wire first-launch expiration detection in `App.tsx` to display `ValueRecapScreen` and record `trialRecapSeenAt`.

## 5. Paywall Conversion Mode & Mock Subscription Flow

- [x] 5.1 Update `PaywallScreen.tsx` to support subscription conversion mode (annual 39,99 €/año with discount badge, monthly 6,99 €/mes, and quiet bypass button) when accessed after trial expiration.
- [x] 5.2 Implement mock subscription activation in `App.tsx` that sets `mockSubscribed: true` and resumes any pending action.

## 6. Localization & Verification

- [x] 6.1 Add Spanish catalog strings for header chips, video lock overlays, trial status modal, subscription tiers, and value recap in `src/i18n/es.ts`.
- [x] 6.2 Verify all tests across touched units (`plus.test.ts`, `WorldMapScreen.test.tsx`, `LessonVideoCard.test.tsx`, `navigation.test.ts`, `i18n.test.ts`).
- [x] 6.3 Run full test suite (`npm test`) and `openspec validate --change plus-trial-conversion-and-perks` to verify all scenarios and requirements.
