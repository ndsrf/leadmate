# Tasks

## 1. Signal table and engine (pure, test-first)

- [x] 1.1 In `src/shell/nodes/readTheDog.test.ts` write failing tests for the signal table: nine signals, classes and subtle flags exactly as in design Decision 2, every class has an obvious signal; then add `RtdSignal`, `RtdClass` (`'calm' | 'alert' | 'about_to_react'`) and `SIGNALS` in `src/shell/nodes/readTheDog.ts` and verify `npx jest readTheDog` passes
- [x] 1.2 Test then implement `READ_THE_DOG` constants (design Decision 3, with `missSeconds` taken from `DIAGNOSTIC.timeout`) and `timerFor(level, opts)`: level 0 is 2.4 s, levels never under 1.0 s, timers strictly decrease with level, the screen-reader option gives `screenReaderTimer` (6 s) at every level; verify the tests pass
- [x] 1.3 Test then implement `newRound(seed, carry?)` and the time/phase part of `stepRound`: round ends at 24 s, a pause of `pauseSeconds` after a right answer and `wrongPauseSeconds` after a wrong or missed one ignores answers, an unanswered signal at round end counts as neither right nor missed, a timed-out signal counts as missed; verify the tests pass
- [x] 1.4 Test then implement answering: a right class closes the signal as right, a wrong class as wrong with no retry, a second answer on a closed signal is ignored, `last` event `seq` rises once per event; verify the tests pass
- [x] 1.5 Test then implement Combo and score with the design Decision 3 formula: streak counter, `bestCombo` kept after a break, points grow with timer left and Combo, wrong/missed never subtract; verify the tests pass
- [x] 1.6 Test then implement the adaptive level: up after 3 right in a row, down after 2 wrong/missed in a row, both streaks reset on every level change (4 right from level 0 is level 1), clamped to the ladder, subtle signals only from `subtleFromLevel`, `fixedLevel` option pins the level; verify the tests pass
- [ ] 1.7 Test then implement the seeded weighted draw: never the same signal twice in a row, missed/wrong raises a signal's weight (capped), right lowers it to no less than base, a weak signal appears more often over a long run with the same seed, no `Math.random` (grep check in the test file or lint); verify the tests pass
- [ ] 1.8 Test then implement determinism: two runs with the same seed, carry and timed answers produce identical signal sequences and `roundResult`; verify the test passes
- [ ] 1.9 Test then implement `roundLatency`: median of per-answer values, where each right answer is its time minus `decisionAllowance` clamped to 0-1.5 and each miss is 1.5; wrong answers and the signal open at the end excluded; all-missed, only-wrong and empty rounds give 1.5; add a test pinning representative rounds to the quick, steady and slow bands of `latency.ts`; verify the tests pass
- [ ] 1.10 Test then implement `roundResult(state)` (score, best Combo, per-class right/wrong/missed, end level, latency, seconds; serialisable, no names or free text) and `carryOf(state)` (level and weights for a replay) and `replaySeed(seed, n)` (deterministic, differs per n); verify the tests pass and that the engine never touches a Dog record

## 2. Feedback and input helpers (pure, test-first)

- [ ] 2.1 Test then implement `rtdFeedback(event, combo, signal)` in `readTheDog.ts`: small for right, medium for right on a subtle signal or Combo of 3 or more, big at every multiple of `bigEvery` (5, 10, ...) and not at Combo 3 (unlike the Stage `BIG_COMBO`), wrong for wrong and missed, `textKey` is `readTheDog.signal.<signal>`; verify the tests pass
- [ ] 2.2 Test then implement `swipeClass(dx, dy)`: left Calm, up Alert, right About to react, under 40 points or downwards is no answer, dominant axis decides; verify the tests pass

## 3. Body-language art on the breed Dog

- [x] 3.1 Test then implement the pure parts spec `src/shell/ui/rtdArt.ts` (body, ears, eyes, mouth, tail, hackles per signal); test that every pair of signals differs in at least one part and that `looking` still maps to the old Diagnostic look; verify `npx jest rtdArt` passes
- [x] 3.2 Extend `BreedArt` with an optional `signal` prop driving the parts (ear pin and perk per ear kind, whale-eye crescent, tongue flick, tight mouth, low/loose/stiff tail, play-bow body transform, hackles ridge from `geometryOf`), keeping `looking` working; verify existing `BreedArt`/`breedShapes` tests still pass, a new render test draws every breed for every signal without throwing, and a coat sweep draws hackles up in every coat with the ridge present
- [x] 3.3 Gate the loose-wag motion behind `useMotion().reduced` with a still curved tail as the alternative; add the wag to `endlessAnimations.allowlist.ts`; verify with a render test under reduced motion that no animated value is created and the endless-animation allowlist test passes
- [ ] 3.4 Visual check at 320 points wide of the smallest breeds (Chihuahua, Yorkshire) and one large breed for every signal, in light and in a dark-coat palette; enlarge the scene Dog for a breed where a subtle part is unreadable; record screenshots in the PR

## 4. Catalog text

