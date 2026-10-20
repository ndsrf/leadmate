# Keep the app local-first and sync profile data to Supabase as a replica

The app is fully playable with no account and no network: the Dog, Equipment, weights, Trigger Profile, Learning Attributes, Streak and Walk Diary live in local storage, which stays the source of truth. After registration, Supabase holds a replica of that data. Sync resolves conflicts per record by last-write-wins on `updatedAt`, except that Walk Diary entries merge as a union by date and Node, completed Nodes as a union, Daily Stage scores as the best per date, and the Streak keeps the run that was active later with the longer best (a Streak is stored as a run, not as separate days); Learning Attributes are never blended field by field. When a user registers or logs in on a device and the account already has a Dog, the user explicitly chooses which Dog to keep, and the discarded side is backed up locally for 30 days. Remote level configs are validated against the bundled schema, versioned, recorded as `configVersion` in the Stage payload, and fall back silently to bundled configs. Daily Stages always use the bundled generator (ADR 0005). Terms follow `GLOSSARY.md`.

## Considered options

- **Server as source of truth (online-required):** would break the deferred-registration funnel and make walks unplayable offline.
- **Field-level merge of Learning Attributes:** could produce a combination the Dog never actually learned, and is hard to explain to the user.
- **Silent merge or overwrite on login to an existing account:** risks destroying weeks of training with no recovery.

## Consequences

Registration is never a gate to play, and the simulation stays free of storage and network access (ADR 0002, ADR 0003). A user who skips registration risks losing data on device loss, so the app reminds them at defined moments. One Dog per account in v1, though rows are keyed by `dog_id` and `user_id` so more can be added later.
