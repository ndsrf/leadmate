# Design

## Context

See proposal.md for why. The current state that shapes the approach:

- **One routing function.** `routeFor` in `src/shell/navigation.ts` decides the visible screen from the persisted `record.onboarding.step` (`src/shell/onboarding/flow.ts`, `ONBOARDING_STEPS`), the active `flow` and `settingsOpen`. Some funnel screens are not persisted steps: the taste briefing (`tasteBriefed`), the taste payoff (`tastePayoff`), the guided first Stage's Node 0 sub-steps (`introRun.step`: primer, checkpoint, simulation, debrief), the register prompt (`flow.name === 'register'`) and the `SetupScreen` parts (`SETUP_PARTS` in `src/shell/onboarding/setup.ts`, local to that screen).
- **Stages start in two callbacks** in `App.tsx`: `startStage` and `startCloseExercise`. They end in three places: the `debrief` bundle message in `onMessage`, the Pause Menu's `onExit` (which builds `skippedSimulationPayload`), and the Stage view being released (`viewWanted` goes false through `goHome`, back while loading, or a load error). Node Minigames finish through `act({ type: 'finish' })` without the bundle.
- **Checkpoint** answers go through `act({ type: 'answer' | 'timeout' })` into the pure `advance` in `src/shell/nodes/node.ts`. The guided first Stage drives the same `advance` through `setIntroRun`.
- **Lessons** render in `LessonScreen` (`src/shell/screens/LessonScreens.tsx`), which already computes reading progress with `readingProgress` (`src/shell/lessons/lessonRun.ts`) on scroll. `App.tsx` opens them with `setFlow({ name: 'lesson', id, returnTo })` from the trail, the Library, a Node action and the video unlock, and marks them read with `markLessonRead` on "Done".
- **Stop completion** is not an event today. `celebrationsFor` (`src/shell/celebrations.ts`) already diffs the record before and after a completion inside the same `update` closure. `stopStatus` (`src/shell/world.ts`) says whether a Stop is `done`.
- **Device-local settings** live in their own AsyncStorage keys (`leadmate.ui` in `src/shell/ui/uiSettings.ts`), outside the synced Dog record. `resetProgress` (`src/shell/reset.ts`) keeps them.
- **Third-party SDK pattern.** `src/shell/ads/` and `src/shell/billing/` wrap native SDKs behind an interface with a mock, choose the mock under Jest, on web or when the native module is missing, read keys from `EXPO_PUBLIC_*`, and never throw into the caller (`prepareAds`).
- **The simulation is pure** (ADR 0002). Nothing under `src/sim/` or `bundle/` may know about analytics.

## Goals / Non-Goals

**Goals:**
- One typed event contract module that every caller goes through. It refuses anything not declared, so privacy is enforced in code and covered by tests, not by review alone.
- Every decision that can be pure is pure and tested under Jest. Examples: which funnel step is showing, whether a step change is a new view, Stage start and end pairing, Lesson time and scroll, newly done Stops, session boundaries. `App.tsx` only wires them.
- Later changes (`add-read-the-dog-game`, `telegraph-marker-timing`, `split-walks-into-encounters`) add events by adding a contract entry and an ADDED requirement to `product-analytics`, with no change to the plumbing.

**Non-Goals:**
- No generic `screen_viewed` for every screen, no autocapture, no session replay, no feature flags, no surveys.
- No user identification, no account linking, no person profiles.
- No consent dialog. Analytics is on by default and can be turned off in Settings (decided with the user, see Risks).
- No dashboards in the repo. The PostHog funnel and insights are configured in PostHog.
- Nothing in the simulation, the debrief payload or Supabase changes.

## Decisions

### 1. Module layout: `src/shell/analytics/`

Following the `ads/` pattern:

