# Design

## Context

LeadMate currently defaults all interface strings and curriculum content to Spanish. The application shell in `App.tsx` hardcodes `CATALOG = es` and `LANGUAGE: Language = 'es'`. However, the underlying content system (`src/shell/content/resolver.ts`, `loader.ts`, `validator.ts`) was architected from inception to support per-language markdown files (`<lang>.md`) with graceful section-by-section fallback to Spanish (`es.md`).

This design establishes a dynamic, reactive multilanguage engine supporting Spanish and English across the React Native shell, the embedded simulation webview, and curriculum content packs.

## Goals / Non-Goals

**Goals:**
- Provide zero-dependency device locale detection on startup using standard `Intl.DateTimeFormat().resolvedOptions().locale`.
- Enable dynamic runtime language switching across all screens, modals, simulation HUDs, and content without requiring an application restart.
- Persist the selected language locally in `AsyncStorage` and mirror in `DogRecord.language`, preserving device language precedence during cloud account synchronization and progress resets.
- Introduce an accessible, dedicated `language` funnel step between `welcome` and `dog` pre-selected to the device locale (or English if non-Spanish).
- Add an "Idioma / Language" selector to the "Preferencias" tab of `SettingsScreen`.
- Deliver full English translations for all ~1,100 interface keys (`src/i18n/en.ts`) and all 81 curriculum items in `content/` (34 Lessons, 18 Missions, 20 Nodes, 9 Worlds).
- Strictly adhere to [`GLOSSARY.md`](file:///home/jgm/orca/workspaces/leadmate/multilanguage/GLOSSARY.md) canonical terminology throughout all English copy.

**Non-Goals:**
- Supporting additional languages beyond Spanish and English in this change (architecture will accommodate them later).
- Generating new voice audio assets (cue packs use sound effects and will map to existing assets for both `es` and `en`).
- Letting remote cloud sync overwrite a device's local interface language.

## Decisions

### 1. Locale Detection via Standard ECMAScript `Intl`
*Rationale*: Hermes and Node.js have full ECMAScript `Intl` support. `Intl.DateTimeFormat().resolvedOptions().locale` reliably returns standard BCP 47 language tags (e.g., `es-ES`, `en-US`) across iOS, Android, Web, and Jest test environments without introducing native module dependencies or linking steps.
*Alternatives Considered*:
- `expo-localization`: Requires adding an extra native package and mock stubs in Jest.
- React Native `Platform.select`/`I18nManager`: Platform-fragmented and less uniform than standard `Intl`.

### 2. Dual-Layer Language Persistence with Device Precedence
*Rationale*:
- **Cold start layer (`AsyncStorage`)**: Read immediately before `DogRecord` is parsed or migrated so that the initial splash and welcome screen display in the correct language.
- **Domain layer (`DogRecord.language`)**: Stored on the record for profile inspection and telemetry.
- **Precedence rule**: If Device A (English) and Device B (Spanish) sync via Supabase, cloud synchronization will update training progress, attributes, and streak, but each device retains its own local language preference.
- **Reset Progress rule**: Resetting dog progress clears training data and returns to `welcome`, but keeps the user's explicit language preference intact.

### 3. Funnel Integration: Dedicated Language Screen
*Rationale*: Placing the language question immediately after `welcome` and before `dog` ensures that users whose system language defaulted to English (e.g., German/French device) or who prefer a different language can choose it before typing the Dog's name, picking coat/breed, or reading concern cards.
*Alternatives Considered*:
- *Language toggle on Welcome*: Crowds the branded welcome splash and complicates touch targets.
- *Language in Dog Setup*: Too late; the user would already have experienced the Taste Stage and Concerns in the wrong language.

### 4. Settings Screen Integration in "Preferencias"
*Rationale*: Matches the domain categorization established in [`GLOSSARY.md`](file:///home/jgm/orca/workspaces/leadmate/multilanguage/GLOSSARY.md) and [`settings-screen`](file:///home/jgm/orca/workspaces/leadmate/multilanguage/openspec/specs/settings-screen/spec.md) where "Preferencias" owns interface feedback, appearance theme, checkpoint timing, and audio cues.

### 5. Curriculum Content Authoring & Subagent Parallelization
*Rationale*: Translating 81 curriculum items (34 Lessons, 18 Missions, 20 Nodes, 9 Worlds) involves substantial domain copy. To maintain speed and isolation:
- Translations are authored in `content/beta/` with parallel subagents partitioned by content domain:
  - Agent 1: Theory Lessons (`lessons/*/en.md`)
  - Agent 2: Training Nodes & Worlds (`nodes/*/en.md`, `worlds/*/en.md`)
  - Agent 3: Real-World Missions (`missions/*/en.md`)
- Subagents follow [`GLOSSARY.md`](file:///home/jgm/orca/workspaces/leadmate/multilanguage/GLOSSARY.md) and [`content/FORMAT.md`](file:///home/jgm/orca/workspaces/leadmate/multilanguage/content/FORMAT.md).
- Once validated (`npm run content:validate -- --channel beta`), `npm run content:promote` updates `content/stable/` and rebuilds `src/shell/content/baseline.generated.ts`.

### 6. Voice Cue Mapping
*Rationale*: Voice cues (`lets-go` and `aqui`) are sound effects, not spoken dialog. In `src/shell/voice.ts`, `VOICE_PACKS` will map `en` to the existing sound assets (`lets-go.es` and `aqui.es`), fulfilling the `Record<Language, string>` requirement without missing assets.

## Risks / Trade-offs

- **[Risk: Incomplete translations in Content Packs]** → *Mitigation*: The validator (`npm run content:validate`) strictly checks that all items have required headings and valid markdown structure. Any missing section will trigger warnings or errors before promotion.
- **[Risk: Incomplete keys in English Interface Catalog]** → *Mitigation*: Automated test in `src/i18n/catalog-usage.test.ts` / `i18n.test.ts` will verify that every key in `ES_INTERFACE` exists in `EN_INTERFACE` with non-empty text, falling back to Spanish if any key is omitted.
- **[Risk: Layout Clipping with English Text]** → *Mitigation*: English copy is typically 15-25% shorter than Spanish. Existing layouts already adhere to the 40% expansion requirement from the `localization` spec.
- **[Risk: Simulation Webview Catalog Sync]** → *Mitigation*: `SimView` already transmits the active `catalog` object via `bundle/main.ts:141` (`t = createTranslator(message.catalog ?? es)`). When shell language changes, the updated catalog is provided to the simulation bridge.

## Migration Plan

1. Existing `DogRecord` instances without a `language` property are migrated to `language: 'es'` by `migrateRecord()`, ensuring existing Spanish users experience zero change.
2. Cold start reads `leadmate.language` from `AsyncStorage`. If absent, detects device locale (`es` if Spanish, `en` otherwise) and initializes the setting.
3. Updating `pack.yaml` to include `en` in `languages: ['es', 'en']` and promoting to stable updates the bundled baseline manifest without breaking existing caches.
