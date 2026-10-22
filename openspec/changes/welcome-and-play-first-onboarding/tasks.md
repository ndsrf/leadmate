# Tasks

## 1. Steps, routing and the Dog record

- [x] 1.1 Reorder `ONBOARDING_STEPS` in `onboarding/flow.ts` to `welcome, dog, taste, payoff, setup, diagnostic, plan, first-stage, paywall, done`; make `inFunnel` mean "before `done`" and route `paywall` as its own page. Verify with updated `flow.test.ts` and `navigation.test.ts` (every step maps to exactly one screen; `paywall` is not `funnel`).
- [x] 1.2 Add `name: string` to `DogRecord` with a record version bump and a migration that adds `''`; set `NEW_ONBOARDING.step` to `welcome`. Verify with `dogRecord.test.ts`: an old record loads with `name: ''`, a record at `setup` or later keeps its step, a finished record stays `done`.
- [x] 1.3 Make Reset Progress clear name and coat and restore the `welcome` step. Verify with `reset.test.ts`.
- [x] 1.4 Add a name sanitiser (trim, 1 to 20 characters) and verify its unit test for blank, padded and 21-character input.

## 2. Taste Stage

- [x] 2.1 Add the taste scenario config (dog Distractor, high Trigger level, short `activateAfterMeters`, 20-second limit, default snapshot with no Cue skill) and verify it passes the existing scenario validation.
- [x] 2.2 Add a tuning test: a still Handler and a straight-walking Handler both reach Reactive within the limit across several seeds. Verify the test fails when the scenario is made easy.
- [x] 2.3 Run the taste in the shell: end on the first Reactive tier or the time limit, show no Hints, show one fixed control line that goes away at the first input, and never call `applyStage`, `applyActivity` or the hint recorder. Verify with a test that the Dog record differs only in the onboarding step, and with a `seenHints` check.
- [x] 2.4 Closing during the taste leaves the step at `taste`, so a restart plays it again. Verify with a flow test.

## 3. Screens

- [x] 3.1 Build the welcome screen (one primary button, a secondary "I already have an account" link to login, no input) from the Paper Meadow components. Verify it shows for a first-run record only.
- [x] 3.2 Build the name-and-look screen (name field and the coat control moved out of `SetupScreen`; blank name blocks continuing). Verify `SetupScreen` no longer asks for coat and the name is stored.
- [x] 3.3 Build the Payoff Screen (names the Dog, "your Dog" when the name is empty, one button to Dog setup). Verify it shows the same text after a reaction and after the time limit.
- [x] 3.4 Add a name field to Settings that sets or edits the name; existing users are never prompted. Verify the new name appears wherever it is used.
- [x] 3.5 Add the Spanish copy for welcome, the name prompt, the payoff and the control line once supplied, and verify the `catalog-usage` test passes.

## 4. Paywall, registration and login

- [x] 4.1 Move the paywall after the first Stage: `completeFirstStage` sets the step to `paywall` before the registration prompt opens. Verify with `firstStage.test.ts` and a restart-during-registration test that resumes at the paywall.
- [x] 4.2 Make auth reached from the Funnel return to the paywall, not the map, so registration cannot skip it. Verify by creating an account from the prompt and landing on the paywall.
- [x] 4.3 From the welcome screen's login link, a found cloud Dog replaces the first-run record and its own step applies. Verify the Dog chosen at login resumes at its stored step.

## 5. Sync and integration

- [x] 5.1 Carry `name` in the account-sync record schema under the existing last-write-wins rule, and accept records without it. Verify with `sync` tests for a rename and a pre-name record.
- [x] 5.2 Update the README and `GLOSSARY.md` references to the funnel order if present, and verify no doc still describes the paywall before the first Stage.
- [ ] 5.3 Run the full test suite and walk the funnel once on a device from a reset Dog: welcome, name, taste, payoff, setup, Diagnostic, Walk Plan, first Stage, registration, paywall, World Map.

## Workflow follow-up

- Archive the change after review, then verify the synced `onboarding-funnel` spec.