| File | Kind | Role |
|---|---|---|
| `contract.ts` | pure | `SCHEMA_VERSION`, the `EVENTS` registry (name → declared properties and their kinds), `FUNNEL_STEPS`, `buildEvent(name, props, common)` that validates and returns an event or `null` |
| `state.ts` | pure + store | `DEFAULT_ENABLED`; `AnalyticsState` `{ installId, installedAt, choice: 'on' \| 'off' \| null, funnelDoneOnce, funnelOpen, upgradedInstall }` under the key `leadmate.analytics`; `isEnabled(state)` = `choice ?? DEFAULT_ENABLED`; `readAnalyticsState`, `loadAnalyticsState(store, newId, now, record)`, `saveAnalyticsState` |
| `funnel.ts` | pure | `funnelStepOf(input)` → `FunnelStep \| null`; `FunnelViews` dedupe (new view only when the step changes); `funnelOpen`/`funnelDoneOnce` transitions |
| `stages.ts` | pure | `PlayTracker`: `start(info, now)` for a Stage or a Minigame, `end(outcome, now, score?)` → `stage_ended` or `minigame_ended` props or `null`; idempotent, so a second end is a no-op |
| `lessons.ts` | pure | `LessonTimer`: foreground time and furthest progress; `close(closedBy)` → props |
| `stops.ts` | pure | `stopsNewlyDone(before, after, worlds, now)` built on `stopStatus` |
| `session.ts` | pure | `shouldStartSession(lastBackgroundAt, now)` (30 min), `daysSince`, `secondsSince` |
| `types.ts` | types | `AnalyticsService` interface: `start(state)`, `capture(event)`, `setEnabled(on)`, `flush()` |
| `posthog.ts` | adapter | `PostHogAnalyticsService` over `posthog-react-native` |
| `mock.ts` | adapter | `MockAnalyticsService`: records events in memory for tests, sends nothing |
| `index.ts` | wiring | `getAnalytics()` singleton (mock under Jest, on web, or with no key), `track(name, props)` that stamps the time, builds the common properties, validates and captures, inside `try/catch`; events tracked before `initAnalytics` finishes wait in a small in-memory buffer (cap 50) |

`track` is the only API screens and `App.tsx` call. It is synchronous, returns `void`, and never throws.

*Alternative considered:* calling `posthog.capture` directly at call sites. Rejected. Nothing would stop a free-text property from going out, and tests could not see what is sent.

### 2. The contract enforces privacy

Each event declares its properties with one of these kinds:
- `int`: a finite number, rounded.
- `bool`.
- `enum([...])`: a string from a fixed list.
- `id`: a string matching `^[a-z0-9][a-z0-9_.:-]{0,63}$` that is not UUID-shaped (`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`). Lowercase, no spaces. This is the shape of content ids such as Node, Lesson, World and Stop ids; the UUID exclusion stops a Dog id, account id or install id from passing as one.

`buildEvent` returns `null` (drop) for an unknown event, an undeclared property, a missing required property or a value of the wrong kind. In development it also logs a `console.warn`, so a dropped event is noticed early and not lost silently in production. There is no `string` kind, so free text cannot be declared. A privacy test runs the wired paths with `MockAnalyticsService` for a record whose Dog is named `Luna`, with email `luna@example.com`, a Dog id and an account id, and checks that none of these values, nor the install id, is in any captured event's properties.

*Alternative considered:* a denylist that scrubs known personal fields. Rejected. A denylist fails open when a new field appears.

### 3. Versioning: one global `schema_version`

`SCHEMA_VERSION = 1` goes on every event. The rules are in the spec: additive changes (a new event, an optional property, a new enum value) keep the version; breaking changes raise it. Because removing a value is breaking, the first contract declares only values the app can produce today (for example, no `node` Lesson source). Later changes follow these steps:
1. Add an entry to `EVENTS` in `contract.ts`, plus a contract test.
2. Add an ADDED requirement to `product-analytics` in their own delta.
3. Call `track` from the shell.

Event names are `snake_case` `object_verb`. Property names are `snake_case`. A comment at the top of `contract.ts` states these rules.

*Alternative considered:* a version per event. Rejected. It is more to keep in step for a contract this small, and PostHog insights filter easily on one property.

### 4. PostHog configuration (GDPR-minded)

- Read `EXPO_PUBLIC_POSTHOG_KEY` and `EXPO_PUBLIC_POSTHOG_HOST` (default `https://eu.i.posthog.com`, the EU region). With no key, use the mock. Dev and release builds use different PostHog projects through different keys in `eas.json` profiles.
- SDK options:
  - `captureAppLifecycleEvents: false`. We send our own `session_started`.
  - No autocapture of screens or touches, and no session replay.
  - `disableGeoip: true`.
  - `personProfiles: 'never'`, or the SDK's equivalent for anonymous-only events.
  - `flushAt` around 20, `flushInterval` around 30 s.
  - `maxQueueSize` set to 1000.