- [ ] 4.1 Add `readTheDog.*` keys to `src/i18n/es.ts` and `src/i18n/en.ts`: help, start, the three answer labels and accessibility hints, timer text, Combo, score, one signal line per signal with `{name}`, one body description per signal (`readTheDog.describe.<signal>`) that never names the class, result title, share right, signals to watch, replay, continue; reword `plan.latency` in both languages to the reaction time once the signal was spotted (design Decision 8); verify the catalog completeness/parity tests pass
- [ ] 4.2 Pre-ship gate (does not block sections 1-6; must be done before the release containing 6.2): canine-behaviour review of the signal table and every signal line and description, in both languages (soft, non-shaming wording, correct reading of each signal); fold any table or text correction back into 1.1 and 4.1; record the reviewer's sign-off in the PR

## 5. Shell scene and screen

- [ ] 5.1 Add `ReadTheDogScene` in `src/shell/ui/MinigameProps.tsx` (meadow, `BreedArt` with `signal`, caption only after answer or miss, a band above the Dog for Feedback Messages, side margins from the screen edges) and a timer bar with a text alternative; verify a render test shows no caption before an answer and the caption after
- [ ] 5.2 Add a shell `FeedbackBurst` drawing the four tiers with `TIER_SECONDS` and the `effectsPool` easing helpers, with fades only under reduced motion, icon plus words for right and wrong, no shake and no red flash, a new burst replacing the one still showing; verify render tests for each tier with and without reduced motion
- [ ] 5.3 Build `src/shell/screens/ReadTheDogView.tsx` on `useTicker` and a ref-held `RoundState`: start button, three `MinigameButton`s, swipe pan on the scene via React Native `PanResponder` and `swipeClass` (no new dependency), Combo counter, score, `feedback.stage(...)` on every event, `withDogName` for the line, screen-reader announcement of `readTheDog.describe.<signal>` per signal and of the line after each answer, and `fixedLevel: 0` with `screenReaderTimer` while a screen reader is on (`AccessibilityInfo` and its change event); verify a component test with fake timers that a tap answer, a swipe answer and a timeout each produce one event and one `feedback.stage` call, and that with a screen reader on the timer is 6 s
- [ ] 5.4 Add the result card to the view (score, best Combo, share right, named signals to watch, replay, Continue) and instant replay with `newRound(replaySeed(seed, n), carryOf(prev))` and no start screen; verify a component test that replay starts a round at once at the carried level and that the result callback fires exactly once per round
- [ ] 5.5 Verify layout at 320 by 640 points with large text: Dog, timer, Combo, score and buttons all visible and no clipping, buttons at least 44 points; record a screenshot in the PR

## 6. Onboarding Diagnostic swap

- [ ] 6.1 Give `ReadTheDogView` an `onFinish(latency)` that is called once, on Continue, with the first finished round's latency; verify a component test that a faster replay before Continue still reports the first round's latency
- [ ] 6.2 Mount `ReadTheDogView` for the `diagnostic` step in `App.tsx` in place of `DiagnosticView`, still calling `recordDiagnostic`, and its first round with no carry; replace `DiagnosticView` with `ReadTheDogView` in the `src/App.test.tsx` mocked-view list; verify `src/App.test.tsx` funnel tests reach the diagnostic card and plan, the latency is recorded and seeds `reconnectionLatency` once, a record that already has a latency is unchanged, and after a progress reset the funnel plays the round again and seeds once
- [ ] 6.3 Verify resume and leaving: a funnel test that closes the app mid-round, one that closes it on the result before Continue, and one that leaves with System Back (keeping the step's current back behaviour) each restore the `diagnostic` step with no latency recorded and start a fresh round
- [ ] 6.4 Remove the old reflex test: `DiagnosticView.tsx`, `DiagnosticScene`, `PawRow` (if unused), `diagnosticPosture`, `newDiagnostic`/`stepDiagnostic`/`pawsFilled`/`DIAGNOSTIC_PAWS` and the `diagnostic.*` catalog keys (plus any `minigame.dog.*` key left unused), keeping `recordDiagnostic`, `seedFromLatency`, `median`, `DIAGNOSTIC.timeout` and the latency bands; verify `npx tsc --noEmit`, lint and the full test suite pass

## 7. Integration checks

- [ ] 7.1 Run the app (Expo web or device) through the funnel to the Diagnostic: play a round in Spanish and in English, check feedback sounds and haptics follow the Settings toggles, check reduced motion, play one round with TalkBack or VoiceOver on, check a swipe from near the screen edge does not trigger the back gesture, replay once, Continue to the diagnostic card (reworded label) and plan; note the results in the PR
- [ ] 7.2 Verify `openspec validate add-read-the-dog-game --strict` passes and every scenario in the three delta specs is covered by a test above or by the manual check in 7.1

## Workflow follow-up

- When `add-product-analytics` lands, log `roundResult` from the view's per-round result callback (tracked in that change, not here).
- Revisit the open question on replacing World 1 choose-the-action Minigames after the analytics baseline.
- Retune `decisionAllowance`, the timer ladder, `screenReaderTimer`, the pauses and score constants from play-testing and the analytics round latencies.
- Glossary entries (Read the Dog, Body Signal, Signal Class, widened Feedback Message, Combo, Diagnostic, Minigame) and ADR 0032 are written outside this change.
- Archive the change after review and sync the delta specs.
