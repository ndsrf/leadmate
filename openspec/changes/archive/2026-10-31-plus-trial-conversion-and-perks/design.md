# Design

## Context

- `isPlus(record, now)` in `src/shell/plus.ts` is the single source of truth for Plus membership. Today, it checks `onboarding.trialStartedAt <= now < trialStartedAt + 7 days`.
- The World Map header in `src/shell/screens/WorldMapScreen.tsx` renders a single wrapping flex row of chips (`StreakChip`, `LibraryChip`, `GearIcon`, `DailyChip`, `BarkdokuChip`).
- Theory Lessons render video blocks via `LessonVideoCard.tsx` (using `LessonArt` poster art and platform player).
- Pending Plus actions are currently handled by `PendingPlusAction` (`skipMission: string`) in `App.tsx` and `src/shell/plus.ts`.
- See `GLOSSARY.md` for canonical terms (`Trial`, `Plus membership`, `Value Recap`, `Paywall`) and `docs/adr/0016-trial-lifecycle-and-conversion-recap.md` for architectural decisions.

## Goals / Non-Goals

**Goals:**
- Provide clear visual and functional differentiation for active trial users so they see what Plus gives them.
- Give free users natural, contextual entry points to the 7-day trial without coercive blocks.
- Seamlessly resume intended actions (playing a video or skipping a mission) upon starting the trial.
- Present a grateful, value-focused recap upon trial expiry before prompting for full subscription.
- Enable local mock purchase flow so conversion options grant persistent Plus state (`mockSubscribed`).

**Non-Goals:**
- Integrating live app store billing / in-app purchase SDKs (RevenueCat, StoreKit, Google Play Billing) in this change. The conversion screen presents the tier options and mocks the purchase confirmation until real billing credentials are wired.
- Gating core theory reading text, illustrations, or free Worlds 1-4.

## Decisions

### 1. Unified Trial Lifecycle & Plus Membership Helpers in `src/shell/plus.ts`
Add pure lifecycle helpers:
- `trialState(record, now)`: returns `'unstarted' | 'active' | 'expired'`.
  - `'unstarted'`: `trialStartedAt === null`.
  - `'active'`: `trialStartedAt !== null` and `now < trialStartedAt + 7 days`.
  - `'expired'`: `trialStartedAt !== null` and `now >= trialStartedAt + 7 days`.
- `trialDaysRemaining(record, now)`: computes `Math.max(1, Math.ceil((trialEnd - now) / 86_400_000))` for active trials.
- `isPlus(record, now)`: returns `true` if `record.onboarding.mockSubscribed === true` or if `trialState(record, now) === 'active'`.
- `PendingPlusAction`: generalized union:
  ```ts
  export type PendingPlusAction =
    | { kind: 'skip'; missionId: string }
    | { kind: 'video'; lessonId: string };
  ```
- `startTrialThen(record, pending, now)` / `subscribeThen(record, pending, now)`: activates Plus and immediately resolves pending actions without requiring a second tap.

### 2. Header `PlusChip` and Trial Status Modal
- Place `PlusChip` in the header row between `LibraryChip` and the Settings gear.
- Chip visual state:
  - *Unstarted*: Tone `accent`, label `"Plus"`, value `"7 días gratis"`. Press opens `PaywallScreen`.
  - *Active*: Tone `accent`, label `"Plus"`, value `"{n} d"`. Press opens `TrialStatusModal`.
  - *Expired*: Tone `warn` or `accent`, label `"Plus"`, value `"Pasar a Plus"`. Press opens conversion screen.
- `TrialStatusModal` renders as a lightweight raised sheet over the map displaying active benefits with a single `"Entendido"` dismiss button, wired to `screenBack` for hardware back dismissal.

### 3. Theory Lesson Video Gating
- `LessonVideoCard` accepts `isPlus: boolean`, `trialState: 'unstarted' | 'active' | 'expired'`, and `onUnlock?: () => void`.
- When `!isPlus`:
  - Renders poster illustration with dark overlay and lock badge.
  - Button text: `"Desbloquear con 7 días gratis"` if unstarted; `"Desbloquear con Plus"` if expired.
  - Tapping opens the paywall with `{ name: 'paywall', then: { kind: 'video', lessonId } }`.
- When `isPlus`:
  - Renders play button alongside an accent badge: `"Desbloqueado con Plus"`.
  - Playback starts immediately.

### 4. Post-Trial Value Recap Screen & Conversion Routing
- Route `{ name: 'recap' }` in `src/shell/navigation.ts`, evaluated after splash when `trialState === 'expired'` and `!onboarding.trialRecapSeenAt`.
- Metrics shown on `ValueRecapScreen`:
  - Active Streak days maintained.
  - Video demonstrations watched (derived from completed video-bearing lessons in `readLessons`).
  - Day Skips used (from `DiaryTotals`).
- Subscription tiers presented:
  - Plan Anual: `39,99 €/año` (`Ahorra un 40% · 3,33 €/mes`).
  - Plan Mensual: `6,99 €/mes`.
  - Secondary bypass button: `"Continuar con la versión gratuita"`.
- Subsequent taps on locked perks or expired `PlusChip` route directly to `PaywallScreen` in subscription mode without repeating the one-time recap.

## Risks / Trade-offs

- [Header chip wrapping on very narrow screens] → Mitigated by compact label/value formatting (`"Plus · 5 d"`), fitting cleanly within the existing wrapping flex-row.
- [Offline video access] → Theory video blocks already require network access to stream YouTube embeds; gating does not introduce new offline constraints. Text and illustrations remain strictly offline-first.
- [Device clock manipulation to extend trial] → Mitigated by existing acceptance in ADR 0014 until server-validated subscriptions are deployed.
