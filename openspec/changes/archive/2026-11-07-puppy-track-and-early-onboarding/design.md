# Design

## Context

See `proposal.md` for motivation. Currently, the Dog's age band (`puppy`, `adolescent`, `adult`, `senior`) is collected late in `SetupScreen.tsx` (Part 3 "about"), which occurs after the user has already entered the dog's name and completed the interactive taste walk. Furthermore, World 1 ("Un perro es un perro") renders a linear 3-stretch trail in `WorldMapScreen.tsx`. While `calm-hands` contains minor copy adjustments for puppies, there is no cohesive early puppy curriculum or guidance for establishing an indoor safe space (crate/den/pen) for sleep.

## Goals / Non-Goals

**Goals:**
- Move age band selection upfront to `DogLookScreen` in Step 2 of the onboarding funnel so the app knows the dog's life stage immediately.
- Pre-populate and allow editing of the age band in the later `SetupScreen` without re-prompting it as an unentered required field.
- Enrich `theory-home-rest` ("En casa se descansa") with the "Rincón y espacio seguro" protocol (denning, open crate/pen, sleeping alone without anxiety).
- Implement World 1 companion satellite stops (Solution 2) for puppy records (`ageBand === 'puppy'`), anchored alongside the 3 foundational stretches:
  1. Stretch 1 (Manos en calma) ↔ Puppy Mouthing & Bite Inhibition (`puppy-bite`)
  2. Stretch 2 (En casa se descansa) ↔ Domestic Sound Desensitisation (`puppy-sound`)
  3. Stretch 3 (Primero, calma) ↔ Cooperative Veterinary Handling (`puppy-vet`)
- Ensure the satellite layout fits alongside the World 1 spine in a compact, mobile-friendly viewport without breaking the established trail visual.

**Non-Goals:**
- Creating a separate locked World 0 that blocks access to World 1 or World 2 (the puppy track is a parallel companion track, not a gating barrier).
- Requiring satellite stops to be completed before unlocking World 2.
- Modifying outdoor worlds (World 3 onwards).

## Decisions

### 1. Age Band Intake in `DogLookScreen`
- **Choice**: Extend `DogLookScreen` in `src/shell/screens/IntroScreens.tsx` to include age stage selection chips (Puppy `<6m`, Adolescent `6-18m`, Adult `1.5-8y`, Senior `>8y`) on the name step or as part of the profile configuration.
- **Default**: Age selection is skippable (defaults to `null` if unselected).
- **Alternative considered**: Inserting a separate onboarding step (`age`) between `dog` and `concern`. Rejected because adding extra funnel steps increases drop-off; grouping age into the initial dog profile keeps the funnel streamlined.

### 2. Universal "Safe Space" Protocol in `theory-home-rest`
- **Choice**: Update Spanish trail catalog entries (`trail.theory-home-rest.*` in `src/i18n/es.trail.ts`) to teach the "rincón de calma y descanso":
  - Explaining why dogs naturally seek a bounded den or quiet corner.
  - Setting up an open crate, playpen, or bordered bed with safe chew toys.
  - Associating the space with calm rest and zero disturbances (never using it as punishment).
- **Rationale**: Applies universally to puppies and newly adopted rescue dogs without introducing separate duplicate lessons.

### 3. Satellite Stops Layout in World 1
- **Choice**: In `WorldMapScreen.tsx` and `mapLayout.ts`, when rendering World 1 for a puppy record (`ageBand === 'puppy'`):
  - Render compact 40px satellite stops anchored beside key Stretch nodes:
    - Stretch 0: anchored beside `calm-hands` (`puppy-bite`)
    - Stretch 1: anchored beside `theory-home-rest` (`puppy-sound`)
    - Stretch 2: anchored beside `theory-calm-first` (`puppy-vet`)
  - Position dynamically on the side opposite the parent node's text label (`!labelOnRight(index)`) to prevent text collision.
  - Connect each satellite stop to its parent stretch node with a subtle dashed connector line.
  - Status & progression: Unlocked immediately upon entering World 1; non-gating for trail progression or World 2 unlocking (see ADR 0024).
  - Tapping a satellite stop opens the standard lesson sheet.
- **Alternative considered**: Full dual-column tree (Solution 3). Rejected because it breaks LeadMate's single winding trail metaphor and causes visual whiplash when advancing into World 2.

### 4. Dedicated Puppy Track Modules
- **Choice**: Define three puppy companion modules in `src/shell/puppyTrack.ts` (or standard `LessonDef` registry):
  - `puppy-bite`: Needle teeth redirection, hands are not toys, trade-up game, reverse timeouts.
  - `puppy-sound`: Graduated sub-threshold habituation to vacuum cleaners, doorbells, and thunder using household/phone audio and calm pairing.
  - `puppy-vet`: Cooperative touch routine for paws, ears, eyes, and teeth with calm marking.
- **Visual & Storage**: 40px diameter, book glyph, showing a completed checkmark badge once read. Completion tracked in `DogRecord.readLessons` so progress persists and remains accessible in the Theory Library.

## Risks / Trade-offs

- **[Vertical screen height in World 1]** → World 1 has 12 stops across 3 stretches. Anchoring 3 satellite stops beside each stretch's opening stop keeps them visible alongside the main trail without adding 12 extra rows.
- **[Existing non-puppy records]** → Non-puppy records (`adult`, `senior`, `adolescent`, or unset) do not render satellite stops, ensuring zero visual disruption for existing users.
- **[Onboarding funnel state persistence]** → Modifying `DogLookScreen` does not change `ONBOARDING_STEPS` array indices, preventing migration issues for users mid-onboarding.

## Migration Plan

1. Update `DogLookScreen` in `src/shell/screens/IntroScreens.tsx` to collect `ageBand` and save it to `DogRecord`.
2. Update `SetupScreen.tsx` so the `about` section pre-selects the existing `ageBand`.
3. Enrich `theory-home-rest` in `src/i18n/es.trail.ts`.
4. Create `src/shell/puppyTrack.ts` with definitions and translations for the 3 puppy modules.
5. Update `src/shell/screens/WorldMapScreen.tsx` and `mapLayout.ts` to draw satellite stops for puppy records.
6. Add unit tests for onboarding age selection, puppy stop rendering, and module interactions.
