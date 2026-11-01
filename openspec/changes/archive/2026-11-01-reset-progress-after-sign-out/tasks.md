# Tasks

## 1. Visibility rule

- [x] 1.1 In `src/shell/reset.ts`, change `shouldShowResetSection` to take only `signedIn` and return `!signedIn`, and update its doc comment (shown whenever signed out; reset itself unlinks the device from the account's Dog). Verify with `npx tsc --noEmit`, which flags any caller still passing `paired`.
- [x] 1.2 In `src/shell/reset.test.ts`, replace the "section hidden while the device is paired…" test with one saying the section is shown when signed out whether or not the device is paired. Verify that `npx jest src/shell/reset.test.ts` passes, including the existing "after a reset, logging in to an account with a Dog takes that Dog…" test (it already covers resetting from a paired state).
- [x] 1.3 In `src/shell/screens/SettingsScreen.tsx`, call `shouldShowResetSection(account.signedIn)`. Verify that a render test in `src/shell/screens/SettingsModal.test.tsx` (or `SettingsScreen.test.tsx`) shows the Reset section for `signedIn: false` with `sync.dogId: 'd1'`, and hides it for `signedIn: true`.

## 2. Confirmation note for paired devices

- [x] 2.1 Add `settings.reset.confirmAccountNote` to `src/i18n/es.ts` (e.g. "El perro guardado en tu cuenta no se borra. Si vuelves a iniciar sesión, te preguntaremos con qué perro quieres quedarte."). Verify that `npx jest src/i18n` passes, including the catalog-usage check.
- [x] 2.2 In the Settings reset confirmation modal, render the note below `confirmBody` only when `account.sync.dogId !== null`. Verify with render tests: the note appears when paired and is absent when `dogId` is `null`.

## 3. Signed-out account status

- [x] 3.1 Add `account.signedOutPaired` to `src/i18n/es.ts` ("Sesión cerrada: tu perro sigue guardado en tu cuenta, pero no se sincroniza hasta que vuelvas a iniciar sesión."). In the signed-out branch of `AccountSection` (`src/shell/screens/AccountScreens.tsx`), show it when `account.sync.dogId !== null`, otherwise `account.signedOut`. Verify with render tests for both cases and that `npx jest src/i18n` passes.

## 4. Decision record and docs

- [x] 4.1 Amend `docs/adr/0009-reset-progress-is-local-and-signed-out-only.md` in place (keep the file name), adding a dated "Amended 2026-11" note: Reset Progress is offered whenever signed out, a paired device included. It still ends the Pairing; logging out keeps the Pairing so that logging back in syncs silently. Update the Consequences paragraph (deleting the account is no longer needed to reset after logging out) and record the accepted fresh-trial trade-off. Verify by reading it back: the ADR no longer says a paired signed-out device hides the button.
- [x] 4.2 Update the Purpose line of `openspec/specs/progress-reset/spec.md` to drop "local-only Dog" (match the new glossary wording). Verify with `openspec validate --specs --strict`.
- [x] 4.3 Run the full suite (`npx jest`) and `npx tsc --noEmit`, and verify both pass.

## Workflow follow-up

- Manually check on a device: sign in, let it sync, log out, open Settings and confirm Reset progress is visible with the account note in its confirmation.
- Archive the change with `/opsx:archive` after review.