- Distinct id: our `installId`, passed to the SDK at start (bootstrap with `isIdentifiedId: false`). We never call `identify`, `alias` or `group`.
- In the PostHog project, turn on "Discard client IP data". This is part of the rollout tasks.
- PostHog stores queued events in AsyncStorage and retries with backoff, which gives the offline queueing and the drop-oldest cap required by the spec. Each event carries its own timestamp from `capture` time. We do not build a second queue.

*Alternative considered:* our own queue that posts to the PostHog HTTP API. More code and more to test, for behaviour the SDK already has. We keep it as a fallback if the SDK's queue turns out not to persist across restarts on our Expo version; task 1.2 checks this first.

### 5. Opt-out semantics

`AnalyticsState.choice` is `null` until the user touches the switch, then `'on'` or `'off'`. The effective setting is `choice ?? DEFAULT_ENABLED`, with `DEFAULT_ENABLED = true` as the one constant in `state.ts` that sets the default. Storing "never chosen" instead of a resolved boolean means flipping the constant to `false` in a later build turns analytics off for every user who never chose, which is what an opt-in remedy needs; users who turned it on explicitly stay on. `setAnalyticsEnabled(false)` does three things:
1. It saves `choice: 'off'`.
2. It sets an in-memory gate that makes `track` return straight away.
3. It calls the SDK's `optOut()` and clears the SDK's pending queue (`reset` of the queue, not of the id, keeping our `installId`).

`setAnalyticsEnabled(true)` saves `choice: 'on'` and calls `optIn()`, or starts the SDK if it was never started in this launch. Turning it on sends nothing by itself; the next natural event is the first one. On launch, an install that is off never starts the SDK at all. While off, local bookkeeping that never leaves the device (`funnelDoneOnce`, `funnelOpen`) keeps updating, so `repeat` stays right if the user turns analytics back on; no event is built or buffered. The switch lives in its own key and not in `UiSettings`, because the install id and `installedAt` belong with it. Like `leadmate.ui`, this key is not cleared by `resetProgress` and not synced.

### 6. Funnel step derivation

`funnelStepOf({ route, onboardingStep, setupPart, tasteBriefed, tastePayoff, introStep, flowName })` maps the app's state to the spec's step list:
- `route.name === 'funnel'` → the persisted step (welcome, language, dog, concern, diagnostic, plan, method); for `setup`, `setup_<part>`.
- `taste` → `taste_briefing` until briefed, then `taste_stage`, then `taste_payoff`.
- `first-stage` → `first_<introStep>`, where simulation becomes `first_walk`.
- `flow` `register` → `register_prompt`; an account `auth` flow over the funnel → `account`.
- `paywall` → `paywall`.
- The World Map while `funnelOpen` is true → `map`, after which `funnelOpen: false` and `funnelDoneOnce: true` are saved. `funnelOpen` is saved true whenever any other Funnel step is viewed. This makes `map` fire once per Funnel run, again after a reset (with `repeat` true), and never for a user who was already past the Funnel when analytics shipped. A login that replaces the Dog mid-Funnel also ends with `map`; the `account` step before it tells that path apart.
- Anything else → `null`.

`upgradedInstall` is set when the state is first created and the Dog record's onboarding step is past `welcome`. It goes on `session_started`, so analysis can exclude installs that predate analytics; `app_version` alone cannot, since upgraded and fresh installs share it.

`SetupScreen` gets an optional `onPart(part)` callback so its local part reaches `App.tsx`. A `useEffect` keyed on the derived step sends `funnel_step_viewed` when the step differs from the last one sent. `repeat` is `funnelDoneOnce` at the time of the view.

*Alternative considered:* sending from each funnel screen's mount. Rejected. Mount and re-mount do not match "came to the front", and the step logic would be spread over many files.

### 7. Stage and Minigame start and end pairing

