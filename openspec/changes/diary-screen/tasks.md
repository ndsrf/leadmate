# Tasks

## 1. Activity Log in the record

- [x] 1.1 Add `src/shell/activity.ts` (`ActivityEvent`, `StageSummary`, `stageSummary`, `activityAt`, `addActivity`, `trimLog` at 500, `readActivityLog` validation) and verify `src/shell/diary.test.ts` "keeps only the newest entries" and "drops unreadable entries" pass
- [x] 1.2 Add `activityLog` to `DogRecord`, `newDogRecord` and `migrateRecord`, with no version bump, and verify `migrateRecord({}).activityLog` is `[]`
- [x] 1.3 Log entries from `onDebrief` (stars, Stage summary or Minigame metrics, assigned exercise), `completeDaily` (every play), `markLessonRead` (first read only, `now` parameter) and `completeFirstStage`, and verify the "Activity Log" tests in `src/shell/diary.test.ts` pass along with the existing node, daily and lesson suites
- [x] 1.4 Union the log in `src/shell/sync/merge.ts` by `at|kind|id` and trim, and verify the "unions two copies of the log" test passes
- [x] 1.5 Cover reset clearing the log in `src/shell/reset.test.ts` and verify it passes
- [x] 1.6 Add **Activity Log**, **Diary** and **Active Day** to `GLOSSARY.md`, distinguished from **Walk Diary**, and record ADR 0013 (the Activity Log is display-only). Verify the wording matches the specs

## 2. Diary model

- [x] 2.1 Add `src/shell/diary.ts` (`diaryDays` folding log, Walk Diary, Daily best, trial start and pre-log first Stage; `dayMarks`; `diaryTotals`) and verify the "Diary days" tests pass
- [x] 2.2 Add calendar helpers (`monthGrid` Monday-first, `shiftMonth`, `weekdayOf`, `timeOf`, `streakDates`) and verify the "calendar helpers" tests pass (October 2026 layout, leap February, year wrap, broken Streak)
- [x] 2.3 Count only Active Days (days that credited the Streak) in the totals while still highlighting days with only a Lesson read, and verify the "Lesson-only day" test passes

## 3. Diary screen and entry

- [x] 3.1 Add Diary text to `src/i18n/es.ts` (chip, views, month and weekday names, date templates, marks, totals, entry labels, metrics) and verify `src/i18n` tests and the catalog-usage test pass
- [x] 3.2 Build `src/shell/screens/DiaryScreen.tsx`: header with back and the view toggle, totals panel, calendar with month navigation, highlights, mark dots, today outline, Streak bar and legend, and a shared `DayCard` with full per-entry detail. Verify `noRawColors` and catalog-usage tests pass
- [x] 3.3 Make the World Map's Streak chip open the Diary (`onDiary`), with no separate Diary chip, and the `diary` flow in `App.tsx`, rendered over the map with `mapWith`. Verify `npx tsc --noEmit` reports no new errors
- [ ] 3.4 Capitalise the first letter of month and long-date titles in code, not with CSS `capitalize` (which gave "Octubre De 2026"), and verify in the web build that the calendar title reads "Octubre de 2026"
- [x] 3.5 Label Nodes as "Paseo del mapa" / "Paseos del mapa" and Lessons as "Lectura" / "Lecturas" in the Diary, never as "lecciones", and verify `src/i18n/es.ts` has no `diary.*` text calling a Node a lección

## 4. Integration checks

- [x] 4.1 Run `npx jest` and verify all suites pass
- [ ] 4.2 In the web build at phone width, with a seeded record: open the Diary from the map, verify highlighted days and dots, tap a day to see its card, switch to "Días con actividad" and check that only active days are listed by month, and check that going back keeps the map's scroll position
- [ ] 4.3 On a device, play a Node, the Daily Stage and read a Lesson, then verify each appears in the Diary under today with its time and details

## Workflow follow-up

- Archive the change after review with `/opsx:archive`, which syncs `activity-diary`, `world-map-screen` and `account-sync` into `openspec/specs/`.
