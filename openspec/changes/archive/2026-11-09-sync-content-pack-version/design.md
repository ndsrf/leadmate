# Design: Sync Content Pack Version Between Git, App Baseline, and Remote Storage

## Context

Curriculum content in LeadMate is organized into `content/beta` and `content/stable`. Today, `pack.yaml` contains:
```yaml
formatVersion: 1
minAppVersion: 1.0.0
languages:
  - es
retired: []
```
`contentVersion` (the release increment) is not stored in `pack.yaml`. Instead, it was passed as CLI flags or inferred from local dist/storage. In production Supabase storage, `beta` is currently at `contentVersion: 4` while `stable` is at `contentVersion: 1`.

Because `pack.yaml` lacks `contentVersion`:
1. `scripts/gen-baseline.mjs` generates `src/shell/content/baseline.generated.ts` without a `contentVersion` field in `pack`.
2. `src/shell/content/runtime.ts` falls back to hardcoded `contentVersion: 1`.
3. `src/shell/content/updater.ts` queries `store.getActivePointer(channel)`. On fresh installs or app updates, this returns `null`. The updater assumes the installed content is version `0`/`null`, fails the `up_to_date` check, and diffs remote files against an empty set of active files, downloading 100% of the pack over the network even if every file is byte-for-byte identical to the bundled baseline in the app binary.
4. `publish.ts` does not check whether `pack.yaml`'s version matches or exceeds the remote version, allowing accidental overwrite or version desynchronization.

## Goals / Non-Goals

**Goals:**
- Make Git (`pack.yaml`) the single source of truth for both format specification version (`formatVersion`) and curriculum content version (`contentVersion`).
- Ensure `content/beta/pack.yaml` is set to `4` (matching current Supabase beta storage) and `content/stable/pack.yaml` is set to `1` (matching current Supabase stable storage).
- Make `scripts/gen-baseline.mjs` preserve `contentVersion` in `BASELINE_PACK`.
- Teach `runtime.ts` and `updater.ts` to recognize the bundled baseline's `contentVersion`.
- Avoid downloading any content files when the installed version (either cached active pack or bundled baseline) satisfies or exceeds the remote `contentVersion`.
- Guard `content:publish` so that publishing fails fast if `pack.yaml`'s `contentVersion` has not been bumped past the remote channel's active `latest.json` (except during explicit rollbacks).

**Non-Goals:**
- Rewriting the storage backend or offline storage schemas.
- Modifying non-content game engines or physics logic.

## Decisions

### 1. Require `contentVersion` in `pack.yaml` Schema and Validation
- **Decision**: Update `PACK_SCHEMA_FIELDS` and `validatePackYaml` in `src/shell/content/schema.ts` to require `contentVersion: number` (positive integer). Update `PackYaml` type definition to include `contentVersion: number`.
- **Rationale**: Making `contentVersion` mandatory in Git prevents silent drift and ensures any pack created or promoted cannot be built or published without an explicit version.
- **Alternatives Considered**: Optional `contentVersion` defaulting to 1. Rejected because optional fields cause silent regression to version 1 and obscure drift.

### 2. Baseline Generation and In-Memory Active Content
- **Decision**: In `scripts/gen-baseline.mjs`, ensure `pack.pack.contentVersion` is written to `baseline.generated.ts`. In `runtime.ts`, resolve active content version dynamically from `activePointer?.contentVersion ?? (pack.pack as any).contentVersion ?? 1`.
- **Rationale**: When the app starts offline or on a fresh install, `getActiveContent().contentVersion` accurately reports the bundled version instead of hardcoded 1.

### 3. Baseline-Aware Updater Up-to-Date Check
- **Decision**: In `updater.ts`, compute the currently effective installed version:
  ```ts
  const baselineVersion = channel === 'stable' ? (BASELINE_PACK.pack as any).contentVersion : undefined;
  const installedVersion = activePointer?.contentVersion ?? baselineVersion ?? 0;
  if (installedVersion >= contentVersion) {
    return { updated: false, reason: 'up_to_date', remoteVersion: contentVersion };
  }
  ```
- **Rationale**: When an app binary ships with baseline `contentVersion: 4` and remote is also `4`, launch checks evaluate `installedVersion (4) >= remote (4)`, immediately resolving to `up_to_date` with 0 network requests, 0 downloads, and no update banner.

### 4. Promotion Mechanics (`content:promote`)
- **Decision**: In `src/shell/content/promote.ts` (`promotePack`), preserve `content/stable/pack.yaml`'s existing `contentVersion` as-is instead of overwriting it with beta's content version.
- **Rationale**: In the domain model, channels (`beta` and `stable`) build and publish independently with their own monotonic counters. Preserving stable's existing version keeps promotion as a staging and editorial review step; authors explicitly bump stable's version when ready to publish.

### 5. Staging and Differential Downloads
- **Decision**: When an update moves a client from baseline to remote (e.g. baseline v4 to remote v5), the updater performs a standard prioritized download to populate `activeDir`. All subsequent updates (v6, v7, etc.) diff against `activeDir` and copy unchanged files locally, keeping each activated pack on disk complete and self-contained without pre-duplicating 8MB of flash storage on first launch.

### 6. Publish Safeguard Against Version Drift
- **Decision**: In `publish.ts` (`publishPack`):
  - Before uploading files, if `mode !== 'rollback'`, fetch the channel's `latest.json` from Supabase storage (if it exists).
  - Compare `manifest.contentVersion` (from `pack.yaml`) against remote `latest.contentVersion`.
  - If `manifest.contentVersion <= latest.contentVersion`, throw a helpful error:
    `"Remote channel '<channel>' is already at version <remote>. pack.yaml has version <local>. Please bump contentVersion in content/<channel>/pack.yaml before publishing."`
  - When `--rollback <version>` is used, bypass this check.
- **Rationale**: Catches developer/author error before any files or pointers are uploaded, guaranteeing strict monotonically increasing versioning in production.

## Risks / Trade-offs

- **[Risk] Test fixtures failing schema validation** → **Mitigation**: Update all mock `pack.yaml` objects in existing unit test suites (`validator.test.ts`, `schema.test.ts`, `build.test.ts`, `publish.test.ts`, `runtime.test.ts`, `updater.test.ts`) to specify `contentVersion: 1`.
- **[Risk] Channel mismatch for baseline** → **Mitigation**: `BASELINE_PACK` represents the stable channel. When checking the `beta` channel on a clean install, the baseline does not claim to be beta unless explicitly configured or if beta matches stable baseline.
