# Design

## Context

The Checkpoint step presents a timed question testing canine training concepts. The duration is configured via `record.checkpointSeconds` and resolved via `checkpointLimit(setting)` in `src/shell/nodes/node.ts`. Currently, `CheckpointSeconds` is typed as `0 | 5 | 10`, with a default of `5` in `newDogRecord()`. In `src/shell/screens/SettingsScreen.tsx`, `CHECKPOINT_OPTIONS` exposes 5s, 10s, and 0s ("Sin límite").

See `proposal.md` for motivation and `specs/training-node-loop/spec.md` for requirements.

## Goals / Non-Goals

**Goals:**
- Update `CheckpointSeconds` union type to `0 | 10 | 15 | 20`.
- Change default Checkpoint duration to 15 seconds for new Dog records.
- Gracefully migrate and normalize existing stored records containing `5` (or unrecognised values) to `15`.
- Update `CHECKPOINT_OPTIONS` in `SettingsScreen.tsx` to 20s, 15s, 10s, and Sin límite (0s).
- Provide localization strings for 20s and 15s in Spanish catalog (`src/i18n/es.ts`).
- Update unit tests across `dogRecord`, `node`, and reset routines.

**Non-Goals:**
- Modifying the countdown ticker implementation in `NodeScreens.tsx` or `ProgressBar` run-down logic.
- Allowing arbitrary custom durations (options remain fixed discrete choices).
- Altering the Debrief scoring or review mechanisms.

## Decisions

### Decision 1: Update `CheckpointSeconds` type
- **Choice**: `export type CheckpointSeconds = 0 | 10 | 15 | 20;`
- **Rationale**: Retains TypeScript compile-time guarantees across shell components (`App.tsx`, `SettingsScreen.tsx`, `dogRecord.ts`, `node.ts`).
- **Alternatives considered**: Leaving it as generic `number`, which would weaken type safety and allow invalid durations.

### Decision 2: Normalization and migration strategy
- **Choice**: In `readDogRecord` / deserialization in `src/shell/dogRecord.ts`:
  ```ts
  checkpointSeconds: checkpoint === 0 || checkpoint === 10 || checkpoint === 15 || checkpoint === 20 ? checkpoint : 15
  ```
- **Rationale**: Existing records with value `5` (previously the default) or invalid values will seamlessly update to the new default of `15`. Users who explicitly picked `10` or `0` ("Sin límite") will retain their preference.
- **Alternatives considered**: Incrementing `RECORD_VERSION` and writing a dedicated schema migration. Unnecessary because the existing record deserializer already normalizes every field in-place without bumping `RECORD_VERSION`.

### Decision 3: Option ordering in Settings UI
- **Choice**: Display options in `CHECKPOINT_OPTIONS` as: 20s, 15s, 10s, and Sin límite (0s).
- **Rationale**: Matches user prompt specifications and keeps timed options descending, ending with the untimed option.

### Decision 4: Localization catalog keys
- **Choice**: Add `settings.checkpoint.20` ("20 s") and `settings.checkpoint.15` ("15 s") to `src/i18n/es.ts`. Keep `settings.checkpoint.10` ("10 s") and `settings.checkpoint.off` ("Sin límite").
- **Rationale**: Consistent with existing naming convention in `es.ts`.

## Risks / Trade-offs

- **[Risk] Existing records with 5s fail type checking or persist invalid state** → Normalization fallback in `dogRecord.ts` maps any value outside `{0, 10, 15, 20}` to `15`.
- **[Risk] Test breakage in existing suites** → Audit and update all unit test assertions expecting `5` (e.g. `node.test.ts`, `reset.test.ts`).
