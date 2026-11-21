# Design

## Context

See proposal.md for why. What exists today:

- **Diagnostic.** `src/shell/onboarding/diagnostic.ts` is a pure, seeded 15-second reflex test (`newDiagnostic` / `stepDiagnostic`, gaps drawn from `createRng`). `diagnosticLatency` is the median reaction time, with a time-out counted as `DIAGNOSTIC.timeout` (1.5 s) and early taps ignored. `recordDiagnostic(record, latency)` stores `onboarding.diagnosticLatency`, seeds `attributes.reconnectionLatency` via `seedFromLatency` (maps 0.25-0.8 s to 0.4-0.1), builds the Personal Plan and advances the step. It does nothing if a latency is already stored, which is what makes the seeding happen exactly once.
- **Consumers of the latency.** `latency.ts` bands it (quick under 0.35 s, slow from 0.55 s). `PlanScreen` shows it on the diagnostic card, and `plan.ts` adds the Poste Stretch for the slow band. `App.tsx` mounts `DiagnosticView` for the `diagnostic` step with `seed={newSeed()}` and `onFinish={(latency) => update((r) => recordDiagnostic(r, latency))}`.
- **Diagnostic view and art.** `DiagnosticView.tsx` is a React Native shell screen driven by `useTicker` (which stops while the app is in the background). It draws `DiagnosticScene` (meadow plus `BreedArt`, breed and coat). `BreedArt` is a parametric silhouette per breed (`BREED_SHAPES`) with one body-language switch, `looking` (ears perked per ear kind, wide eye, gaze lines).
- **The World 1 engine.** `src/shell/nodes/readDog.ts` with `ReadDogView.tsx` is the choose-the-action engine. A scene is a short fixed script of beats (4-5), built by `buildScript(scene, seed)`. There are four scene-specific action buttons with one right action per state per scene. A beat gives one retry after a wrong choice and has a 5-second decision window. The result is Debrief metrics (`timing`/`poste`, `tension`) and a handling score. Its Dog is `CanineMinigameAvatar`, which is coat-only with no breed and uses the `CaninePosture` specs in `ui/canine.ts`.
- **Feedback Messages.** Tier rules and timings are pure in `src/hud/feedback.ts` (`TIER_SECONDS`, `BIG_COMBO`) and `src/hud/effectsPool.ts` (`alphaFade`, `wobbleOffset`, `bounceOffset`, `withDogName`). Phaser draws them in the bundle. The shell voices them through `feedback.stage({ polarity, tier, combo })`, with `comboSemitones` for the rising tick.

Constraints: pure logic is seeded with `createRng` (no `Math.random`). All text comes from `src/i18n` (es, en). Reduced motion is handled by `useMotion`. Scene art keeps Light colours (game-ui-theme "Light-only regions").

## Goals / Non-Goals

**Goals:**
- A pure, seeded, test-first Read the Dog engine that one shell screen drives, both for the onboarding Diagnostic and for a later standalone use.
- A drop-in for the Diagnostic. It reports a latency on the existing scale, so `recordDiagnostic`, `latency.ts`, `plan.ts`, `PlanScreen` and the `DogRecord` schema stay unchanged.
- Body-language signals drawn on the breed-and-coat Dog the user picked in the funnel.

**Non-Goals:**
- Replacing or changing any World 1 choose-the-action Minigame, or adding Read the Dog as a World Map Node. This is the open question below.
- Persisting the skill level or signal weights across sessions or in the synced Dog record.
- A recorded "watch it back" replay of the round. Instant replay means playing again at once (see Decision 7).
- Emitting analytics. `add-product-analytics` is a soft dependency (see Decision 9).
- Any change to the simulation, the bundle, Stage Feedback Messages, or the Expressive Dog of the action Minigames.

## Decisions

### 1. A new engine next to `readDog.ts`, not an extension of it

New pure module `src/shell/nodes/readTheDog.ts`, with tests in `readTheDog.test.ts`. It reuses only shared building blocks: `createRng`, the `TextKey` typing and the Feedback helpers.

Why not extend `readDog.ts`? Almost every rule differs:

