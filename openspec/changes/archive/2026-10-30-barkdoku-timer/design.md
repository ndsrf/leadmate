# Design

## Context

- The engine (`src/shell/puzzle/engine.ts`) is pure and already stamps `startTime` at `createPuzzle` and `endTime` on solve/fail; `computeMetrics` derives `durationSeconds` from wall-clock time, so time in the background and time reading the rules are counted today. Stars come from mistakes only (0 → 3★, 1 → 2★, 2+ → 1★).
- The World 3 Node (`calm-zone-intro`) plays the 4×4 tutorial board and uses `barkdokuResult` to turn metrics into a handling score (1000 − 200 per mistake) so `starsFor` (650 → 2★, 850 → 3★) gives the same Stars as the board.
- The Daily Barkdoku is reached from the map chip through the `puzzle` flow in `App.tsx`, pinned to the date it was opened (`getDailyBoard(f.date)`), chosen from the 8 boards of size 5–8. On solve it only calls `applyActivity` (Streak), so nothing is logged and no time is kept. `onFinish` fires only from the solved card's Continue button.
- The Activity Log (`src/shell/activity.ts`) validates kinds against a fixed list and drops unknown ones; the Diary model (`src/shell/diary.ts`) groups entries by day, reads `dailyBest` from the record for each day, and computes totals. ADR 0013: progress lives in record fields, the log only repeats it for display.
- `power-efficiency` requires screen timers to stop when the screen is hidden or the app is backgrounded, and forbids re-rendering React on every tick of a minigame timer. `watchAppActive` in `src/shell/ui/live.ts` already wraps `AppState`.
- The `barkdoku-puzzle` and `activity-diary` specs exist only in the in-flight `barkdoku-puzzle-game` and `diary-screen` changes; this change's deltas assume both are archived first.
- Terms follow `GLOSSARY.md` (Daily Barkdoku, Solve Time, Target Time, Daily Solve Time); the rating and first-solve rules are recorded in ADR 0014.

## Goals / Non-Goals

**Goals:**
- Keep timing in the pure engine so it is unit-testable with injected `now` values, as the rest of the engine is.
- One rating rule shared by the Daily Barkdoku and the Node.
- Reuse the existing Activity Log, `dailyBest` and Diary patterns rather than adding new mechanisms.

**Non-Goals:**
- History of practice solves, per-board best times or leaderboards.
- Retuning targets from real play data (targets are constants to adjust later).
- Changing the failed/retry flow, or renaming internal ids (`calm-zone-intro`, `minigame.barkdoku.*` keys, `barkdoku` kinds).

## Decisions

### Active-time accounting in the engine
Replace the wall-clock pair with an accumulator: `BarkdokuState` keeps `elapsedMs` (time banked so far), `runningSince: number | null` and `started: boolean`. `createPuzzle`/`resetPuzzle` start at `elapsedMs = 0`, `runningSince = null`, `started = false`, so the clock waits for the first tap: `toggleCell` sets `started = true` and `runningSince = now` on the first accepted tap of an attempt. New pure functions `pausePuzzle(state, now)` (bank `now − runningSince`, set `null`), `resumePuzzle(state, now)` (set `runningSince = now` only if `started` and still playing) and `elapsedMs(state, now)`. `toggleCell` banks time and sets `runningSince = null` when the status becomes `solved` or `failed`, which freezes the clock. `startTime`/`endTime` are removed (only the engine and its tests use them).
- *Alternative*: keep `startTime` and subtract a `pausedMs` total. Rejected: two clocks to keep consistent, and a pause in flight is awkward to express.

### Target times
`targetSecondsFor(board): number | undefined` in `src/shell/puzzle/` returns `undefined` for `difficulty === 'tutorial'`, else `board.targetSeconds` when set, else a size table `{4: 60, 5: 120, 6: 180, 7: 240, 8: 360, 9: 480}`. Keyed by size, not `difficulty`, because 6×6 and 7×7 share "medium" while needing different budgets. `BarkdokuBoard` gains optional `targetSeconds`.

### One rating rule
`ratePuzzle(mistakes, withinTarget): Stars` — 0 mistakes & within target → 3, 0 mistakes over target → 2, 1 → 2, 2+ → 1. `computeMetrics` returns `durationSeconds` (active time, minimum 1), `targetSeconds` (may be `undefined`), `withinTarget` (`true` when there is no target, else `durationSeconds <= targetSeconds`) and `stars` from `ratePuzzle`. `barkdokuResult` keeps its formula and caps the score at 800 when `withinTarget` is false, so 0 mistakes over target lands on 2★ and 1 or 2 mistakes are unchanged; a test pins `starsFor(barkdokuResult(m).handlingScore) === m.stars` across all cases. The `starsFor` doc comment ("never time or taps") is updated to name Barkdoku's Target Time cap as the one exception, pointing to ADR 0014.

### Clock rendering within the power budget
A small `PuzzleClock` component inside `BarkdokuView` holds its own 1 Hz `setInterval` while `runningSince !== null` and reads `elapsedMs(state, Date.now())`; only it re-renders, and only when the displayed second changes (a discrete change, as `power-efficiency` allows). The view subscribes through `watchAppActive(AppState, …)`: going inactive dispatches `pausePuzzle` and the interval stops; becoming active dispatches `resumePuzzle`. The clock shows `m:ss` with `Objetivo m:ss` below when there is a target; past it the clock switches to the warning tone token. Its accessibility label is "Tiempo m:ss, objetivo m:ss" (target part omitted when absent), with no live region. `formatClock(seconds)` lives in the puzzle module and is reused by the map chip and the Diary.

