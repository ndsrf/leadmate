# Design

## Context

See proposal.md for motivation. Observed state of the app:

- There is no breed concept. `DogRecord` holds `coat` (7 values, `COAT_PALETTE` in `ui/canine.ts`), `weights`, `triggerProfile`, `equipment`; `RECORD_VERSION` is 5 and `readRecord` rebuilds every field defensively.
- `DogLookScreen` (name + coat `Choice` buttons), `SetupScreen` (equipment, weights as text fields, per-kind `Choice` rows), `DiagnosticView` (a `Pad` that turns green) and `PaywallScreen` (two lines and two buttons) are plain panels.
- The shell already has the paper-meadow kit (`Raised`, `Button`, `Panel`, `Choice`, tokens in `ui/tokens.json`, `Migas`, `LeadLine`, `CanineMinigameAvatar` with postures, `RoundPips`, `MinigameButton`) and a `noRawColors` test that forbids raw hex outside the tokens/art files.
- The design canvas (boards 10 and 04b) gives the target look. Its silhouettes are inline SVG symbols; its data (breeds, size bands, weight ranges) is the source for the catalog.
- The simulation reads only `coat`, `dogScale` (from weight) and the Trigger Profile; the Stage sprites live in the Phaser bundle.

## Goals / Non-Goals

**Goals:**
- Bring the four onboarding surfaces to the design's look using existing kit components first.
- Keep every simulation input and every funnel rule (step order, persistence, `pullStrength`, latency seeding, paywall stub) exactly as is.
- Keep pure logic (breed catalog, chip-to-level mapping, slider math) in `src/shell/onboarding/` with unit tests, and keep views thin.

**Non-Goals:**
- Breed-specific Stage sprites or breed-based gameplay differences.
- Reordering the funnel into the design's "breed, weight, coat, name" run; we keep play-first.
- Extra trigger kinds, pull and calm-time questions, real prices or billing.

## Decisions

**1. Breed is a catalog in code, stored as an id on the record.** `src/shell/onboarding/breeds.ts` exports `BREEDS` (id, size band, `kg: [min, max] | null`, `defaultCoat`), `isBreed`, `breedWeightMid`. `DogRecord.breed: BreedId`, default `'mestizo'`, read with the same defensive pattern as `coat`; `RECORD_VERSION` goes to 6 so older records migrate by defaulting. `'otra'` ("Otra raza") is a real id that draws the Mestizo silhouette. Alternative: store a free-text breed name; rejected because silhouettes, weight hints and tests need a closed set. Breed travels with the record in sync like `coat` does; the implementer confirms the sync path treats unknown fields the same way and adds a test.

**2. Silhouettes are a React Native SVG component, not images.** `ui/BreedArt.tsx` ports the design's 16 symbols to `react-native-svg` (`Svg`, `Path`, `Ellipse`), taking `breed`, `coat` and `width`, and using `COAT_PALETTE` for fills and `color.ink` for outlines. This matches `Migas` and the avatar, scales for the weight-based preview, themes with tokens and adds no asset pipeline. Alternative: bitmap sprites; rejected (no source art, bundle size, no coat recolouring). Hex values in the design symbols are mapped to tokens or `COAT_PALETTE`; anything with no token goes into `ui/theme` rather than raw hex (keeps `noRawColors` green).

**3. Breed pre-fill respects manual edits.** `DogRecord` gets no "touched" flags. The Dog look screen keeps local state: weight and coat are pre-filled on a breed change only while their local `touched` flag is false. The weight goes into the record by the existing `weights` path when setup saves it, so the look screen stores breed and coat, and passes the breed midpoint as the initial weight text of setup (derived from `record.breed` when `weights.dogKg` is null). Alternative: write the pre-filled weight into the record at pick time; rejected because it would make a skipped weights step look like entered data and change `pullStrength` for users who skipped.

