# Tasks

## 1. World Structure & Home Concerns Relocation

- [x] 1.1 Rename `homeStretchesInWorldOne` to `homeStretchesInWorldTwo` in `src/shell/homeBehaviours.ts` and update signature and docstrings.
- [x] 1.2 Update `worldsFor` in `src/shell/world.ts` to place declared Home Stretches at the beginning of World 2 (`world.id === 'home'`) in Personal Plan order (biting first), leaving World 1 strictly with its 3 foundational stretches.
- [x] 1.3 Update `setHomeConcern` in `src/shell/dogRecord.ts` to gate on World 2 (`home`) completion rather than World 1.
- [x] 1.4 Move the "Other Home Behaviours" section in `src/shell/screens/WorldMapScreen.tsx` so it renders after World 2 (between World 2 and World 3).
- [x] 1.5 Update `src/shell/world.test.ts`, `src/shell/homeBehaviours.test.ts`, and `src/shell/dogRecord.test.ts` to assert World 1 completes in 3 stretches, World 2 contains home stretches ahead of threshold stretches, and late declaration rules hold.

## 2. Onboarding Method & Ecosystem Overview

- [x] 2.1 Add the `method` step to `ONBOARDING_STEPS` in `src/shell/onboarding/flow.ts` right after `plan` and update `flow.test.ts`.
- [x] 2.2 Create `src/shell/screens/MethodOverviewScreen.tsx` displaying the 3-step World trail loop (Theory → Simulator → Mission), Daily Walk, Barkdoku (Guaudoku), and the adaptive Personal Plan reassurance note.
- [x] 2.3 Integrate `MethodOverviewScreen` into the onboarding screen router in `src/shell/Overlays.tsx` and verify navigation with component tests.
- [x] 2.4 Add localized copy keys for the method overview, Barkdoku/Guaudoku description, Daily Walk description, and reassurance note to `src/i18n/es.ts`.

## 3. Biting Theory Enrichment (Prevention & Action)

- [x] 3.1 Update `src/i18n/es.home.ts` for `trail.theory-bite-owner` and `trail.theory-bite-others` to teach early warning detection (escalation ladder / yellow zone), safe environmental management, and the trade-up ("intercambio") protocol.
- [x] 3.2 Verify theory lesson catalog entries and lesson structure tests with `npm test -- -t "lesson"`.

## 5. Review Fixes

- [x] 5.1 Keep a started Home Stretch open when World 2 is still locked (`stopLock` in `world.ts`).
- [x] 5.2 Raise `RECORD_VERSION` to 10 and migrate a World 1 `worldHome` list (`moveHomeStretchesToWorldTwo` in `dogRecord.ts`).
- [x] 5.3 Order non-Home Stretches of World 2 by Personal Plan order.
- [x] 5.4 Method overview: name only Concerns scheduled in World 2, no name placeholder, system back returns to the plan; document `concern` and `method` among the funnel steps in `navigation.ts`.

## 4. Integration & Validation

- [x] 4.1 Run the full test suite (`npm test`) to verify clean passes across world progression, onboarding, and catalog usage.
- [x] 4.2 Validate the OpenSpec change with `openspec validate restructure-worlds-and-onboarding-flow --strict`.
