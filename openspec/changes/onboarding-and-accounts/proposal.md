# Proposal

## Why

With the mechanic and training loop proven, new users need a frictionless first run and accounts to persist progress. Phase 3 of 4.

## What Changes

- Add the onboarding funnel: Dog and Equipment setup, a behavior questionnaire (does the Dog bark at children, bicycles, other dogs...) that fills the Trigger Profile defined in `training-loop-and-learning`, the Diagnostic, a personalized card and Walk Plan, a 7-day soft paywall (stubbed), and registration offered after the first Stage. The funnel resumes where it was interrupted.
- Guide the first Stage with one-shot hints for the leash colors, the Marker and the Poste (playtesters did not notice them unaided).
- Ask for the Dog's and the Handler's weight in setup; their ratio sets how strongly the Handler can pull the Dog, replacing the stand-in `pullStrength` constant in `base-leadmate`.
- Add Supabase email/password auth, a local-first replica of profile data with explicit handling of an account that already has a Dog, validated remote level configs, and account deletion. See [ADR 0006](../../../docs/adr/0006-local-first-sync.md).
- Route every new string through the i18n catalog.

## Capabilities

### New Capabilities
- `onboarding-funnel`: First-run flow with deferred, skippable registration.
- `account-sync`: Auth, local-first sync of profile data, conflict handling, remote level configs and account deletion.

### Modified Capabilities

(none)

## Out of scope

- Real billing and entitlement checks (the paywall is a stub).
- Leaderboards (ADR 0005 only requires that score, date and seed could be submitted later).
- Social login and more than one Dog per account in the UI.

## Impact

- Depends on `training-loop-and-learning`. Adds a Supabase schema with RLS keyed by `user_id` and `dog_id`, and auth screens. Design and tasks are still to be written.
