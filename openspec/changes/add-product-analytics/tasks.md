# Tasks

## 1. Dependency and SDK spike

- [ ] 1.1 Add `posthog-react-native` (and any peer it needs for Expo, such as `expo-file-system`/`expo-application` if required) pinned to an exact version; verify `npx expo install --check` reports no mismatch and `npm run typecheck` passes
- [ ] 1.2 Spike on an Android dev build: capture 3 events offline, kill the app, reopen online, and confirm in the PostHog dev project that all 3 arrive with their original timestamps; record the result and the exact option names for EU host, no GeoIP, no person profiles, no lifecycle/autocapture, distinct-id bootstrap, opt-out and queue clearing as a comment block at the top of `src/shell/analytics/posthog.ts` (if events do not survive the kill, switch task 3.3 to the own-queue fallback from design decision 4)

## 2. Event contract (pure, test-first)

- [ ] 2.1 Write `src/shell/analytics/contract.test.ts` first: unknown event → `null`; undeclared property → `null`; missing required property → `null`; `id` kind rejects spaces, upper case, `@`, >64 chars and UUID-shaped values; `int` rejects `NaN`/`Infinity` and rounds; every built event carries `schema_version` 1 and the common properties; verify the tests fail
- [ ] 2.2 Implement `src/shell/analytics/contract.ts` (`SCHEMA_VERSION`, property kinds `int`/`bool`/`enum`/`id`, `EVENTS` registry for `funnel_step_viewed`, `session_started`, `stage_started`, `stage_ended`, `minigame_started`, `minigame_ended`, `lesson_opened`, `lesson_done`, `checkpoint_answered`, `stop_completed` with the properties in the `product-analytics` spec, `FUNNEL_STEPS`, `buildEvent`), with a header comment stating the versioning and naming rules; verify 2.1 passes
- [ ] 2.3 Add a contract snapshot test that lists every event name with its property names and kinds, so any change to the contract shows in review and forces a decision on `schema_version`; verify it passes
- [ ] 2.4 Add a contract-level privacy test: `buildEvent` drops every declared `id` property set to `Luna`, `luna@example.com` or a UUID, and no event declares a property kind that accepts free text; verify it passes (the end-to-end privacy check is 8.3)

## 3. Install state, service and opt-out

- [ ] 3.1 Write `src/shell/analytics/state.test.ts` first, then implement `state.ts` (`DEFAULT_ENABLED = true` as the only place the default lives; `leadmate.analytics` key: `installId`, `installedAt`, `choice` on/off/null, `funnelDoneOnce`, `funnelOpen`, `upgradedInstall` set when created for a record past `welcome`; `isEnabled` = `choice ?? DEFAULT_ENABLED`; UUID v4 install id from an injected generator, no new dependency; corrupt or missing JSON → fresh state; storage errors → in-memory state, never throws). Tests include: with the default mocked to `false`, a `null` choice is off and an `'on'` choice stays on; verify tests pass
- [ ] 3.2 Extend `src/shell/reset.test.ts` to assert `resetProgress` leaves `leadmate.analytics` unchanged (the `progress-reset` delta); verify it passes without changing `reset.ts`
- [ ] 3.3 Implement `types.ts` (`AnalyticsService`), `mock.ts` (`MockAnalyticsService` recording captured events) and `posthog.ts` (options from 1.2, distinct id = `installId`, never `identify`/`alias`), with `mock.test.ts`; verify tests pass
- [ ] 3.4 Write `index.test.ts` first, then implement `index.ts`: `getAnalytics()` picks the mock under Jest, on web or with no `EXPO_PUBLIC_POSTHOG_KEY`; `initAnalytics(store, record)` loads state and starts the service only when enabled; `track(name, props)` stamps the time, buffers in memory (cap 50) until `initAnalytics` finishes and then sends or discards per the switch, adds common properties (`app_version` from `Constants.expoConfig`, active `content_version` and `content_channel`, `language`, `seconds_since_install` clamped at 0), drops events that fail `buildEvent` (with `console.warn` in `__DEV__`), and swallows every error; `setAnalyticsEnabled(false)` saves, gates `track` at once and opts out and clears the SDK queue. Tests cover: off → nothing captured; turned off mid-App Session → nothing more captured; turned on → nothing sent until the next event; event tracked before init → captured after init with its original time; service throwing → `track` does not throw; verify tests pass
- [ ] 3.5 Add `EXPO_PUBLIC_POSTHOG_KEY` and `EXPO_PUBLIC_POSTHOG_HOST` (EU) to the development profile of `eas.json` only (the production key waits for 9.4) and document both next to the existing `EXPO_PUBLIC_*` keys; verify a build with no key runs and sends nothing

