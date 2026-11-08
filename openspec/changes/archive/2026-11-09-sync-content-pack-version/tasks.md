# Tasks

## 1. Pack Schema, Validation, and Content Pack Files

- [x] 1.1 Add `contentVersion: number` to `PackYaml` interface and `PACK_SCHEMA_FIELDS` in `src/shell/content/schema.ts`, and validate positive integer in `validatePackYaml`. Verify with `npm test -- src/shell/content/schema.test.ts`.
- [x] 1.2 Update `content/beta/pack.yaml` to specify `contentVersion: 4` and `content/stable/pack.yaml` to specify `contentVersion: 1`. Verify with `node scripts/content-validate.mjs --channel beta` and `node scripts/content-validate.mjs --channel stable`.
- [x] 1.3 Update mock `PackYaml` fixtures in existing test suites (`validator.test.ts`, `schema.test.ts`, `build.test.ts`, `publish.test.ts`, `resolver.test.ts`, `runtime.test.ts`) to supply `contentVersion: 1`. Verify tests pass with `npm test -- src/shell/content/validator.test.ts`.

## 2. Baseline Generation and App Runtime

- [x] 2.1 Update `scripts/gen-baseline.mjs` to preserve `contentVersion` in `BASELINE_PACK` and regenerate `src/shell/content/baseline.generated.ts`. Verify generated file exports `BASELINE_PACK.pack.contentVersion`.
- [x] 2.2 Update `src/shell/content/runtime.ts` (`getActiveContent` and `initContentRuntime`) to read `contentVersion` from `baseline.pack.contentVersion` instead of hardcoding `1`. Verify with `npm test -- src/shell/content/runtime.test.ts`.
- [x] 2.3 Update `promotePack` in `src/shell/content/promote.ts` to preserve destination `pack.yaml`'s `contentVersion` during promotion. Verify with `npm test -- src/shell/content/promote.test.ts`.

## 3. Baseline-Aware Updater and Differential Downloads

- [x] 3.1 Update `src/shell/content/updater.ts` so `checkAndDownloadUpdate` compares remote `contentVersion` against `activePointer?.contentVersion ?? (channel === 'stable' ? BASELINE_PACK.pack.contentVersion : 0)`. Verify that fresh installs matching remote resolve to `{ updated: false, reason: 'up_to_date' }` in `updater.test.ts`.
- [x] 3.2 Verify `src/shell/content/updater.ts` download and staging logic so that first remote update populates `activeDir` cleanly and subsequent updates diff locally against `activeDir`. Verify with tests in `updater.test.ts`.

## 4. Publish Safeguard and Integration Verification

- [x] 4.1 Update `publishPack` in `src/shell/content/publish.ts` to check remote `latest.json` and throw an actionable error if `manifest.contentVersion <= latest.contentVersion` (unless performing a rollback). Verify with mock storage tests in `publish.test.ts`.
- [x] 4.2 Run full content subsystem tests (`npm test -- src/shell/content`) and verify complete test suite and CLI validation pass.

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied.
- Verify the archived result.
