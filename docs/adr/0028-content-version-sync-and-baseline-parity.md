---
status: accepted
---
# Content Version Sync, Baseline Parity, and Drift Protection

Educational content packs previously only tracked `formatVersion: 1` in `pack.yaml`, while remote releases incremented `contentVersion` independently in Supabase Storage. As a result, the app runtime hardcoded baseline content to version 1, and the updater treated all files as missing on fresh installs or binary updates—re-downloading the entire ~8MB curriculum even when the bundled baseline was byte-for-byte identical to remote.

We make Git (`pack.yaml`) the single source of truth for `contentVersion` per channel (`content/beta/pack.yaml` initialized to 4, `content/stable/pack.yaml` to 1). The bundled baseline pack preserves this version, the app runtime exposes it, and the updater evaluates `max(installedActiveVersion, baselineVersion) >= remoteVersion` to immediately resolve as `up_to_date` on launch with zero network requests.

## Considered Options

- **Hardcode baseline version or query dynamic remote manifest on first launch**: Still causes unnecessary downloads or network dependencies on fresh installs. Rejected.
- **Auto-increment version in pack.yaml during publish**: Risks uncommitted Git drift, merge conflicts, or CI desynchronization. Rejected.
- **Git single source of truth with publish gate (chosen)**:
  - `contentVersion` is a required positive integer in `pack.yaml`.
  - `scripts/gen-baseline.mjs` bakes `contentVersion` directly into `BASELINE_PACK`.
  - `content:promote` preserves `content/stable/pack.yaml`'s version counter, leaving version bumps to explicit release commits.
  - `content:publish` halts if `pack.yaml.contentVersion <= remote.contentVersion`, enforcing deliberate Git commits prior to deployment.
  - On launch, the updater checks the remote pointer against both stored packs and the bundled baseline. If baseline is already up to date, zero files are downloaded.