A Minigame is not a Stage (GLOSSARY), so it gets its own `minigame_started`/`minigame_ended` events, built by the same tracker with `kind: 'minigame'`. The tracker is held in a `useRef` in `App.tsx` as `PlayTracker`:
- `start` is called in `startStage` and `startCloseExercise`, so `stage_started` goes out when the Stage is launched, before its Stage view loads; a back during loading then pairs with `outcome: 'left'`. `minigame_started` is sent when a Node of mode `minigame` enters `simulation`. Kind and id come from the route (`taste`, `first-stage` → `first` with `intro-node`, flow `daily` → `daily:<date>`, `warmup`, `node`). `attempt` is the flow's own counter plus one (`f.attempt + 1`, already 0-based in `App.tsx`), and 1 for taste, first and warmup.
- `end('finished', score)` is called in the `debrief` branch of `onMessage`, in the Minigame `finish` callback, and for a taste reaction in `showTastePayoff` (no score).
- `end('skipped')` is called as the first line of the Pause Menu `onExit`, before it branches. That order matters: for the taste route `onExit` calls `showTastePayoff`, whose `end('finished')` is then a no-op.
- `end('left')` is called from an effect keyed on the play key (`route` + `attempt`): when the route no longer shows that Stage or Minigame and it is still open. This covers `viewWanted` turning false for Stages and leaving a Minigame, which has no Stage view.

Because `end` is idempotent, the overlapping paths (skip, then view release) send one event. `duration_seconds` is always foreground wall time from start to end minus time paused; the tracker takes `pause`/`resume` calls from the existing `paused` state and `AppState`. It deliberately does not use the payload's `durationSeconds`, so the property has one meaning for every outcome (it includes loading time).

If the app is killed during a Stage or Minigame, nothing more can be sent. The last event for that install is then a `*_started` without its `*_ended`, and that already answers "last screen seen". We do not persist open Stages to report on the next launch.

### 8. Lesson time and scroll

`LessonScreen` already computes `progress` on scroll. It gains an optional `onProgress(percent)` prop. A `LessonTimer` lives in `App.tsx` while the lesson flow is shown:
- It is created when the lesson flow is entered, and `lesson_opened` is sent then.
- It records furthest progress.
- `AppState` pauses and resumes it.
- It closes on "Done" (`closed_by: 'done'`) or when the lesson flow is left any other way (`closed_by: 'back'`).