## 4. Settings switch

- [ ] 4.1 Add `settings.analytics`, `settings.analytics.toggle` and `settings.analytics.help` to `src/i18n/es.ts` and `src/i18n/en.ts` (the help line says the data is anonymous, never includes the Dog's name or email, and helps improve the game); verify `src/i18n/i18n.test.ts` and `catalog-usage.test.ts` pass
- [ ] 4.2 Add a `useAnalyticsSetting()` hook over `AnalyticsState` and an `AnalyticsSection` on the Preferencias tab of `src/shell/screens/SettingsScreen.tsx`, after Language, using the existing `Toggle`; extend `SettingsScreen.test.tsx` so that it is shown on Preferencias and not on the other tabs, defaults to on, pressing it calls `setAnalyticsEnabled(false)` and shows off at once, and it has an accessible label and state; verify tests pass

## 5. Sessions and funnel steps

- [ ] 5.1 Write `session.test.ts` first, then implement `session.ts` (`shouldStartSession` at a 30 min threshold, `daysSince`, `secondsSince`); verify tests cover 5 min (no) and 45 min (yes)
- [ ] 5.2 Wire `initAnalytics` and `session_started` (`first_session`, `days_since_install`, `upgraded_install`) at app start in `App.tsx`, and the `AppState` background/foreground check; verify with an `App.test.tsx` case using `MockAnalyticsService` that one `session_started` is captured on mount
- [ ] 5.3 Write `funnel.test.ts` first, then implement `funnel.ts` (`funnelStepOf` covering every value in `FUNNEL_STEPS`, including taste briefing, stage and payoff, `setup_<part>`, `first_<introStep>` with simulation → `first_walk`, `register_prompt`, `account`, `paywall`, `map` only while `funnelOpen` is true, and `null` elsewhere; plus the dedupe that only reports a changed step and the `funnelOpen`/`funnelDoneOnce` transitions); tests cover a second Funnel run after a reset sending `map` with `repeat` true, and an upgraded install already at `done` sending no `map`; verify tests pass
- [ ] 5.4 Add an optional `onPart(part)` prop to `SetupScreen` that reports the visible setup part; extend `SetupScreen.test.tsx` to check it fires on each part change; verify tests pass
- [ ] 5.5 Wire `funnel_step_viewed` in `App.tsx` from `funnelStepOf` (with `repeat` = `funnelDoneOnce`, saving `funnelOpen: true` on any other step and `funnelOpen: false`, `funnelDoneOnce: true` when `map` is sent); verify with an `App.test.tsx` case that advancing welcome → language sends both steps once each

## 6. Stages

- [ ] 6.1 Write `stages.test.ts` first, then implement `stages.ts` (`PlayTracker` for Stages and Minigames: `start` → `stage_started` or `minigame_started` props; `end(outcome)` → `stage_ended` or `minigame_ended` props with `duration_seconds` as foreground unpaused wall time from start, `handling_score` only when finished and given; a second `end` and an `end` with nothing open return `null`; a new `start` while one is open first ends the old one as `left`); verify tests cover skip-then-release, debrief-then-release, error-while-loading, taste skip-then-payoff (stays skipped) and a Minigame left
- [ ] 6.2 Wire the tracker in `App.tsx`: `start` in `startStage` and `startCloseExercise` (kind and id from the route: `taste`, `first`/`intro-node`, node id, `daily:<date>`, `warmup`; `attempt` = `f.attempt + 1` or 1), and when a `minigame` Node enters `simulation`; `end('finished')` in the `debrief` branch of `onMessage` (with `handlingScore`), in the Minigame `finish` callback and on the taste reaction; `end('skipped')` as the first line of the Pause Menu `onExit`; `end('left')` from an effect when the play route or attempt changes with something open; pause and resume from `paused` and `AppState`. Verify with `App.test.tsx` cases that a skipped Node Stage sends exactly one `stage_started` and one `stage_ended` with `outcome` skipped, and that backing out of a Minigame sends `minigame_ended` with `outcome` left
- [ ] 6.3 Verify the simulation stays pure: add a test that scans `src/sim/**` and `bundle/src/**` for any `analytics` or `posthog` import and fails if found, and confirm `src/sim/payloadBaseline.test.ts` still passes unchanged

## 7. Lessons and Checkpoints

- [ ] 7.1 Write `lessons.test.ts` first, then implement `lessons.ts` (`LessonTimer`: foreground seconds with pause/resume, furthest progress kept when scrolling back up, `close(closedBy)` once only); verify tests pass
- [ ] 7.2 Add an optional `onProgress(percent)` prop to `LessonScreen` fed from its existing `readingProgress` handler; extend `LessonScreens.test.tsx` to check it is called on scroll; verify tests pass
- [ ] 7.3 Wire `lesson_opened` (`source`: trail from the World Map Stop, library from the Theory Library, video_unlock from the paywall's `then: { kind: 'video' }`) when the lesson flow is entered and `lesson_done` (`closed_by` done or back) when it is left in `App.tsx`; verify with an `App.test.tsx` case that opening a Lesson from the map and pressing Done sends both events with `source` trail and `closed_by` done
- [ ] 7.4 Wire `checkpoint_answered` for Node runs (in `act`, for `answer`/`timeout` while `run.step === 'checkpoint'`) and for the guided first Stage's `introRun`, timing from when `run.question` was shown and reading the result from the run after `advance`; verify with a `NodeScreens`/`App.test.tsx` case that a correct answer sends `result` correct with the Node id and `question_index` 0

## 8. Stop completion

- [ ] 8.1 Write `stops.test.ts` first, then implement `stops.ts` (`stopsNewlyDone(before, after, worlds, now)` using `stopStatus` and `placeOf`, 0-based trail index; a replay of a done Node, an identical record, a Mission that is only started, a Day Skip that leaves the Mission owed and a Satellite Stop return nothing; passing an Owed Mission returns it); verify tests pass
- [ ] 8.2 Call `stopsNewlyDone` in the completion `update` closures in `App.tsx`: the Node Debrief effect, Lesson "Done" (`markLessonRead`), the Mission pass, check-in and day-skip paths, and `completeFirstStage`. Send `stop_completed` after the update and never from sync, login or reset paths. Verify with an `App.test.tsx` case that the first completion of a Node sends one `stop_completed` and a replay sends none
- [ ] 8.3 Add an end-to-end privacy test in `App.test.tsx` with `MockAnalyticsService`: a Dog named `Luna`, account email `luna@example.com`, a Dog id and an account id play the Funnel, a Lesson, a Checkpoint, a Stage and a Minigame; assert none of those values, nor the install id, appears in any captured event's properties; verify it passes

## 9. Privacy documentation and rollout

- [ ] 9.1 Update `docs/privacy-policy.md` (Spanish and English sections) to describe the anonymous analytics: what is sent, the PostHog EU processor, no name, email or account link, how to turn it off in Settings, that it is not linked to the account (so account deletion does not touch it) and the PostHog retention period; verify the policy names every event category in the contract
- [ ] 9.2 Configure the PostHog production project: EU region, "Discard client IP data" on, no session replay, no autocapture; prepare the Play Console and App Store data-safety answers (app interactions, analytics, not linked to the user, not used for tracking); verify with a checklist in the PR description
- [ ] 9.3 Build a funnel insight in PostHog over `funnel_step_viewed` steps in `FUNNEL_STEPS` order, plus a "last event per install" view, both excluding `upgraded_install` true; verify it shows data from the dev project after a manual run-through
- [ ] 9.4 Only after 9.1 and 9.2 are done, add the production `EXPO_PUBLIC_POSTHOG_KEY` to the production profile of `eas.json`; verify the release build that first carries it ships the updated policy

## 10. Integration check

- [ ] 10.1 Run `npm test` and `npm run typecheck`; both pass
- [ ] 10.2 On an Android device build with the dev key, play welcome → first Stage → paywall → open a Lesson → play a Node, then turn analytics off and play another Stage. Verify in PostHog Live events that the expected events arrived in order with `schema_version` 1, that none contain the Dog's name, and that nothing arrived after the switch was turned off
- [ ] 10.3 Repeat 10.2 with the phone in airplane mode until the end, then reconnect; verify the queued events arrive with their original times

## Workflow follow-up

- The changes `add-read-the-dog-game`, `telegraph-marker-timing` and `split-walks-into-encounters` add their events through a `contract.ts` entry and an ADDED requirement on `product-analytics` (design decision 3).
- Archive the change after review and sync `product-analytics`, `settings-screen` and `progress-reset` into the main specs.
- Before release, confirm the opt-out default with whoever owns legal; if opt-in is required, flip `DEFAULT_ENABLED` and add a consent prompt in a follow-up change.
