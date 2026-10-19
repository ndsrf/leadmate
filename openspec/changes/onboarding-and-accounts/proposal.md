# Proposal

## Why

With the mechanic and training loop proven, new users need a frictionless first run and accounts to persist progress. Phase 3 of 4.

## What Changes

- Add the onboarding funnel: dog and equipment setup, 15-second diagnostic, personalized card and walk plan, 7-day soft paywall (stubbed), registration after the first stage.
- Guide the first stage: explain the leash colors and the Marker, and show the Poste when needed (playtesters did not notice them unaided).
- Ask for the dog's and the Handler's weight in setup; their ratio sets how strongly the Handler can pull the dog (stand-in config value in `base-leadmate`).
- Add Supabase auth, remote level configs, and sync of profile data with migration of local data on registration.

## Capabilities

### New Capabilities
- `onboarding-funnel`: First-run flow with deferred registration. (Backend/auth requirements to be added as a spec when designed.)

### Modified Capabilities

(none)

## Impact

- Depends on `training-loop-and-learning`. Adds Supabase schema with RLS and auth screens. Design and tasks are still to be written.
