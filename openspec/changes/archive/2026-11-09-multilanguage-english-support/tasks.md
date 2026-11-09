# Tasks

## 1. Core Localization Engine & Device Locale Detection

- [x] 1.1 Implement locale detection utility in `src/i18n/language.ts` using `Intl.DateTimeFormat().resolvedOptions().locale` (defaulting `es` for Spanish locales, `en` otherwise) and verify unit tests in `src/i18n/language.test.ts`.
- [x] 1.2 Update `src/shell/voice.ts` to include `'en'` in `SUPPORTED_LANGUAGES`, map voice cues for `en` to the existing sound assets in `VOICE_PACKS`, and verify `src/shell/voice.test.ts` passes.
- [x] 1.3 Add `language?: Language` to `DogRecord` in `src/shell/dogRecord.ts`, update `migrateRecord()` to default existing records to `'es'`, and verify `src/shell/dogRecord.test.ts` passes.
- [x] 1.4 Implement persistent device language storage in `src/shell/storage.ts` using `AsyncStorage`, and ensure cloud account synchronization preserves local device language preference.

## 2. English Interface Translation Catalogs

- [x] 2.1 Author `src/i18n/en.home.ts` and `src/i18n/en.trail.ts` providing idiomatic English translations adhering to `GLOSSARY.md`.
- [x] 2.2 Author complete `src/i18n/en.ts` translating all remaining keys from `ES_INTERFACE` (~937 keys), export `en` catalog from `src/i18n/index.ts`, and update `createTranslator` fallback behavior.
- [x] 2.3 Expand `src/i18n/i18n.test.ts` and `src/i18n/catalog-usage.test.ts` to assert that every key in `es.ts` exists in `en.ts`, has non-empty text, and never returns a raw key or empty string.

## 3. Onboarding Language Question & Funnel Flow

- [x] 3.1 Update `ONBOARDING_STEPS` in `src/shell/onboarding/flow.ts` to include `'language'` immediately after `'welcome'` and before `'dog'`, and update `nextStep()` and flow tests.
- [x] 3.2 Create `LanguageScreen` in `src/shell/screens/IntroScreens.tsx` with Spanish and English options, pre-selecting the device language, and wire back navigation to `'welcome'`.
- [x] 3.3 Wire `LanguageScreen` into `App.tsx` and `src/shell/navigation.ts`, immediately updating the active shell translator and persisted language upon selection, and verify in `App.test.tsx`.

## 4. Settings Screen Language Selector

- [x] 4.1 Add the "Idioma / Language" selection section with Spanish and English chips to the "Preferencias" tab in `src/shell/screens/SettingsScreen.tsx`.
- [x] 4.2 Wire language change callbacks to update `DogRecord.language`, device storage, and the active shell translator without reload or dismiss, and verify in `src/shell/screens/SettingsScreen.test.tsx`.

## 5. Curriculum Content Localization (content/beta/)

- [x] 5.1 Update `content/beta/pack.yaml` to include `en` in `languages: ['es', 'en']`.
- [x] 5.2 Dispatch parallel subagent to translate all 34 Lessons into `content/beta/lessons/*/en.md` following `GLOSSARY.md` and `content/FORMAT.md`.
- [x] 5.3 Dispatch parallel subagent to translate all 20 Nodes and 9 Worlds into `content/beta/nodes/*/en.md` and `content/beta/worlds/*/en.md`.
- [x] 5.4 Dispatch parallel subagent to translate all 18 Missions into `content/beta/missions/*/en.md`.
- [x] 5.5 Run `npm run content:validate -- --channel beta` and verify zero errors across all beta content files.

## 6. Content Pack Promotion, Baseline Build & Full Verification

- [x] 6.1 Execute `npm run content:promote` to update `content/stable/` and verify manifest consistency.
- [x] 6.2 Run `npm run content:build` to regenerate `src/shell/content/baseline.generated.ts` with bundled `es` and `en` content.
- [x] 6.3 Run full test suite (`npm test`) and typecheck (`npm run typecheck`) to verify zero regressions across all 153 test suites.
