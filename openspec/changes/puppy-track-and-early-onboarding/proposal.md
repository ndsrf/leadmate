# Proposal

## Why

Puppy owners represent a high-intent user cohort with acute, time-sensitive needs (night crying, sharp mouthing, early sound habituation before vaccines), yet the app collects age late in setup and provides no dedicated early puppy curriculum. Furthermore, new dogs (both puppies and rescue adoptions) lack foundational guidance on safe small-space denning and sleeping alone calmly.

## What Changes

- **Early Age Band Intake in Onboarding**: Move the age band question (`puppy`, `adolescent`, `adult`, `senior`) from late Dog Setup (`about` part) into the early Dog profile step alongside name, breed, and coat, enabling immediate personalization across the funnel.
- **Enrich "En casa se descansa" with Safe Space Protocol**: Expand the universal World 1 home-rest curriculum with the "Rincón y espacio seguro" protocol (small defined resting area / crate / pen, positive den association, sleeping alone without anxiety), applying to puppies and newly adopted adult dogs alike.
- **Puppy Satellite Stops in World 1**: Introduce companion satellite stops anchored directly to the three foundational stretches of World 1 ("Un perro es un perro") when `ageBand === 'puppy'`:
  1. *Manos en calma* ↔ *Inhibición del mordisco y dientes de aguja* (mouthing redirection, hands are not toys).
  2. *En casa se descansa* ↔ *Desensibilización sonora* (graduated domestic sound habituation: vacuum, doorbell, storm).
  3. *Primero, calma* ↔ *Manipulación corporal y veterinario* (calm desensitisation to touching paws, ears, and mouth).
- **Integrated Satellite Layout**: Present the satellite stops anchored alongside the winding trail spine so the puppy curriculum is introduced right beside World 1's foundational stretches without adding extra vertical rows.

## Capabilities

### New Capabilities
- `puppy-track`: Defines the dedicated puppy curriculum modules (bite inhibition and needle teeth redirection, graduated domestic sound desensitisation, and calm body handling for veterinary prep) accessible via satellite stops.

### Modified Capabilities
- `onboarding-funnel`: Promotes age band selection from late Dog Setup into the initial Dog profile step alongside breed and name.
- `dog-basics-world`: Enriches the "Home is for resting" stretch with the safe small-space denning protocol, and specifies the companion satellite stop layout for puppy records.

## Impact

- Code: `src/shell/onboarding/flow.ts`, `src/shell/screens/IntroScreens.tsx` (`DogLookScreen`), `src/shell/screens/SetupScreen.tsx`, `src/shell/world.ts`, `src/shell/screens/WorldMapScreen.tsx`, `src/shell/ui/mapLayout.ts`, and i18n catalogs (`es.ts`, `es.trail.ts`).
- Tests: Updates to `IntroScreens.test.tsx`, `SetupScreen.test.tsx`, `world.test.ts`, and `WorldMapScreen.test.tsx`.
