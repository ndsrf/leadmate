# Design

## Context
Active simulations in LeadMate run in an embedded Phaser bundle inside a WebView (`SimView`), overlaid with React Native UI components (`Overlays.tsx`). Currently, the only mechanism to pause an active simulation is via the hardware/system back button on Android. There is no visible on-screen back button during simulation, rendering the Pause Menu inaccessible on iOS and web.

Furthermore, when the Pause Menu (`ResumeOverlay`) is presented, its "Exit" action previously invoked `goHome()`, resetting the current flow and abandoning the simulation to the World Map without progress or debrief. For users who need or wish to bypass the simulation portion of a Node, first stage, or Daily walk, there is currently no way to skip ahead without playing the entire scenario to completion.

## Goals / Non-Goals

**Goals:**
- Provide a clean, accessible on-screen Back button (`SimulatorBackButton`) within the React Native shell overlay during active simulations (Stage, Close Exercise Stage, and Daily walk).
- Ensure tapping the on-screen back button pauses the simulation and opens the Pause Menu, matching Android system back behavior.
- Support skipping the simulation when the secondary button (`pause.skip`, «Saltar simulación») is selected in the Pause Menu:
  - Advance trail nodes (Stage and Close Exercise Stage) and first-stage onboarding to their Debrief screens with baseline completion credit (1 star), while leaving the Dog's persistent Learning Attributes untouched.
  - Advance the Daily walk to `DailyResultScreen` with a completed daily record.
  - Advance the onboarding taste to `PayoffOverlay`.
  - Mark warm-up as completed and return to the World Map.
- Provide a robust baseline debrief payload factory for skipped simulations so downstream scoring, exercises, and telemetry remain valid and free of runtime errors.

**Non-Goals:**
- Implementing custom in-canvas pause or back UI inside Phaser scenes (all controls remain in the React Native overlay layer for consistent styling and accessibility).
- Adding complex score customization for skipped stages; skipping always awards valid baseline completion (1 star).
- Altering static minigames (Doorbell Mat, Read Dog, Barkdoku), which already manage their own navigation.

## Decisions

### 1. On-Screen Back Button as a Shell Overlay Component
- **Decision**: Create a `SimulatorBackButton` component in `src/shell/Overlays.tsx` rendered by `App.tsx` whenever `playingStage && bundle === 'ready' && !paused && !tastePayoff`.
- **Placement**: Top-left corner positioned using safe area insets to avoid device notches and status bars.
- **Styling**: Uses the game design system tokens (palette surface background, ink edge, subtle drop depth, and back chevron icon), maintaining touch targets ≥ 44×44 pt.
- **Alternatives considered**:
  - *Drawing the button inside Phaser HUD*: Rejected because it would require duplicate implementations for `StageScene` and `CloseExerciseScene`, break responsive safe area handling across devices, and bypass React Native accessibility APIs.

### 2. Synthesized Baseline Debrief Payload on Skip
- **Decision**: Introduce a `skippedSimulationPayload(seed: number, mode?: string)` factory function in `src/sim/payload.ts` that returns a well-formed `SimulationDebriefPayload` with:
  - `durationSeconds: 30`, `slackPercentage: 100`, `tautPercentage: 0`, `pullPercentage: 0`
  - `markerHits: 0`, `markerAccuracyMs: undefined`
  - `handlingScore: 500` (below the 650 threshold for 2 stars, ensuring a fair 1-star completion)
  - zeroed encounter and distraction metrics
- **Rationale**: Downstream systems (`onDebrief`, `metricScores`, `starsFor`, `completeDaily`, `celebrationsFor`) strictly require a typed `SimulationDebriefPayload`. Synthesizing a consistent baseline prevents undefined errors and gives clean 1-star progress without modifying the Dog's Learning Attributes.

### 3. Unified Skip Dispatch in `App.tsx`
- **Decision**: In `App.tsx`, update the secondary button of the Pause Menu (`ResumeOverlay`) to use the label `t('pause.skip')` («Saltar simulación») and dispatch the appropriate skip action based on active `route` and `flow`:
  - `route.name === 'flow' && f.name === 'node'`: synthesizes payload, triggers `account.countStage()`, calls `act({ type: 'finish', result: { kind, payload } })`, unpauses.
  - `route.name === 'first-stage'`: synthesizes payload, advances `introRun` to debrief with `{ kind: 'stage', payload }`, unpauses.
  - `route.name === 'flow' && f.name === 'daily'`: synthesizes payload, computes `completeDaily()`, updates record, sets flow result, unpauses.
  - `route.name === 'flow' && f.name === 'warmup'`: marks warmup completed, unpauses, returns to map.
  - `route.name === 'taste'`: calls `showTastePayoff()`, unpauses.
- **Alternatives considered**:
  - *Keeping the label as «Salir»*: Confusing to users who expect to be returned to the World Map rather than advancing to Debrief.
  - *Adding an intermediate confirmation modal*: Rejected as the Pause Menu itself is already a two-step confirmation.

### 4. Architecture Decision Record (ADR 0021) and Glossary
- **Decision**: Formalize this behavioral change in `docs/adr/0021-pause-menu-skip-simulation.md` and sharpen the **Pause Menu** entry in `GLOSSARY.md`.

## Risks / Trade-offs

- **[Risk]** Downstream debrief calculations crashing on unusual zero values in the skip payload.
  → **Mitigation**: Reuse established payload defaults verified by `testPayload.ts` and test with `metricScores` and `onDebrief`.
- **[Risk]** Accidental double-taps on the back button or exit button causing race conditions.
  → **Mitigation**: Once skip is triggered, `paused` is cleared and the flow state immediately transitions to Debrief/Result, unmounting `ResumeOverlay`.
- **[Risk]** Visual collision between the on-screen back button and coach marks or hints.
  → **Mitigation**: Back button is pinned to top-left safe area, while `HintOverlay` and coach marks occupy center-top and lower thumb zones.
