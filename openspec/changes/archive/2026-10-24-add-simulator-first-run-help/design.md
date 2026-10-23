# Design

## Context

Hints today: the bundle emits one-shot `stage-signal`s (`first-taut`, `first-fixation`, `leash-limit`, `first-input`); `App.tsx` maps them with `hintFor`, shows a `HintOverlay` text panel for 7 s and records the id in `seenHints` (`src/shell/onboarding/hints.ts`). The taste Stage shows a fixed text line until `first-input` and records nothing. The joystick and Marker are drawn by the bundle HUD at positions from the pure `hudLayout(width, height, cues)` (`src/hud/layout.ts`). The sim emits events to the bundle; it never touches storage.

## Goals / Non-Goals

**Goals:**
- Drawn pointers placed exactly on the real controls, and a named warning when a dog approaches.
- Reuse the existing signal -> `seenHints` -> overlay path.

**Non-Goals:**
- A full interactive tutorial or blocking steps.
- Warnings for non-dog Distractors, or new languages (only `es.ts` exists).
- Changing sim behaviour (Arousal, Distractor motion).

## Decisions

1. **Shell overlays, positioned with `hudLayout`.** The guide is a shell React Native overlay (pointer-events none) that calls `hudLayout` with the Stage view size. Alternative: draw it in the Phaser HUD. Rejected: text and i18n, the Dog's name and `seenHints` already live in the shell; the layout function is pure so both sides agree. Assumption to verify in apply: the Stage view fills the window; if not, the bundle sends its HUD size once at `ready`.
2. **Coach mark state is local to the shell**, not a signal. Two marks (`move`, `mark`) each show from Stage start while unseen, and hide when their control is used (movement input / Marker press; `first-input` is too coarse, so the bundle also reports which control was used), on pause, and after a timeout (Marker: 20 s). Coach marks are a new term (GLOSSARY), distinct from Hints.
3. **New `dog-approaching` sim event and Stage signal.** Emitted once per Stage when an active `dog` Distractor first gets within `triggerRadius * APPROACH_FACTOR` (about 2x) of the Dog. Alternative: warn at spawn; rejected because spawn can be far off screen. The signal carries `time` as the others do; the pointer side is computed by the bundle and sent as an extra `bearing` field (angle of the dog relative to the screen) so the shell can place an arrow at the screen edge.
4. **Hint id `dog-approaching`** is added to `HINT_IDS` and mapped from the signal in `HINT_FOR_SIGNAL`. Coach marks use ids `coach-move` and `coach-mark` in `seenHints`. The taste records no Hint, but it does record `coach-move`/`coach-mark` when the user uses that control there (a deliberate exception to "the taste records nothing", mirrored in the onboarding-funnel delta), so the first guided Stage re-shows only a mark for a control the user never used. The approaching-dog warning is shown in the taste but is not recorded, so it shows once more in the first guided Stage.
   - The warning only warns; it does not alter the scenario. The taste's Distractor is already `kind: 'dog'`.
5. **Dog name** via the existing `withDogName` with the neutral fallback; keys `coach.controls.move`, `coach.controls.mark`, `coach.dog.warning` with a `{name}` placeholder. `onboarding.taste.control` and `TASTE_LINE_KEY` are removed.
6. **Drawing** with react-native-svg if already a dependency (check), else Views with rotated chevrons; light ink outline and the HUD tokens, no raw colors (`noRawColors` test).

## Risks / Trade-offs

- [Overlay misaligned with controls on odd screen sizes] -> compute from `hudLayout` and test with several sizes; fall back to the bundle-sent HUD size.
- [Warning fires in a Stage where the dog never approaches closely] -> the signal fires only within the approach range.
- [Obscures play] -> pointer-events none, small, auto-dismiss, hidden on input.
- [Warning seen twice in onboarding] -> accepted (decision 4); Coach marks are not repeated.
