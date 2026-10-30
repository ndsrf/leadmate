# Tasks

## 1. Engine: active time, targets and rating

- [x] 1.1 Replace `startTime`/`endTime` in `BarkdokuState` with `elapsedMs` + `runningSince` (null until the first tap); add `pausePuzzle`, `resumePuzzle`, `elapsedMs` in `src/shell/puzzle/engine.ts`; have `toggleCell` start the clock on the first tap and freeze it on `solved`/`failed`, and `createPuzzle`/`resetPuzzle` return to 0 and stopped. Verify with `engine.test.ts` cases: 0 before any tap, elapsed with injected `now`, a pause excluded, no time after solve, reset back to 0, resume before the first tap does not start the clock.
- [x] 1.2 Add optional `targetSeconds` to `BarkdokuBoard`, `targetSecondsFor(board)` (undefined for tutorial, override wins, else size table 4→60 … 9→480) and `formatClock(seconds)` (`m:ss`). Verify with unit tests for each size, the override, a tutorial board, and `formatClock(75) === '1:15'`, `formatClock(0) === '0:00'`.
- [x] 1.3 Add `ratePuzzle(mistakes, withinTarget)` and extend `BarkdokuMetrics`/`computeMetrics` with `targetSeconds`, `withinTarget` (true without a target) and active-time `durationSeconds`. Verify with tests for the spec scenarios (clean+fast 3★, clean+slow 2★, 1 mistake 2★, 2 mistakes 1★, tutorial clean 3★ at any time).
- [x] 1.4 Add `PuzzleSummary` and `puzzleSummary(board, metrics)`. Verify with a unit test of the built summary with and without a target.

## 2. Node scoring

- [x] 2.1 Cap `barkdokuResult`'s handling score at 800 when `withinTarget` is false and update the `starsFor` doc comment in `src/shell/stars.ts` (exception + ADR 0014). Verify with a test asserting `starsFor(barkdokuResult(m).handlingScore) === m.stars` for every mistakes × within/over/no-target combination.
- [x] 2.2 Add optional `puzzle?: PuzzleSummary` to the `minigame` Node result and copy it into the Node's Activity Log entry in `onDebrief` (`src/shell/nodes/node.ts`). Verify with a `node.test.ts` case where a Barkdoku Debrief entry holds the puzzle summary and Stars.

## 3. Board view: clock, target, practice and solved card

- [x] 3.1 Add a `PuzzleClock` component in `BarkdokuView.tsx`: `0:00` until the first tap, then a 1 Hz interval updating only on a changed second, "Objetivo m:ss" when there is a target, warning tone past it, accessibility label without a live region. Verify in `BarkdokuView.test.tsx` with fake timers: no advance before the first tap, text advances after, tone changes past target, no target line on a tutorial board.
- [x] 3.2 Subscribe to app foreground with `watchAppActive(AppState, …)`, dispatching `pausePuzzle`/`resumePuzzle`. Verify with a test that a mocked background period is not counted.
- [x] 3.3 Show the Solve Time, Stars and, with a target, the target and target-met mark on the solved card, and pass `puzzleSummary` out through `onFinish`. Verify with tests for target met, target missed and tutorial solved cards.
- [x] 3.4 Add the `practice` prop: "Práctica" badge, solved card with the Solve Time, no Stars or target mark, and the "result kept" line. Verify with a test rendering a practice solve.
- [x] 3.5 Add the new Spanish strings (clock label, target, target met/missed, practice badge and line) to `src/i18n/es.ts`. Verify `npm run typecheck` and `src/i18n/i18n.test.ts`/`catalog-usage.test.ts` pass.

## 4. Spanish name

- [x] 4.1 Rename the game to "Guaudoku" in `minigame.barkdoku.title`, `map.barkdoku.daily`, `node.barkdoku.title`, `minigame.barkdoku.solvedTitle` and `node.barkdoku.vcard1` (masculine wording, drop "(Barkdoku)"), change `minigame.barkdoku.conflictRegion` to "la misma zona", and drop "Zona de Calma" from code comments in `src/shell/puzzle/types.ts` and `BarkdokuView.tsx`; keep keys and ids. Verify with a test that no `es` catalog value contains "Zona de Calma" (case-insensitive) and update `WorldMapScreen.test.tsx` names/expectations.

