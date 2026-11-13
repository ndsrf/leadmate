## Why

Development builds follow the Beta channel while production follows Stable, so developers never test what ships. Releases can also bake in a stale bundled baseline (it is regenerated only as a side effect of `content:promote`), and any download that is needed is slow: files are fetched one by one, and the bundled baseline is ignored when deciding what to download.

## What Changes

- **A. Dev matches production**: a development build with no stored choice follows Stable, like production. Beta stays selectable in dev through the Content channel control.
- **B. Release ships the latest stable**: one release script regenerates the bundled baseline from `content/stable` and then runs a release check, for EAS and local builds alike. The check fails when the baseline's content version or text/structure file hashes differ from the published stable pointer, or when the host cannot be reached; an explicit `--allow-offline` override warns and is never used by default in the EAS build.
- **C. Faster downloads**: the diff uses the baseline's file hashes when no downloaded pack is active, and remaining files download with bounded concurrency. A first-install pack holds only the downloaded files, and the active content is that pack with the baseline filling any file it lacks (validated as a merged result). Packs staged after that are complete sets. Progress and verification keep their meaning under concurrency, and a failure cancels in-flight requests where the platform allows.
- Dev immediate activation applies only while Beta is selected; a dev device with no stored choice moves to Stable on upgrade, with no migration.
- No change to the manifest or its format version; old apps keep working. Zip bundles are out of scope and would be a separate change if measurements still show slow downloads.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `content-updates`: dev build channel default; baseline always equals the release's stable pack; diff seeded from the baseline; concurrent downloads; progress and atomic activation under concurrency.
- `content-packs`: release builds regenerate the baseline from stable; release check that the baseline matches the published stable pointer.

## Impact

- Code: `src/shell/content/channelSetting.ts`, `runtime.ts`, `updater.ts`, `store.ts` and `resolver.ts` (merged active content), `baseline.generated.ts` generation (`scripts/gen-baseline.mjs`), a new `release:prepare` script and `content:release-check`, the EAS build hook, `package.json` scripts, publish/promote tooling.
- Tests: channel default, updater diff and concurrency, progress, baseline parity and release check.
- No new dependencies, no manifest or `formatVersion` change, no app-store-only requirements.
- Out of scope: zip bundles, changing which media is fetched per World, pointer caching rules.