`source` comes from the call site: `trail` (the Stop on the World Map, Satellite Stops included), `library` (the Theory Library) or `video_unlock` (the paywall's `then: { kind: 'video' }` reopening the Lesson). No Node screen opens a Lesson today, so there is no `node` value; a later change can add it without a version bump.

### 9. Stop completion from record diffs, at completion sites only

`stopsNewlyDone(before, after, worlds, now)` returns the trail Stops whose `stopStatus` went from not `done` to `done`, with world id and 0-based trail index from `placeOf`. Satellite Stops are skipped: they never gate anything, and their reading already shows in `lesson_done`. An Owed Mission is not done, so a Day Skip sends nothing and the later pass sends the event. It is called inside the existing `update` closures that complete things:
- the Node Debrief effect (next to `celebrationsFor`);
- `markLessonRead` on Lesson "Done";
- the Mission paths in `App.tsx` (`passMissionDirectly`, check-in via `applyMissionCheckIn`, day skip);
- `completeFirstStage`.

The resulting events are sent after the update, not inside the reducer. Records replaced by sync, login or reset never go through these sites, so synced progress sends nothing.

*Alternative considered:* one effect that diffs every record change. Rejected. It would report Stops done by sync merges and the first load as completions.

### 10. Sessions

An App Session is one stretch of app use: it starts at launch or on a return to the foreground after 30 minutes or more away. The event keeps the PostHog-conventional name `session_started`, but prose says "App Session" because the glossary reserves bare "session" (it is an _Avoid_ for Stage and Stretch, and `sessionCapacity` in `rusty.ts` means something else).

`session_started` is sent once the analytics state has loaded at app start. Funnel views made before that (the welcome screen can show first) wait in the `index.ts` buffer with their own timestamps. An `AppState` listener stores the time the app went to the background and sends `session_started` again on `active` if `shouldStartSession` (30 min or more). `first_session` is true when the state was created in this launch; `upgraded_install` is copied from the state.

### 11. Settings switch

There is a new `AnalyticsSection` in `SettingsScreen.tsx` on the Preferencias tab, after the language section. It uses the existing `Toggle` and the `Section`/caption pattern of the feedback section. It takes `{ enabled, setEnabled }` from an `useAnalyticsSetting()` hook, which reads and writes `AnalyticsState`. The strings `settings.analytics`, `settings.analytics.toggle` and `settings.analytics.help` are added to `src/i18n/es.ts` and `src/i18n/en.ts`.

## Risks / Trade-offs

- **[GDPR/ePrivacy: Spain's AEPD may treat analytics without prior consent as non-compliant, and a random install id is still pseudonymous personal data]** → Mitigations:
  - Opt-out as decided, but data-minimal: EU host, no IP or GeoIP, no person profiles, no account link, no free text.
  - The privacy policy (`docs/privacy-policy.md`) and the store data-safety forms are updated.
  - The default comes from one constant (`DEFAULT_ENABLED` in `state.ts`) and is resolved at read time for users who never chose, so flipping it plus a consent prompt is a contained follow-up that also covers existing installs. This should be confirmed with whoever owns legal before release.
- **[The SDK queue may not survive an app kill on our Expo/RN version]** → Task 1.2 checks persistence first. The fallback is our own small AsyncStorage queue behind the same `AnalyticsService` interface.
- **[`App.tsx` is large (1800 lines) and the wiring touches many callbacks]** → All decisions live in pure modules. `App.tsx` only gets one-line `track` calls and refs. Tests cover the pure modules, and `App.test.tsx` checks a few wiring paths with `MockAnalyticsService`.
- **[Double or missing `stage_ended` from overlapping end paths]** → The idempotent tracker, with a test for every path pair (skip then release, debrief then release, error during loading, taste skip then payoff, leaving a Minigame).
- **[Event loss]** → Accepted: the queue cap drops the oldest, and events are lost on opt-out or on a kill mid-flush. The goal is direction, not accounting.
- **[Installs from before this change get an `installedAt` equal to their first launch with analytics]** → Their `seconds_since_install` and `days_since_install` are understated. Accepted. Such installs are filtered out with `app_version` in analysis.
- **[Android Auto Backup restores `leadmate.analytics` with the rest of AsyncStorage]** → A restored device keeps the install id. Accepted: it restores the same Dog, so it is the same user's history.
- **[Ads already ask GDPR consent through Google UMP (ADR 0018)]** → Analytics does not read or depend on the UMP answer; the two are separate purposes with separate controls. If legal review ties them, that is part of the opt-in follow-up.
- **[Erasure requests]** → The install id is not shown to the user or linked to the account, so account deletion does not touch analytics. The privacy policy states this and the PostHog retention period.
- **[A future event may need a string that is not id-shaped]** → It is added as an `enum` with its values, or the contract grows a new kind on purpose, with a review.

## Migration Plan

1. Create the EU PostHog projects (dev and production) and turn on "Discard client IP data". Put the dev key in the development profile of `eas.json` now; the production key goes into the production profile only after step 3 is done.
2. Ship with analytics on by default. No data migration: existing installs create their state on first launch.
3. Update `docs/privacy-policy.md` and the Play/App Store data-safety answers ("App interactions, analytics, not linked to the user, not used for tracking") before the release that ships the SDK.
4. Rollback: remove the key from the build profile. `getAnalytics()` then falls back to the mock and nothing is sent, with no code change.

## Open Questions

- The exact PostHog SDK option names (`personProfiles`, bootstrap of the distinct id, clearing the queue on opt-out) depend on the `posthog-react-native` version installed. The intent is fixed above. Task 1.x pins the version and maps each option.

## Grilling decisions

Questions raised when stress-testing this change against GLOSSARY.md, the ADRs, the related main specs and the code, each resolved with the recommended (or most conservative, reversible) answer.

1. **"Player" in prose?** Use "user"; GLOSSARY lists "player" as an _Avoid_ (for Handler), and the human is the user.
2. **"Session" is reserved in GLOSSARY (Stage, Stretch) and code (`sessionCapacity`)?** Keep the event name `session_started`, call the concept "App Session" in prose and define it in the spec.
3. **A Minigame is not a Stage, yet `stage_started` covered it?** Separate `minigame_started`/`minigame_ended` from the same tracker; `mode` is now stage or close_exercise only.
4. **Is `stage_started` sent at launch or when play begins?** At launch, before the Stage view loads, so a back during loading pairs with `left`.
5. **What does `duration_seconds` measure?** Always foreground, unpaused wall time from launch to end, never the payload clock, so it means one thing for every outcome.
6. **Keep `left_early`?** Dropped: it is fully derived from `outcome`, and removing it after release would be a breaking change.
7. **What is `attempt`?** The flow's counter plus one (1 on opening, +1 per play again from the Debrief); 1 for taste, first and warmup.
8. **`stage_id` for Stages without a Node?** `taste`, `warmup`, `daily:<date>`, and `intro-node` for the guided first Stage.
9. **`handling_score` when there is none (taste, some Minigames)?** Optional; sent only when the Debrief payload or Minigame reports one.
10. **A taste skip runs `showTastePayoff`, which would record `finished`?** `end('skipped')` is the first line of `onExit`, so the later `finished` is a no-op.
11. **Minigames have no Stage view, so `viewWanted` never ends them?** `end('left')` is driven by leaving the play route/attempt, not by `viewWanted`.
12. **Lesson `source` `node` has no call site in the code?** Dropped; a later change can add it additively.
13. **Do Satellite Stops send `stop_completed`?** No; they never gate progress and `lesson_done` already shows their reading.
14. **Is a Day Skip a completion?** No; an Owed Mission is not done, and its later pass sends the event.
15. **`map` keyed on `funnelDoneOnce` never fires after a reset?** New `funnelOpen` flag: set by any Funnel view, cleared by `map`, so `map` fires once per Funnel run.
16. **Users already past the Funnel would send a spurious `map` and skew the baseline?** `funnelOpen` prevents the `map`; `upgraded_install` on `session_started` lets analysis exclude pre-analytics installs.
17. **Events made before the analytics state loads (welcome shows first)?** Held in a capped in-memory buffer with their timestamps, then sent or discarded per the switch.
18. **The `id` kind accepts UUIDs, so a Dog or account id could pass?** UUID-shaped values are rejected, and the privacy test also checks Dog id, account id and install id.
19. **`content_version` is per Channel and ambiguous across stable and beta?** Add `content_channel` to the common properties.
20. **Should the default be resolved when the state is created?** No: store `choice` as on/off/null and resolve `null` with `DEFAULT_ENABLED` at read time, so flipping the constant reaches every user who never chose.
21. **Does local bookkeeping run while analytics is off?** Yes for device-only flags (`funnelDoneOnce`, `funnelOpen`); no event is built, buffered or queued.
22. **Does turning analytics back on send an event?** No; the next natural event is the first.
23. **Web build: mock only without a key, or always?** Always the mock on web (matches tasks and the ads/billing pattern).
24. **The progress-reset spec lists what a reset keeps but not analytics?** Add a MODIFIED `progress-reset` requirement naming the analytics choice and install id.
25. **Account deletion and erasure requests?** Analytics is not linked to the account and is untouched; the privacy policy says so and states PostHog retention.
26. **Android Auto Backup restores the install id?** Accepted; it restores the same Dog and user.
27. **Tie analytics to the ads UMP consent (ADR 0018)?** No; separate purpose and control, revisited only with the opt-in follow-up.
28. **Could the production key ship before the privacy policy?** No: only the dev key goes in now; the production key is added after the policy and data-safety forms are updated.
29. **The privacy test "from a record" cannot run at `buildEvent` level?** Keep a contract-level test and add an end-to-end wiring test with `MockAnalyticsService`.
30. **`seconds_since_install` if the clock goes back?** Clamped at 0.
31. **Untestable wording ("about 25", "exactly one" despite kills)?** Scenarios made exact, and "unless the app is closed or killed first" added.
32. **Scope creep: Barkdoku, Shop, Value Recap, later Paywalls, ads?** Out of scope, listed in the proposal; later changes add events through the contract.
33. **Install id generator?** No new dependency; an injected UUID v4 generator in the Shell (ADR 0002 binds only the simulation).
34. **Settings tab for the switch: Preferencias or Cuenta?** Preferencias: it is a device setting that works with no account.
35. **Does the default-on decision deserve an ADR?** Yes: hard to reverse once data is collected, surprising without the context, and a real trade-off (proposed as ADR 0031).
