# Design

## Context

- The simulation (`src/sim/sim.ts`) already emits a `SimEvent` for most handled actions: `marker-hit` (with `accuracyMs`), `marker-miss`, `marker-reactive`, `marker-wasted`, `check-in-hit`, `missed-opportunity`, `dog-follow`, `disengagement`, `poste-stop` (`abrupt`), `cue-mismatch`, `tension-change`, `sintonia-start`, `go-sniff-start`, `go-sniff-end` (`reason`).
- The Stage bundle (Phaser, `bundle/src/StageScene.ts`) consumes those events and today only draws a 0.5 s coloured ring (`this.flash`). It sends the shell a few messages (`stage-signal`, `playCue`, `reaction-tier-change`) through `src/sim/messages.ts`.
- All Stage sound plays in the shell (power-efficiency: no audio engine in the bundle). UI sounds go through `src/shell/ui/feedback.ts` and `feedbackBackends.ts`, which create one `expo-audio` player per sound and skip UI sounds while `cueAudioActive()`.
- One-time hints are recorded in `DogRecord.seenHints` via the shell's hint helpers; Coach marks already use this from Stage signals.
- The handling score is `handlingScore()` in `src/sim/payload.ts` (ADR 0005), and stars come from `src/shell/stars.ts`.
- Scenario configs embedded in content are checked by `validateScenario` (`src/sim/scenery.ts`) from the content validator.

## Goals / Non-Goals

**Goals:**
- One table that maps simulation events to feedback kinds, so every Stage gets messages without per-Stage work.
- Meters as a generic, opt-in scenario feature that `rethink-unpredictable-walk-stage` can use for Nose and Connection.
- Keep the simulation pure and the Daily Stage score unchanged.

**Non-Goals:**
- Feedback in close leash exercises and Minigames.
- A Debrief replay timeline (planned with `rethink-unpredictable-walk-stage`).
- Changing star thresholds.

## Decisions

1. **Feedback is decided in the bundle and voiced in the shell.** A pure module `src/hud/feedback.ts` turns each tick's events (plus the Dog record's seen kinds, passed in at `start`) into at most one `FeedbackMessage {kind, tier, polarity, text key, combo, meterPoints?, meter?}`. It applies priority, Combos and rate limits. `StageScene` draws the effect, and a new bundle message `{ type: 'feedback', kind, tier, polarity, combo }` tells the shell to play the sound and haptic and to record a newly seen kind. *Why:* drawing must stay frame-synced in Phaser; sound must stay in the shell; a pure module is unit-testable against seeded event streams. *Alternative:* the shell decides everything from forwarded events. Rejected: the round trip adds latency to the visual, and the shell would duplicate the bundle's event handling.

2. **Event → kind table.** Right: `marker-hit` → mark (grade from the event), `check-in-hit` → check-in (grade), `dog-follow` → followed turn, `disengagement` → let go, `poste-stop` that ends in `posteSuccesses` → poste, `sintonia-start` → flow, `go-sniff-start` → sniff release. Wrong: `marker-miss` → missed window, new `marker-late` → late, `marker-reactive` → reactive mark, `marker-wasted` → nothing to mark, `missed-opportunity` → missed chance, `cue-mismatch` → wrong cue, `poste-stop` with `abrupt` → harsh stop, `tension-change` to rigid → pull, `go-sniff-end` with `tension` → sniff cut short. Tiers: Perfect grades, poste and let-go are medium; Combos of 3+ and full meters are big; the rest of the right actions are small.

3. **New simulation facts are added as events, not computed in the bundle.** The simulation records when the current look started (`lookStartedAt`), grades hits (`grade: 'perfect' | 'good'` on `marker-hit` and `check-in-hit`), and emits `marker-late` for a press within 1.0 s after a window closed. It keeps `markGrades` in telemetry. *Why:* grades and Late feed telemetry and meters, so they must be seeded and deterministic.

