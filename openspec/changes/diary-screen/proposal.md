# Proposal

## Why

The app records progress (Walk Diary check-ins, Daily Stage bests, the Streak), but the user cannot look back at it: nothing shows what they did on a given day or how a run went. A Diary turns that history into something they can browse, which supports the habit loop the Streak is built on. Today most history is also lost: Node runs, Daily Stage replays and Lesson reads keep no date, and Stage numbers are thrown away after the Debrief.

## What Changes

- Add an **Activity Log** to the Dog record: one dated entry per Node Debrief, Daily Stage play, first-time Lesson read and the guided first Stage. Each entry keeps its Stage numbers (score, Slack, pull, peak Arousal, Marker accuracy and hits, missed opportunities, check-ins, Poste successes, harsh stops, Sintonía, Go Sniffs, duration), the Minigame metrics, the stars earned on that run and the real-world exercise the Debrief assigned. The log is display-only: nothing reads progress back from it. It keeps the newest 500 entries.
- Add a **Diary screen**, opened by tapping the Streak chip in the World Map's top bar (no separate Diary chip), with two views:
  - **Calendar**: a Monday-first month grid with month navigation. Days with activity are highlighted, each with coloured dots per kind of activity (Node, Daily Stage, Lesson, real-world exercise, first Stage) and a flame bar for days of the live Streak. Tapping a day shows everything that happened on it below the grid.
  - **Days with activity**: only the days that have entries, newest first, grouped under month headings, each fully expanded.
- Each day card shows the long date, Today and Streak-day markers, an activity count, the kinds present, and every entry with its time: Stage stats, Minigame metrics, stars, the World, the assigned exercise, Walk Diary outcomes, the day's best Daily score and the trial start.
- A totals panel shows the current and best Streak, Active Days (days that credited the Streak), best score, Node runs, Daily plays, Lessons read and real-world exercises, with the date of the first Active Day. The Diary is free for every user.
- Days from before the log existed still show the data that was already dated (Walk Diary, Daily best, first Stage, trial start).
- Sync unions the Activity Log; Reset Progress clears it with the rest of the record.

## Capabilities

### New Capabilities
- `activity-diary`: the dated Activity Log of what the user did, and the Diary screen that shows it as a calendar and as a list of days with activity.

### Modified Capabilities
- `world-map-screen`: the Streak chip in the top bar opens the Diary.
- `account-sync`: conflict resolution also unions the Activity Log.

## Impact

- Record: `DogRecord.activityLog` (new field, defaults to empty on read; no version bump, as with `readLessons`). Written by `onDebrief`, `completeDaily`, `markLessonRead` and `completeFirstStage`.
- New code: `src/shell/activity.ts` (log types, entry building, validation, trim), `src/shell/diary.ts` (pure day/calendar model), `src/shell/screens/DiaryScreen.tsx`.
- Changed: `src/shell/dogRecord.ts`, `src/shell/sync/merge.ts`, `src/shell/nodes/node.ts`, `src/shell/daily.ts`, `src/shell/lessons/lesson.ts`, `src/shell/onboarding/firstStage.ts`, `src/shell/screens/WorldMapScreen.tsx`, `App.tsx` (new `diary` flow over the map), `src/i18n/es.ts` (Diary text, month and weekday names).
- No new dependencies. The record grows by at most 500 small entries.
