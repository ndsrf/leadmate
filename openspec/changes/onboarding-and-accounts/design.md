# Design

## Context

See `proposal.md` for motivation and [ADR 0006](../../../docs/adr/0006-local-first-sync.md) for the local-first sync model. Terms follow [`GLOSSARY.md`](../../../GLOSSARY.md).

Observed today:
- The Dog lives in one versioned `DogRecord` (`src/shell/dogRecord.ts`, `RECORD_VERSION = 2`, key `leadmate.dog`), loaded and saved by `useDog` through a `KeyValueStore` (AsyncStorage on a phone, localStorage in the browser). The record already holds `equipment`, `triggerProfile`, `attributes`, `walkDiary`, `streak`, `dailyBest` and `completedNodes`. Its doc comment says it is shaped for migration on registration.
- The Stage receives a read-only `LearningSnapshot` (ADR 0003). `pullStrength` is a `ScenarioConfig` constant (0.8) in `src/sim/config.ts`, not part of the snapshot.
- `App.tsx` is a single `Page` union (`home`, `settings`, `warmup`, `daily`, `node`). There is no first-run flow. Only a Spanish catalog (`src/i18n/es.ts`) ships.
- There is no Supabase dependency and no network code. The simulation is pure and seeded (ADR 0002).

## Goals / Non-Goals

**Goals:**
- Keep the simulation untouched apart from receiving a different `pullStrength` through the scenario config.
- Make the funnel and sync logic pure, testable functions in `src/shell/`, with thin screens on top.
- Never lose local data: every destructive sync step is explicit or backed up.

**Non-Goals:**
- A sync engine with per-field CRDTs, background sync while the app is closed, or realtime subscriptions.
- Changing the `LearningSnapshot` shape.

## Decisions

1. **Record changes, one version bump.** `DogRecord` goes to `RECORD_VERSION = 3` with: `updatedAt` (ISO, set by every `useDog.update`), `weights: { dogKg: number | null; handlerKg: number | null }`, `onboarding: { step: OnboardingStep; firstStageCompletedAt: string | null; trialStartedAt: string | null; diagnosticLatency: number | null }`, and `seenHints: string[]`. `migrateRecord` reads v2 records with defaults, and an existing v2 user is treated as having completed onboarding (`step: 'done'`) so current testers never see the funnel. *Alternative:* a second storage key for onboarding state. Rejected: one record means one `updatedAt` and one unit to sync.

2. **Funnel as a state machine.** `OnboardingStep = 'setup' | 'diagnostic' | 'plan' | 'paywall' | 'first-stage' | 'done'`, with a pure `nextStep(step)` in `src/shell/onboarding/flow.ts`. Setup sub-answers (equipment, weights, questionnaire) are written to the record as they are entered, and `step` advances only when the setup screen is finished. `App.tsx` gets an `onboarding` page: while `record.onboarding.step !== 'done'` it renders the funnel and not `home`. Per the spec, the funnel is complete once the paywall screen is passed, so the step after `paywall` is `first-stage`, which is a post-funnel milestone tracked by `firstStageCompletedAt`; `done` is set when that Stage ends and registration was offered.