4. **Meters in the simulation config.** `ScenarioConfig.meters?: { id, labelKey, icon, target, meterPoints: Partial<Record<FeedbackActionKind, number>> }[]` (max 2). The simulation adds Meter Points when it pushes the matching event and caps at the target; `buildPayload` adds `meters` and, when meters exist, uses `round(1000 × mean(value/target))` for `handlingScore`. `validateScenario` rejects bad meters. *Why:* the score must come from the same seeded state as the rest of the payload. *Alternative:* compute meters in the shell from events. Rejected: replays, the Daily Stage and remote level configs all trust the payload.

5. **Message text.** Catalog keys `feedback.<kind>.full`, `feedback.<kind>.short`, `feedback.combo` ("{label} x{n}"), in `es` and `en`, with `{name}` and cue-word interpolation. The Hint (`.full`) is used when the kind is not in `seenHints` (key `feedback:<kind>`); the bundle sends `feedback` with `firstTime: true` and the shell records it only for recorded Stages, as with Coach marks.

6. **Effects drawn with pooled objects.** One reusable message container (text + icon), a fixed pool of 40 particle images, and one banner. Particles use simple tween curves; nothing is allocated per effect. The effect layer stops updating when nothing is active, consistent with "HUD redraws only on visible change". Reduced motion swaps tweens for alpha fades. Icons and burst shapes come from the LeadMate Design System canvas, packed into the HUD atlas.

