# Design

## Context

`shouldShowResetSection(signedIn, paired)` in `src/shell/reset.ts` returns `!signedIn && !paired`, and Settings passes `paired = account.sync.dogId !== null`. Signing out (`auth.signOut()` in `AccountScreens.tsx`) clears only the auth session. `sync.dogId` is cleared only by `forgetAccount` (account deletion) and by `resetSync` (after Reset progress). So once a device has synced, the section stays hidden after sign-out.

Reset already writes `NEW_SYNC_STATE` (`dogId: null`). After that, `runSync` takes the "not paired" path. If the account has a Dog, it either replaces a Dog still at the welcome screen or returns `needs-choice`. It never merges. The existing test "after a reset, logging in to an account with a Dog takes that Dog…" in `reset.test.ts` already starts from a paired state (`dogId: 'old-cloud-dog'`) and passes. Allowing reset while paired and signed out therefore needs no change to sync.

## Goals / Non-Goals

**Goals:**
- Reset available whenever signed out.
- Users of a paired device understand that the account copy survives.

**Non-Goals:**
- Resetting while signed in, or resetting the cloud Dog (the `resetGeneration` option in ADR 0009 stays rejected).
- Changing what sign-out does to the sync state.

## Decisions

**Decide visibility from sign-in state alone, and keep the pairing on sign-out.** The alternative was to clear `dogId` on sign-out, which would also make the section reappear. But logging back in to the same account would then go through the not-paired path and ask "which Dog to keep" every time, instead of syncing silently with the paired Dog. That is a regression for the common case of signing out and back in. Reset clears the pairing itself, at the only moment that matters.

**Remove the `paired` parameter from `shouldShowResetSection` instead of ignoring it.** Leaving an unused parameter suggests a rule that no longer exists. The function becomes `shouldShowResetSection(signedIn)`.

**Choose the confirmation copy from `account.sync.dogId !== null`.** This is the same flag the old visibility rule used, so the account note appears exactly in the newly unlocked case. It goes in a separate string (`settings.reset.confirmAccountNote`) shown below `confirmBody`, so the existing text and its translations stay as they are.

## Risks / Trade-offs

- [The user expects reset to wipe the account copy too, and is surprised when it comes back at login] → The confirmation note says so explicitly, and the choose-which-Dog prompt at login shows both Dogs with summaries.
- [Reset clears `trialStartedAt`, so a user who used up their trial can log out, reset and start a new one] → Accepted. Any user who has never signed in can already do this, and it costs them all of the Dog's progress. Closing it belongs in a separate `plus-membership` change (e.g. store-level trials), not here.
- [The user resets and then registers a *new* account] → Already covered: the reset Dog has `dogId: null`, so it uploads as a new Dog ("Old progress not resurrected").
