# Proposal

## Why

Barkdoku already measures nothing the user can see: the engine stamps a start and end time and computes `durationSeconds`, but the board shows no clock, nothing keeps the time, and a Daily Barkdoku solve leaves no trace in the Diary (it only credits the Streak). A visible Solve Time with a Target Time per difficulty gives the Daily Barkdoku a reason to come back, and logging it makes the Diary a full record of what the user did. The Spanish name "Zona de Calma" also reads as a place rather than a game; the game becomes "Guaudoku" for Spanish users.

## What Changes

- **Solve timer**: the Barkdoku board shows an `m:ss` clock next to the treats. It starts at the first tap (reading the rules costs no time), counts only time with the app in the foreground, and starts over when the board is reset or retried. The solved card shows the final Solve Time.
- **Target Time by difficulty**: every non-tutorial board has a Target Time, by default from its size (4×4 1:00, 5×5 2:00, 6×6 3:00, 7×7 4:00, 8×8 6:00, 9×9 8:00), with an optional per-board override. Tutorial boards have none. Past the target the clock changes tone but play is never cut short.
- **Time in the rating**: on a board with a Target Time, 3 Stars need a clean solve (0 mistakes) within it; a clean solve over it earns 2 Stars. Mistakes rate as before (1 mistake 2★, 2 or more 1★). Tutorial boards are rated by mistakes only, so the World 3 Barkdoku Node is unaffected today.
- **Only the first Daily Barkdoku solve of a day counts**: it sets that date's **Daily Solve Time** and Stars, is logged and credits the Streak. Reopening the board later that day is practice, marked "Práctica": the clock runs, but no Stars, nothing saved, logged or credited. See ADR 0014.
- **Daily Barkdoku chip on the map**: the existing chip keeps opening the date-seeded board, now timed. Before today's first solve it shows a highlighted "new" state; after, today's Daily Solve Time against the Target Time (✓ when within it).
- **Daily Solve Time kept**: the record keeps each date's first solve (time and moment), synced by keeping the earlier solve and cleared by Reset Progress.
- **Diary**: each first Daily Barkdoku solve is logged in the Activity Log with board size, difficulty, Solve Time, Target Time, mistakes and Stars; Barkdoku Node runs also keep their Solve Time. The Diary shows a Daily Barkdoku mark, a day-card line with the Daily Solve Time against target (read from the record, so it survives log trimming) and a total of Daily Barkdoku solves.
- **Spanish name**: every user-facing "Zona de Calma" that names the game becomes "Guaudoku" (title, map chip, World 3 Stop title, solved title, intro card); the region conflict message says "la misma zona". Internal ids such as `calm-zone-intro` are unchanged, so no saved progress moves.

Out of scope: a board picker by difficulty, leaderboards, more boards (the 8-board daily rotation repeats; accepted), logging failed or practice attempts, and renaming internal ids.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `barkdoku-puzzle`: adds the Solve Time clock, the Target Time per non-tutorial board, the time condition on 3 Stars, Daily Barkdoku practice, and the Spanish name. (Introduced by the in-flight `barkdoku-puzzle-game` change.)
- `activity-diary`: logs first Daily Barkdoku solves and shows them, the Daily Solve Time and Barkdoku Node times in the Diary. (Introduced by the in-flight `diary-screen` change.)
- `world-map-screen`: the Daily Barkdoku chip shows today's state and Daily Solve Time.
- `account-sync`: conflict resolution keeps the earlier first Daily Barkdoku solve per date.

## Impact

- Ordering: `barkdoku-puzzle-game` and `diary-screen` must be archived before this change, since its deltas build on the `barkdoku-puzzle` and `activity-diary` specs and on the `account-sync` requirement as `diary-screen` rewrites it.
- Code: `src/shell/puzzle/` (types, engine timing, target times, rating), `src/shell/screens/BarkdokuView.tsx` (clock, target, practice, solved card, background pause), `src/shell/activity.ts` (new `barkdoku` kind and summary), `src/shell/dogRecord.ts` (`dailyBarkdoku`, first-solve recorder), `src/shell/sync/merge.ts`, `src/shell/nodes/node.ts` (carry the puzzle summary into the Node entry), `src/shell/diary.ts` and `src/shell/screens/DiaryScreen.tsx`, `src/shell/screens/WorldMapScreen.tsx`, `App.tsx`, `src/shell/stars.ts` (doc comment), `src/i18n/es.ts`.
- Record: new `dailyBarkdoku` field and a new Activity Log kind, both read leniently with no version bump. Older app versions drop the unknown entries on read, as the log is designed to.
- Docs: glossary terms Daily Barkdoku, Solve Time, Target Time and Daily Solve Time; ADR 0014.
- No new dependencies.
