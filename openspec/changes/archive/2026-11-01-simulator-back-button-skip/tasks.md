# Tasks

## 1. Baseline Debrief Payload Helper & Localization

- [x] 1.1 Implement `skippedSimulationPayload(seed: number, mode?: string): SimulationDebriefPayload` in `src/sim/payload.ts` and verify unit tests in `src/sim/payload.test.ts` pass with valid baseline metrics (1-star score, 100% slack, 0% pull).
- [x] 1.2 Add `pause.skip` («Saltar simulación») to the Spanish localization catalog in `src/i18n/es.ts` and verify `npm test -- src/i18n/` passes.

## 2. On-Screen Back Button Component

- [x] 2.1 Create `SimulatorBackButton` component in `src/shell/Overlays.tsx` with safe-area positioning, 44×44 pt minimum touch target, theme styling, and accessibility labels, and verify with unit tests in `src/shell/ui/appearance.test.tsx`.
- [x] 2.2 Render `SimulatorBackButton` in `App.tsx` during active simulations (`playingStage && bundle === 'ready' && !paused && !tastePayoff`), wiring its `onPress` to pause the simulator and present the Pause Menu.

## 3. Skip Simulation on Pause Exit

- [x] 3.1 Update `ResumeOverlay` in `src/shell/Overlays.tsx` to display `t('pause.skip')` on its secondary action button.
- [x] 3.2 Update `ResumeOverlay` `onExit` in `App.tsx` for trail Node runs (Stage and Close Exercise) to synthesize baseline completion payload and advance to `DebriefScreen` while preserving Learning Attributes, verified in `src/App.test.tsx`.
- [x] 3.3 Update `ResumeOverlay` `onExit` in `App.tsx` for first-stage onboarding to advance to first-stage Debrief with baseline completion credit, verified in `src/App.test.tsx`.
- [x] 3.4 Update `ResumeOverlay` `onExit` in `App.tsx` for Daily walk to complete the walk and advance to `DailyResultScreen`, verified in `src/App.test.tsx`.
- [x] 3.5 Update `ResumeOverlay` `onExit` in `App.tsx` for warm-up and onboarding taste to complete/advance properly, verified in `src/App.test.tsx`.

## 4. Verification & Conformance

- [x] 4.1 Run full Jest test suite (`npm test`) covering `App.test.tsx`, `navigation.test.ts`, `appearance.test.tsx`, and `payload.test.ts`.
- [x] 4.2 Run typecheck (`npm run typecheck`) to verify strict TypeScript adherence across both React Native shell and bundle.
