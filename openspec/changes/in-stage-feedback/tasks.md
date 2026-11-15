# Tasks

## 1. Simulation: grades, Late Marker press and meters

- [x] 1.1 Track `lookStartedAt`, add `grade` to `marker-hit` and `check-in-hit`, emit `marker-late` within 1.0 s after a window closed, and count `markGrades` in telemetry; verify with new `sim.test.ts` / `feedback.test.ts` cases for Perfect (≤0.3 s), Good, Late and still-wasted presses.
- [x] 1.2 Add `meters` to `ScenarioConfig`, add Meter Points on matching events capped at the target, and reject bad meters in `validateScenario`; verify with unit tests for filling, the cap, determinism with the same seed, and each validation error.
- [x] 1.3 Add `markGrades` and `meters` to `SimulationDebriefPayload`, and compute `handlingScore` from meters when declared; verify with `payload.test.ts` (1000 when full, 750 for full + half, unchanged score and no `meters` without them) and that the Daily Stage tests still pass.
- [x] 1.4 Check that the `GLOSSARY.md` entries already added for Feedback Message, Hint, Combo, Stage Meter, Meter Points, Mark, Marker timing grade and Late Marker press still match the specs as built; verify by reading them against the final code names.

## 2. Feedback decision module

- [x] 2.1 Write `src/hud/feedback.ts`: map events to kinds and tiers (design Decision 2), choose the Hint or the short form from the seen kinds, route the existing event Hints through the same slot at top priority, drop wrong kinds in the Taste Stage, and apply priority, drop-not-queue, 4 s Combos and the 8 s Rigid Pull limit; verify with `src/hud/feedback.test.ts` covering each scenario in the `stage-action-feedback` spec.
- [x] 2.2 Add `feedback.*` i18n keys in Spanish and English for every kind (full and short, with what to try for wrong kinds) and the Combo format; verify with the i18n catalog test that both languages have every key.

## 3. Drawing the effects

- [x] 3.1 Draw the icons and burst shapes in the LeadMate Design System canvas, export them and add them to the HUD atlas; verify every icon in the spec is present. _(Drawn as SVG by `scripts/art/hud/gen.mjs`, packed by `npm run art:hud` into `bundle/assets/hud/`; presence checked by `bundle/src/artAtlases.test.ts`; contact sheet in `art/`. The canvas artboard "FeedbackIcons" is left to the coordinator.)_
- [ ] 3.2 In `StageScene`, replace the flash ring with pooled message, particle (max 40) and banner objects for the four tiers, plus reduced-motion fades; verify on device that each tier plays, that no shake or red flash appears for wrong actions, and that controls are never covered.
- [ ] 3.3 Draw Stage Meters (only when declared) with Meter Points flying from the Dog into them and a full state; verify with a test scenario that declares two meters, on web and Android.
- [ ] 3.4 Stop effect updates when nothing is active; verify with the HUD dirty tests and the energy readout that a quiet walk does no effect work.

## 4. Shell: sounds, haptics and seen kinds

- [ ] 4.1 Add the `feedback` bundle message to `messages.ts` (types and decoder); verify with `messages.test.ts`.
- [ ] 4.2 Add `tick`, `chime`, `fanfare` and `bonk` SFX (licence recorded next to the files), preload players at Stage start, raise the tick's pitch with the Combo, and lower feedback volume to 35% while `cueAudioActive()`; verify with feedback-service unit tests and by ear on device during a Cue.
- [ ] 4.3 Play the light-tick or soft-thud haptic per polarity, respecting the haptics setting; verify on Android.
- [ ] 4.4 Record `feedback:<kind>` in `seenHints` on first Hint in recorded Stages only, cleared by Reset progress; verify with `dogRecord`/hints tests.

## 5. Integration checks

- [ ] 5.1 Run a seeded Stage with and without feedback and assert identical payloads; verify in CI.
- [ ] 5.2 Run the `power-efficiency` scenario regression check and confirm no web audio context in the bundle; verify the results stay within budget.
- [ ] 5.3 Play the Taste Stage and confirm no wrong Feedback Message and no new `seenHints` entry; play the guided first Stage and confirm its event Hints still show once each and never stack with a Feedback Message.
- [ ] 5.4 Playtest a World 3, a World 5 and a Daily Stage on a phone; confirm every listed action shows its message and none is missed or stacked, and note tuning changes in design.md.
