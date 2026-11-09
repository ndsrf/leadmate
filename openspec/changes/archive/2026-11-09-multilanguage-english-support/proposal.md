# Proposal

## Why

LeadMate was initially shipped exclusively in Spanish. To reach a global audience of dog owners, the application needs to become genuinely multilingual, starting with first-class English support. Users should experience the app in their phone's native language immediately upon opening, be given an explicit choice during onboarding, and have the freedom to change the app language at any time in Settings, with all curriculum content and interface copy fully localized.

## What Changes

- **Automatic Startup Locale Resolution**: Detect device locale on startup; default to Spanish (`es`) if the device language is Spanish, and default to English (`en`) for all other languages.
- **Onboarding Language Question**: Introduce a dedicated onboarding step (`language`) directly following the welcome screen (`welcome`) and preceding the dog profile step (`dog`). Pre-selects the resolved device language and switches active application language immediately upon selection.
- **Language Selector in Settings**: Add an "Idioma / Language" selection section inside the "Preferencias" tab of the Settings screen, allowing immediate runtime switching between Spanish and English.
- **Dynamic Translation Architecture**: Update application shell to dynamically maintain active language and provide a unified translator (`createTranslator`) that merges the interface catalog and resolved content pack, maintaining graceful fallback to Spanish for any missing keys.
- **Full Interface Localization (`src/i18n`)**: Provide a comprehensive English interface catalog (`en.ts`, `en.home.ts`, `en.trail.ts`) translating all UI text, HUD labels, debrief strings, and modals.
- **Full Curriculum Content Localization (`content/`)**: Provide complete `en.md` translations for all 81 curriculum items (34 Lessons, 18 Missions, 20 Nodes, and 9 Worlds) across `content/stable/` and `content/beta/`, add `en` to `pack.yaml`, and rebuild the bundled baseline.
- **Audio Cue Mapping**: Ensure voice cue configuration maps both `es` and `en` to existing sound cue assets (`lets-go.es` and `aqui.es`).

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `localization`: Add first-class English support, initial launch device locale detection with English fallback, runtime language switching, and persistence.
- `onboarding-funnel`: Insert `language` step after `welcome` and before `dog`, defaulted to device language or English, with immediate active language update.
- `settings-screen`: Add language selection controls in the `Preferencias` tab with instant UI and content update without reload.

## Impact

- **App Entry & Navigation**: `App.tsx` and `src/shell/navigation.ts` support the new `language` funnel step and dynamic language state.
- **Storage & State**: `DogRecord` stores `language?: Language` with migration defaulting existing records to `es`, plus cold-start caching in `AsyncStorage`.
- **i18n**: New `src/i18n/en.ts` and related catalogs alongside updated `createTranslator`.
- **Content Packs**: 81 new `en.md` files in `content/stable/` and `content/beta/`, updated `pack.yaml`, and regenerated `src/shell/content/baseline.generated.ts`.
- **Dependencies & Performance**: Zero added native dependencies; uses standard ECMAScript `Intl` for locale detection.
