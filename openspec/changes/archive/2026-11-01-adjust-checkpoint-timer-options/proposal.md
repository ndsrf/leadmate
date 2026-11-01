# Proposal

## Why

The current 5-second Checkpoint timer is too short for users to comfortably read the question and three options before answering, causing unintended timeouts and friction during learning loops. Adjusting the initial default timer to 15 seconds and updating settings choices to 20s, 15s, 10s, and untimed ("Sin límite") gives users sufficient time to read and evaluate questions while preserving accessible pacing.

## What Changes

- **Default Checkpoint Duration**: Change the initial default Checkpoint timer limit from 5 seconds to 15 seconds for newly created Dog records and unconfigured states.
- **Settings Options**: Update the Checkpoint timer options in Settings to 20 seconds, 15 seconds, 10 seconds, and untimed (off / 0s).
- **Remove 5-second Option**: Remove the 5-second option from Settings and type definitions because it is too brief.
- **Record Migration / Normalization**: Update `CheckpointSeconds` type to `0 | 10 | 15 | 20` and migrate/normalize existing records with `checkpointSeconds: 5` (or invalid values) to 15 seconds.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `training-node-loop`: Update default Checkpoint question time limit from 5 seconds to 15 seconds, and update settings options to 20s, 15s, 10s, and timer off (0s).

## Impact

- **Type and State (`src/shell/dogRecord.ts`)**: `CheckpointSeconds` union type changes from `0 | 5 | 10` to `0 | 10 | 15 | 20`; `newDogRecord()` default `checkpointSeconds` becomes 15; record deserialization/normalization migrates `5` or unrecognised values to 15.
- **UI (`src/shell/screens/SettingsScreen.tsx`)**: `CHECKPOINT_OPTIONS` updated to 20s, 15s, 10s, and 0s (off).
- **Localization (`src/i18n/es.ts`)**: Add keys for 20s and 15s (`settings.checkpoint.20`, `settings.checkpoint.15`), retain 10s and off; clean up or deprecate 5s key.
- **Tests**: Update `node.test.ts`, `reset.test.ts`, and any serialization / settings tests asserting `checkpointLimit` or default `checkpointSeconds`.
