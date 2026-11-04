# Tasks

## 1. Early Onboarding Age Intake

- [x] 1.1 Update `DogLookScreen` in `src/shell/screens/IntroScreens.tsx` to include age stage selection chips (`puppy`, `adolescent`, `adult`, `senior`) alongside name and breed, and verify with updated tests in `IntroScreens.test.tsx`.
- [x] 1.2 Update `SetupScreen.tsx` to pre-select the recorded `ageBand` in the `about` section without treating it as unentered, and verify with `SetupScreen.test.tsx`.
- [x] 1.3 Update onboarding flow tests in `flow.test.ts` and `dogRecord.test.ts` to verify `ageBand` records and persists from the initial profile step.

## 2. Universal Safe Space Enrichment

- [x] 2.1 Update `theory-home-rest` lesson copy and takeaways in `src/i18n/es.trail.ts` with the "Rincón y espacio seguro" protocol (denning, open crate/pen, safe chewing, and sleeping alone without anxiety).
- [x] 2.2 Verify lesson content and schema checks pass in `theoryLessons.test.ts` and `world.test.ts`.

## 3. Puppy Track Content & Modules

- [x] 3.1 Create `src/shell/puppyTrack.ts` defining the three puppy companion modules (`puppy-bite`, `puppy-sound`, `puppy-vet`) and their completion state logic.
- [x] 3.2 Add localized text keys for the three puppy modules in `src/i18n/es.trail.ts` and `src/i18n/es.ts`.
- [x] 3.3 Add unit tests in `src/shell/puppyTrack.test.ts` validating module definitions, copy completeness, and progress recording.

## 4. World 1 Satellite Stop Map Layout

- [x] 4.1 Update `src/shell/ui/mapLayout.ts` with geometry and offset functions for satellite stops anchored to World 1 stretches.
- [x] 4.2 Update `src/shell/screens/WorldMapScreen.tsx` to render companion satellite stops for puppy records (`ageBand === 'puppy'`) and wire stop tap actions to open the puppy module sheet.
- [x] 4.3 Add unit tests in `WorldMapScreen.test.tsx` verifying that satellite stops render exclusively for puppy records and handle selection correctly.

## 5. Integration Verification

- [x] 5.1 Run full test suite (`npm test`) and typecheck (`npx tsc --noEmit`) to verify zero regressions across onboarding, world map progression, and existing dog records.
