# Proposal

## Why

We believe new users leave early: they're confused after the first walk, and then they hit many screens, minigames and long Lessons. We can't confirm that today. The app has no product analytics, and the only telemetry is the end-of-Stage debrief payload. We need a baseline for where users stop before we change the first session (see `add-read-the-dog-game` and `split-walks-into-encounters`). Otherwise we won't be able to tell whether those changes helped.

## What Changes

- Add anonymous product analytics sent to PostHog, aimed at: **which screen is the last one a user sees, how far do they get, and what do they do and tap on the way?**
- Emit a fixed, versioned set of events:
  - `funnel_step_viewed` (step, time since install)
  - `stage_started` / `stage_ended` (Stage id, attempt, outcome, duration)
  - `minigame_started` / `minigame_ended` (Node id, attempt, outcome, duration), kept apart from Stage events because a Minigame is not a Stage
  - `lesson_opened` / `lesson_done` (Lesson id, source, seconds on screen, share scrolled), to show whether Lessons are read or skipped
  - `checkpoint_answered` (Node id, correct, time to answer)
  - `stop_completed` (World id, Stop id)
  - `session_started` (days since install, first App Session, upgraded install)
  - `screen_viewed` (screen, previous screen, content item) for every screen, not only the Funnel
  - `app_backgrounded` (screen, seconds in the App Session), to show where users leave
- Every event also carries context: the current screen, progress (World, Stops done, furthest Stop, Funnel done), whether signed in, Plus status (free, trial, subscribed), App Session number and time, platform and runtime (store, preview, dev build, Expo Go, web). Taps carry the same context through PostHog super properties.
- Taps are recorded with PostHog touch autocapture, limited to component names and fixed test ids: no screen text, and the Dog-name input and account views are excluded (ADR 0035). On web only touch taps are recorded.
- Session replay is recorded in dev and internal preview builds only, fully masked.
- Analytics is anonymous: a random install id. No Dog name, email, account id, Dog id or free text goes into any event, the contract drops anything it does not declare, and tap capture is configured to leave screen text out.
- Analytics is on by default with an opt-out switch in Settings. Turning it off stops all sending right away. The default comes from one constant and applies to every user who has not touched the switch, so it can be flipped to opt-in if legal review asks for it (see design, Risks).
- Events are queued while offline and sent later. Analytics never blocks or slows the UI, and a failure to send never shows an error to the user.
- The simulation stays pure: events are sent from the shell, never from `src/sim/`.

## Capabilities

### New Capabilities
- `product-analytics`: the anonymous event contract (names, properties, versioning), the install id, the privacy rules on what may be sent, offline queueing, and opt-out behaviour.

### Modified Capabilities
- `settings-screen`: adds the analytics opt-out switch.
- `progress-reset`: names the analytics choice and install id among the device settings a reset keeps.

## Impact

- New dependencies: the PostHog React Native SDK (`posthog-react-native`), with the project key in app config, and `posthog-react-native-session-replay` for dev-build replay.
- Shell code: funnel step changes, every screen change, Stage and Minigame start/end in the Shell, Lesson screens, Checkpoint, World trail Stop completion, app start and background, `PostHogProvider` at the app root, fixed `testID`s and `ph-no-capture` on screens.
- Daily Barkdoku, the Shop, the Value Recap and Paywalls outside the Funnel are covered by `screen_viewed` and taps only, with no dedicated events. Commercial Ads are out of scope.
- Privacy: the privacy policy and store data-safety forms need to mention analytics, including tap capture (ADR 0035 amends ADR 0031). GDPR applies: the install id is pseudonymous personal data, so events are data-minimal and the opt-out-by-default choice is a documented, reversible risk. The production key ships only after the policy and forms are updated.
- No change to `src/sim/`, seeded results or the debrief payload.
