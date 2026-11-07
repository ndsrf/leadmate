# Tasks

## 1. Pack format, parser and validation (pure, no app wiring)

- [x] 1.1 Define the schema (pack.yaml, worlds, per-item folders with structure file + `<lang>.md` + media, retired ids) as typed data in `src/shell/content/schema.ts`; verify with unit tests that sample valid and invalid files are accepted/rejected.
- [x] 1.2 Implement the `<lang>.md` section parser into existing block types (no raw HTML, allow-listed inline formatting; image alt/caption by file name); verify with tests for every Lesson block kind and for rejected markup.
- [x] 1.3 Implement `validatePack` (dangling ids, missing sections/images, duplicates, orphans, Spanish required, language-gap warnings, unknown Minigame/scenario via `validateScenario`, relative-only paths, YouTube id shape, retired-id rule against a previous manifest); verify one test per `content-packs` scenario.
- [x] 1.4 Implement `resolvePack(pack, language)` producing `WorldDef`/`LessonDef`/`NodeDef`/`MissionDef` and per-language catalogs layered over Spanish (section-level fallback, never a raw key); verify with a fixture pack including a partial English translation.

## 2. Channel folders, export and parity

- [x] 2.1 Write `scripts/content-export.mjs` that exports today's Worlds, Lessons, Nodes, Missions, content text and art into the folder layout under `content/beta/` (images into each item's `media/`); verify the output passes `validatePack`.
- [x] 2.2 Add a parity test asserting `resolvePack(export)` deep-equals the current TS content and every content catalog key; verify no diffs.
- [x] 2.3 Create `content/stable/` by promoting beta (task 3.3 command) and verify both channels validate.
- [x] 2.4 Write `content/FORMAT.md` (every file kind, field and section, id rules, where images/animation keys/YouTube ids go, how to add a language, create/edit/reorder/retire an item, promote and publish, a full worked Lesson + Mission example, and a short "agent checklist"); generate its field tables from the schema and add a conformance test that fails on drift; verify an agent-style test creates a Lesson from the guide's example and it validates. Link it from `docs/content/` and README.

## 3. Authoring toolchain (all with `--channel beta|stable`)

- [x] 3.1 Add `npm run content:validate -- --channel <c>` (non-zero exit, file/field/fix-hint output); verify on both channels and on three deliberately broken fixtures.
- [x] 3.2 Add `content:build` producing a deterministic manifest (channel, contentVersion, formatVersion, minAppVersion, SHA-256 and size per file) and hashed files in `dist/content/<channel>/`; verify two builds are identical apart from the timestamp.
- [x] 3.3 Add `content:promote` (validate beta, copy to stable, validate stable, refuse on errors); verify stable equals beta afterwards and beta is untouched.
- [x] 3.4 Add the `content` bucket migration and `content:publish` (validate, upload files, then `<channel>/latest.json` last, prune old files, `--rollback <version>`, default beta, stable needs `--channel stable` + confirmation or `--yes`); verify against a mocked storage client that an interrupted upload leaves `latest.json` untouched, that no channel flag publishes beta, and that stable prompts.
- [x] 3.5 Add `content:watch` (rebuild beta on file change) and run a beta build from `npm start`; verify editing a beta Lesson rebuilds `dist/content/beta`.
- [x] 3.6 Write an ADR in `docs/adr/`, add Content Pack, Channel, Baseline Pack and Manifest to GLOSSARY.md, and document the author workflow and service-role key handling in README; verify the documented commands run as written.

## 4. App runtime: resolve, cache, activate

- [x] 4.1 Add `EXPO_PUBLIC_CONTENT_BASE` and `EXPO_PUBLIC_CONTENT_DEV_URL` handling (https only; dev URL ignored in production); verify unit tests including "unset means baseline only and no requests".
- [x] 4.2 Implement the content store per channel (staging dir, hash verification, active pointer in AsyncStorage, previous-version retention, GC) over an injected file/KeyValue interface; verify tests for hash mismatch, interrupted download, corrupt cache and atomic flip.
- [x] 4.3 Implement the launch updater (fetch `latest.json` and manifest with timeout, diff by hash, eager structure/text for Spanish + user language, media order current World → next → rest, compatibility check, in-app `validatePack` before activation); verify each `content-updates` scenario with a fake host.
- [x] 4.4 Load the active pack (or baseline) at start-up before content screens render, never swapping on a background update during a session; verify a pack finished mid-session is not used until restart.
- [x] 4.5 Add the media resolver: missing images show the themed placeholder, request the file and replace it on arrival; verify with a component test.
- [x] 4.6 In `__DEV__`, load the locally built beta pack at start; verify with a test and by editing a Lesson, saving and reloading the dev app.

## 5. Content channel setting

- [x] 5.1 Add the device-only `contentChannel` setting (default Stable, dev builds default Beta, not in the Dog record or sync); verify unit tests for defaults and persistence.
- [x] 5.2 Implement `switchChannel` (fetch, verify, validate, swap provider, persist; on failure revert and report; switching to a cached channel works offline); verify tests for online, failure, offline-cached and no-content-base cases.
- [x] 5.3 Add a version label to Settings (app version and build from `expo-constants`; there is none today), the seven-tap unlock with a "Hide" action, the Content channel control and the "Beta content" indicator on content screens, with Spanish interface strings in the app catalog; verify with component tests for locked, unlocked and dev states and a manual check on a device that switching reloads Worlds and Lessons immediately.
- [x] 5.4 Verify progress rules across channels (completed ids kept, beta-only progress ignored on stable, World completion unaffected by inserted Nodes); verify with tests for the three `content-updates` progress scenarios.

## 6. Switch the app to the resolved pack

- [x] 6.1 Make World map, trail, unlocking and Missions read from the resolved pack; verify existing `world`, `mission`, `mapModel` and `WorldMapScreen` tests pass unchanged.
- [x] 6.1b Move World `tier`, `preview`, `nodeCount` and `unlockedBy` into world files and keep the Plus entitlement check in app code; verify the `plus` and `WorldMapScreen` tests pass and a test shows a pack-marked Plus World still shows the paywall to a free user.
- [x] 6.2 Make Lessons and the Theory Library read from the pack; verify `lesson`, `content`, `conformance`, `LessonScreens` tests pass.
- [x] 6.3 Make Nodes (Primer, Checkpoint, exercises, scenario selection) read from the pack; verify `node`, `readDog`, `calmHands` tests pass.
- [x] 6.4 Remove content keys from the compiled `es*.ts` catalogs (interface strings stay typed); verify `catalog-usage` and `i18n` tests pass.
- [x] 6.5 Make the resolver take a language that defaults to `es` (the app has no language picker and `SUPPORTED_LANGUAGES` is `['es']`); verify a test resolves a fixture in `en` with Spanish fallback and that the app still uses `es`. No UI change.
- [x] 6.6 Remove the old TS content modules and generated art registry once parity (2.2) still passes against the bundled stable pack; verify `npm test` and `npm run typecheck` are green.

## 7. End-to-end verification

- [x] 7.1 Publish beta with one edited Lesson, one new Lesson with an image and a Spanish-only video, a reorder and a retirement; publish stable unchanged; on an installed build verify Stable shows the old trail, switching to Beta shows the new one immediately, switching back works offline, and a corrupt manifest is ignored.
- [x] 7.2 Verify power and start-up impact against `docs/power-baseline.md` (no polling, one update check per launch) and record the result.
