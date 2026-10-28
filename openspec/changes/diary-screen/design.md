# Design

## Context

The Dog record already dates a few things: Walk Diary entries (`date`, `nodeId`, `outcome`), `dailyBest` by date, `streak.lastActiveDate`, and onboarding's `firstStageCompletedAt` and `trialStartedAt`. Node completions, stars, Daily replays and Lesson reads carry no date, and each Stage's `SimulationDebriefPayload` is dropped after its Debrief. The record is local-first and synced whole with last-write-wins plus per-field unions (ADR 0006). Screens draw only from theme tokens and catalog text, which tests enforce. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Show as much per-day and per-run detail as the app can know, with no extra steps for the user.
- Keep the Diary a pure view: building it never changes the record.
- Keep the calendar and day model testable without rendering.

**Non-Goals:**
- Editing or deleting entries, or adding free-text notes.
- Backfilling detail for runs from before the log existed (that data was never stored).
- Charts or trends over time.
- A record version bump: the new field defaults to empty on read, as `readLessons` did.

## Decisions

**A separate append-only Activity Log rather than dating existing fields.** Adding dates to `completedNodes` or `stars` would change fields that progress logic reads and that merge already treats specially. A separate list (`activityLog`) that nothing reads for progress keeps the change isolated and makes the "display-only" rule easy to keep. Alternative considered: storing the full `SimulationDebriefPayload` per entry. It is rejected because it carries fields with no meaning to the user (seed, config version, calm-encounter maps). `StageSummary` keeps the 13 numbers the Debrief and Daily result screens show.

**Entries are written where the record already changes.** `onDebrief`, `completeDaily`, `markLessonRead` and `completeFirstStage` each append one entry with `activityAt(now, …)`, which stamps the ISO time and the local date. The date is stored, not derived later, so the day an entry belongs to never moves if the device's time zone changes. `markLessonRead` takes `now` with a default of `new Date()`, so existing callers keep working.

**Bounded at 500 entries, trimmed on every write and read.** This keeps the synced JSON small (roughly 100 KB at most). Trimming sorts by `at` and keeps the newest entries, so a merged log from two devices stays ordered.

**Merge by union on `at|kind|id`.** Each entry has a millisecond timestamp, so the same event from one device dedupes, and different events from two devices both survive. The merged list is trimmed again.

**Pure day model (`diary.ts`).** `diaryDays(record)` folds the log, the Walk Diary, `dailyBest`, the trial start and a pre-log first Stage into one `DiaryDay` per date. It also provides `dayMarks`, `diaryTotals`, `monthGrid` (Monday-first, based on UTC so DST cannot shift a cell), `shiftMonth`, `weekdayOf`, `timeOf` and `streakDates`. The screen only lays these out. Alternative considered: computing this in the component. It is rejected because it could not be tested and could not be reused for the list view.

**One screen with two views, opened as a flow over the map.** `{ name: 'diary' }` is rendered through `mapWith(...)`, like the Library, so the map stays mounted and keeps its scroll. The view toggle uses `Choice` pills in the fixed header, and the calendar and the list share one `DayCard`, so both views show the same detail.

**Colour is never the only signal.** Each mark has a colour from theme tokens (brand, accent, info, coral, sintonía). Every calendar cell has a full accessibility label, a legend names each colour, and the day card writes out each kind as text.

**Text from the catalog, including month and weekday names.** The app ships one language and the catalog-usage test forbids literal JSX text, so the names are catalog keys rather than coming from `Intl`, whose support on Hermes varies. Dates use `{weekday}, {day} de {month} de {year}` templates.

## Risks / Trade-offs

- [Daily replays fill the log fast] → The 500-entry cap is about months of daily use. Older detail falls off, but `dailyBest` and the Walk Diary still date those days.
- [Two plays at the same millisecond collapse in merge] → This is practically impossible from user input, and harmless if it happens.
- [The record grows on every sync] → It is bounded by the cap, and entries are small flat objects.
- [Stored exercise keys can disappear from the catalog] → An entry's exercise is shown only when its key still exists. A Node or Lesson that is gone shows as "Contenido retirado".
- [Streak days are computed back from the current run only] → Earlier broken runs are not marked as Streak days. The activity highlight still shows those days.

## Migration Plan

No migration step. Reading a record without `activityLog` yields an empty log. Older app versions that sync a record drop the unknown field. Because merge always unions it, a newer device's log survives unless the older device's copy wins whole and is then re-uploaded. That is acceptable for display-only data.