## 5. Record, daily solve and sync

- [x] 5.1 Add `dailyBarkdoku: Record<string, { seconds; at; targetSeconds? }>` to `DogRecord` with default `{}` and a lenient reader in `src/shell/dogRecord.ts`. Verify with `dogRecord.test.ts` cases: missing field reads as `{}`, invalid keys/values are dropped.
- [x] 5.2 Add `'barkdoku'` to `ActivityKind` and optional `puzzle` to `ActivityEvent` with a validating reader in `src/shell/activity.ts`. Verify with tests that a valid entry round-trips and a malformed `puzzle` field is dropped without losing the entry.
- [x] 5.3 Add `recordDailyBarkdoku(record, summary, stars, boardDate, now)` that, on the date's first solve, marks the Streak, saves the Daily Solve Time and logs a `barkdoku` entry, and otherwise only marks the Streak. Verify with `dogRecord.test.ts` cases: first solve saved and logged, second solve leaves time and log unchanged, Streak credited on `now`'s date for a board dated the day before.
- [x] 5.4 Wire `App.tsx`: pass `practice` to the `puzzle` flow from `dailyBarkdoku[f.date]`, call `recordDailyBarkdoku` on a non-practice solve and nothing on a practice one, and pass the Barkdoku `puzzle` summary through the Node branch's `finish`. Verify with `npm run typecheck` and the manual check in 8.2.
- [x] 5.5 Merge `dailyBarkdoku` per date keeping the earlier `at` in `src/shell/sync/merge.ts`. Verify with a `merge.test.ts` case (09:00 2:10 vs 20:00 1:50 → 2:10) and that `barkdoku` log entries union without duplicates.
- [x] 5.6 Verify Reset Progress clears `dailyBarkdoku` and `barkdoku` log entries with a `reset.test.ts` assertion.

## 6. World Map chip

- [x] 6.1 Pass `dailyBarkdoku[today]` from `App.tsx` to `WorldMapScreen` and render the Guaudoku chip as "nuevo"/highlighted when unsolved and `m:ss / m:ss` with ✓ when within target. Verify with `WorldMapScreen.test.tsx` cases for unsolved, within target and over target.

## 7. Diary

- [x] 7.1 Add `dailyBarkdoku` to `DiaryDay` from the record, `'barkdoku'` to `DAY_MARKS` and `barkdokuSolves` (days with a Daily Solve Time) to `DiaryTotals` in `src/shell/diary.ts`, keeping Barkdoku entries out of `bestScore`. Verify with `diary.test.ts` cases: a day shows its Daily Solve Time with an empty log, a Daily-Barkdoku-only day has the mark and is an Active Day, two log entries for one date count as one solve.
- [x] 7.2 Render the day's Daily Solve Time line, `barkdoku` entries (time of day, "Guaudoku N×N", Solve Time, mistakes, Stars), the Solve Time on Barkdoku Node entries, the legend item, the screen-reader name and the totals line in `DiaryScreen.tsx`, with a colour token and Spanish strings. Verify with a DiaryScreen render test (or a snapshot update reviewed by hand) showing these.

## 8. Integration checks

- [x] 8.1 Run `npm test` and `npm run typecheck`; both pass.
- [x] 8.2 In the running app: the clock stays at `0:00` until the first tap and pauses in background; solve today's Guaudoku, then replay it faster in practice. The chip and the Diary show the first solve's time against the target, the practice solve changes nothing, and no "Zona de Calma" text appears.

## Workflow follow-up

- Archive `barkdoku-puzzle-game` and `diary-screen` before archiving this change, so its deltas apply to existing specs.
- Run `openspec validate barkdoku-timer` after those archives and before archiving this change.
- Tell the owner of `settings-gear-icon` that the Daily Barkdoku chip label is now "Guaudoku", shorter than "Zona de Calma", which may help the 360px Map Header target.
