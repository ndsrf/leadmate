# Proposal: Sync Content Pack Version Between Git, App Baseline, and Remote Storage

## Why

Currently, `pack.yaml` in `content/beta` and `content/stable` only records `formatVersion: 1` (the schema format version), while content releases increment `contentVersion` independently in remote Supabase storage (where beta is at version 4). Because `contentVersion` is not tracked in Git, the app runtime hardcodes baseline content to version 1, and the updater treats all baseline files as missing on fresh installs or binary updates, forcing the client to re-download the entire curriculum over the network even when the bundled files are byte-for-byte identical to remote.

## What Changes

- **Track `contentVersion` in Git (`pack.yaml`)**: Add `contentVersion` to `pack.yaml` for both `beta` and `stable` channels, update schema types and pack validation to require a positive integer, and preserve it across promotions and baseline generation.
- **Dynamic Baseline Version in Runtime**: Update `runtime.ts` to inspect the bundled baseline pack's `contentVersion` instead of hardcoding `1`.
- **Baseline-Aware Updater Checks**: Update `updater.ts` so that when determining whether an update is needed, the remote version is compared against the maximum of the stored active pack version and the bundled baseline pack version (for the stable channel or matching bundled channel). If the installed/bundled version is greater than or equal to remote, resolve immediately as `up_to_date` with zero downloads.
- **Diff Against Bundled Baseline Files**: Enhance update file diffing to check file hashes against both stored active files and bundled baseline files. Files already present with matching SHA-256 hashes in the bundled baseline will not be downloaded again.
- **Guard `content:publish` Against Version Drift**: In `publish.ts` / `content-publish.mjs`, fetch remote `latest.json` before publishing and enforce that `pack.yaml`'s `contentVersion` is strictly greater than the current remote version (or provide explicit validation to prevent accidental overwrites/drift).

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `content-packs`: Require `contentVersion` in `pack.yaml`, validate it during pack checks, include it in the generated baseline pack, and guard publishing against version drift compared to remote pointers.
- `content-updates`: Teach the runtime and updater to recognize bundled baseline content versions, prevent redundant re-downloads when the app binary already carries the remote version or identical files, and diff downloads against bundled files.

## Impact

- **Schema & Validation**: `src/shell/content/schema.ts`, `src/shell/content/validator.ts`, `content/beta/pack.yaml`, `content/stable/pack.yaml`, `FORMAT.md`.
- **Baseline Generator**: `scripts/gen-baseline.mjs`, `src/shell/content/baseline.generated.ts`.
- **Runtime & Updater**: `src/shell/content/runtime.ts`, `src/shell/content/updater.ts`, `src/shell/content/store.ts`.
- **CLI & Publish Tools**: `src/shell/content/build.ts`, `src/shell/content/publish.ts`, `scripts/content-publish.mjs`.
- **Tests**: Unit and integration tests for validation, building, publishing, runtime initialization, and updater differential downloads.