7. **Sound in the shell.** Add the feedback SFX to `SOUNDS` (`tick`, `chime`, `fanfare`, `bonk`), preload one player per sound at Stage start instead of creating one per play, and play Combo ticks with a rate (pitch) that rises 1 semitone per step up to +7. While `cueAudioActive()` is true, play feedback at 35% volume instead of skipping it (the ui-feedback delta). SFX source: a CC0 pack (for example Kenney's interface sounds), licence recorded next to the files, or sounds made for the app.

8. **Event Hints use the same slot.** The bundle's existing event Hints (leash colours, Marker, Poste, leash Taut or Rigid Pull) are routed through `src/hud/feedback.ts` as the highest-priority kind, so they win over any Feedback Message on the same tick and suppress the Feedback Message for the same event. When they show and how `seenHints` records them is unchanged. The approaching-dog warning keeps its own pointer and placement.

9. **Taste Stage.** The `start` message tells the bundle when the Stage is the Taste Stage. The feedback module then drops every wrong kind and records no Hint as seen, which matches the existing rule that the Taste Stage records no `seenHints`.

10. **The flash ring is replaced** by the new effects, so a mark never shows two signals.

11. **Simulation details settled while building tasks 1.1–1.3** (`isf-sim`).
    - *Feedback action kind ids use GLOSSARY terms*, not the informal labels of Decision 2, which clash with it ("flow" is an _Avoid_ for Sintonía; a Mark is a budget unit, not a hit). The type `FeedbackActionKind` and the event → kind function `feedbackKindOf` live in `src/sim/feedbackKinds.ts`, so the simulation (meters) and `src/hud/feedback.ts` share one table; adding a kind is one line in `FEEDBACK_ACTION_KINDS` plus its event case. Mapping from Decision 2: mark → `marker-hit`, check-in → `check-in-hit`, followed turn → `followed-turn`, let go → `disengagement`, poste → `poste`, flow → `sintonia`, sniff release → `go-sniff`; missed window → `missed-reward-window`, late → `late-marker-press`, reactive mark → `reactive-marker`, nothing to mark → `wasted-marker`, missed chance → `missed-opportunity`, wrong cue → `wrong-cue`, harsh stop → `harsh-stop`, pull → `rigid-pull`, sniff cut short → `go-sniff-cut-short`.
    - *Poste is reported on the Disengagement*: `disengagement` carries `poste: true` when the Handler stood at the leash limit (the event that counts `posteSuccesses`), and maps to `poste` instead of `disengagement`. One event gives one kind.
    - *Look start*: `lookStartedAt` is set when a look begins while the Dog was not looking; a look after a followed turn always starts afresh (it is a new thing to mark). A glance or Cue during a look extends it without resetting the grade.
    - *Grades*: Perfect when the press is at most 300 ms (rounded to ms) after the window opened (`PERFECT_MARK_SECONDS`), Good later in the window.
    - *Late Marker press only after a window that closed unmarked*: a Reward Window that expired (after its `marker-miss`, on the same tick or later) or a look with no Check-in hit. A second press after a marked look stays wasted. Rules before it are unchanged, so a press with the Dog fixated, Reactive or in Rigid Pull stays a reactive press. `LATE_PRESS_SECONDS` = 1.0.
    - *Meter Points*: added at the end of the tick, in event order, for the events of that tick; each addition (capped at the target, skipped when nothing is added) is reported as a `meter-points` event with `meterId`, `kind`, `points`, `value` and `full`, so the bundle can fly the points and show the full state once. Meters use no random draws. Only right kinds may add Meter Points; `validateScenario` also rejects more than 2 meters, missing or repeated ids, a missing `labelKey` or `icon`, a target not above 0, unknown or wrong kinds, points not above 0 and a meter nothing fills. Icon names are not checked against the HUD catalog (the simulation cannot import `src/hud`).
    - *Payload*: `markGrades` is in every walking-Stage payload (optional in the type, since close exercises and skipped payloads have none); `meters` only when declared. For scenarios without meters the only payload change is the additive `markGrades`; `src/sim/payloadBaseline.test.ts` checks this against payloads captured before the change for every content Stage, the Taste Stage, the default scenario and three Daily Stages. A Late press changes no other payload field, because wasted presses had no payload count (only `marksUsed`, which both spend).

## Risks / Trade-offs

- [Message overload in busy Stages] → One message at a time, wrong-over-right priority, drop instead of queue, Combo merging, an 8 s rate limit for Rigid Pull; tune in playtests.
- [Feedback hides the Dog or controls] → Messages are placed above the Dog, kept clear of the HUD control zones from `layout.ts`, and the banner sits under the top safe area.
- [expo-audio latency or rate support differs by platform] → Preloaded players; if changing the rate is not supported on a platform, fall back to a fixed tick (the Combo count still shows).
- [Score change surprises players of existing Stages] → Only Stages that declare meters change their score; no existing scenario declares meters in this change.
- [Late Marker press changes `markerWasted` counts] → Telemetry consumers that only read hits are unaffected; `wasted` drops by the number of Late presses, which is intended.

## Migration Plan

Ship the app code first. Content needs no change, because no scenario declares meters yet. Rollback: revert the app release; payload fields are additive and older records ignore them.

## Open Questions

- Exact message wordings and SFX choices: settled during writing and playtests without changing specs.
- Particle counts and durations per tier within the spec limits: tuned on device.

## Art as built (task 3.1)
- HUD atlas `bundle/assets/hud/sprites.{png,json}` (Phaser JSON hash, untrimmed, pivot 0.5/0.5), made by `npm run art:hud` from `scripts/art/hud/gen.mjs`. Frames: `icon_paw`, `icon_eye`, `icon_heart`, `icon_nose`, `icon_hourglass`, `icon_sparkle`, `icon_star`, `icon_puff`, `icon_mark` (64×64, checked at 24–32 px), `burst_spark` (32×32 pooled particle), `burst_star` (128×128), `banner_frame` (512×96; keep 56 px at each end when stretching), `glow_edge` (128×128 frame, clear centre; slice 40 px per side, stretch to the screen), `meter_nose`, `meter_connection` (64×64 badges for the Stage Meter catalog).
- Wrong kinds use `icon_puff` (grey, never red). Colours come only from `tokens.json`; the render script fails on any other colour or any `<text>`.
- The Design System canvas boards "FeedbackIcons" and "DogPortrait" were not added by the worker (no canvas tool): contact sheets are under `art/` for the coordinator.
