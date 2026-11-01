# Proposal

## Why

Once a device has ever been signed in to an account, the Reset progress section disappears from Settings for good. Signing out does not bring it back, because signing out leaves the device linked to the account's Dog (`sync.dogId` stays set) and the section is hidden while that link exists. To users this looks like the button has been removed. Today the only way to get it back is to delete the account. Reset already unlinks the device and sync never merges into an unlinked device without asking, so hiding the section while signed out does not protect anything.

## What Changes

- Settings shows the Reset progress section whenever no account is signed in, whether or not the device is still linked to an account's Dog. It stays hidden while signed in (no change).
- If the device is still linked to an account's Dog, the confirmation adds one sentence: the Dog saved in the account is not erased, and logging in again will ask which Dog to keep.
- Reset behaves as it does today (it already unlinks the device from the account's Dog). After a reset, logging in follows the existing choose-which-Dog rules: the account's Dog replaces the reset one if the user is still at the welcome screen; otherwise the app asks which to keep.
- The signed-out text in Settings' Account section gets a second version for a paired device ("your Dog is still saved in your account but doesn't sync until you log in again"), so it no longer contradicts the reset confirmation by saying the progress is only on this device.
- ADR 0009 is amended in place, with a dated note: the rule becomes "signed out" instead of "signed out and not linked to an account's Dog".

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `progress-reset`: the "Reset progress action" requirement no longer hides the section for a signed-out device that is still linked to an account's Dog. The "Explicit confirmation" requirement adds a note that the account copy is kept when the device is paired.
- `account-sync`: adds a "Signed-out account status" requirement that tells a never-paired device apart from one that is still paired.

## Impact

- `src/shell/reset.ts`: `shouldShowResetSection` drops the `paired` argument.
- `src/shell/screens/SettingsScreen.tsx`: visibility call site, plus the extra confirmation sentence when `account.sync.dogId !== null`.
- `src/i18n/es.ts`: two new strings (the account-copy note in the confirmation and the paired signed-out status).
- `src/shell/screens/AccountScreens.tsx`: the signed-out branch of `AccountSection` picks its text based on the Pairing.
- `GLOSSARY.md`: Reset Progress reworded; **Pairing** added (already done during the review).
- `src/shell/reset.test.ts`: the "hidden while paired" test flips; the existing reset-then-log-in test already covers resetting from a linked state.
- `docs/adr/0009-reset-progress-is-local-and-signed-out-only.md`: amended.
- No sync, storage format or backend changes.
