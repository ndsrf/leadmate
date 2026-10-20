# Tasks

## 1. Record v3 and funnel state (`onboarding-funnel`)

- [x] 1.1 Bump `DogRecord` to version 3 in `src/shell/dogRecord.ts` with `updatedAt`, `weights`, `onboarding` (`step`, `firstStageCompletedAt`, `trialStartedAt`, `diagnosticLatency`) and `seenHints`, migrate v2 records to `step: 'done'`, and verify with tests in `src/shell/dogRecord.test.ts` that v2 and unreadable input load with the right defaults
- [x] 1.2 Set `updatedAt` on every change in `useDog.update` and verify a test that each update advances it
- [x] 1.3 Add the pure `nextStep` state machine in `src/shell/onboarding/flow.ts` and verify tests for the order setup, diagnostic, plan, paywall, first-stage, done, and for resuming from every persisted step

## 2. Setup: Equipment, weights and questionnaire

- [x] 2.1 Add `pullFromWeights` and range validation in `src/shell/onboarding/weights.ts` with an exported `PULL_TUNING`, and verify tests for the heavier-Dog case, the clamps, the 70 kg / 20 kg reference giving 0.8, out-of-range rejection and null weights giving 0.8
- [x] 2.2 Apply the derived `pullStrength` where the shell builds each Stage's `ScenarioConfig` in `App.tsx` and `src/shell/nodes/scenarios.ts`, and verify a test that the scenario carries the record's value and a v2 record keeps 0.8
- [x] 2.3 Add the questionnaire mapping (four answers to levels 0–3 for the supported Distractor kinds, excluding `other`) through `setTriggerLevel`, and verify tests that answers produce the expected Trigger Profile
- [x] 2.4 Build the setup screens (Equipment, weights with skip, questionnaire) with catalog keys in `src/i18n/es.ts`, and verify `src/i18n/i18n.test.ts` and `catalog-usage.test.ts` pass and the flow completes in the browser build

## 3. Diagnostic, card and Walk Plan

- [x] 3.1 Build the 15-second Diagnostic Minigame that records a median reaction time without calling `applyStage`, and verify a test that Learning Attributes are unchanged when it is replayed after onboarding
- [x] 3.2 Add the latency-to-`reconnectionLatency` seed (clamped to 0.1–0.4) applied once at the end of the step, and verify tests for the band edges and that a second run does not re-seed
- [x] 3.3 Add `buildWalkPlan` in `src/shell/onboarding/plan.ts` and the card screen, and verify tests that a slow latency puts the Poste practice Node first and that the plan has 3–5 existing Node ids
- [x] 3.4 Add the stub `PaywallScreen` where both buttons continue and "Start trial" records `trialStartedAt`, and verify tests that neither button gates content and the card and plan come before the paywall

## 4. Guided first Stage

- [x] 4.1 Check the bridge events in `src/sim/messages.ts` and add only the missing ones for first Taut, first Reward Window and leash limit reached, and verify tests in `src/sim/sim.test.ts` that they fire once at the right moments without changing replays (same seed, same payload)
- [x] 4.2 Add `hintFor` in `src/shell/onboarding/hints.ts` and persist `seenHints`, and verify tests that each hint appears once and is not repeated on replay
- [x] 4.3 Add the non-blocking hint overlays to `src/shell/Overlays.tsx` with catalog text, and verify in the browser build that the leash colors, Marker and Poste hints show at the right moments

## 5. App wiring

- [x] 5.1 Add the `onboarding` page to `App.tsx` so `home` is reached only after the paywall screen is passed, the first Stage runs with hints, and `firstStageCompletedAt` is set when it ends, and verify a test of the page selection for each `step`
- [x] 5.2 Verify the interrupted-funnel scenario end to end: kill the app after the weights step, reopen, and check the funnel resumes with the earlier answers

## 6. Supabase backend

- [x] 6.1 Add `@supabase/supabase-js`, `src/shell/sync/client.ts` (session in AsyncStorage, null client when the env vars are unset) and `.env.example`, and verify the app and the existing test suite run with no backend configured
- [x] 6.2 Write the SQL migration for `dogs` and `level_configs` with RLS policies and the `delete-account` Edge Function under `supabase/`, and verify with a policy test that one user cannot read or write another user's rows
- [x] 6.3 Document the project setup, env vars and rollback in `README.md`, and verify the steps run as written on a fresh Supabase project

## 7. Auth

- [x] 7.1 Build the sign-up, login, logout and reset screens and the registration prompt after the first Stage with "Not now", and verify that skipping leaves the app fully playable and that the session survives a restart
- [x] 7.2 Add `shouldRemind` (after Stage 3 or a 3-day Streak, once per day) with `leadmate.sync` state, and verify tests for each trigger and the daily limit
- [x] 7.3 Add the verification grace in sync (pause with `paused: 'verify'` 7 days after sign-up when unverified) and the verify prompt, and verify tests for day 7 and day 8 with local play unaffected
- [x] 7.4 Add in-app account deletion calling the Edge Function, signing out and keeping local data, and verify that the cloud rows are gone afterwards

## 8. Sync

- [x] 8.1 Add the pure `resolve` in `src/shell/sync/merge.ts` (later `updatedAt` wins whole; union diary and completed Nodes; per-date max `dailyBest`; longer Streak) and verify tests in `src/shell/sync/merge.test.ts` for each rule, including that Learning Attributes are never blended
- [x] 8.2 Add `sync.ts` (pull, resolve, push; triggered at start, on foreground and after debounced saves; failures leave local state untouched), and verify tests with a fake client for offline play and replication on the next sync
- [x] 8.3 Add `migrateOnRegister`, the choose screen with `summarize`, and the 30-day local backup with expiry cleanup, and verify tests that a new account uploads silently, an account with a Dog asks, and the discarded side is recoverable and expires
- [x] 8.4 Add `fetchLevelConfigs` and `resolveScenario` with validation, caching and silent fallback, record `configVersion` in the Stage payload (`src/sim/payload.ts`), and verify tests for unreachable, invalid and valid remote configs and that Daily Stages never use remote configs

## 9. Documentation

- [x] 9.1 Update `GLOSSARY.md` if any new term was introduced during implementation and ADR 0006 if the sync rules changed, and verify that no stale terms remain with a search for "mini-playtest" and "level"