3. **Weights to `pullStrength`.** `pullFromWeights(dogKg, handlerKg)` in `src/shell/onboarding/weights.ts` returns `clamp(PULL_BASE × (handlerKg / dogKg) / REFERENCE_RATIO, PULL_MIN, PULL_MAX)` with `PULL_BASE = 0.8`, `REFERENCE_RATIO = 3.5` (a 70 kg Handler and a 20 kg Dog reproduce today's 0.8), `PULL_MIN = 0.3`, `PULL_MAX = 1.5`. The constants live in one exported `PULL_TUNING` object so they can be retuned in playtests. A null weight returns the 0.8 default. The shell applies the result to the `ScenarioConfig` it builds for each Stage (where it already applies Equipment), so the simulation still reads no storage. Validation ranges (Dog 1–80 kg, Handler 30–200 kg) live beside it. *Alternative:* add weights to `LearningSnapshot`. Rejected: `pullStrength` is a scenario input today, and the snapshot is Learning-specific.

4. **Questionnaire.** One question per entry of `DISTRACTOR_KINDS` that the simulation supports (`child`, `bicycle`, `dog`, `skateboard`, `food`; `other` is skipped as unaskable). Four answers map to `TriggerLevel` 0–3. The result goes through the existing `setTriggerLevel`, so `calmCounts` reset as in the settings editor. Question text comes from the catalog.

5. **Diagnostic.** A Minigame (reaction-time tap) built like the existing `DoorbellMatView`/`PosteMinigameView` minigames: it does not go through `applyStage`. Its median reaction time maps to the starting `attributes.reconnectionLatency` through a clamped linear map into the band 0.1–0.4 (the default is 0.2), written once at the end of the funnel step. The diagnostic card shows the latency and a band label (quick, steady, slow) from the same function.

6. **Walk Plan.** A pure function `buildWalkPlan(latency, triggerProfile)` returns an ordered list of 3–5 existing Node ids from `src/shell/nodes/content.ts`: the default World 1 order, with the Poste practice Node first when latency is in the slow band, and Nodes for the Dog's strongest-level Distractor kinds promoted. The plan is stored as plain Node ids in `onboarding` (not a new concept in the sim) and shown on the card; `home` marks the plan's next Node.

7. **Paywall stub.** `PaywallScreen` with two buttons that both call `advance`. "Start trial" also sets `trialStartedAt`. No entitlement module exists, so nothing can gate content by accident.

8. **Hints.** A pure `hintFor(event, seenHints)` in `src/shell/onboarding/hints.ts` maps bridge events from the Stage to a hint id (`leash-colors`, `marker`, `poste`) or null if seen. It is called only while the first Stage runs (`onboarding.step === 'first-stage'`) or while ids remain unseen. Overlays are non-blocking and added to `src/shell/Overlays.tsx`. Hint triggers need first-Taut, first-Reward-Window and leash-limit signals on the bridge; tasks check what `messages.ts` already emits and add only the missing events (the simulation stays pure).

9. **Supabase client and auth.** `@supabase/supabase-js` with AsyncStorage as the session store, created in `src/shell/sync/client.ts` from `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. When these are unset (tests, the browser demo), `getClient()` returns null and every sync function becomes a no-op, so the app and its tests run with no backend. Auth screens (sign up, login, reset, verify prompt, delete account) are shell screens reached from the registration prompt and from settings.

10. **Schema.** One table `dogs (user_id uuid references auth.users on delete cascade, dog_id uuid, record jsonb, updated_at timestamptz, primary key (user_id, dog_id))` with RLS `user_id = auth.uid()` for select, insert, update and delete. A second table `level_configs (id text, version int, config jsonb, published bool)` is readable by everyone and writable by no client. *Alternative:* normalized tables per field. Rejected: the app already treats the Dog as one record, last-write-wins is per record (ADR 0006), and a jsonb column avoids a schema migration for every `DogRecord` change. The record's `version` field stays the compatibility contract.

11. **Sync algorithm.** `src/shell/sync/merge.ts` has the pure `resolve(local, remote)`: the record with the later `updatedAt` is the base and wins whole, including Learning Attributes; then `walkDiary` entries are unioned by `(date, nodeId)`, `dailyBest` takes the per-date maximum, `completedNodes` is unioned, and `streak` takes the side with the later `lastActiveDate` for `current` and the maximum for `best`. (A Streak record stores a run, not individual days, so the date-union in the spec is realised as this rule.) `src/shell/sync/sync.ts` pulls, resolves, writes locally if changed, and pushes if local is newer; it runs at app start, on return to foreground, and after each saved change with a debounce. A failed network call leaves local state untouched and retries on the next trigger. Sync state (`lastSyncedAt`, pause flag) lives under its own key `leadmate.sync`, not inside the record.

12. **First sign-in on a device.** `migrateOnRegister(local, remoteDogs)` in `sync.ts` returns `upload` when the account has no Dog, otherwise `choose`. The choose screen shows `summarize(record)` for each side (name, Streak, completed Node count). The discarded record is written to `leadmate.backup` with an expiry 30 days out; on app start, expired backups are deleted. Nothing is merged or overwritten before the user picks.

13. **Verification grace.** After 7 days from sign-up, if the Supabase user's `email_confirmed_at` is null, `sync` returns `paused: 'verify'` and the UI shows a verify prompt. Local play is never touched.

14. **Remote configs.** `fetchLevelConfigs()` reads `level_configs`, runs each through the existing scenario validator, and caches valid ones under `leadmate.configs`. `resolveScenario(id)` returns the cached remote config when valid, else the bundled one. The Stage payload gets `configVersion` (`'bundled'` or the remote version). Daily Stages call the bundled generator directly and never `resolveScenario`.

15. **Account deletion.** A Supabase Edge Function `delete-account` (service role) deletes the `auth.users` row, which cascades to `dogs`. The app calls it, signs out, and keeps local data.

16. **Registration prompt and reminders.** `shouldRemind(record, sync, now)` is pure: not signed in, after Stage 3 or Streak ≥ 3, and not reminded today (`leadmate.sync` holds `lastReminderDate`).

17. **i18n.** All new text keys go in `src/i18n/es.ts`, the only catalog that ships. The existing `catalog-usage.test.ts` and `i18n.test.ts` guard unused and missing keys; the device-language default applies once another catalog exists.

## Risks / Trade-offs

- [Last-write-wins drops the older device's learning progress] → The explicit choice at first sign-in covers the big case, and the 30-day local backup covers a wrong choice. Subsequent syncs are expected to be one device at a time.
- [The jsonb record can drift from the app's types] → `migrateRecord` already validates every field from untrusted input; remote data goes through it too.
- [Device clocks decide who wins] → Accepted for v1; `updatedAt` could move to a server timestamp later without changing the record shape.
- [`pullStrength` tuning makes Stages feel different for existing testers] → Existing v2 records have null weights and keep 0.8.
- [Hints depend on bridge events that may not exist] → Tasks add only the missing ones and cover them in tests.

## Migration Plan

1. Ship the v3 record and funnel with `getClient()` returning null (no backend needed); v2 users migrate silently to `step: 'done'`.
2. Create the Supabase project, schema, RLS policies and Edge Function; set the two env vars; enable sync.
3. Rollback: unset the env vars. The app returns to local-only with no data lost, since local storage was always the source of truth.

## Open Questions

- Exact `PULL_TUNING` constants and the latency band thresholds will be tuned in playtests; the structure above does not change.
