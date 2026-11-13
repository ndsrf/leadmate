# Tasks

## 1. Dev defaults to Stable

- [x] 1.1 Remove the `isDev` branch in `src/shell/content/channelSetting.ts` and the `runtime.ts` fallback so the default is stable in every build; update `channelSetting.test.ts` and `runtime.test.ts` and verify they pass, including "dev build with no stored choice follows stable" and "dev build remembers Beta".
- [x] 1.2 Limit immediate activation in dev to Beta in `updater.ts` / `runtime.ts`; verify `devRuntime.test.ts` and `updater.test.ts` cover "dev on Beta applies at once" and "dev on Stable activates at next launch".

## 2. Baseline hashes and regeneration

- [x] 2.1 Make `scripts/gen-baseline.mjs` also emit `baseline.hashes.generated.ts` (relative path to sha256 for text and structure files, using the build's hashing); verify a test shows the index matches `content/stable` hashes and that two generations are identical.
- [x] 2.2 Regenerate `baseline.generated.ts` and the hash index, and verify `parity.test.ts` still passes.

## 3. Release path and check

- [x] 3.1 Add `scripts/content-release-check.mjs` (`content:release-check`) comparing the baseline version and hashes with the published stable pointer and manifest, text and structure files only, with the spec's messages for older, newer, differing content, unreachable host and `--allow-offline`; verify with unit tests covering every release-check scenario, including "images are not compared".
- [x] 3.2 Add `release:prepare` running `sim:embed`, then `gen-baseline`, then `content:release-check`, stopping on the first failure; point `eas-build-post-install` at it (without `--allow-offline`) and verify by running it against a stubbed host and checking the order and exit codes.

## 4. Merged active content

- [x] 4.1 Make the resolver and store treat the active content as the installed pack's files with the baseline filling any file the installed pack lacks (Stable only); verify `resolver.test.ts` and `store.test.ts` cover a partial pack and Beta never using the baseline.
- [x] 4.2 Validate the merged result before activation and keep the previous content when it fails; verify with a test for "merged pack fails validation".

## 5. Updater diff and concurrency

- [x] 5.1 Seed the diff from the merged hashes (installed manifest plus baseline index) in `updater.ts`, so first install skips files matching the baseline and stages only downloaded files; verify `updater.test.ts` for "first install seeded from the baseline" and "Beta has no baseline".
- [x] 5.2 Stage every pack after the first as a complete set, copying from the installed pack and the baseline's files; verify a test for "update after a partial first install".
- [x] 5.3 Replace the serial download loop with a worker pool (one constant, limit 6) that keeps the priority order, cancels in-flight requests on failure where supported and never stages their results; verify tests for concurrent downloads, out-of-order completion and "one of several fails".
- [x] 5.4 Make progress count finished files and never decrease under concurrency; verify the progress test for "progress under concurrency" and that the banner tests still pass.

## 6. Integration

- [x] 6.1 Run `npm test`, the type check and `openspec validate align-content-with-production-stable`; verify all pass.
- [x] 6.2 In a dev build, check that a first launch follows Stable, Beta can be selected and is remembered, and that a first-install stable update downloads only files that differ from the baseline.

## Workflow follow-up

- Run `release:prepare` against the published stable host before the next release.
- Archive the change after review.
