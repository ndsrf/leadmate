# Tasks

## 1. Data Model and Migration

- [x] 1.1 Update `CheckpointSeconds` type in `src/shell/dogRecord.ts` to `0 | 10 | 15 | 20`, set default `checkpointSeconds: 15` in `newDogRecord()`, and update record deserialization/normalization in `dogRecord.ts` to migrate `5` and invalid values to `15`; verify with unit tests covering default values and migration of existing records
- [x] 1.2 Update `src/shell/nodes/node.test.ts` and `src/shell/reset.test.ts` assertions for `checkpointLimit` and default `checkpointSeconds` to verify that 10, 15, 20 return their respective limits and 0 returns null

## 2. Localization and Settings UI

- [x] 2.1 Add localization keys for 20s and 15s (`settings.checkpoint.20` and `settings.checkpoint.15`) in `src/i18n/es.ts` and verify with `src/i18n/catalog-usage.test.ts`
- [x] 2.2 Update `CHECKPOINT_OPTIONS` in `src/shell/screens/SettingsScreen.tsx` to list 20s, 15s, 10s, and "Sin límite" (0s) with their corresponding localization keys; verify in the Settings UI that selecting each option updates `record.checkpointSeconds`

## 3. Integration Verification

- [x] 3.1 Run full project test suite (`npm test`) to verify all dog record, node loop, and catalog tests pass with the new timer options
