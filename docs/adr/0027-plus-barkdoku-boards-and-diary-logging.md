# Plus Members Can Play Fresh Barkdoku Boards Logged in the Diary

ADR 0014 established that only the first solve of a date's Daily Barkdoku counts because repeating the same fixed board is memory rather than deduction. For users with LeadMate Plus (subscribers and users in their 7-day trial), we introduce Plus Boards: subsequent distinct, procedurally generated boards on the same calendar day. Because these are unplayed boards requiring real deduction, their solves are evaluated against Target Time, award Stars, and are logged in the Activity Log for the Diary. To preserve streak integrity, only the first solve sets the Daily Solve Time and credits the Streak. Free Tier users continue to replay the same daily board in practice mode without diary entries.

## Considered Options

- **Overwrite Daily Solve Time if a Plus Board is faster**: rejected; Daily Solve Time reflects the shared daily benchmark board, not subsequent different boards of varying sizes.
- **Do not log Plus Boards in the Activity Log**: rejected; unlike memorized replays, solving fresh boards represents genuine cognitive training and dog handling progress that users want to see recorded in their Diary.
- **Allow Free Tier users unlimited new boards**: rejected; multi-board daily play is an explicit premium feature that drives Plus trial adoption and conversion.
