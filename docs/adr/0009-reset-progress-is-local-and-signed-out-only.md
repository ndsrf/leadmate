# Reset Progress is offered only while signed out and ends the sync Pairing

> **Amended 2026-11:** Reset Progress is now offered whenever no account is signed in, a device still paired with an account's Dog included. Previously a paired, signed-out device (for example after logging out) hid the button, so the only way back to it was deleting the account. Reset still ends the Pairing (`dogId: null`), which is what keeps the old progress from being merged back; logging out keeps the Pairing so that logging back in to the same account syncs silently. On a paired device the confirmation adds that the Dog saved in the account is kept and that logging in again will ask which Dog to keep.

Reset Progress is offered only while no account is signed in (whether or not the device is still paired with a cloud Dog), and it also clears the device's sync pairing (`dogId`, `lastSyncedAt`). Sync merges stars by maximum and unions completed Nodes, Walk Diary and Daily Stage scores (ADR 0006, ADR 0007), so a freshly reset Dog that stayed paired with a cloud copy would have its old progress merged straight back; ending the Pairing on reset prevents that, and the account's Dog itself is never changed. Signed-in users therefore cannot reset (the button is hidden); a signed-out user who later logs in meets the existing choose-which-Dog prompt, with the discarded side backed up for 30 days, instead of a silent merge. The one exception is a reset Dog still at the welcome screen: it holds nothing, so the account's Dog replaces it without a prompt.

This is the one reset path ADR 0007 said did not exist; it is safe only because the reset Dog is no longer paired with any cloud copy to resurrect from.

## Considered options

- **A `resetGeneration` counter that wins whole in `resolve()`:** would allow resetting a signed-in Dog, but needs a record version bump, a Supabase column and a second-device prompt. Rejected for now; revisit if signed-in users need to start over.
- **Delete the cloud Dog on reset, or switch to a new `dog_id`:** destroys data the user did not name and leaves stale devices to push it back.
- **Sign out on reset:** surprising, and it still leaves the cloud copy and pairing behind.

## Consequences

A signed-in user who wants a fresh start logs out and then resets; deleting the account is no longer needed. The account's Dog survives the reset, and logging in again meets the choose-which-Dog rules (or, if the reset Dog is still at the welcome screen, takes the account's Dog). The Pairing is ended by Reset Progress and account deletion, not by sign-out, so signing out and back in to the same account still syncs without a prompt.

Reset clears `trialStartedAt`, so a user whose trial has ended can log out, reset and start a new trial. This is accepted: any never-signed-in user could already do so, and it costs all of the Dog's progress. Closing it belongs in a separate `plus-membership` change (for example store-level trials).