### Practice mode
`BarkdokuView` gains a `practice?: boolean` prop. `App.tsx` passes `practice = record.dailyBarkdoku[f.date] !== undefined` when opening the `puzzle` flow. In practice the header shows a "Práctica" badge, the solved card shows the Solve Time with no Stars or target mark and the line "Tu resultado de hoy se mantiene", and `onFinish` in `App.tsx` goes straight home without touching the record. Failed attempts before the first solve are not practice: nothing is saved until a solve.

### Carrying puzzle numbers out of the view
`puzzleSummary(board, metrics): PuzzleSummary` builds `{ size, difficulty?, durationSeconds, targetSeconds?, mistakes }`, passed out through `onFinish` with the metrics.
- Daily: `App.tsx` calls a new `recordDailyBarkdoku(record, summary, stars, boardDate, now)` in `dogRecord.ts` instead of bare `applyActivity`. If `dailyBarkdoku[boardDate]` already exists it only marks the Streak (defensive; the view is in practice mode then). Otherwise it marks the Streak, sets `dailyBarkdoku[boardDate] = { seconds, at: now.toISOString(), targetSeconds? }` and adds an Activity Log entry `{ kind: 'barkdoku', id: board.id, stars, puzzle: summary }`. The Daily Solve Time is keyed by the board's pinned date; the log entry and the Streak use `now`, as every other entry does.
- Node: the `minigame` result type gains optional `puzzle?: PuzzleSummary`; `App.tsx`'s Barkdoku branch passes it through `finish`, and `onDebrief` copies it into the Node entry next to `metrics`.

### Record, sync and reset
`DogRecord.dailyBarkdoku: Record<string, { seconds: number; at: string; targetSeconds?: number }>`, default `{}`, read with a lenient reader (valid date keys, finite positive `seconds`, parseable `at`); no version bump, as with `activityLog`. Storing `targetSeconds` keeps the Diary and chip correct if board targets are retuned later. `sync/merge.ts` merges it per date by keeping the entry with the earlier `at`. Reset Progress builds a fresh record, so it clears with no extra code; a reset test asserts it.
- *Alternative*: derive the Daily Solve Time from the log. Rejected by ADR 0013 (the log is trimmed and display-only).

### Activity Log and Diary
`ActivityKind` gains `'barkdoku'`; `ActivityEvent` gains optional `puzzle?: PuzzleSummary`, validated by `readPuzzle` (finite numbers, size 4–9) on read. `DiaryDay` gains `dailyBarkdoku?` read from the record, like `dailyBest`. `DAY_MARKS` gains `'barkdoku'` (after `'daily'`), with its own colour token, legend label ("Guaudoku") and screen-reader name; `DiaryTotals` gains `barkdokuSolves`, counted from days with a Daily Solve Time so trimmed or duplicated log entries do not skew it. `DiaryScreen` renders the day's Daily Solve Time line (`m:ss / m:ss`, target-met mark), each `barkdoku` log entry (time of day, "Guaudoku N×N", Solve Time, mistakes, Stars), and the Solve Time on Barkdoku Node entries. Barkdoku entries do not feed `bestScore`.

### Map chip
`WorldMapScreen` takes `barkdokuToday?: { seconds: number; targetSeconds?: number }` from `record.dailyBarkdoku[today]`. The chip mirrors the Daily Stage chip: `highlight` + "nuevo" when unsolved, else `m:ss / m:ss` with ✓ when within target (just `m:ss` when there is no target).

### Spanish name
In `src/i18n/es.ts`, `minigame.barkdoku.title`, `map.barkdoku.daily`, `node.barkdoku.title`, `minigame.barkdoku.solvedTitle` and `node.barkdoku.vcard1` name the game "Guaudoku" (masculine: "¡Guaudoku resuelto!", "Mundo 3 · Guaudoku", "En el Guaudoku, coloca…"), and `minigame.barkdoku.conflictRegion` says "la misma zona". Keys and ids are unchanged. Code comments that say `Barkdoku ("Zona de Calma")` drop the old name.

## Risks / Trade-offs

- [Targets may be too tight or too loose for real players] → constants in one table plus a per-board override; easy to retune without spec changes, and stored solves keep the target they were played against.
- [Adding time to Stars changes the meaning of 3★] → only boards with a Target Time are affected; the only Node today uses a tutorial board, so no Node outcome changes.
- [8 boards rotate, so a returning user meets a known board about every 8 days] → accepted; times are compared only within a date, and first-solve-only stops same-day memorisation. More boards are a separate change.
- [Older app versions on a synced account drop `barkdoku` log entries when they rewrite the log] → accepted; the log is display-only and the Diary's Daily Solve Time comes from `dailyBarkdoku`, which older versions also drop but newer devices restore on merge.
- [The Daily Solve Time's date (board date) and its log entry's date (solve moment) differ when a solve crosses midnight] → documented; the time belongs to the board played, the log and Streak to when it was played.
- [A 1 Hz React update on the board] → confined to the clock component and stopped in background and before the first tap, within `power-efficiency`'s discrete-change rule.

## Migration Plan

No data migration: `dailyBarkdoku` defaults to `{}` and old logs read as before; Daily Barkdoku solves from before this change have no time and simply do not appear. Rollback is a plain revert; stored `barkdoku` entries and `dailyBarkdoku` are then dropped by the older reader.
