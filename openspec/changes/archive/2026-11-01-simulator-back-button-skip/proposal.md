# Proposal

## Why
Currently, the simulator has no on-screen back button, preventing iOS and web players from accessing the pause menu without hardware buttons. Furthermore, selecting Exit in the pause menu abandons the simulation and returns to the World Map without saving progress or allowing the user to proceed, forcing players to replay simulations in full even if they wish to skip them.

## What Changes
- Add an on-screen back/pause button to the simulator shell overlay (positioned in the top-left corner within the safe area) across active Stage, Close Exercise, and Daily walk simulations.
- Ensure tapping the on-screen back button triggers the existing pause flow and presents the pause popup (`ResumeOverlay`), matching hardware back behavior.
- Update the "Exit" action in the pause popup (`ResumeOverlay`) to skip the running simulation instead of abandoning to the map:
  - For trail nodes (Stage or Close Exercise): transition directly to the Debrief screen with completion credit (minimum baseline telemetry payload) so the player can unlock progress.
  - For the first-stage onboarding: skip directly to the first-stage Debrief screen with completion credit.
  - For the Daily walk: skip directly to the Daily Results screen with a completed walk record.
  - For the onboarding taste: advance to the taste payoff screen as before.
  - For the warm-up: complete the warm-up and return to the map.
- Resume continues normal simulation execution without skipping.

### Out of Scope
- Adding a skip button inside the Phaser canvas itself (the button lives in the React Native shell overlay layer).
- Custom score input or arbitrary star assignment for skipped stages (skipping awards standard completion with baseline 1-star credit).
- Modifying static minigames (Doorbell Mat, Read Dog, Barkdoku) that already have explicit exit/done buttons.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `stage-flow`: Update back action requirements to include an on-screen back button in the simulator overlay in addition to system back, and specify that selecting Exit from the pause menu skips the simulation directly to its results/debrief screen with completion credit.

## Impact
- **Code**: `App.tsx`, `src/shell/Overlays.tsx`, `src/shell/navigation.ts`, and corresponding test suites (`App.test.tsx`, `src/shell/navigation.test.ts`, `src/shell/ui/appearance.test.tsx`).
- **Dependencies & APIs**: No external dependencies or API changes.
- **State**: Debrief handlers receive a synthesized baseline payload upon skip to ensure valid completion and persistence.
