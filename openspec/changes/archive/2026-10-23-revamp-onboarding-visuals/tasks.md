## 1. Breed data

- [x] 1.1 Add `src/shell/onboarding/breeds.ts`: `BREEDS` (16 breeds + `mestizo` + `otra`) with size band, weight range, default coat; `isBreed`, `breedWeightMid`; unit tests (catalog complete, ranges inside 1-80 kg, Otra has no range)
- [x] 1.2 Add `breed` to `DogRecord` (default `mestizo`), read defensively, bump `RECORD_VERSION` to 6; tests for old records and invalid values
- [x] 1.3 Check the sync path carries `breed` like `coat` and add a test; confirm a Stage payload is identical for Dogs differing only in breed
- [x] 1.4 Add `breed.*` strings (es, en) and make the existing `noRawColors` and i18n tests pass

## 2. Shared UI pieces

- [x] 2.1 `ui/BreedArt.tsx`: port the 16 silhouettes from the design (board 04b) to `react-native-svg` in `COAT_PALETTE` and token colours; `otra` draws `mestizo`; smoke test renders every id
- [x] 2.2 `ui/BreedTile`, `ui/CoatSwatch` (colour + visible name + check), `ui/StepHeader`, `ui/Chip`, `ui/Segmented` built on `Raised`/tokens, with press, focus and reduced-motion behaviour matching `Choice`
- [x] 2.3 `ui/WeightSlider` with track, thumb, value bubble, step buttons and `adjustable` accessibility actions; pure value/fraction/snap helpers in `onboarding/weights.ts` with tests

## 3. Dog look screen

- [x] 3.1 Rebuild `DogLookScreen`: stepper header, breed grid (6 first, expand to all + Otra raza), live preview, coat swatches + texture-free name labels, name field; breed pick pre-fills default coat unless coat was touched
- [x] 3.2 Extend `saveNameAndLook` to take and save the breed; update `look.ts`/`intro.ts` tests; blank name still blocks; continuing without touching breed saves `mestizo`

## 4. Setup screens

- [x] 4.1 Equipment: two illustrated cards with check and note; keep recording `equipment`
- [x] 4.2 Weights: use `WeightSlider` + numeric field for Dog and Handler, breed range hint, initial Dog weight from the breed midpoint only while `weights.dogKg` is null and nothing was entered; skip still gives `pullStrength` 0.8
- [x] 4.3 Triggers: chips for `QUESTION_KINDS`, three-step intensity for selected kinds (default `often`), deselect resets to level 0, existing profile shown selected; add `chipsOf`/`selectKind`/`setIntensity` to `questionnaire.ts` with tests; settings editor unchanged
- [x] 4.4 Wire the stepper ("1 of 3", "2 of 3"...) and in-screen back between parts without changing the persisted funnel step

## 5. Diagnostic

- [x] 5.1 Rebuild `DiagnosticView` as a scene: meadow, `CanineMinigameAvatar` in the Dog's coat (breed art in the scene), calm posture until the signal and a `looking` posture while it is on (add posture to `canine.ts` if needed, with caption key), coach caption, paws progress with `aria` label, round Marker button; reduced motion applies the posture instantly
- [x] 5.2 Keep `diagnostic.ts` logic unchanged; add tests that an early tap records no latency and that paws fill by responses without ending the run early
- [x] 5.3 Update the diagnostic card to draw the Dog in its breed art and show the breed name

## 6. Paywall

- [x] 6.1 Rebuild `PaywallScreen`: close control (acts as "Maybe later"), `Migas`, "7 days free" badge, title, three benefit rows with icons, free-basics panel, Start trial / Maybe later; scrolls on short screens; no price, no unsupported promises
- [x] 6.2 Update `paywall.*` strings (es, en); keep `passPaywall` behaviour and its tests; add a test for the close path not recording `trialStartedAt`

## 7. Verification

- [x] 7.1 Run the typecheck, lint and jest suites; fix `noRawColors`, i18n parity and touch-target tests
- [ ] 7.2 Run the app on web and a 360 by 640 viewport with large text; walk the full funnel (welcome to World Map) and check each changed screen against the design board 10 and 04b, including reduced motion
- [x] 7.3 Run `openspec validate revamp-onboarding-visuals` and fix findings