| | `readDog.ts` (choose the action) | Read the Dog |
|---|---|---|
| Answers | 4 actions, different per scene | 3 fixed classes |
| What is right | per scene and state | per signal, the same everywhere |
| Wrong answer | one retry per beat | no retry |
| Timer | a fixed 5 s window | adaptive, 2.4 s down to 1.0 s |
| Length | 4-5 beats | time-boxed, open-ended stream |
| Draws | fixed scripts | weighted draws |
| Result | Debrief metrics and stars | score, Combo, latency |

Folding these into `stepReadDog` would branch on the mode in every function. It would also put the tested, seeded World 1 scripts at risk. The two engines share a concept (the Dog shows a state and the user answers), not code.

If the open question later moves World 1 onto Read the Dog, the new engine can be mounted as a Node then. To avoid confusing the two, the new files use the full name `readTheDog*`, and the existing `readDog*` keeps its name. Renaming it to `chooseAction*` is out of scope. In docs, specs and catalog keys, "Read the Dog" always means this game; the World 1 engine is called the action Minigame (its scenes are made of Action beats), never "Read Dog".

### 2. Signal set and classes

The `RtdSignal` union and one table `SIGNALS: Record<RtdSignal, { cls: RtdClass; subtle: boolean }>`, with `RtdClass = 'calm' | 'alert' | 'about_to_react'`. The domain name is **Signal Class**. Two of its labels match the Reaction Tier (`calm`, `alert`, `reactive` in `src/sim`) on purpose, because they teach what those tiers look like, but a Signal Class is the reading of a drawn pose, never derived from Arousal. The third value is spelled `about_to_react` so it is never mistaken for the tier `reactive`.

| Signal | Class | Subtle |
|---|---|---|
| `soft_loose` | Calm | no |
| `play_bow` | Calm | no |
| `loose_wag` | Calm | yes |
| `ears_up_still` | Alert | no |
| `lip_lick` | Alert | yes |
| `whale_eye` | Alert | yes |
| `freeze_stare` | About to react | no |
| `hackles_up` | About to react | no |
| `stiff_closed_mouth` | About to react | yes |

Each class has one or two obvious signals and at least one subtle one, so the early levels (obvious only) still use all three answers.

We left out lying down (it needs a different leg rig on `BreedArt`), sniffing and yawning (both can be calm or stress, which is too ambiguous for a one-tap class), and barking or lunging (that is already reacting, not about to). A canine-behaviour review of the table and of every signal line is a task. The table is data, so adding a signal is one row plus its art and catalog lines.

