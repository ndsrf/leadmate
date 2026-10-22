# Reset Progress exists only for Dogs with no cloud copy and detaches the sync pairing

Reset Progress is offered only while no account is signed in and the device is not paired with a cloud Dog (`dogId` empty), and it also clears the device's sync pairing (`dogId`, `lastSyncedAt`). Sync merges stars by maximum and unions completed Nodes, Walk Diary and Daily Stage scores (ADR 0006, ADR 0007), so a freshly reset Dog paired with a cloud copy would have its old progress merged straight back. Signed-in users therefore cannot reset (the button is hidden); a signed-out user who later logs in meets the existing choose-which-Dog prompt, with the discarded side backed up for 30 days, instead of a silent merge. The one exception is a reset Dog still at the welcome screen: it holds nothing, so the account's Dog replaces it without a prompt.

This is the one reset path ADR 0007 said did not exist; it is safe only because it never has a cloud copy to resurrect from.

## Considered options

- **A `resetGeneration` counter that wins whole in `resolve()`:** would allow resetting a signed-in Dog, but needs a record version bump, a Supabase column and a second-device prompt. Rejected for now; revisit if signed-in users need to start over.
- **Delete the cloud Dog on reset, or switch to a new `dog_id`:** destroys data the user did not name and leaves stale devices to push it back.
- **Sign out on reset:** surprising, and it still leaves the cloud copy and pairing behind.

## Consequences

A signed-in user who wants a fresh start must delete the account first (account deletion keeps local data, so they then reset). The pairing is cleared by Reset Progress, not by sign-out, so signing out alone still keeps syncing semantics unchanged.
