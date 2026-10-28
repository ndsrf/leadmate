# The Activity Log Is Display-Only

The Diary needs a date and the results of every run, but the progress fields (`completedNodes`, `stars`, `dailyBest`, `readLessons`, the Streak) store no dates or results. We added a separate Activity Log to the Dog record. Nothing reads progress back from it: the progress fields stay the source of truth, and the log repeats some of their facts for display. It keeps only the newest 500 entries and is merged by union on sync, so it can drop or duplicate history without ever changing what the user has earned.

## Considered options

- **Add dates to the progress fields** (dated `completedNodes`, a list of Daily plays instead of the best per day): this would avoid storing the same fact twice, but it changes fields that unlocking, stars and sync merging all read, and it would need a record migration. Rejected.
- **Derive progress from the log**: this would give one source of truth, but trimming the log, or an older device that drops the field, could then take away progress. Rejected.
