# Trial Lifecycle, Value Recap, and Video Gating

LeadMate Plus features (such as Day Skips, Plus Worlds, and technique video demonstrations) are available during a 7-day Trial. We derive trial lifecycle states (`unstarted`, `active`, `expired`) purely from `trialStartedAt` and `now`, present a celebratory Value Recap screen once upon the first cold start after expiration, and gate video embeds while keeping all reading text, tips, and illustrations completely free and offline-first.

## Considered Options

- **Mutable trial state flags in DogRecord:** Storing state flags (e.g. `trialExpired: boolean`) causes drift across offline sync and clock changes. Rejected in favor of pure derivation from `trialStartedAt` and `now`.
- **Gating full theory lessons:** Requiring Plus to read theory lessons would violate the app's educational mission and offline-first reading promise ([ADR 0008](0008-web-hosted-tutorials-and-placeholders.md), [ADR 0011](0011-embed-youtube-video-in-lessons.md)). Rejected: text, illustrations, and tips remain completely free; only third-party video embeds require Plus.
- **Showing Value Recap on every locked interaction after expiration:** Repeating the retrospective achievements when tapping a locked feature disrupts task flow. Rejected: the recap runs once on initial post-trial cold start; subsequent locked triggers route directly to the standard subscription paywall.
- **Persisting per-video playback records:** Adding individual video playback tracking to `DogRecord` would force a schema version bump and sync merge handlers for a display-only metric. Rejected: achievements are derived cleanly from completed video-bearing lessons in `readLessons`.

## Consequences

- `trialDaysRemaining` counts integer days from 1 to 7 without needing server polling or local storage mutators.
- A user whose trial expires retains full access to their dog attributes, streak, completed lessons, and free Worlds 1-4.
- Pending actions (`PendingPlusAction`) cleanly resume either a skipped mission or an autoplayed video when a user activates Plus.