**4. Trigger chips map onto the existing four-level answers.** No new data: a selected kind has level 1 to 3 (default 2), unselected is 0. `questionnaire.ts` gains `chipsOf(profile)` and `selectKind`/`setIntensity` helpers over the existing `setTriggerLevel`; `ANSWERS` and `levelOf` stay (settings still uses all four). Intensity control is the design's `seg` (a little, often, a lot) shown under the chip row for the currently selected kinds. Alternative: a single global intensity; rejected because the profile is per kind. The `never` answer in settings remains as is.

**5. Weight slider with typed fallback.** `WeightSlider` (in `ui/`) renders the design's track, thumb and bubble using a `PanResponder`/gesture-free approach consistent with the codebase's other controls (pressable track with step buttons for keyboard and screen readers, `accessibilityRole="adjustable"` with increment/decrement actions). It sits next to a small numeric `TextField`; both write one `kg` state, validated by the existing `isDogKg`/`isHandlerKg`. The slider range is the validation range; the breed range is a hint, never a limit. Math (value to fraction and back, step snapping) is pure and tested in `weights.ts`.

**6. Diagnostic keeps its state machine; only the view changes.** `stepDiagnostic`, `DIAGNOSTIC` and latency functions are untouched. The view maps `signalShownAt !== null` to the `looking` posture of `CanineMinigameAvatar` (ears up, fixed gaze; add this posture to `postureSpec` if the closest existing one, `alert`, does not read right) with a caption from the catalog, and `Pad` becomes a round `MinigameButton` (Marker icon). Paws are the fixed number of signals the 15 seconds are expected to hold (design shows 5) and fill by `min(reactions.length, 5)`; the Diagnostic still ends on time, not on paw count, so a fast user does not end early and a slow user is not stuck. Alternative: end after N reactions; rejected because it changes the 15-second rule and the latency sample size.

**7. Paywall is presentational only.** `PaywallScreen` keeps its props (`onStartTrial`, `onLater`) and adds the close control wired to `onLater`. Layout: close button, `Migas` on a meadow card with the "7 days free" `Badge`, `h1`, three benefit rows with icons, a `Panel` stating basics stay free, buttons. Benefit copy is limited to what exists today (the four worlds and Daily Walk, full theory guides with video where available, "more coming"); "up to three dogs" and "[PRICE] per month" from the design are NOT used because neither exists, and the spec forbids implying them. Content scrolls on short screens.

**8. Step header.** A small `StepHeader` (back, dots/segments, "n of 3") is shown on the Dog look screen as "1 of 2" (breed and look, name) and in setup as "1 of 3" (weight and equipment), "2 of 3" (triggers) to match actual screens; the design's total of 3 for breed, weight, coat does not apply because the order differs. Back uses the existing in-screen part state; it does not change the persisted funnel step.

**9. Strings.** All new text goes through `i18n` with `es` and `en` entries; breed names are catalog keys (`breed.labrador`, ...). Spanish names are the source (Spanish market first).

## Risks / Trade-offs

- [16 hand-ported silhouettes are a lot of SVG and may look off] -> port one family at a time behind the same props, snapshot-free but with a render smoke test per breed id, and review each on device; `mestizo` is the fallback for any breed that is not ready, so the picker can ship with fewer.
- [Slider gestures differ between web and native] -> the track also supports step buttons and the numeric field, so the control works without dragging; test on web (the app builds for web).
- [Paws progress could suggest a pass/fail the Diagnostic does not have] -> paws are filled by responses, not correctness; copy says "huellas", not score.
- [Record version bump and sync] -> default-on-read makes the migration additive; a record written by a newer build and read by an older one just ignores the unknown field, same as coat.
- [Paywall without price may look unfinished] -> accepted; the stub is explicit in the spec and the price line is added when billing exists.

## Migration Plan

1. Ship breed catalog, record field and `RECORD_VERSION` 6 first (additive, no UI change).
2. Ship UI changes behind no flag; they replace the old views.
3. Rollback is a revert of the UI commits; the extra `breed` field on records is harmless.

## Open Questions

- Which exact copy for the three paywall benefits (can be settled in review of the strings; it does not change structure).