These are a new type, not new `CaninePosture` values. `CaninePosture` drives the coat-only avatar of the action Minigames. These signals are drawn by `BreedArt` (Decision 4). In the domain a Signal is still a Canine Posture (the Dog's observable body language); only the code type is separate.

### 3. Engine shape (pure, fixed-step like the existing engines)

- **Run state.** `newRound(seed, carry?)` returns a `RoundState` with:
  - `t` and `phase` (`showing` / `pause` / `done`), the current `signal` and its `timer`
  - `level`, a per-signal `weight` map, `combo`, `bestCombo`, `score`, `rightStreak`, `badStreak`
  - the response times on right answers, per-class counts, and the `last` event with a `seq` (the same pattern as `ReadDogRun.last`)
- **Step.** `stepRound(state, dt, answer: RtdClass | null)` is pure, so the view sends at most one answer per tick.
- **Constants.** One `READ_THE_DOG` object:
  - `roundSeconds: 24`
  - `pauseSeconds: 0.35` after a right answer, `wrongPauseSeconds: 1.2` after a wrong or missed one, so the correction line can be read before the next signal
  - `timers: [2.4, 2.0, 1.7, 1.4, 1.2, 1.0]` (level 0-5)
  - `subtleFromLevel: 2`
  - `upAfter: 3`, `downAfter: 2`; `rightStreak` and `badStreak` both reset to 0 on every level change, a right answer resets `badStreak` and a wrong or missed one resets `rightStreak`
  - `missWeight: +2`, `rightWeight: -1`, `maxWeight: 5`, base weight 1
  - `decisionAllowance: 0.45`
  - `missSeconds`: not a new number, it is `DIAGNOSTIC.timeout` (1.5 s), the value `median([])` already falls back to, so the miss value has one source
  - `screenReaderTimer: 6` (see below)
  - `bigEvery: 5` (Decision 6)
  - score: `basePoints: 100`; a right answer adds round(100 × (0.5 + 0.5 × timeLeft / timer) × (1 + 0.1 × min(combo − 1, 9))), where `combo` counts this answer. All of these are tunable constants; the spec pins only the orderings (faster is worth more, Combo is worth more, nothing subtracts)
- **Drawing the next signal.** Use `createRng(seed * 7919 + drawIndex)`, the same per-draw reseeding style as `diagnostic.ts`'s `drawGap`, so a draw depends only on the seed, its index and the state. Choose among the signals allowed at the current level, excluding the previous one, in proportion to their weights.
- **Screen reader.** The view passes `{ fixedLevel: 0, timerSeconds: READ_THE_DOG.screenReaderTimer }` while a screen reader is on (read through `AccessibilityInfo.isScreenReaderEnabled` and its `screenReaderChanged` event, as `ShopPopup` already does), so the engine stays the only place timers come from. 2.4 s is too short to hear the body description and then answer; 6 s is a tunable guess. A change of the setting mid-round takes effect from the next signal.
- **Replay seed.** `replaySeed(seed, n)` derives the n-th replay's seed from the seed `App.tsx` passes in, so the view never draws randomness of its own and replays stay reproducible in tests.

### 4. Art: extend `BreedArt` rather than use `CanineMinigameAvatar`

The Diagnostic already draws the user's own breed and coat. Moving to the coat-only avatar would lose that, and that recognition is part of the first-session hook.

`BreedArt`'s `looking: boolean` becomes an optional `signal?: RtdSignal | 'looking'`, with `looking` kept as an alias so current callers are unchanged. Each signal is a small parts spec, in the same spirit as `PostureSpec`:

- `body`: level, bow or forward lean (a transform about the hind legs or the body)
- `ears`: relaxed, up or pinned, reusing the existing `PERK_DEG` per ear kind and adding a pinned rotation
- `eyes`: soft, whale (white crescent) or fixed
- `mouth`: soft open, tongue flick or tight
- `tail`: low, wag or stiff high
- `hackles`: a ridge path along `geometryOf(s)` from the withers to the rump

The parts spec lives in a pure `ui/rtdArt.ts`, so its rule (every pair of signals differs in at least one part) is unit tested without rendering.

Snapshot or render tests cover every breed × one coat for each signal. Coats only change the palette, so a coat sweep on one signal is enough.

The wag is the only motion. It is gated by `useMotion().reduced`, and without motion it is drawn as a still curve.

### 5. Shell screen, not the Phaser bundle

`ReadTheDogView.tsx` (shell, React Native) replaces `DiagnosticView` and follows the same ticker-and-ref pattern: per-tick state in a ref, React state only for what the screen shows.

The bundle was rejected. It would cost a WebView start before the first signal (against "value in seconds"), it has no breed art, and the onboarding step already lives in `App.tsx`.

Inputs:
- three `MinigameButton`s, each with an icon and text
- a pan gesture on the scene for swipes, with a 40-point threshold and dominant-axis detection, decided in a pure `swipeClass(dx, dy)` helper. It uses React Native's built-in `PanResponder`: the app has no `react-native-gesture-handler`, and one swipe recogniser does not justify a new native dependency. The scene keeps a margin from the screen edges so a swipe never starts where the system back gesture lives. Swipes are a shortcut; the buttons are the primary input

### 6. Feedback reuses the Feedback Message rules, drawn in the shell

- **Tier.** A pure `rtdFeedback(event, combo, signal)` returns `{ tier, polarity, combo, textKey }`. It deliberately does not use the Stage rule `BIG_COMBO = 3`: a signal comes every 1-2 s, so a big effect from Combo 3 would fire almost constantly. Read the Dog uses medium from Combo 3 and big at every multiple of `bigEvery` (5).
- **Voice.** The view calls the existing `feedback.stage({ polarity, tier, combo })`. Sounds, haptics, settings, volume ducking and the `comboSemitones` pitch come for free.
- **Drawing.** A small shell `FeedbackBurst` draws the tier: pop word and icon, star burst, banner and Combo counter, wobble and grey puff. It takes its timings from `TIER_SECONDS` and the easing from `alphaFade` / `wobbleOffset` / `bounceOffset`, so the shell and bundle effects match. With reduced motion, `alphaFade` is used alone. Tier effects (0.6-1.2 s) outlast the 0.35 s pause, so the burst sits in the band above the Dog, never over it, and a new burst replaces the one still showing.
- **Screen reader.** The signal line is announced after the answer, through the same polite live region as the body description.
- **Text.** The signal line comes from catalog keys `readTheDog.signal.<signal>` with `{name}`, filled by `withDogName`. There is no Hint/short split and nothing goes in `seenHints`: the one line is already the short form.

### 7. "Instant replay" means play again at once

The result card shows the score, best Combo, share right and the signals to watch, plus a replay button. Replay calls `newRound(replaySeed(seed, n), carry)`, where `carry = { level, weights }` from the finished round, and starts it with no start screen. So the adaptive level and the weak-signal weights continue across replays within the session.

We rejected a recorded playback of the round: a new view, more time before the next try, and the brief asked for value in seconds. If analytics shows players want it, it can be added on top of the reported result.

### 8. Latency on the old scale, through a fixed allowance

Choosing among three classes takes longer than a single-button reflex. Raw classification times would push almost everyone into the slow band.

`roundLatency` = median of: each right answer's time − 0.45, clamped to 0-1.5; each miss as 1.5. Wrong answers and a signal still open at the end are excluded, like the old early taps. No data gives 1.5, like `median([])` today.

The allowance is taken off each right answer, not off the median. Taking it off the median (the first draft) would turn a round of only misses into 1.05 s, inside the scale instead of at its slow end, and contradict "nothing answered gives 1.5". A miss means the same as the old time-out: 1.5 on the old scale.

This keeps the latency bands, `seedFromLatency`, `plan.ts`, `PlanScreen` and the stored `diagnosticLatency` meaning the same.

The diagnostic card prints the value as "Your reaction time: 0.xx s". After the allowance that number is the time to act once the signal was read, not the full answer time, so only the `plan.latency` catalog text changes (es and en) to say that, for example "Your reaction time once you spotted the signal". `PlanScreen` code is unchanged, and the wording still holds for values recorded by the old reflex test.

A screen reader user's times include the spoken description, so they will tend to land in the slow band. The old reflex test had the same bias, and the slow band only adds a Poste Stretch to the plan. It is noted as a risk, not solved here. Users already past the step keep their old value, because `recordDiagnostic` is idempotent. The allowance is one constant to retune after play-testing or analytics.

Alternative considered: re-band using raw times and a migration of stored values. Rejected, because it touches the record, sync and the plan for no player-visible gain.

In the funnel, the view keeps the latency of the first finished round. It calls `onFinish(firstLatency)` once, when the user taps Continue on any round's result. `App.tsx` keeps calling `recordDiagnostic` unchanged, which records, seeds, builds the plan and advances the step.

This way the result and the replays come before the card. A replay can never overwrite the first round. An app closed before Continue records nothing, and the Diagnostic restarts on resume. No change to `diagnostic.ts`'s record function is needed.

### 9. Result object, ready for analytics (soft dependency)

`roundResult(state)` returns a plain, serialisable object: `{ score, bestCombo, right, wrong, missed (per class), endLevel, latency, seconds }`. It contains no name and no free text, so it already fits the anonymous rules proposed in `add-product-analytics`. That change can log it from the view's finish callback. Nothing here depends on it landing.

### 10. Text keys

New catalog namespace `readTheDog.*` in both `es.ts` and `en.ts`:
- help, start, the three answers and their accessibility hints
- timer text, combo, score
- signal lines and screen-reader body descriptions per signal (`readTheDog.describe.<signal>`)
- result title, share, signals to watch, replay, continue

The `diagnostic.*` keys become unused once `DiagnosticView` is removed. They are deleted in the same task, so the catalog completeness tests stay honest.

## Risks / Trade-offs

- [The class table is a simplification of real canine body language: context changes meaning, and a play bow can precede a reaction.] → The lines say what the signal usually means. A behaviour review is a task before shipping. The table is one data row per signal and easy to correct.
- [Subtle signals on small silhouettes (Chihuahua, Yorkshire) may not be readable at phone size.] → The parts spec scales the hackles ridge, eye white and tongue with the head and body size. A visual check at 320 points for the smallest breeds is a task. If a subtle signal is still unreadable on a breed, the scene enlarges the Dog for that breed rather than dropping the signal.
- [The 0.45 s allowance is a guess, so the latency band distribution could shift.] → The constant has a unit test that pins the band boundaries for representative inputs. It is flagged for retuning once analytics reports round latencies.
- [A timed game is a barrier for some users.] → The timer never goes under 1.0 s and eases after misses. A screen reader pins it at 2.4 s. Misses never cost points or block onboarding: a poor round just yields the slow band, which already adapts the plan.
- [Swipes can conflict with screen scrolling or system back gestures.] → The scene is not inside a scroll view while a round runs. Swipes are taken only on the scene area, inset from the screen edges. The buttons always work.
- [Adaptive timers cap answer times at higher levels (1.0 s at level 5), which pulls strong players' latency down.] → The funnel's recorded round always starts at level 0 with no carry, and each right answer is clamped. The shift is small and in the direction of the quick band they already earn.
- [Screen reader users' latency includes speech time.] → Same as the old reflex test; the 6 s timer makes the round playable. Revisit with analytics.
- [Removing `DiagnosticView` and `DiagnosticScene` changes the funnel's first minigame for users at that step mid-update.] → They see the new round on resume. The step id `diagnostic` and the record schema are unchanged.

## Migration Plan

There is no data migration: the `diagnostic` step id, `onboarding.diagnosticLatency` and `recordDiagnostic`'s exactly-once rule are kept.

Ship in one release:
1. Engine.
2. Art.
3. View.
4. Swap in `App.tsx`.
5. Delete `DiagnosticView`, `DiagnosticScene`, `PawRow` if unused, `diagnosticPosture` and the `diagnostic.*` keys. Keep `DIAGNOSTIC.timeout`, which `median` and `READ_THE_DOG` use.

To roll back, revert the `App.tsx` swap commit. The old engine in `diagnostic.ts` (`newDiagnostic`/`stepDiagnostic`) is deleted only in the last task, so a rollback before that point is a one-line change.

## Open Questions

- Should Read the Dog also replace some World 1 static choose-the-action Minigames (for example the Basics scenes)? We will decide after the `add-product-analytics` baseline shows how World 1 performs. This does not change this change's specs or tasks, because the engine is already independent of the onboarding step.
- The final value of the decision allowance (0.45 s), the timer ladder, the screen-reader timer (6 s), the pauses and the score constants. Tune them after play-testing. They are constants, not behaviour.

## Grilling decisions

Questions raised when this change was stress-tested against `GLOSSARY.md`, the ADRs, the related main specs and the code. Each was settled with the default answer.

| # | Question | Decision taken | Why |
|---|---|---|---|
| 1 | Does the name "Read the Dog" clash with the World 1 `readDog` engine? | Keep "Read the Dog" for this game only, with code in `readTheDog*`; call the World 1 engine the action Minigame. | The renaming is cheap now and the two engines share no code (Decision 1). |
| 2 | Calm / Alert overlap the Reaction Tier (Calm, Alert, Reactive). Is a class a tier? | No. It is a new term, Signal Class (the reading of a pose). Code value `about_to_react`. | The tiers are simulation state from Arousal. The classes are what the user reads. The shared labels teach the tiers on purpose. |
| 3 | Is a signal a new concept or a Canine Posture? | In the domain it is a Canine Posture with one Signal Class. In code it is a separate `RtdSignal` type drawn by `BreedArt`. | This keeps the glossary single-sourced without touching the coat-only avatar. |
| 4 | The glossary avoids "Round" for Action beats. What do we call the parts? | "Round" is the 24 s game. Each item in it is a signal, never a beat or a round. | This avoids the overload with Action beat. |
| 5 | Feedback Message and Combo are defined "in a Stage". Do they apply here? | Yes. Read the Dog uses both. The glossary definitions are widened (proposed). The `stage-action-feedback` spec is unchanged. There is no Hint form and nothing goes in `seenHints`. | It reuses the tiers, sounds and haptics without touching Stage rules. |
| 6 | The Stage rule is big at Combo 3 (`BIG_COMBO`). Is that the same here? | No. Medium from Combo 3, big at every multiple of 5 (`bigEvery`). | Signals come every 1-2 s, so big at 3 would fire constantly. |
| 7 | The latency formula subtracts 0.45 from the median, so a round of only misses gives 1.05, not 1.5. | Subtract the allowance from each right answer and clamp. A miss counts 1.5. Then take the median. | It fixes the contradiction and keeps a miss equal to the old time-out. |
| 8 | The diagnostic card says "Your reaction time" next to the adjusted value. | Keep the value and the `PlanScreen` code. Reword only `plan.latency` (es, en). | This is the smallest truthful fix and is reversible. |
| 9 | Adaptive timers cap answer times and bias the latency. | Accept it. The funnel round starts at level 0 with no carry. Recorded as a risk. | The effect is small, and fixing it would complicate the formula. |
| 10 | Screen reader: 2.4 s is too short to hear a description and answer. | Level pinned at 0, a 6 s screen-reader timer (tunable), the line read after the answer. | It keeps the round playable. The engine stays the only timer source. |
| 11 | Screen reader latency includes speech time. | Measure as usual, flagged as a risk. | It matches the old reflex test, and the slow band only adds a Poste Stretch. |
| 12 | A 0.35 s pause is too short to read a correction line. | 0.35 s after a right answer, 1.2 s after a wrong or missed one (both tunable). | The correction is the teaching moment. |
| 13 | Tier effects outlast the pause. Do bursts cover the next signal? | Bursts are drawn above the Dog, and a new burst replaces the old one. | The Dog must stay readable. |
| 14 | Swipes need a gesture library the app does not have. | Use React Native's `PanResponder` with no new dependency, inset from the edges, buttons primary. | It avoids a native dependency and conflicts with System Back. |
| 15 | Where does a replay's seed come from? | `replaySeed(seed, n)` derives it from the seed passed in. | The view stays free of randomness and tests stay reproducible. |
| 16 | Do level-change streaks reset after a change? | Yes. Both streaks reset on every level change. | Otherwise one long run would jump several levels at once. |
| 17 | "Points grow with timer left and Combo" cannot be tested as stated. | A concrete tunable formula in the design. The spec pins only the orderings. | It gives tests numbers without freezing the balance. |
| 18 | "First timer is 2.4 s" contradicts replays and the screen reader. | Scoped to a round with no carried level and no screen reader. | It removes the contradiction. |
| 19 | "Round ends outside the Diagnostic" cannot be tested, because there is no entry point outside the funnel. | Reworded: the round never reads or writes Learning Attributes. Only `recordDiagnostic` does. | This is testable at engine level. A standalone entry stays a non-goal. |
| 20 | What happens with System Back mid-round or on the result? | The step keeps its current back behaviour. The round is discarded and nothing is recorded, as when the app is closed. | It is the conservative choice and the same as app close. |
| 21 | Progress reset? | The fresh record has no latency. The round plays again and seeds once. A test is added. | Existing reset behaviour, made explicit. |
| 22 | `median` depends on `DIAGNOSTIC.timeout`, which task 6.4 would remove. | Keep `DIAGNOSTIC.timeout` as the only miss value. `missSeconds` refers to it. | One source for 1.5 s. |
| 23 | The `App.test.tsx` mocked-view list and the shared `minigame.dog.*` keys. | Update the list. Delete keys only if no longer used. | Avoids a broken suite and lost keys. |
| 24 | The wag is an endless animation. | Add an allowlist entry, still under reduced motion. | The allowlist test would fail otherwise. |
| 25 | The spec says hackles show in every coat, but the tests used one coat. | Render tests sweep every coat for hackles up. | The spec and the tests must agree. |
| 26 | When does the behaviour review happen? | It stays a pre-ship gate before release, not before engine work. | The table is data, so a late correction is cheap. |
| 27 | The proposal still says "Phaser or shell" and "maybe reuse `readDog`". | Updated to a shell screen and a new engine. | Brings the proposal in line with the design. |
| 28 | "Instant replay"? | One tap to play again, not a recorded playback. | Value in seconds (Decision 7). |
| 29 | Does the Diagnostic get longer (15 s to 24 s plus a result card)? | Accept it. Continue is available as soon as the result shows. | It is still under 30 s, and the result is the teaching payoff. |
| 30 | Analytics? | Stays a soft dependency. The result object is already anonymous. | `add-product-analytics` has not landed. |
| 31 | "Signal" clashes with the glossary's Cue ("a signal the Handler gives the Dog") and Marker. | The glossary term is Body Signal. In Read the Dog text, "signal" always means a Body Signal shown by the Dog. | Separates the Dog's body language from the Handler's Cues. |
